import assert from 'assert'
const boltProtocolDriver = require('neo4j-driver').v1
import generateUUID from 'uuid/v4'
import { nodeLabel, connectionType } from '../../graphModel/graphSchemeReference.js'

// convention of data structure - `connection: { source: [<nodeKey>, <portKey>], destination: [<nodeKey>, <portKey>] }`
const jsonToCepherAdapter = {
  convertObjectToCepherProperty(object) {
    let propertyArray = []
    for (let [key, value] of Object.entries(object)) {
      switch (typeof value) {
        case 'boolean':
        case 'number':
          propertyArray.push(`${key}: ${value}`)
          break
        case 'string':
          propertyArray.push(`${key}:'${value}'`) // Note: use single-quotes to allow json strings that rely on double qoutes.
          break
        case 'object': // an array (as the property cannot be an object in property graph databases)
          propertyArray.push(`${key}: [${value.map(item => (typeof item == 'string' ? `'${item}'` : item)).join(', ')}]`)
          break
        default:
          throw new Error(`• "${typeof value}" Property value type for graph data is not supported.`)
          break
      }
    }
    return propertyArray.join(', ')
  },
  convertArrayToCepherLabel(array) {
    return array.join(':')
  },
}

export function boltCypherModelAdapterFunction({ url = { protocol: 'bolt', hostname: 'localhost', port: 7687 }, authentication = { username: 'neo4j', password: 'test' } } = {}) {
  const graphDBDriver = boltProtocolDriver.driver(`${url.protocol}://${url.hostname}:${url.port}`, boltProtocolDriver.auth.basic(authentication.username, authentication.password), {
    disableLosslessIntegers: true, // neo4j represents IDs as integers, and through the JS driver transforms them to strings to represent high values approximately 2^53 +
    // maxConnectionPoolSize: process.env.DRIVER_MAX_CONNECTION_POOL_SIZE || 50,                     // maximum number of connections to the connection pool
    // maxConnectionLifetime: process.env.DRIVER_MAX_CONNECTION_LIFETIME || 4 * 60 * 60 * 1000,      // time in ms, 4 hours maximum connection lifetime
    // maxTransactionRetryTime: process.env.DRIVER_MAX_TRANSACTION_RETRY_TIME || 3 * 1000,           // time in ms to retry a transaction
    // connectionAcquisitionTimeout: process.env.DRIVER_CONNECTION_ACQUISITION_TIMEOUT || 2 * 1000,  // time in ms to wait for a connection to become available in the pool
    // trust: process.env.DRIVER_TLS_TRUST || 'TRUST_ALL_CERTIFICATES',                              // tls trust configuration
    // encrypted: process.env.DRIVER_TLS_ENABLED || 'ENCRYPTION_OFF'                                 // enable/disable TLS encryption to client
  })

  const implementation = {
    driverInstance: graphDBDriver, // expose driver instance
    // load nodes and connections from json file data.
    async loadGraphData({ nodeEntryData = [], connectionEntryData = [] } = {}) {
      // deal with `NodeReference`
      let referenceNodeArray = nodeEntryData.filter(node => node.labels.includes(nodeLabel.nodeReference)) // extract `NodeReference` nodes
      nodeEntryData = nodeEntryData.filter(node => !referenceNodeArray.some(i => i == node)) // remove reference nodes from node array.
      let referenceNodeMap = new Map()
      let reintroduceNodeArray = []
      for (let referenceNode of referenceNodeArray) {
        let actualTargetNode = await implementation.getNodeByKey({ key: referenceNode.properties.key, shouldThrow: false })
        // <reference id>: <actual id in graph>
        if (actualTargetNode) {
          referenceNodeMap.set(referenceNode.identity, actualTargetNode)
          console.log(`• Found "NodeReference" target in current graph ${referenceNode.identity} -> ${actualTargetNode.identity}`)
        } else {
          // if reference node key was not found in the current graph data, reintroduce it as a NodeReference node
          reintroduceNodeArray.push(referenceNode)
          console.log(`• "NodeReference" was not found in current graph - ${referenceNode.properties.key}.`)
        }
      }
      // reintroduce reference nodes that where not found in current graph
      for (let node of reintroduceNodeArray) {
        nodeEntryData.push(node)
      }
      // replace node reference with actual graph identity of the target reference node
      for (let edge of connectionEntryData) {
        if (referenceNodeMap.get(edge.start)) {
          let actualReferenceNode = referenceNodeMap.get(edge.start)
          edge.start = actualReferenceNode.identity
          // add connection keys for actual reference nodes that the latter function rely on.
          edge.startKey = actualReferenceNode.properties.key
        }
        if (referenceNodeMap.get(edge.end)) {
          let actualReferenceNode = referenceNodeMap.get(edge.end)
          edge.end = actualReferenceNode.identity
          // add connection keys for actual reference nodes that the latter function rely on.
          edge.endKey = actualReferenceNode.properties.key
        }
      }

      const idMap = { nodeIdentity: new Map() /** maps old graph data ids to new data ids. (as ids cannot be set in the database when loaded the graph data.) */ }
      for (let entry of nodeEntryData) {
        let createdNode = await implementation.addNode({ nodeData: entry })
        idMap.nodeIdentity.set(entry.identity, createdNode.identity) // <loaded parameter ID>: <new database ID>
      }

      // add reference target nodes to the list of nodes for usage in `addConnection function
      let actualReferenceNodeArray = Array.from(referenceNodeMap.values())
      for (let actualReferenceNode of actualReferenceNodeArray) {
        idMap.nodeIdentity.set(actualReferenceNode.identity, actualReferenceNode.identity)
      }

      // rely on `key` property to create connections
      connectionEntryData.map(connection => {
        if (!connection.startKey) connection.startKey = nodeEntryData.filter(node => node.identity == connection.start)[0].properties.key
        if (!connection.endKey) connection.endKey = nodeEntryData.filter(node => node.identity == connection.end)[0].properties.key
      })
      for (let entry of connectionEntryData) {
        await implementation.addConnection({ connectionData: entry, idMap })
      }
    },
    addNode: async ({ nodeData /*conforms with the Cypher query results data convention*/ }) => {
      assert(nodeData.properties?.key, '• Node data must have a key property - ' + nodeData)

      let session = await graphDBDriver.session()
      let query = `
        create (n:${jsonToCepherAdapter.convertArrayToCepherLabel(nodeData.labels)} {${jsonToCepherAdapter.convertObjectToCepherProperty(nodeData.properties)}})
        return n
      `
      let result = await session.run(query)
      await session.close()
      return result.records[0].toObject().n
    },
    addConnection: async ({ connectionData /*conforms with the Cypher query results data convention*/, idMap /*Use identities to create edges */ }) => {
      assert(typeof connectionData.start == 'number' && typeof connectionData.end == 'number', `• Connection must have a start and end nodes.`)
      if (connectionData.type == connectionType.next) assert(connectionData.properties?.key, '• Connection object must have a key property.')
      let nodeArray = await implementation.getAllNode()
      let session = await graphDBDriver.session()

      let query = `
        match (source { key: '${connectionData.startKey}' }) ${idMap ? `where ID(source) = ${idMap.nodeIdentity.get(connectionData.start)}` : ''}
        match (destination { key: '${connectionData.endKey}' }) ${idMap ? `where ID(destination) = ${idMap.nodeIdentity.get(connectionData.end)}` : ''}
        create 
          (source)
          -[l:${connectionData.type} {${jsonToCepherAdapter.convertObjectToCepherProperty(connectionData.properties)}}]->
          (destination) 
        return l
      `
      let result = await session.run(query)
      // result.records.forEach(record => record.toObject() |> console.log)
      await session.close()
      return result
    },
    // TODO: Update this function to consider the returned destination & source nodes, would match their role in the connection pair (e.g. check `getNodeConnection` below).
    getNodeConnectionByKey: async function({
      direction = 'outgoing' /* filter connection array to match outgoing connections only*/,
      sourceKey,
      destinationNodeType,
    }: {
      direction: 'outgoing' | 'incoming',
    }) {
      assert(direction == 'outgoing', '• `direction` parameter unsupported.')
      let session = await graphDBDriver.session()
      let query = `
        match 
          (source { key: '${sourceKey}' })
          -[l:${connectionType.next}]->
          (destination${destinationNodeType ? `:${destinationNodeType}` : ''}) 
        return l
        order by destination.key
      `
      let result = await session.run(query)
      result = result.records.map(record => record.toObject().l)
      await session.close()
      return result
    },
    /**
     * @returns Array of objects [{
     *  connection: Object,
     *  source: Object,
     *  destination: Object
     * }]
     */
    getNodeConnection: async function({
      nodeID,
      direction /* filter connection array to match outgoing connections only*/,
      otherPairNodeType,
      connectionType,
    }: {
      direction: 'outgoing' | 'incoming' | undefined /*both incoming and outgoing*/,
    }) {
      let session = await graphDBDriver.session()
      let connectionTypeQuery = connectionType ? `:${connectionType}` : ``
      let connection = direction == 'outgoing' ? `-[connection${connectionTypeQuery}]->` : direction == 'incoming' ? `<-[connection${connectionTypeQuery}]-` : `-[connection${connectionTypeQuery}]-`
      let query

      // switch direction to return destination and source correctly according to the different cases.
      switch (direction) {
        case 'outgoing':
          query = `
            match (source)  ${connection} (destination${otherPairNodeType ? `:${otherPairNodeType}` : ''}) 
            where id(source)=${nodeID}
            return connection, source, destination order by destination.key
          `
          break
        case 'incoming':
          query = `
            match (destination)  ${connection} (source${otherPairNodeType ? `:${otherPairNodeType}` : ''})
            where id(destination)=${nodeID}
            return connection, source, destination order by source.key
          `
          break
        default:
          query = `
            match (source)  ${connection} (destination${otherPairNodeType ? `:${otherPairNodeType}` : ''}) 
            where id(source)=${nodeID}
            return connection, source, destination order by destination.key
          `
          break
      }
      let result = await session.run(query)
      result = result.records.map(record => record.toObject())
      await session.close()
      return result
    },
    getNodeByKey: async function({ key, shouldThrow = true }) {
      let session = await graphDBDriver.session()
      let query = `
        match (n {key: '${key}'})
        return n
      `
      let result = await session.run(query)
      await session.close()
      if (shouldThrow) assert(result.records[0], `• Cannot find node where node.key="${key}"`)
      if (result.records.length == 0) return false
      return result.records[0].toObject().n
    },
    getNodeByID: async function({ id }) {
      let session = await graphDBDriver.session()
      let query = `
        match (n) where id(n)=${id}
        return n
      `
      let result = await session.run(query)
      await session.close()
      return result.records[0].toObject().n
    },
    getAllNode: async function() {
      let session = await graphDBDriver.session()
      let query = `
        match (n) return n order by n.key
      `
      let result = await session.run(query)
      await session.close()
      return result.records
        .map(record => record.toObject().n)
        .map(node => {
          // node.identity = node.identity.toString()
          return node
        })
    },
    getAllEdge: async function() {
      let session = await graphDBDriver.session()
      let query = `
        match ()-[l]->(n) return l order by n.key
      `
      let result = await session.run(query)
      await session.close()
      return result.records
        .map(record => record.toObject().l)
        .map(edge => {
          // Note: Bolt driver option handles integer transformation.
          // change numbers to string representation
          // edge.identity = edge.identity.toString()
          // edge.start = edge.start.toString()
          // edge.end = edge.end.toString()
          return edge
        })
    },
    countNode: async function() {
      let session = await graphDBDriver.session()
      let query = `
        MATCH (n)
        RETURN count(n) as count
      `
      let result = await session.run(query)
      await session.close()
      return result.records[0].toObject().count
    },
    countEdge: async function() {
      let session = await graphDBDriver.session()
      let query = `
        MATCH ()-[r]->()
        RETURN count(r) as count
      `
      let result = await session.run(query)
      await session.close()
      return result.records[0].toObject().count
    },
  }
  return implementation
}
