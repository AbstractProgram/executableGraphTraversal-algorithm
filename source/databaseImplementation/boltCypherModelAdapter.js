"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.boltCypherModelAdapterFunction = boltCypherModelAdapterFunction;var _assert = _interopRequireDefault(require("assert"));

var _v = _interopRequireDefault(require("uuid/v4"));const boltProtocolDriver = require('neo4j-driver').v1;

const jsonToCepherAdapter = {
  convertObjectToCepherProperty(object) {
    let propertyArray = [];
    for (let [key, value] of Object.entries(object)) {
      switch (typeof value) {
        case 'boolean':
        case 'number':
          propertyArray.push(`${key}: ${value}`);
          break;
        case 'string':
          propertyArray.push(`${key}:'${value}'`);
          break;
        case 'object':
          propertyArray.push(`${key}: [${value.map(item => typeof item == 'string' ? `'${item}'` : item).join(', ')}]`);
          break;
        default:
          throw new Error(`• "${typeof value}" Property value type for graph data is not supported.`);
          break;}

    }
    return propertyArray.join(', ');
  },
  convertArrayToCepherLabel(array) {
    return array.join(':');
  } };


let identityNumber = -1;
function createEdgeData({ startId, endId, type }) {
  identityNumber--;
  return {
    identity: identityNumber,
    start: startId,
    end: endId,
    type,
    properties: {
      key: (0, _v.default)() } };


}

function boltCypherModelAdapterFunction({ schemeReference, url = { protocol: 'bolt', hostname: 'localhost', port: 7687 }, authentication = { username: 'neo4j', password: 'test' } } = {}) {
  (0, _assert.default)(schemeReference, `• schemeReference must be passed to initialize the model adapter.`);
  const graphDBDriver = boltProtocolDriver.driver(`${url.protocol}://${url.hostname}:${url.port}`, boltProtocolDriver.auth.basic(authentication.username, authentication.password), {
    disableLosslessIntegers: true });








  const implementation = {
    driverInstance: graphDBDriver,


    async replaceNodeWithAnother_loadGraphData({ nodeEntryData = [], connectionEntryData = [] } = {}) {

      let referenceNodeArray = nodeEntryData.filter(node => node.labels.includes(schemeReference.nodeLabel.nodeReference));
      nodeEntryData = nodeEntryData.filter(node => !referenceNodeArray.some(i => i == node));
      let rerouteNodeMap = new Map();
      let reintroduceNodeArray = [];
      for (let referenceNode of referenceNodeArray) {
        let actualTargetNode = await implementation.getNodeByKey({ key: referenceNode.properties.key, shouldThrow: false });

        if (actualTargetNode) {
          rerouteNodeMap.set(referenceNode.identity, actualTargetNode);
          console.log(`• Found "NodeReference" target in current graph ${referenceNode.identity} -> ${actualTargetNode.identity}`);
        } else {

          reintroduceNodeArray.push(referenceNode);
          console.log(`• "NodeReference" was not found in current graph - ${referenceNode.properties.key}.`);
        }
      }

      for (let node of reintroduceNodeArray) {
        nodeEntryData.push(node);
      }

      for (let edge of connectionEntryData) {
        if (rerouteNodeMap.get(edge.start)) {
          let actualReferenceNode = rerouteNodeMap.get(edge.start);
          edge.start = actualReferenceNode.identity;

          edge.startKey = actualReferenceNode.properties.key;
        }
        if (rerouteNodeMap.get(edge.end)) {
          let actualReferenceNode = rerouteNodeMap.get(edge.end);
          edge.end = actualReferenceNode.identity;

          edge.endKey = actualReferenceNode.properties.key;
        }
      }

      const idMap = { nodeIdentity: new Map() };
      for (let entry of nodeEntryData) {
        let createdNode = await implementation.addNode({ nodeData: entry });
        idMap.nodeIdentity.set(entry.identity, createdNode.identity);
      }


      let actualReferenceNodeArray = Array.from(rerouteNodeMap.values());
      for (let actualReferenceNode of actualReferenceNodeArray) {
        idMap.nodeIdentity.set(actualReferenceNode.identity, actualReferenceNode.identity);
      }


      connectionEntryData.map(connection => {
        if (!connection.startKey) connection.startKey = nodeEntryData.filter(node => node.identity == connection.start)[0].properties.key;
        if (!connection.endKey) connection.endKey = nodeEntryData.filter(node => node.identity == connection.end)[0].properties.key;
      });
      for (let entry of connectionEntryData) {
        await implementation.addConnection({ connectionData: entry, idMap });
      }
    },

    async dealWithExternalReference({ nodeEntryData, connectionEntryData }) {

      let externalRerouteNodeArray = nodeEntryData.
      filter(node => node.labels.includes(schemeReference.nodeLabel.reroute)).
      filter(rerouteNode => rerouteNode.properties[schemeReference.rerouteProperty.externalReferenceNodeKey]);

      let rerouteNodeMap = new Map();
      for (let rerouteNode of externalRerouteNodeArray) {
        let externalKey = rerouteNode.properties[schemeReference.rerouteProperty.externalReferenceNodeKey];
        let actualTargetNode = await implementation.getNodeByKey({ key: externalKey, shouldThrow: false });

        if (actualTargetNode) {
          rerouteNodeMap.set(rerouteNode, actualTargetNode);
          console.log(`• Found external reference target node in current graph ${rerouteNode.identity} -> ${actualTargetNode.identity}`);
        } else {

          console.log(`• External reference node ("${externalKey}") was not found in current graph for reroute node - ${rerouteNode.properties.key}.`);
        }
      }

      rerouteNodeMap.forEach((value, key) => {

        let referenceEdge = createEdgeData({ startId: rerouteNode.identity, endId: actualTargetNode.identity, type: schemeReference.connectionType.reference });
        connectionEntryData.push(referenceEdge);
      });
    },



    async loadGraphData({ nodeEntryData = [], connectionEntryData = [] } = {}) {
      await implementation.dealWithExternalReference({ nodeEntryData, connectionEntryData });

      const idMap = { nodeIdentity: new Map() };
      for (let entry of nodeEntryData) {
        let createdNode = await implementation.addNode({ nodeData: entry });
        idMap.nodeIdentity.set(entry.identity, createdNode.identity);
      }


      connectionEntryData.map(connection => {
        if (!connection.startKey) connection.startKey = nodeEntryData.filter(node => node.identity == connection.start)[0].properties.key;
        if (!connection.endKey) connection.endKey = nodeEntryData.filter(node => node.identity == connection.end)[0].properties.key;
      });
      for (let entry of connectionEntryData) {
        await implementation.addConnection({ connectionData: entry, idMap });
      }
    },
    addNode: async ({ nodeData }) => {var _nodeData$properties;
      (0, _assert.default)((_nodeData$properties = nodeData.properties) === null || _nodeData$properties === void 0 ? void 0 : _nodeData$properties.key, '• Node data must have a key property - ' + nodeData);

      let labelSection = nodeData.labels && nodeData.labels.length > 0 ? `:${jsonToCepherAdapter.convertArrayToCepherLabel(nodeData.labels)}` : '';
      let session = await graphDBDriver.session();
      let query = `
        create (n${labelSection} {${jsonToCepherAdapter.convertObjectToCepherProperty(nodeData.properties)}})
        return n
      `;
      let result = await session.run(query);
      await session.close();
      return result.records[0].toObject().n;
    },
    addConnection: async ({ connectionData, idMap }) => {var _connectionData$prope;
      (0, _assert.default)(typeof connectionData.start == 'number' && typeof connectionData.end == 'number', `• Connection must have a start and end nodes.`);
      if (connectionData.type == schemeReference.connectionType.next) (0, _assert.default)((_connectionData$prope = connectionData.properties) === null || _connectionData$prope === void 0 ? void 0 : _connectionData$prope.key, '• Connection object must have a key property.');
      let nodeArray = await implementation.getAllNode();
      let session = await graphDBDriver.session();

      let query = `
        match (source { key: '${connectionData.startKey}' }) ${idMap ? `where ID(source) = ${idMap.nodeIdentity.get(connectionData.start)}` : ''}
        match (destination { key: '${connectionData.endKey}' }) ${idMap ? `where ID(destination) = ${idMap.nodeIdentity.get(connectionData.end)}` : ''}
        create 
          (source)
          -[l:${connectionData.type} {${jsonToCepherAdapter.convertObjectToCepherProperty(connectionData.properties)}}]->
          (destination) 
        return l
      `;
      let result = await session.run(query);

      await session.close();
      return result;
    },

    getNodeConnectionByKey: async function ({
      direction = 'outgoing',
      sourceKey,
      destinationNodeType })


    {
      (0, _assert.default)(direction == 'outgoing', '• `direction` parameter unsupported.');
      let session = await graphDBDriver.session();
      let query = `
        match 
          (source { key: '${sourceKey}' })
          -[l:${schemeReference.connectionType.next}]->
          (destination${destinationNodeType ? `:${destinationNodeType}` : ''}) 
        return l
        order by destination.key
      `;
      let result = await session.run(query);
      result = result.records.map(record => record.toObject().l);
      await session.close();
      return result;
    },







    getNodeConnection: async function ({
      nodeID,
      direction,
      otherPairNodeType,
      connectionType })


    {
      let session = await graphDBDriver.session();
      let connectionTypeQuery = connectionType ? `:${connectionType}` : ``;
      let connection = direction == 'outgoing' ? `-[connection${connectionTypeQuery}]->` : direction == 'incoming' ? `<-[connection${connectionTypeQuery}]-` : `-[connection${connectionTypeQuery}]-`;
      let query;


      switch (direction) {
        case 'outgoing':
          query = `
            match (source)  ${connection} (destination${otherPairNodeType ? `:${otherPairNodeType}` : ''}) 
            where id(source)=${nodeID}
            return connection, source, destination order by destination.key
          `;
          break;
        case 'incoming':
          query = `
            match (destination)  ${connection} (source${otherPairNodeType ? `:${otherPairNodeType}` : ''})
            where id(destination)=${nodeID}
            return connection, source, destination order by source.key
          `;
          break;
        default:
          query = `
            match (source)  ${connection} (destination${otherPairNodeType ? `:${otherPairNodeType}` : ''}) 
            where id(source)=${nodeID}
            return connection, source, destination order by destination.key
          `;
          break;}

      let result = await session.run(query);
      result = result.records.map(record => record.toObject());
      await session.close();
      return result;
    },
    getNodeByKey: async function ({ key, shouldThrow = true }) {
      let session = await graphDBDriver.session();
      let query = `
        match (n {key: '${key}'})
        return n
      `;
      let result = await session.run(query);
      await session.close();
      if (shouldThrow) (0, _assert.default)(result.records[0], `• Cannot find node where node.key="${key}"`);
      if (result.records.length == 0) return false;
      return result.records[0].toObject().n;
    },
    getNodeByID: async function ({ id }) {
      let session = await graphDBDriver.session();
      let query = `
        match (n) where id(n)=${id}
        return n
      `;
      let result = await session.run(query);
      await session.close();
      return result.records[0].toObject().n;
    },
    getAllNode: async function () {
      let session = await graphDBDriver.session();
      let query = `
        match (n) return n order by n.key
      `;
      let result = await session.run(query);
      await session.close();
      return result.records.
      map(record => record.toObject().n).
      map(node => {

        return node;
      });
    },
    getAllEdge: async function () {
      let session = await graphDBDriver.session();
      let query = `
        match ()-[l]->(n) return l order by n.key
      `;
      let result = await session.run(query);
      await session.close();
      return result.records.
      map(record => record.toObject().l).
      map(edge => {





        return edge;
      });
    },
    countNode: async function () {
      let session = await graphDBDriver.session();
      let query = `
        MATCH (n)
        RETURN count(n) as count
      `;
      let result = await session.run(query);
      await session.close();
      return result.records[0].toObject().count;
    },
    countEdge: async function () {
      let session = await graphDBDriver.session();
      let query = `
        MATCH ()-[r]->()
        RETURN count(r) as count
      `;
      let result = await session.run(query);
      await session.close();
      return result.records[0].toObject().count;
    } };

  return implementation;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NvdXJjZS9kYXRhYmFzZUltcGxlbWVudGF0aW9uL2JvbHRDeXBoZXJNb2RlbEFkYXB0ZXIuanMiXSwibmFtZXMiOlsiYm9sdFByb3RvY29sRHJpdmVyIiwicmVxdWlyZSIsInYxIiwianNvblRvQ2VwaGVyQWRhcHRlciIsImNvbnZlcnRPYmplY3RUb0NlcGhlclByb3BlcnR5Iiwib2JqZWN0IiwicHJvcGVydHlBcnJheSIsImtleSIsInZhbHVlIiwiT2JqZWN0IiwiZW50cmllcyIsInB1c2giLCJtYXAiLCJpdGVtIiwiam9pbiIsIkVycm9yIiwiY29udmVydEFycmF5VG9DZXBoZXJMYWJlbCIsImFycmF5IiwiaWRlbnRpdHlOdW1iZXIiLCJjcmVhdGVFZGdlRGF0YSIsInN0YXJ0SWQiLCJlbmRJZCIsInR5cGUiLCJpZGVudGl0eSIsInN0YXJ0IiwiZW5kIiwicHJvcGVydGllcyIsImJvbHRDeXBoZXJNb2RlbEFkYXB0ZXJGdW5jdGlvbiIsInNjaGVtZVJlZmVyZW5jZSIsInVybCIsInByb3RvY29sIiwiaG9zdG5hbWUiLCJwb3J0IiwiYXV0aGVudGljYXRpb24iLCJ1c2VybmFtZSIsInBhc3N3b3JkIiwiZ3JhcGhEQkRyaXZlciIsImRyaXZlciIsImF1dGgiLCJiYXNpYyIsImRpc2FibGVMb3NzbGVzc0ludGVnZXJzIiwiaW1wbGVtZW50YXRpb24iLCJkcml2ZXJJbnN0YW5jZSIsInJlcGxhY2VOb2RlV2l0aEFub3RoZXJfbG9hZEdyYXBoRGF0YSIsIm5vZGVFbnRyeURhdGEiLCJjb25uZWN0aW9uRW50cnlEYXRhIiwicmVmZXJlbmNlTm9kZUFycmF5IiwiZmlsdGVyIiwibm9kZSIsImxhYmVscyIsImluY2x1ZGVzIiwibm9kZUxhYmVsIiwibm9kZVJlZmVyZW5jZSIsInNvbWUiLCJpIiwicmVyb3V0ZU5vZGVNYXAiLCJNYXAiLCJyZWludHJvZHVjZU5vZGVBcnJheSIsInJlZmVyZW5jZU5vZGUiLCJhY3R1YWxUYXJnZXROb2RlIiwiZ2V0Tm9kZUJ5S2V5Iiwic2hvdWxkVGhyb3ciLCJzZXQiLCJjb25zb2xlIiwibG9nIiwiZWRnZSIsImdldCIsImFjdHVhbFJlZmVyZW5jZU5vZGUiLCJzdGFydEtleSIsImVuZEtleSIsImlkTWFwIiwibm9kZUlkZW50aXR5IiwiZW50cnkiLCJjcmVhdGVkTm9kZSIsImFkZE5vZGUiLCJub2RlRGF0YSIsImFjdHVhbFJlZmVyZW5jZU5vZGVBcnJheSIsIkFycmF5IiwiZnJvbSIsInZhbHVlcyIsImNvbm5lY3Rpb24iLCJhZGRDb25uZWN0aW9uIiwiY29ubmVjdGlvbkRhdGEiLCJkZWFsV2l0aEV4dGVybmFsUmVmZXJlbmNlIiwiZXh0ZXJuYWxSZXJvdXRlTm9kZUFycmF5IiwicmVyb3V0ZSIsInJlcm91dGVOb2RlIiwicmVyb3V0ZVByb3BlcnR5IiwiZXh0ZXJuYWxSZWZlcmVuY2VOb2RlS2V5IiwiZXh0ZXJuYWxLZXkiLCJmb3JFYWNoIiwicmVmZXJlbmNlRWRnZSIsImNvbm5lY3Rpb25UeXBlIiwicmVmZXJlbmNlIiwibG9hZEdyYXBoRGF0YSIsImxhYmVsU2VjdGlvbiIsImxlbmd0aCIsInNlc3Npb24iLCJxdWVyeSIsInJlc3VsdCIsInJ1biIsImNsb3NlIiwicmVjb3JkcyIsInRvT2JqZWN0IiwibiIsIm5leHQiLCJub2RlQXJyYXkiLCJnZXRBbGxOb2RlIiwiZ2V0Tm9kZUNvbm5lY3Rpb25CeUtleSIsImRpcmVjdGlvbiIsInNvdXJjZUtleSIsImRlc3RpbmF0aW9uTm9kZVR5cGUiLCJyZWNvcmQiLCJsIiwiZ2V0Tm9kZUNvbm5lY3Rpb24iLCJub2RlSUQiLCJvdGhlclBhaXJOb2RlVHlwZSIsImNvbm5lY3Rpb25UeXBlUXVlcnkiLCJnZXROb2RlQnlJRCIsImlkIiwiZ2V0QWxsRWRnZSIsImNvdW50Tm9kZSIsImNvdW50IiwiY291bnRFZGdlIl0sIm1hcHBpbmdzIjoid09BQUE7O0FBRUEsb0RBREEsTUFBTUEsa0JBQWtCLEdBQUdDLE9BQU8sQ0FBQyxjQUFELENBQVAsQ0FBd0JDLEVBQW5EOztB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QUNJLEtBQVIsRUFBTjtBQUNBLGFBQU9GLE1BQU0sQ0FBQ0csT0FBUCxDQUFlLENBQWYsRUFBa0JDLFFBQWxCLEdBQTZCbUIsS0FBcEM7QUFDRCxLQWpTb0IsRUFBdkI7O0FBbVNBLFNBQU9qRixjQUFQO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCdcclxuY29uc3QgYm9sdFByb3RvY29sRHJpdmVyID0gcmVxdWlyZSgnbmVvNGotZHJpdmVyJykudjFcclxuaW1wb3J0IGdlbmVyYXRlVVVJRCBmcm9tICd1dWlkL3Y0J1xyXG4vLyBjb252ZW50aW9uIG9mIGRhdGEgc3RydWN0dXJlIC0gYGNvbm5lY3Rpb246IHsgc291cmNlOiBbPG5vZGVLZXk+LCA8cG9ydEtleT5dLCBkZXN0aW5hdGlvbjogWzxub2RlS2V5PiwgPHBvcnRLZXk+XSB9YFxyXG5jb25zdCBqc29uVG9DZXBoZXJBZGFwdGVyID0ge1xyXG4gIGNvbnZlcnRPYmplY3RUb0NlcGhlclByb3BlcnR5KG9iamVjdCkge1xyXG4gICAgbGV0IHByb3BlcnR5QXJyYXkgPSBbXVxyXG4gICAgZm9yIChsZXQgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKG9iamVjdCkpIHtcclxuICAgICAgc3dpdGNoICh0eXBlb2YgdmFsdWUpIHtcclxuICAgICAgICBjYXNlICdib29sZWFuJzpcclxuICAgICAgICBjYXNlICdudW1iZXInOlxyXG4gICAgICAgICAgcHJvcGVydHlBcnJheS5wdXNoKGAke2tleX06ICR7dmFsdWV9YClcclxuICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgY2FzZSAnc3RyaW5nJzpcclxuICAgICAgICAgIHByb3BlcnR5QXJyYXkucHVzaChgJHtrZXl9Oicke3ZhbHVlfSdgKSAvLyBOb3RlOiB1c2Ugc2luZ2xlLXF1b3RlcyB0byBhbGxvdyBqc29uIHN0cmluZ3MgdGhhdCByZWx5IG9uIGRvdWJsZSBxb3V0ZXMuXHJcbiAgICAgICAgICBicmVha1xyXG4gICAgICAgIGNhc2UgJ29iamVjdCc6IC8vIGFuIGFycmF5IChhcyB0aGUgcHJvcGVydHkgY2Fubm90IGJlIGFuIG9iamVjdCBpbiBwcm9wZXJ0eSBncmFwaCBkYXRhYmFzZXMpXHJcbiAgICAgICAgICBwcm9wZXJ0eUFycmF5LnB1c2goYCR7a2V5fTogWyR7dmFsdWUubWFwKGl0ZW0gPT4gKHR5cGVvZiBpdGVtID09ICdzdHJpbmcnID8gYCcke2l0ZW19J2AgOiBpdGVtKSkuam9pbignLCAnKX1dYClcclxuICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg4oCiIFwiJHt0eXBlb2YgdmFsdWV9XCIgUHJvcGVydHkgdmFsdWUgdHlwZSBmb3IgZ3JhcGggZGF0YSBpcyBub3Qgc3VwcG9ydGVkLmApXHJcbiAgICAgICAgICBicmVha1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcHJvcGVydHlBcnJheS5qb2luKCcsICcpXHJcbiAgfSxcclxuICBjb252ZXJ0QXJyYXlUb0NlcGhlckxhYmVsKGFycmF5KSB7XHJcbiAgICByZXR1cm4gYXJyYXkuam9pbignOicpXHJcbiAgfSxcclxufVxyXG5cclxubGV0IGlkZW50aXR5TnVtYmVyID0gLTEgLy8gdGhpcyBpcyBqdXN0IHVzZWQgdG8gY3JlYXRlIGlkcyB0aGF0IGNvdWxkIG5vdCBjb25mbGljdCB3aXRoIGN1cnJlbnRseSBleGlzdGluZyBpZHMuXHJcbmZ1bmN0aW9uIGNyZWF0ZUVkZ2VEYXRhKHsgc3RhcnRJZCwgZW5kSWQsIHR5cGUgfSkge1xyXG4gIGlkZW50aXR5TnVtYmVyLS1cclxuICByZXR1cm4ge1xyXG4gICAgaWRlbnRpdHk6IGlkZW50aXR5TnVtYmVyLFxyXG4gICAgc3RhcnQ6IHN0YXJ0SWQsXHJcbiAgICBlbmQ6IGVuZElkLFxyXG4gICAgdHlwZSxcclxuICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAga2V5OiBnZW5lcmF0ZVVVSUQoKSxcclxuICAgIH0sXHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYm9sdEN5cGhlck1vZGVsQWRhcHRlckZ1bmN0aW9uKHsgc2NoZW1lUmVmZXJlbmNlLCB1cmwgPSB7IHByb3RvY29sOiAnYm9sdCcsIGhvc3RuYW1lOiAnbG9jYWxob3N0JywgcG9ydDogNzY4NyB9LCBhdXRoZW50aWNhdGlvbiA9IHsgdXNlcm5hbWU6ICduZW80aicsIHBhc3N3b3JkOiAndGVzdCcgfSB9ID0ge30pIHtcclxuICBhc3NlcnQoc2NoZW1lUmVmZXJlbmNlLCBg4oCiIHNjaGVtZVJlZmVyZW5jZSBtdXN0IGJlIHBhc3NlZCB0byBpbml0aWFsaXplIHRoZSBtb2RlbCBhZGFwdGVyLmApXHJcbiAgY29uc3QgZ3JhcGhEQkRyaXZlciA9IGJvbHRQcm90b2NvbERyaXZlci5kcml2ZXIoYCR7dXJsLnByb3RvY29sfTovLyR7dXJsLmhvc3RuYW1lfToke3VybC5wb3J0fWAsIGJvbHRQcm90b2NvbERyaXZlci5hdXRoLmJhc2ljKGF1dGhlbnRpY2F0aW9uLnVzZXJuYW1lLCBhdXRoZW50aWNhdGlvbi5wYXNzd29yZCksIHtcclxuICAgIGRpc2FibGVMb3NzbGVzc0ludGVnZXJzOiB0cnVlLCAvLyBuZW80aiByZXByZXNlbnRzIElEcyBhcyBpbnRlZ2VycywgYW5kIHRocm91Z2ggdGhlIEpTIGRyaXZlciB0cmFuc2Zvcm1zIHRoZW0gdG8gc3RyaW5ncyB0byByZXByZXNlbnQgaGlnaCB2YWx1ZXMgYXBwcm94aW1hdGVseSAyXjUzICtcclxuICAgIC8vIG1heENvbm5lY3Rpb25Qb29sU2l6ZTogcHJvY2Vzcy5lbnYuRFJJVkVSX01BWF9DT05ORUNUSU9OX1BPT0xfU0laRSB8fCA1MCwgICAgICAgICAgICAgICAgICAgICAvLyBtYXhpbXVtIG51bWJlciBvZiBjb25uZWN0aW9ucyB0byB0aGUgY29ubmVjdGlvbiBwb29sXHJcbiAgICAvLyBtYXhDb25uZWN0aW9uTGlmZXRpbWU6IHByb2Nlc3MuZW52LkRSSVZFUl9NQVhfQ09OTkVDVElPTl9MSUZFVElNRSB8fCA0ICogNjAgKiA2MCAqIDEwMDAsICAgICAgLy8gdGltZSBpbiBtcywgNCBob3VycyBtYXhpbXVtIGNvbm5lY3Rpb24gbGlmZXRpbWVcclxuICAgIC8vIG1heFRyYW5zYWN0aW9uUmV0cnlUaW1lOiBwcm9jZXNzLmVudi5EUklWRVJfTUFYX1RSQU5TQUNUSU9OX1JFVFJZX1RJTUUgfHwgMyAqIDEwMDAsICAgICAgICAgICAvLyB0aW1lIGluIG1zIHRvIHJldHJ5IGEgdHJhbnNhY3Rpb25cclxuICAgIC8vIGNvbm5lY3Rpb25BY3F1aXNpdGlvblRpbWVvdXQ6IHByb2Nlc3MuZW52LkRSSVZFUl9DT05ORUNUSU9OX0FDUVVJU0lUSU9OX1RJTUVPVVQgfHwgMiAqIDEwMDAsICAvLyB0aW1lIGluIG1zIHRvIHdhaXQgZm9yIGEgY29ubmVjdGlvbiB0byBiZWNvbWUgYXZhaWxhYmxlIGluIHRoZSBwb29sXHJcbiAgICAvLyB0cnVzdDogcHJvY2Vzcy5lbnYuRFJJVkVSX1RMU19UUlVTVCB8fCAnVFJVU1RfQUxMX0NFUlRJRklDQVRFUycsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGxzIHRydXN0IGNvbmZpZ3VyYXRpb25cclxuICAgIC8vIGVuY3J5cHRlZDogcHJvY2Vzcy5lbnYuRFJJVkVSX1RMU19FTkFCTEVEIHx8ICdFTkNSWVBUSU9OX09GRicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBlbmFibGUvZGlzYWJsZSBUTFMgZW5jcnlwdGlvbiB0byBjbGllbnRcclxuICB9KVxyXG5cclxuICBjb25zdCBpbXBsZW1lbnRhdGlvbiA9IHtcclxuICAgIGRyaXZlckluc3RhbmNlOiBncmFwaERCRHJpdmVyLCAvLyBleHBvc2UgZHJpdmVyIGluc3RhbmNlXHJcblxyXG4gICAgLy8gVGhpcyBpcyBrZXB0IGZvciBmdXR1cmUgcmVmZXJlbmNlIG9ubHk6XHJcbiAgICBhc3luYyByZXBsYWNlTm9kZVdpdGhBbm90aGVyX2xvYWRHcmFwaERhdGEoeyBub2RlRW50cnlEYXRhID0gW10sIGNvbm5lY3Rpb25FbnRyeURhdGEgPSBbXSB9ID0ge30pIHtcclxuICAgICAgLy8gZGVhbCB3aXRoIGBOb2RlUmVmZXJlbmNlYFxyXG4gICAgICBsZXQgcmVmZXJlbmNlTm9kZUFycmF5ID0gbm9kZUVudHJ5RGF0YS5maWx0ZXIobm9kZSA9PiBub2RlLmxhYmVscy5pbmNsdWRlcyhzY2hlbWVSZWZlcmVuY2Uubm9kZUxhYmVsLm5vZGVSZWZlcmVuY2UpKSAvLyBleHRyYWN0IGBOb2RlUmVmZXJlbmNlYCBub2Rlc1xyXG4gICAgICBub2RlRW50cnlEYXRhID0gbm9kZUVudHJ5RGF0YS5maWx0ZXIobm9kZSA9PiAhcmVmZXJlbmNlTm9kZUFycmF5LnNvbWUoaSA9PiBpID09IG5vZGUpKSAvLyByZW1vdmUgcmVmZXJlbmNlIG5vZGVzIGZyb20gbm9kZSBhcnJheS5cclxuICAgICAgbGV0IHJlcm91dGVOb2RlTWFwID0gbmV3IE1hcCgpXHJcbiAgICAgIGxldCByZWludHJvZHVjZU5vZGVBcnJheSA9IFtdXHJcbiAgICAgIGZvciAobGV0IHJlZmVyZW5jZU5vZGUgb2YgcmVmZXJlbmNlTm9kZUFycmF5KSB7XHJcbiAgICAgICAgbGV0IGFjdHVhbFRhcmdldE5vZGUgPSBhd2FpdCBpbXBsZW1lbnRhdGlvbi5nZXROb2RlQnlLZXkoeyBrZXk6IHJlZmVyZW5jZU5vZGUucHJvcGVydGllcy5rZXksIHNob3VsZFRocm93OiBmYWxzZSB9KVxyXG4gICAgICAgIC8vIDxyZWZlcmVuY2UgaWQ+OiA8YWN0dWFsIGlkIGluIGdyYXBoPlxyXG4gICAgICAgIGlmIChhY3R1YWxUYXJnZXROb2RlKSB7XHJcbiAgICAgICAgICByZXJvdXRlTm9kZU1hcC5zZXQocmVmZXJlbmNlTm9kZS5pZGVudGl0eSwgYWN0dWFsVGFyZ2V0Tm9kZSlcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGDigKIgRm91bmQgXCJOb2RlUmVmZXJlbmNlXCIgdGFyZ2V0IGluIGN1cnJlbnQgZ3JhcGggJHtyZWZlcmVuY2VOb2RlLmlkZW50aXR5fSAtPiAke2FjdHVhbFRhcmdldE5vZGUuaWRlbnRpdHl9YClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgLy8gaWYgcmVmZXJlbmNlIG5vZGUga2V5IHdhcyBub3QgZm91bmQgaW4gdGhlIGN1cnJlbnQgZ3JhcGggZGF0YSwgcmVpbnRyb2R1Y2UgaXQgYXMgYSBOb2RlUmVmZXJlbmNlIG5vZGVcclxuICAgICAgICAgIHJlaW50cm9kdWNlTm9kZUFycmF5LnB1c2gocmVmZXJlbmNlTm9kZSlcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGDigKIgXCJOb2RlUmVmZXJlbmNlXCIgd2FzIG5vdCBmb3VuZCBpbiBjdXJyZW50IGdyYXBoIC0gJHtyZWZlcmVuY2VOb2RlLnByb3BlcnRpZXMua2V5fS5gKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICAvLyByZWludHJvZHVjZSByZWZlcmVuY2Ugbm9kZXMgdGhhdCB3aGVyZSBub3QgZm91bmQgaW4gY3VycmVudCBncmFwaFxyXG4gICAgICBmb3IgKGxldCBub2RlIG9mIHJlaW50cm9kdWNlTm9kZUFycmF5KSB7XHJcbiAgICAgICAgbm9kZUVudHJ5RGF0YS5wdXNoKG5vZGUpXHJcbiAgICAgIH1cclxuICAgICAgLy8gcmVwbGFjZSBub2RlIHJlZmVyZW5jZSB3aXRoIGFjdHVhbCBncmFwaCBpZGVudGl0eSBvZiB0aGUgdGFyZ2V0IHJlZmVyZW5jZSBub2RlXHJcbiAgICAgIGZvciAobGV0IGVkZ2Ugb2YgY29ubmVjdGlvbkVudHJ5RGF0YSkge1xyXG4gICAgICAgIGlmIChyZXJvdXRlTm9kZU1hcC5nZXQoZWRnZS5zdGFydCkpIHtcclxuICAgICAgICAgIGxldCBhY3R1YWxSZWZlcmVuY2VOb2RlID0gcmVyb3V0ZU5vZGVNYXAuZ2V0KGVkZ2Uuc3RhcnQpXHJcbiAgICAgICAgICBlZGdlLnN0YXJ0ID0gYWN0dWFsUmVmZXJlbmNlTm9kZS5pZGVudGl0eVxyXG4gICAgICAgICAgLy8gYWRkIGNvbm5lY3Rpb24ga2V5cyBmb3IgYWN0dWFsIHJlZmVyZW5jZSBub2RlcyB0aGF0IHRoZSBsYXR0ZXIgZnVuY3Rpb24gcmVseSBvbi5cclxuICAgICAgICAgIGVkZ2Uuc3RhcnRLZXkgPSBhY3R1YWxSZWZlcmVuY2VOb2RlLnByb3BlcnRpZXMua2V5XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChyZXJvdXRlTm9kZU1hcC5nZXQoZWRnZS5lbmQpKSB7XHJcbiAgICAgICAgICBsZXQgYWN0dWFsUmVmZXJlbmNlTm9kZSA9IHJlcm91dGVOb2RlTWFwLmdldChlZGdlLmVuZClcclxuICAgICAgICAgIGVkZ2UuZW5kID0gYWN0dWFsUmVmZXJlbmNlTm9kZS5pZGVudGl0eVxyXG4gICAgICAgICAgLy8gYWRkIGNvbm5lY3Rpb24ga2V5cyBmb3IgYWN0dWFsIHJlZmVyZW5jZSBub2RlcyB0aGF0IHRoZSBsYXR0ZXIgZnVuY3Rpb24gcmVseSBvbi5cclxuICAgICAgICAgIGVkZ2UuZW5kS2V5ID0gYWN0dWFsUmVmZXJlbmNlTm9kZS5wcm9wZXJ0aWVzLmtleVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgaWRNYXAgPSB7IG5vZGVJZGVudGl0eTogbmV3IE1hcCgpIC8qKiBtYXBzIG9sZCBncmFwaCBkYXRhIGlkcyB0byBuZXcgZGF0YSBpZHMuIChhcyBpZHMgY2Fubm90IGJlIHNldCBpbiB0aGUgZGF0YWJhc2Ugd2hlbiBsb2FkZWQgdGhlIGdyYXBoIGRhdGEuKSAqLyB9XHJcbiAgICAgIGZvciAobGV0IGVudHJ5IG9mIG5vZGVFbnRyeURhdGEpIHtcclxuICAgICAgICBsZXQgY3JlYXRlZE5vZGUgPSBhd2FpdCBpbXBsZW1lbnRhdGlvbi5hZGROb2RlKHsgbm9kZURhdGE6IGVudHJ5IH0pXHJcbiAgICAgICAgaWRNYXAubm9kZUlkZW50aXR5LnNldChlbnRyeS5pZGVudGl0eSwgY3JlYXRlZE5vZGUuaWRlbnRpdHkpIC8vIDxsb2FkZWQgcGFyYW1ldGVyIElEPjogPG5ldyBkYXRhYmFzZSBJRD5cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gYWRkIHJlZmVyZW5jZSB0YXJnZXQgbm9kZXMgdG8gdGhlIGxpc3Qgb2Ygbm9kZXMgZm9yIHVzYWdlIGluIGBhZGRDb25uZWN0aW9uIGZ1bmN0aW9uXHJcbiAgICAgIGxldCBhY3R1YWxSZWZlcmVuY2VOb2RlQXJyYXkgPSBBcnJheS5mcm9tKHJlcm91dGVOb2RlTWFwLnZhbHVlcygpKVxyXG4gICAgICBmb3IgKGxldCBhY3R1YWxSZWZlcmVuY2VOb2RlIG9mIGFjdHVhbFJlZmVyZW5jZU5vZGVBcnJheSkge1xyXG4gICAgICAgIGlkTWFwLm5vZGVJZGVudGl0eS5zZXQoYWN0dWFsUmVmZXJlbmNlTm9kZS5pZGVudGl0eSwgYWN0dWFsUmVmZXJlbmNlTm9kZS5pZGVudGl0eSlcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gcmVseSBvbiBga2V5YCBwcm9wZXJ0eSB0byBjcmVhdGUgY29ubmVjdGlvbnNcclxuICAgICAgY29ubmVjdGlvbkVudHJ5RGF0YS5tYXAoY29ubmVjdGlvbiA9PiB7XHJcbiAgICAgICAgaWYgKCFjb25uZWN0aW9uLnN0YXJ0S2V5KSBjb25uZWN0aW9uLnN0YXJ0S2V5ID0gbm9kZUVudHJ5RGF0YS5maWx0ZXIobm9kZSA9PiBub2RlLmlkZW50aXR5ID09IGNvbm5lY3Rpb24uc3RhcnQpWzBdLnByb3BlcnRpZXMua2V5XHJcbiAgICAgICAgaWYgKCFjb25uZWN0aW9uLmVuZEtleSkgY29ubmVjdGlvbi5lbmRLZXkgPSBub2RlRW50cnlEYXRhLmZpbHRlcihub2RlID0+IG5vZGUuaWRlbnRpdHkgPT0gY29ubmVjdGlvbi5lbmQpWzBdLnByb3BlcnRpZXMua2V5XHJcbiAgICAgIH0pXHJcbiAgICAgIGZvciAobGV0IGVudHJ5IG9mIGNvbm5lY3Rpb25FbnRyeURhdGEpIHtcclxuICAgICAgICBhd2FpdCBpbXBsZW1lbnRhdGlvbi5hZGRDb25uZWN0aW9uKHsgY29ubmVjdGlvbkRhdGE6IGVudHJ5LCBpZE1hcCB9KVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGFzeW5jIGRlYWxXaXRoRXh0ZXJuYWxSZWZlcmVuY2UoeyBub2RlRW50cnlEYXRhLCBjb25uZWN0aW9uRW50cnlEYXRhIH0pIHtcclxuICAgICAgLy8gZGVhbCB3aXRoIEV4dGVybmFsIFJlcm91dGUgLyBOb2RlUmVmZXJlbmNlXHJcbiAgICAgIGxldCBleHRlcm5hbFJlcm91dGVOb2RlQXJyYXkgPSBub2RlRW50cnlEYXRhXHJcbiAgICAgICAgLmZpbHRlcihub2RlID0+IG5vZGUubGFiZWxzLmluY2x1ZGVzKHNjaGVtZVJlZmVyZW5jZS5ub2RlTGFiZWwucmVyb3V0ZSkpIC8vIGV4dHJhY3QgUmVyb3V0ZS9Ob2RlUmVmZXJlbmNlIG5vZGVzXHJcbiAgICAgICAgLmZpbHRlcihyZXJvdXRlTm9kZSA9PiByZXJvdXRlTm9kZS5wcm9wZXJ0aWVzW3NjaGVtZVJlZmVyZW5jZS5yZXJvdXRlUHJvcGVydHkuZXh0ZXJuYWxSZWZlcmVuY2VOb2RlS2V5XSkgLy8gb25seSBleHRlcm5hbCByZXJvdXRlIG5vZGVzICh3aXRoIGFuIGV4dGVybmFsIGtleSBwcm9wZXJ0eSlcclxuXHJcbiAgICAgIGxldCByZXJvdXRlTm9kZU1hcCA9IG5ldyBNYXAoKVxyXG4gICAgICBmb3IgKGxldCByZXJvdXRlTm9kZSBvZiBleHRlcm5hbFJlcm91dGVOb2RlQXJyYXkpIHtcclxuICAgICAgICBsZXQgZXh0ZXJuYWxLZXkgPSByZXJvdXRlTm9kZS5wcm9wZXJ0aWVzW3NjaGVtZVJlZmVyZW5jZS5yZXJvdXRlUHJvcGVydHkuZXh0ZXJuYWxSZWZlcmVuY2VOb2RlS2V5XVxyXG4gICAgICAgIGxldCBhY3R1YWxUYXJnZXROb2RlID0gYXdhaXQgaW1wbGVtZW50YXRpb24uZ2V0Tm9kZUJ5S2V5KHsga2V5OiBleHRlcm5hbEtleSwgc2hvdWxkVGhyb3c6IGZhbHNlIH0pXHJcbiAgICAgICAgLy8gPHJlZmVyZW5jZSBpZD46IDxhY3R1YWwgaWQgaW4gZ3JhcGg+XHJcbiAgICAgICAgaWYgKGFjdHVhbFRhcmdldE5vZGUpIHtcclxuICAgICAgICAgIHJlcm91dGVOb2RlTWFwLnNldChyZXJvdXRlTm9kZSwgYWN0dWFsVGFyZ2V0Tm9kZSlcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGDigKIgRm91bmQgZXh0ZXJuYWwgcmVmZXJlbmNlIHRhcmdldCBub2RlIGluIGN1cnJlbnQgZ3JhcGggJHtyZXJvdXRlTm9kZS5pZGVudGl0eX0gLT4gJHthY3R1YWxUYXJnZXROb2RlLmlkZW50aXR5fWApXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIC8vIFdhcm4gaWYgbm8gcmVyb3V0ZSBub2RlcyB3aGVyZSByZXNvbHZlZDogaWYgcmVmZXJlbmNlIG5vZGUga2V5IHdhcyBub3QgZm91bmQgaW4gdGhlIGN1cnJlbnQgZ3JhcGggZGF0YSwgcmVpbnRyb2R1Y2UgaXQgYXMgYSBOb2RlUmVmZXJlbmNlIG5vZGVcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGDigKIgRXh0ZXJuYWwgcmVmZXJlbmNlIG5vZGUgKFwiJHtleHRlcm5hbEtleX1cIikgd2FzIG5vdCBmb3VuZCBpbiBjdXJyZW50IGdyYXBoIGZvciByZXJvdXRlIG5vZGUgLSAke3Jlcm91dGVOb2RlLnByb3BlcnRpZXMua2V5fS5gKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmVyb3V0ZU5vZGVNYXAuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xyXG4gICAgICAgIC8vIGNyZWF0ZSBSRUZFUkVOQ0UgZWRnZSBiZXR3ZWVuIHJlcm91dGUgbm9kZSBhbmQgdGhlIGFjdHVhbCBleHRlcm5hbCBncmFwaCB0YXJnZXQgcmVmZXJlbmNlIG5vZGVcclxuICAgICAgICBsZXQgcmVmZXJlbmNlRWRnZSA9IGNyZWF0ZUVkZ2VEYXRhKHsgc3RhcnRJZDogcmVyb3V0ZU5vZGUuaWRlbnRpdHksIGVuZElkOiBhY3R1YWxUYXJnZXROb2RlLmlkZW50aXR5LCB0eXBlOiBzY2hlbWVSZWZlcmVuY2UuY29ubmVjdGlvblR5cGUucmVmZXJlbmNlIH0pXHJcbiAgICAgICAgY29ubmVjdGlvbkVudHJ5RGF0YS5wdXNoKHJlZmVyZW5jZUVkZ2UpXHJcbiAgICAgIH0pXHJcbiAgICB9LFxyXG5cclxuICAgIC8vIGxvYWQgbm9kZXMgYW5kIGNvbm5lY3Rpb25zIGZyb20ganNvbiBmaWxlIGRhdGEuXHJcbiAgICAvLyBUT0RPOiBjaGVjayBpZiB0aGlzIG1ldGhvZCBzaG91bGQgYmUgcGxhY2VkIGluIGNvcmUgYXMgaXQgcmVsaWVzIG9uIG5vZGUgcmVmZXJlbmNlIC8gZXh0ZXJuYWwgcmVyb3V0ZSBjb25jZXB0XHJcbiAgICBhc3luYyBsb2FkR3JhcGhEYXRhKHsgbm9kZUVudHJ5RGF0YSA9IFtdLCBjb25uZWN0aW9uRW50cnlEYXRhID0gW10gfSA9IHt9KSB7XHJcbiAgICAgIGF3YWl0IGltcGxlbWVudGF0aW9uLmRlYWxXaXRoRXh0ZXJuYWxSZWZlcmVuY2UoeyBub2RlRW50cnlEYXRhLCBjb25uZWN0aW9uRW50cnlEYXRhIH0pIC8vIG1vZGlmaWVzIG5vZGUgJiBjb25uZWN0aW9uIGFycmF5c1xyXG5cclxuICAgICAgY29uc3QgaWRNYXAgPSB7IG5vZGVJZGVudGl0eTogbmV3IE1hcCgpIC8qKiBtYXBzIG9sZCBncmFwaCBkYXRhIGlkcyB0byBuZXcgZGF0YSBpZHMuIChhcyBpZHMgY2Fubm90IGJlIHNldCBpbiB0aGUgZGF0YWJhc2Ugd2hlbiBsb2FkZWQgdGhlIGdyYXBoIGRhdGEuKSAqLyB9XHJcbiAgICAgIGZvciAobGV0IGVudHJ5IG9mIG5vZGVFbnRyeURhdGEpIHtcclxuICAgICAgICBsZXQgY3JlYXRlZE5vZGUgPSBhd2FpdCBpbXBsZW1lbnRhdGlvbi5hZGROb2RlKHsgbm9kZURhdGE6IGVudHJ5IH0pXHJcbiAgICAgICAgaWRNYXAubm9kZUlkZW50aXR5LnNldChlbnRyeS5pZGVudGl0eSwgY3JlYXRlZE5vZGUuaWRlbnRpdHkpIC8vIDxsb2FkZWQgcGFyYW1ldGVyIElEPjogPG5ldyBkYXRhYmFzZSBJRD5cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gcmVseSBvbiBga2V5YCBwcm9wZXJ0eSB0byBjcmVhdGUgY29ubmVjdGlvbnNcclxuICAgICAgY29ubmVjdGlvbkVudHJ5RGF0YS5tYXAoY29ubmVjdGlvbiA9PiB7XHJcbiAgICAgICAgaWYgKCFjb25uZWN0aW9uLnN0YXJ0S2V5KSBjb25uZWN0aW9uLnN0YXJ0S2V5ID0gbm9kZUVudHJ5RGF0YS5maWx0ZXIobm9kZSA9PiBub2RlLmlkZW50aXR5ID09IGNvbm5lY3Rpb24uc3RhcnQpWzBdLnByb3BlcnRpZXMua2V5XHJcbiAgICAgICAgaWYgKCFjb25uZWN0aW9uLmVuZEtleSkgY29ubmVjdGlvbi5lbmRLZXkgPSBub2RlRW50cnlEYXRhLmZpbHRlcihub2RlID0+IG5vZGUuaWRlbnRpdHkgPT0gY29ubmVjdGlvbi5lbmQpWzBdLnByb3BlcnRpZXMua2V5XHJcbiAgICAgIH0pXHJcbiAgICAgIGZvciAobGV0IGVudHJ5IG9mIGNvbm5lY3Rpb25FbnRyeURhdGEpIHtcclxuICAgICAgICBhd2FpdCBpbXBsZW1lbnRhdGlvbi5hZGRDb25uZWN0aW9uKHsgY29ubmVjdGlvbkRhdGE6IGVudHJ5LCBpZE1hcCB9KVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgYWRkTm9kZTogYXN5bmMgKHsgbm9kZURhdGEgLypjb25mb3JtcyB3aXRoIHRoZSBDeXBoZXIgcXVlcnkgcmVzdWx0cyBkYXRhIGNvbnZlbnRpb24qLyB9KSA9PiB7XHJcbiAgICAgIGFzc2VydChub2RlRGF0YS5wcm9wZXJ0aWVzPy5rZXksICfigKIgTm9kZSBkYXRhIG11c3QgaGF2ZSBhIGtleSBwcm9wZXJ0eSAtICcgKyBub2RlRGF0YSlcclxuXHJcbiAgICAgIGxldCBsYWJlbFNlY3Rpb24gPSBub2RlRGF0YS5sYWJlbHMgJiYgbm9kZURhdGEubGFiZWxzLmxlbmd0aCA+IDAgPyBgOiR7anNvblRvQ2VwaGVyQWRhcHRlci5jb252ZXJ0QXJyYXlUb0NlcGhlckxhYmVsKG5vZGVEYXRhLmxhYmVscyl9YCA6ICcnXHJcbiAgICAgIGxldCBzZXNzaW9uID0gYXdhaXQgZ3JhcGhEQkRyaXZlci5zZXNzaW9uKClcclxuICAgICAgbGV0IHF1ZXJ5ID0gYFxyXG4gICAgICAgIGNyZWF0ZSAobiR7bGFiZWxTZWN0aW9ufSB7JHtqc29uVG9DZXBoZXJBZGFwdGVyLmNvbnZlcnRPYmplY3RUb0NlcGhlclByb3BlcnR5KG5vZGVEYXRhLnByb3BlcnRpZXMpfX0pXHJcbiAgICAgICAgcmV0dXJuIG5cclxuICAgICAgYFxyXG4gICAgICBsZXQgcmVzdWx0ID0gYXdhaXQgc2Vzc2lvbi5ydW4ocXVlcnkpXHJcbiAgICAgIGF3YWl0IHNlc3Npb24uY2xvc2UoKVxyXG4gICAgICByZXR1cm4gcmVzdWx0LnJlY29yZHNbMF0udG9PYmplY3QoKS5uXHJcbiAgICB9LFxyXG4gICAgYWRkQ29ubmVjdGlvbjogYXN5bmMgKHsgY29ubmVjdGlvbkRhdGEgLypjb25mb3JtcyB3aXRoIHRoZSBDeXBoZXIgcXVlcnkgcmVzdWx0cyBkYXRhIGNvbnZlbnRpb24qLywgaWRNYXAgLypVc2UgaWRlbnRpdGllcyB0byBjcmVhdGUgZWRnZXMgKi8gfSkgPT4ge1xyXG4gICAgICBhc3NlcnQodHlwZW9mIGNvbm5lY3Rpb25EYXRhLnN0YXJ0ID09ICdudW1iZXInICYmIHR5cGVvZiBjb25uZWN0aW9uRGF0YS5lbmQgPT0gJ251bWJlcicsIGDigKIgQ29ubmVjdGlvbiBtdXN0IGhhdmUgYSBzdGFydCBhbmQgZW5kIG5vZGVzLmApXHJcbiAgICAgIGlmIChjb25uZWN0aW9uRGF0YS50eXBlID09IHNjaGVtZVJlZmVyZW5jZS5jb25uZWN0aW9uVHlwZS5uZXh0KSBhc3NlcnQoY29ubmVjdGlvbkRhdGEucHJvcGVydGllcz8ua2V5LCAn4oCiIENvbm5lY3Rpb24gb2JqZWN0IG11c3QgaGF2ZSBhIGtleSBwcm9wZXJ0eS4nKVxyXG4gICAgICBsZXQgbm9kZUFycmF5ID0gYXdhaXQgaW1wbGVtZW50YXRpb24uZ2V0QWxsTm9kZSgpXHJcbiAgICAgIGxldCBzZXNzaW9uID0gYXdhaXQgZ3JhcGhEQkRyaXZlci5zZXNzaW9uKClcclxuXHJcbiAgICAgIGxldCBxdWVyeSA9IGBcclxuICAgICAgICBtYXRjaCAoc291cmNlIHsga2V5OiAnJHtjb25uZWN0aW9uRGF0YS5zdGFydEtleX0nIH0pICR7aWRNYXAgPyBgd2hlcmUgSUQoc291cmNlKSA9ICR7aWRNYXAubm9kZUlkZW50aXR5LmdldChjb25uZWN0aW9uRGF0YS5zdGFydCl9YCA6ICcnfVxyXG4gICAgICAgIG1hdGNoIChkZXN0aW5hdGlvbiB7IGtleTogJyR7Y29ubmVjdGlvbkRhdGEuZW5kS2V5fScgfSkgJHtpZE1hcCA/IGB3aGVyZSBJRChkZXN0aW5hdGlvbikgPSAke2lkTWFwLm5vZGVJZGVudGl0eS5nZXQoY29ubmVjdGlvbkRhdGEuZW5kKX1gIDogJyd9XHJcbiAgICAgICAgY3JlYXRlIFxyXG4gICAgICAgICAgKHNvdXJjZSlcclxuICAgICAgICAgIC1bbDoke2Nvbm5lY3Rpb25EYXRhLnR5cGV9IHske2pzb25Ub0NlcGhlckFkYXB0ZXIuY29udmVydE9iamVjdFRvQ2VwaGVyUHJvcGVydHkoY29ubmVjdGlvbkRhdGEucHJvcGVydGllcyl9fV0tPlxyXG4gICAgICAgICAgKGRlc3RpbmF0aW9uKSBcclxuICAgICAgICByZXR1cm4gbFxyXG4gICAgICBgXHJcbiAgICAgIGxldCByZXN1bHQgPSBhd2FpdCBzZXNzaW9uLnJ1bihxdWVyeSlcclxuICAgICAgLy8gcmVzdWx0LnJlY29yZHMuZm9yRWFjaChyZWNvcmQgPT4gcmVjb3JkLnRvT2JqZWN0KCkgfD4gY29uc29sZS5sb2cpXHJcbiAgICAgIGF3YWl0IHNlc3Npb24uY2xvc2UoKVxyXG4gICAgICByZXR1cm4gcmVzdWx0XHJcbiAgICB9LFxyXG4gICAgLy8gVE9ETzogVXBkYXRlIHRoaXMgZnVuY3Rpb24gdG8gY29uc2lkZXIgdGhlIHJldHVybmVkIGRlc3RpbmF0aW9uICYgc291cmNlIG5vZGVzLCB3b3VsZCBtYXRjaCB0aGVpciByb2xlIGluIHRoZSBjb25uZWN0aW9uIHBhaXIgKGUuZy4gY2hlY2sgYGdldE5vZGVDb25uZWN0aW9uYCBiZWxvdykuXHJcbiAgICBnZXROb2RlQ29ubmVjdGlvbkJ5S2V5OiBhc3luYyBmdW5jdGlvbih7XHJcbiAgICAgIGRpcmVjdGlvbiA9ICdvdXRnb2luZycgLyogZmlsdGVyIGNvbm5lY3Rpb24gYXJyYXkgdG8gbWF0Y2ggb3V0Z29pbmcgY29ubmVjdGlvbnMgb25seSovLFxyXG4gICAgICBzb3VyY2VLZXksXHJcbiAgICAgIGRlc3RpbmF0aW9uTm9kZVR5cGUsXHJcbiAgICB9OiB7XHJcbiAgICAgIGRpcmVjdGlvbjogJ291dGdvaW5nJyB8ICdpbmNvbWluZycsXHJcbiAgICB9KSB7XHJcbiAgICAgIGFzc2VydChkaXJlY3Rpb24gPT0gJ291dGdvaW5nJywgJ+KAoiBgZGlyZWN0aW9uYCBwYXJhbWV0ZXIgdW5zdXBwb3J0ZWQuJylcclxuICAgICAgbGV0IHNlc3Npb24gPSBhd2FpdCBncmFwaERCRHJpdmVyLnNlc3Npb24oKVxyXG4gICAgICBsZXQgcXVlcnkgPSBgXHJcbiAgICAgICAgbWF0Y2ggXHJcbiAgICAgICAgICAoc291cmNlIHsga2V5OiAnJHtzb3VyY2VLZXl9JyB9KVxyXG4gICAgICAgICAgLVtsOiR7c2NoZW1lUmVmZXJlbmNlLmNvbm5lY3Rpb25UeXBlLm5leHR9XS0+XHJcbiAgICAgICAgICAoZGVzdGluYXRpb24ke2Rlc3RpbmF0aW9uTm9kZVR5cGUgPyBgOiR7ZGVzdGluYXRpb25Ob2RlVHlwZX1gIDogJyd9KSBcclxuICAgICAgICByZXR1cm4gbFxyXG4gICAgICAgIG9yZGVyIGJ5IGRlc3RpbmF0aW9uLmtleVxyXG4gICAgICBgXHJcbiAgICAgIGxldCByZXN1bHQgPSBhd2FpdCBzZXNzaW9uLnJ1bihxdWVyeSlcclxuICAgICAgcmVzdWx0ID0gcmVzdWx0LnJlY29yZHMubWFwKHJlY29yZCA9PiByZWNvcmQudG9PYmplY3QoKS5sKVxyXG4gICAgICBhd2FpdCBzZXNzaW9uLmNsb3NlKClcclxuICAgICAgcmV0dXJuIHJlc3VsdFxyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICogQHJldHVybnMgQXJyYXkgb2Ygb2JqZWN0cyBbe1xyXG4gICAgICogIGNvbm5lY3Rpb246IE9iamVjdCxcclxuICAgICAqICBzb3VyY2U6IE9iamVjdCxcclxuICAgICAqICBkZXN0aW5hdGlvbjogT2JqZWN0XHJcbiAgICAgKiB9XVxyXG4gICAgICovXHJcbiAgICBnZXROb2RlQ29ubmVjdGlvbjogYXN5bmMgZnVuY3Rpb24oe1xyXG4gICAgICBub2RlSUQsXHJcbiAgICAgIGRpcmVjdGlvbiAvKiBmaWx0ZXIgY29ubmVjdGlvbiBhcnJheSB0byBtYXRjaCBvdXRnb2luZyBjb25uZWN0aW9ucyBvbmx5Ki8sXHJcbiAgICAgIG90aGVyUGFpck5vZGVUeXBlLFxyXG4gICAgICBjb25uZWN0aW9uVHlwZSxcclxuICAgIH06IHtcclxuICAgICAgZGlyZWN0aW9uOiAnb3V0Z29pbmcnIHwgJ2luY29taW5nJyB8IHVuZGVmaW5lZCAvKmJvdGggaW5jb21pbmcgYW5kIG91dGdvaW5nKi8sXHJcbiAgICB9KSB7XHJcbiAgICAgIGxldCBzZXNzaW9uID0gYXdhaXQgZ3JhcGhEQkRyaXZlci5zZXNzaW9uKClcclxuICAgICAgbGV0IGNvbm5lY3Rpb25UeXBlUXVlcnkgPSBjb25uZWN0aW9uVHlwZSA/IGA6JHtjb25uZWN0aW9uVHlwZX1gIDogYGBcclxuICAgICAgbGV0IGNvbm5lY3Rpb24gPSBkaXJlY3Rpb24gPT0gJ291dGdvaW5nJyA/IGAtW2Nvbm5lY3Rpb24ke2Nvbm5lY3Rpb25UeXBlUXVlcnl9XS0+YCA6IGRpcmVjdGlvbiA9PSAnaW5jb21pbmcnID8gYDwtW2Nvbm5lY3Rpb24ke2Nvbm5lY3Rpb25UeXBlUXVlcnl9XS1gIDogYC1bY29ubmVjdGlvbiR7Y29ubmVjdGlvblR5cGVRdWVyeX1dLWBcclxuICAgICAgbGV0IHF1ZXJ5XHJcblxyXG4gICAgICAvLyBzd2l0Y2ggZGlyZWN0aW9uIHRvIHJldHVybiBkZXN0aW5hdGlvbiBhbmQgc291cmNlIGNvcnJlY3RseSBhY2NvcmRpbmcgdG8gdGhlIGRpZmZlcmVudCBjYXNlcy5cclxuICAgICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcclxuICAgICAgICBjYXNlICdvdXRnb2luZyc6XHJcbiAgICAgICAgICBxdWVyeSA9IGBcclxuICAgICAgICAgICAgbWF0Y2ggKHNvdXJjZSkgICR7Y29ubmVjdGlvbn0gKGRlc3RpbmF0aW9uJHtvdGhlclBhaXJOb2RlVHlwZSA/IGA6JHtvdGhlclBhaXJOb2RlVHlwZX1gIDogJyd9KSBcclxuICAgICAgICAgICAgd2hlcmUgaWQoc291cmNlKT0ke25vZGVJRH1cclxuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3Rpb24sIHNvdXJjZSwgZGVzdGluYXRpb24gb3JkZXIgYnkgZGVzdGluYXRpb24ua2V5XHJcbiAgICAgICAgICBgXHJcbiAgICAgICAgICBicmVha1xyXG4gICAgICAgIGNhc2UgJ2luY29taW5nJzpcclxuICAgICAgICAgIHF1ZXJ5ID0gYFxyXG4gICAgICAgICAgICBtYXRjaCAoZGVzdGluYXRpb24pICAke2Nvbm5lY3Rpb259IChzb3VyY2Uke290aGVyUGFpck5vZGVUeXBlID8gYDoke290aGVyUGFpck5vZGVUeXBlfWAgOiAnJ30pXHJcbiAgICAgICAgICAgIHdoZXJlIGlkKGRlc3RpbmF0aW9uKT0ke25vZGVJRH1cclxuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3Rpb24sIHNvdXJjZSwgZGVzdGluYXRpb24gb3JkZXIgYnkgc291cmNlLmtleVxyXG4gICAgICAgICAgYFxyXG4gICAgICAgICAgYnJlYWtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgcXVlcnkgPSBgXHJcbiAgICAgICAgICAgIG1hdGNoIChzb3VyY2UpICAke2Nvbm5lY3Rpb259IChkZXN0aW5hdGlvbiR7b3RoZXJQYWlyTm9kZVR5cGUgPyBgOiR7b3RoZXJQYWlyTm9kZVR5cGV9YCA6ICcnfSkgXHJcbiAgICAgICAgICAgIHdoZXJlIGlkKHNvdXJjZSk9JHtub2RlSUR9XHJcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0aW9uLCBzb3VyY2UsIGRlc3RpbmF0aW9uIG9yZGVyIGJ5IGRlc3RpbmF0aW9uLmtleVxyXG4gICAgICAgICAgYFxyXG4gICAgICAgICAgYnJlYWtcclxuICAgICAgfVxyXG4gICAgICBsZXQgcmVzdWx0ID0gYXdhaXQgc2Vzc2lvbi5ydW4ocXVlcnkpXHJcbiAgICAgIHJlc3VsdCA9IHJlc3VsdC5yZWNvcmRzLm1hcChyZWNvcmQgPT4gcmVjb3JkLnRvT2JqZWN0KCkpXHJcbiAgICAgIGF3YWl0IHNlc3Npb24uY2xvc2UoKVxyXG4gICAgICByZXR1cm4gcmVzdWx0XHJcbiAgICB9LFxyXG4gICAgZ2V0Tm9kZUJ5S2V5OiBhc3luYyBmdW5jdGlvbih7IGtleSwgc2hvdWxkVGhyb3cgPSB0cnVlIH0pIHtcclxuICAgICAgbGV0IHNlc3Npb24gPSBhd2FpdCBncmFwaERCRHJpdmVyLnNlc3Npb24oKVxyXG4gICAgICBsZXQgcXVlcnkgPSBgXHJcbiAgICAgICAgbWF0Y2ggKG4ge2tleTogJyR7a2V5fSd9KVxyXG4gICAgICAgIHJldHVybiBuXHJcbiAgICAgIGBcclxuICAgICAgbGV0IHJlc3VsdCA9IGF3YWl0IHNlc3Npb24ucnVuKHF1ZXJ5KVxyXG4gICAgICBhd2FpdCBzZXNzaW9uLmNsb3NlKClcclxuICAgICAgaWYgKHNob3VsZFRocm93KSBhc3NlcnQocmVzdWx0LnJlY29yZHNbMF0sIGDigKIgQ2Fubm90IGZpbmQgbm9kZSB3aGVyZSBub2RlLmtleT1cIiR7a2V5fVwiYClcclxuICAgICAgaWYgKHJlc3VsdC5yZWNvcmRzLmxlbmd0aCA9PSAwKSByZXR1cm4gZmFsc2VcclxuICAgICAgcmV0dXJuIHJlc3VsdC5yZWNvcmRzWzBdLnRvT2JqZWN0KCkublxyXG4gICAgfSxcclxuICAgIGdldE5vZGVCeUlEOiBhc3luYyBmdW5jdGlvbih7IGlkIH0pIHtcclxuICAgICAgbGV0IHNlc3Npb24gPSBhd2FpdCBncmFwaERCRHJpdmVyLnNlc3Npb24oKVxyXG4gICAgICBsZXQgcXVlcnkgPSBgXHJcbiAgICAgICAgbWF0Y2ggKG4pIHdoZXJlIGlkKG4pPSR7aWR9XHJcbiAgICAgICAgcmV0dXJuIG5cclxuICAgICAgYFxyXG4gICAgICBsZXQgcmVzdWx0ID0gYXdhaXQgc2Vzc2lvbi5ydW4ocXVlcnkpXHJcbiAgICAgIGF3YWl0IHNlc3Npb24uY2xvc2UoKVxyXG4gICAgICByZXR1cm4gcmVzdWx0LnJlY29yZHNbMF0udG9PYmplY3QoKS5uXHJcbiAgICB9LFxyXG4gICAgZ2V0QWxsTm9kZTogYXN5bmMgZnVuY3Rpb24oKSB7XHJcbiAgICAgIGxldCBzZXNzaW9uID0gYXdhaXQgZ3JhcGhEQkRyaXZlci5zZXNzaW9uKClcclxuICAgICAgbGV0IHF1ZXJ5ID0gYFxyXG4gICAgICAgIG1hdGNoIChuKSByZXR1cm4gbiBvcmRlciBieSBuLmtleVxyXG4gICAgICBgXHJcbiAgICAgIGxldCByZXN1bHQgPSBhd2FpdCBzZXNzaW9uLnJ1bihxdWVyeSlcclxuICAgICAgYXdhaXQgc2Vzc2lvbi5jbG9zZSgpXHJcbiAgICAgIHJldHVybiByZXN1bHQucmVjb3Jkc1xyXG4gICAgICAgIC5tYXAocmVjb3JkID0+IHJlY29yZC50b09iamVjdCgpLm4pXHJcbiAgICAgICAgLm1hcChub2RlID0+IHtcclxuICAgICAgICAgIC8vIG5vZGUuaWRlbnRpdHkgPSBub2RlLmlkZW50aXR5LnRvU3RyaW5nKClcclxuICAgICAgICAgIHJldHVybiBub2RlXHJcbiAgICAgICAgfSlcclxuICAgIH0sXHJcbiAgICBnZXRBbGxFZGdlOiBhc3luYyBmdW5jdGlvbigpIHtcclxuICAgICAgbGV0IHNlc3Npb24gPSBhd2FpdCBncmFwaERCRHJpdmVyLnNlc3Npb24oKVxyXG4gICAgICBsZXQgcXVlcnkgPSBgXHJcbiAgICAgICAgbWF0Y2ggKCktW2xdLT4obikgcmV0dXJuIGwgb3JkZXIgYnkgbi5rZXlcclxuICAgICAgYFxyXG4gICAgICBsZXQgcmVzdWx0ID0gYXdhaXQgc2Vzc2lvbi5ydW4ocXVlcnkpXHJcbiAgICAgIGF3YWl0IHNlc3Npb24uY2xvc2UoKVxyXG4gICAgICByZXR1cm4gcmVzdWx0LnJlY29yZHNcclxuICAgICAgICAubWFwKHJlY29yZCA9PiByZWNvcmQudG9PYmplY3QoKS5sKVxyXG4gICAgICAgIC5tYXAoZWRnZSA9PiB7XHJcbiAgICAgICAgICAvLyBOb3RlOiBCb2x0IGRyaXZlciBvcHRpb24gaGFuZGxlcyBpbnRlZ2VyIHRyYW5zZm9ybWF0aW9uLlxyXG4gICAgICAgICAgLy8gY2hhbmdlIG51bWJlcnMgdG8gc3RyaW5nIHJlcHJlc2VudGF0aW9uXHJcbiAgICAgICAgICAvLyBlZGdlLmlkZW50aXR5ID0gZWRnZS5pZGVudGl0eS50b1N0cmluZygpXHJcbiAgICAgICAgICAvLyBlZGdlLnN0YXJ0ID0gZWRnZS5zdGFydC50b1N0cmluZygpXHJcbiAgICAgICAgICAvLyBlZGdlLmVuZCA9IGVkZ2UuZW5kLnRvU3RyaW5nKClcclxuICAgICAgICAgIHJldHVybiBlZGdlXHJcbiAgICAgICAgfSlcclxuICAgIH0sXHJcbiAgICBjb3VudE5vZGU6IGFzeW5jIGZ1bmN0aW9uKCkge1xyXG4gICAgICBsZXQgc2Vzc2lvbiA9IGF3YWl0IGdyYXBoREJEcml2ZXIuc2Vzc2lvbigpXHJcbiAgICAgIGxldCBxdWVyeSA9IGBcclxuICAgICAgICBNQVRDSCAobilcclxuICAgICAgICBSRVRVUk4gY291bnQobikgYXMgY291bnRcclxuICAgICAgYFxyXG4gICAgICBsZXQgcmVzdWx0ID0gYXdhaXQgc2Vzc2lvbi5ydW4ocXVlcnkpXHJcbiAgICAgIGF3YWl0IHNlc3Npb24uY2xvc2UoKVxyXG4gICAgICByZXR1cm4gcmVzdWx0LnJlY29yZHNbMF0udG9PYmplY3QoKS5jb3VudFxyXG4gICAgfSxcclxuICAgIGNvdW50RWRnZTogYXN5bmMgZnVuY3Rpb24oKSB7XHJcbiAgICAgIGxldCBzZXNzaW9uID0gYXdhaXQgZ3JhcGhEQkRyaXZlci5zZXNzaW9uKClcclxuICAgICAgbGV0IHF1ZXJ5ID0gYFxyXG4gICAgICAgIE1BVENIICgpLVtyXS0+KClcclxuICAgICAgICBSRVRVUk4gY291bnQocikgYXMgY291bnRcclxuICAgICAgYFxyXG4gICAgICBsZXQgcmVzdWx0ID0gYXdhaXQgc2Vzc2lvbi5ydW4ocXVlcnkpXHJcbiAgICAgIGF3YWl0IHNlc3Npb24uY2xvc2UoKVxyXG4gICAgICByZXR1cm4gcmVzdWx0LnJlY29yZHNbMF0udG9PYmplY3QoKS5jb3VudFxyXG4gICAgfSxcclxuICB9XHJcbiAgcmV0dXJuIGltcGxlbWVudGF0aW9uXHJcbn1cclxuIl19