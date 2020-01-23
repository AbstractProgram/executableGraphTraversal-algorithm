"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.boltCypherModelAdapterFunction = void 0;var _assert = _interopRequireDefault(require("assert"));

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

const boltCypherModelAdapterFunction = ({ url = { protocol: 'bolt', hostname: 'localhost', port: 7687 }, authentication = { username: 'neo4j', password: 'test' } } = {}) =>
function ({ schemeReference } = {}) {
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
};exports.boltCypherModelAdapterFunction = boltCypherModelAdapterFunction;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NvdXJjZS9kYXRhYmFzZUltcGxlbWVudGF0aW9uL2JvbHRDeXBoZXJNb2RlbEFkYXB0ZXIuanMiXSwibmFtZXMiOlsiYm9sdFByb3RvY29sRHJpdmVyIiwicmVxdWlyZSIsInYxIiwianNvblRvQ2VwaGVyQWRhcHRlciIsImNvbnZlcnRPYmplY3RUb0NlcGhlclByb3BlcnR5Iiwib2JqZWN0IiwicHJvcGVydHlBcnJheSIsImtleSIsInZhbHVlIiwiT2JqZWN0IiwiZW50cmllcyIsInB1c2giLCJtYXAiLCJpdGVtIiwiam9pbiIsIkVycm9yIiwiY29udmVydEFycmF5VG9DZXBoZXJMYWJlbCIsImFycmF5IiwiaWRlbnRpdHlOdW1iZXIiLCJjcmVhdGVFZGdlRGF0YSIsInN0YXJ0SWQiLCJlbmRJZCIsInR5cGUiLCJpZGVudGl0eSIsInN0YXJ0IiwiZW5kIiwicHJvcGVydGllcyIsImJvbHRDeXBoZXJNb2RlbEFkYXB0ZXJGdW5jdGlvbiIsInVybCIsInByb3RvY29sIiwiaG9zdG5hbWUiLCJwb3J0IiwiYXV0aGVudGljYXRpb24iLCJ1c2VybmFtZSIsInBhc3N3b3JkIiwic2NoZW1lUmVmZXJlbmNlIiwiZ3JhcGhEQkRyaXZlciIsImRyaXZlciIsImF1dGgiLCJiYXNpYyIsImRpc2FibGVMb3NzbGVzc0ludGVnZXJzIiwiaW1wbGVtZW50YXRpb24iLCJkcml2ZXJJbnN0YW5jZSIsInJlcGxhY2VOb2RlV2l0aEFub3RoZXJfbG9hZEdyYXBoRGF0YSIsIm5vZGVFbnRyeURhdGEiLCJjb25uZWN0aW9uRW50cnlEYXRhIiwicmVmZXJlbmNlTm9kZUFycmF5IiwiZmlsdGVyIiwibm9kZSIsImxhYmVscyIsImluY2x1ZGVzIiwibm9kZUxhYmVsIiwibm9kZVJlZmVyZW5jZSIsInNvbWUiLCJpIiwicmVyb3V0ZU5vZGVNYXAiLCJNYXAiLCJyZWludHJvZHVjZU5vZGVBcnJheSIsInJlZmVyZW5jZU5vZGUiLCJhY3R1YWxUYXJnZXROb2RlIiwiZ2V0Tm9kZUJ5S2V5Iiwic2hvdWxkVGhyb3ciLCJzZXQiLCJjb25zb2xlIiwibG9nIiwiZWRnZSIsImdldCIsImFjdHVhbFJlZmVyZW5jZU5vZGUiLCJzdGFydEtleSIsImVuZEtleSIsImlkTWFwIiwibm9kZUlkZW50aXR5IiwiZW50cnkiLCJjcmVhdGVkTm9kZSIsImFkZE5vZGUiLCJub2RlRGF0YSIsImFjdHVhbFJlZmVyZW5jZU5vZGVBcnJheSIsIkFycmF5IiwiZnJvbSIsInZhbHVlcyIsImNvbm5lY3Rpb24iLCJhZGRDb25uZWN0aW9uIiwiY29ubmVjdGlvbkRhdGEiLCJkZWFsV2l0aEV4dGVybmFsUmVmZXJlbmNlIiwiZXh0ZXJuYWxSZXJvdXRlTm9kZUFycmF5IiwicmVyb3V0ZSIsInJlcm91dGVOb2RlIiwicmVyb3V0ZVByb3BlcnR5IiwiZXh0ZXJuYWxSZWZlcmVuY2VOb2RlS2V5IiwiZXh0ZXJuYWxLZXkiLCJmb3JFYWNoIiwicmVmZXJlbmNlRWRnZSIsImNvbm5lY3Rpb25UeXBlIiwicmVmZXJlbmNlIiwibG9hZEdyYXBoRGF0YSIsImxhYmVsU2VjdGlvbiIsImxlbmd0aCIsInNlc3Npb24iLCJxdWVyeSIsInJlc3VsdCIsInJ1biIsImNsb3NlIiwicmVjb3JkcyIsInRvT2JqZWN0IiwibiIsIm5leHQiLCJub2RlQXJyYXkiLCJnZXRBbGxOb2RlIiwiZ2V0Tm9kZUNvbm5lY3Rpb25CeUtleSIsImRpcmVjdGlvbiIsInNvdXJjZUtleSIsImRlc3RpbmF0aW9uTm9kZVR5cGUiLCJyZWNvcmQiLCJsIiwiZ2V0Tm9kZUNvbm5lY3Rpb24iLCJub2RlSUQiLCJvdGhlclBhaXJOb2RlVHlwZSIsImNvbm5lY3Rpb25UeXBlUXVlcnkiLCJnZXROb2RlQnlJRCIsImlkIiwiZ2V0QWxsRWRnZSIsImNvdW50Tm9kZSIsImNvdW50IiwiY291bnRFZGdlIl0sIm1hcHBpbmdzIjoiZ05BQUE7O0FBRUEsb0RBREEsTUFBTUEsa0JBQWtCLEdBQUdDLE9BQU8sQ0FBQyxjQUFELENBQVAsQ0FBd0JDLEVBQW5EOztB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QUFuQjtBQUNBLFlBQU1ELE9BQU8sQ0FBQ0ksS0FBUixFQUFOO0FBQ0EsYUFBT0YsTUFBTSxDQUFDRyxPQUFQLENBQWUsQ0FBZixFQUFrQkMsUUFBbEIsR0FBNkJtQixLQUFwQztBQUNELEtBalNvQixFQUF2Qjs7QUFtU0EsU0FBT2pGLGNBQVA7QUFDRCxDQWpUSSxDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnXHJcbmNvbnN0IGJvbHRQcm90b2NvbERyaXZlciA9IHJlcXVpcmUoJ25lbzRqLWRyaXZlcicpLnYxXHJcbmltcG9ydCBnZW5lcmF0ZVVVSUQgZnJvbSAndXVpZC92NCdcclxuLy8gY29udmVudGlvbiBvZiBkYXRhIHN0cnVjdHVyZSAtIGBjb25uZWN0aW9uOiB7IHNvdXJjZTogWzxub2RlS2V5PiwgPHBvcnRLZXk+XSwgZGVzdGluYXRpb246IFs8bm9kZUtleT4sIDxwb3J0S2V5Pl0gfWBcclxuY29uc3QganNvblRvQ2VwaGVyQWRhcHRlciA9IHtcclxuICBjb252ZXJ0T2JqZWN0VG9DZXBoZXJQcm9wZXJ0eShvYmplY3QpIHtcclxuICAgIGxldCBwcm9wZXJ0eUFycmF5ID0gW11cclxuICAgIGZvciAobGV0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhvYmplY3QpKSB7XHJcbiAgICAgIHN3aXRjaCAodHlwZW9mIHZhbHVlKSB7XHJcbiAgICAgICAgY2FzZSAnYm9vbGVhbic6XHJcbiAgICAgICAgY2FzZSAnbnVtYmVyJzpcclxuICAgICAgICAgIHByb3BlcnR5QXJyYXkucHVzaChgJHtrZXl9OiAke3ZhbHVlfWApXHJcbiAgICAgICAgICBicmVha1xyXG4gICAgICAgIGNhc2UgJ3N0cmluZyc6XHJcbiAgICAgICAgICBwcm9wZXJ0eUFycmF5LnB1c2goYCR7a2V5fTonJHt2YWx1ZX0nYCkgLy8gTm90ZTogdXNlIHNpbmdsZS1xdW90ZXMgdG8gYWxsb3cganNvbiBzdHJpbmdzIHRoYXQgcmVseSBvbiBkb3VibGUgcW91dGVzLlxyXG4gICAgICAgICAgYnJlYWtcclxuICAgICAgICBjYXNlICdvYmplY3QnOiAvLyBhbiBhcnJheSAoYXMgdGhlIHByb3BlcnR5IGNhbm5vdCBiZSBhbiBvYmplY3QgaW4gcHJvcGVydHkgZ3JhcGggZGF0YWJhc2VzKVxyXG4gICAgICAgICAgcHJvcGVydHlBcnJheS5wdXNoKGAke2tleX06IFske3ZhbHVlLm1hcChpdGVtID0+ICh0eXBlb2YgaXRlbSA9PSAnc3RyaW5nJyA/IGAnJHtpdGVtfSdgIDogaXRlbSkpLmpvaW4oJywgJyl9XWApXHJcbiAgICAgICAgICBicmVha1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOKAoiBcIiR7dHlwZW9mIHZhbHVlfVwiIFByb3BlcnR5IHZhbHVlIHR5cGUgZm9yIGdyYXBoIGRhdGEgaXMgbm90IHN1cHBvcnRlZC5gKVxyXG4gICAgICAgICAgYnJlYWtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHByb3BlcnR5QXJyYXkuam9pbignLCAnKVxyXG4gIH0sXHJcbiAgY29udmVydEFycmF5VG9DZXBoZXJMYWJlbChhcnJheSkge1xyXG4gICAgcmV0dXJuIGFycmF5LmpvaW4oJzonKVxyXG4gIH0sXHJcbn1cclxuXHJcbmxldCBpZGVudGl0eU51bWJlciA9IC0xIC8vIHRoaXMgaXMganVzdCB1c2VkIHRvIGNyZWF0ZSBpZHMgdGhhdCBjb3VsZCBub3QgY29uZmxpY3Qgd2l0aCBjdXJyZW50bHkgZXhpc3RpbmcgaWRzLlxyXG5mdW5jdGlvbiBjcmVhdGVFZGdlRGF0YSh7IHN0YXJ0SWQsIGVuZElkLCB0eXBlIH0pIHtcclxuICBpZGVudGl0eU51bWJlci0tXHJcbiAgcmV0dXJuIHtcclxuICAgIGlkZW50aXR5OiBpZGVudGl0eU51bWJlcixcclxuICAgIHN0YXJ0OiBzdGFydElkLFxyXG4gICAgZW5kOiBlbmRJZCxcclxuICAgIHR5cGUsXHJcbiAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgIGtleTogZ2VuZXJhdGVVVUlEKCksXHJcbiAgICB9LFxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGJvbHRDeXBoZXJNb2RlbEFkYXB0ZXJGdW5jdGlvbiA9ICh7IHVybCA9IHsgcHJvdG9jb2w6ICdib2x0JywgaG9zdG5hbWU6ICdsb2NhbGhvc3QnLCBwb3J0OiA3Njg3IH0sIGF1dGhlbnRpY2F0aW9uID0geyB1c2VybmFtZTogJ25lbzRqJywgcGFzc3dvcmQ6ICd0ZXN0JyB9IH0gPSB7fSkgPT5cclxuICBmdW5jdGlvbih7IHNjaGVtZVJlZmVyZW5jZSB9ID0ge30pIHtcclxuICAgIGFzc2VydChzY2hlbWVSZWZlcmVuY2UsIGDigKIgc2NoZW1lUmVmZXJlbmNlIG11c3QgYmUgcGFzc2VkIHRvIGluaXRpYWxpemUgdGhlIG1vZGVsIGFkYXB0ZXIuYClcclxuICAgIGNvbnN0IGdyYXBoREJEcml2ZXIgPSBib2x0UHJvdG9jb2xEcml2ZXIuZHJpdmVyKGAke3VybC5wcm90b2NvbH06Ly8ke3VybC5ob3N0bmFtZX06JHt1cmwucG9ydH1gLCBib2x0UHJvdG9jb2xEcml2ZXIuYXV0aC5iYXNpYyhhdXRoZW50aWNhdGlvbi51c2VybmFtZSwgYXV0aGVudGljYXRpb24ucGFzc3dvcmQpLCB7XHJcbiAgICAgIGRpc2FibGVMb3NzbGVzc0ludGVnZXJzOiB0cnVlLCAvLyBuZW80aiByZXByZXNlbnRzIElEcyBhcyBpbnRlZ2VycywgYW5kIHRocm91Z2ggdGhlIEpTIGRyaXZlciB0cmFuc2Zvcm1zIHRoZW0gdG8gc3RyaW5ncyB0byByZXByZXNlbnQgaGlnaCB2YWx1ZXMgYXBwcm94aW1hdGVseSAyXjUzICtcclxuICAgICAgLy8gbWF4Q29ubmVjdGlvblBvb2xTaXplOiBwcm9jZXNzLmVudi5EUklWRVJfTUFYX0NPTk5FQ1RJT05fUE9PTF9TSVpFIHx8IDUwLCAgICAgICAgICAgICAgICAgICAgIC8vIG1heGltdW0gbnVtYmVyIG9mIGNvbm5lY3Rpb25zIHRvIHRoZSBjb25uZWN0aW9uIHBvb2xcclxuICAgICAgLy8gbWF4Q29ubmVjdGlvbkxpZmV0aW1lOiBwcm9jZXNzLmVudi5EUklWRVJfTUFYX0NPTk5FQ1RJT05fTElGRVRJTUUgfHwgNCAqIDYwICogNjAgKiAxMDAwLCAgICAgIC8vIHRpbWUgaW4gbXMsIDQgaG91cnMgbWF4aW11bSBjb25uZWN0aW9uIGxpZmV0aW1lXHJcbiAgICAgIC8vIG1heFRyYW5zYWN0aW9uUmV0cnlUaW1lOiBwcm9jZXNzLmVudi5EUklWRVJfTUFYX1RSQU5TQUNUSU9OX1JFVFJZX1RJTUUgfHwgMyAqIDEwMDAsICAgICAgICAgICAvLyB0aW1lIGluIG1zIHRvIHJldHJ5IGEgdHJhbnNhY3Rpb25cclxuICAgICAgLy8gY29ubmVjdGlvbkFjcXVpc2l0aW9uVGltZW91dDogcHJvY2Vzcy5lbnYuRFJJVkVSX0NPTk5FQ1RJT05fQUNRVUlTSVRJT05fVElNRU9VVCB8fCAyICogMTAwMCwgIC8vIHRpbWUgaW4gbXMgdG8gd2FpdCBmb3IgYSBjb25uZWN0aW9uIHRvIGJlY29tZSBhdmFpbGFibGUgaW4gdGhlIHBvb2xcclxuICAgICAgLy8gdHJ1c3Q6IHByb2Nlc3MuZW52LkRSSVZFUl9UTFNfVFJVU1QgfHwgJ1RSVVNUX0FMTF9DRVJUSUZJQ0FURVMnLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRscyB0cnVzdCBjb25maWd1cmF0aW9uXHJcbiAgICAgIC8vIGVuY3J5cHRlZDogcHJvY2Vzcy5lbnYuRFJJVkVSX1RMU19FTkFCTEVEIHx8ICdFTkNSWVBUSU9OX09GRicgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBlbmFibGUvZGlzYWJsZSBUTFMgZW5jcnlwdGlvbiB0byBjbGllbnRcclxuICAgIH0pXHJcblxyXG4gICAgY29uc3QgaW1wbGVtZW50YXRpb24gPSB7XHJcbiAgICAgIGRyaXZlckluc3RhbmNlOiBncmFwaERCRHJpdmVyLCAvLyBleHBvc2UgZHJpdmVyIGluc3RhbmNlXHJcblxyXG4gICAgICAvLyBUaGlzIGlzIGtlcHQgZm9yIGZ1dHVyZSByZWZlcmVuY2Ugb25seTpcclxuICAgICAgYXN5bmMgcmVwbGFjZU5vZGVXaXRoQW5vdGhlcl9sb2FkR3JhcGhEYXRhKHsgbm9kZUVudHJ5RGF0YSA9IFtdLCBjb25uZWN0aW9uRW50cnlEYXRhID0gW10gfSA9IHt9KSB7XHJcbiAgICAgICAgLy8gZGVhbCB3aXRoIGBOb2RlUmVmZXJlbmNlYFxyXG4gICAgICAgIGxldCByZWZlcmVuY2VOb2RlQXJyYXkgPSBub2RlRW50cnlEYXRhLmZpbHRlcihub2RlID0+IG5vZGUubGFiZWxzLmluY2x1ZGVzKHNjaGVtZVJlZmVyZW5jZS5ub2RlTGFiZWwubm9kZVJlZmVyZW5jZSkpIC8vIGV4dHJhY3QgYE5vZGVSZWZlcmVuY2VgIG5vZGVzXHJcbiAgICAgICAgbm9kZUVudHJ5RGF0YSA9IG5vZGVFbnRyeURhdGEuZmlsdGVyKG5vZGUgPT4gIXJlZmVyZW5jZU5vZGVBcnJheS5zb21lKGkgPT4gaSA9PSBub2RlKSkgLy8gcmVtb3ZlIHJlZmVyZW5jZSBub2RlcyBmcm9tIG5vZGUgYXJyYXkuXHJcbiAgICAgICAgbGV0IHJlcm91dGVOb2RlTWFwID0gbmV3IE1hcCgpXHJcbiAgICAgICAgbGV0IHJlaW50cm9kdWNlTm9kZUFycmF5ID0gW11cclxuICAgICAgICBmb3IgKGxldCByZWZlcmVuY2VOb2RlIG9mIHJlZmVyZW5jZU5vZGVBcnJheSkge1xyXG4gICAgICAgICAgbGV0IGFjdHVhbFRhcmdldE5vZGUgPSBhd2FpdCBpbXBsZW1lbnRhdGlvbi5nZXROb2RlQnlLZXkoeyBrZXk6IHJlZmVyZW5jZU5vZGUucHJvcGVydGllcy5rZXksIHNob3VsZFRocm93OiBmYWxzZSB9KVxyXG4gICAgICAgICAgLy8gPHJlZmVyZW5jZSBpZD46IDxhY3R1YWwgaWQgaW4gZ3JhcGg+XHJcbiAgICAgICAgICBpZiAoYWN0dWFsVGFyZ2V0Tm9kZSkge1xyXG4gICAgICAgICAgICByZXJvdXRlTm9kZU1hcC5zZXQocmVmZXJlbmNlTm9kZS5pZGVudGl0eSwgYWN0dWFsVGFyZ2V0Tm9kZSlcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYOKAoiBGb3VuZCBcIk5vZGVSZWZlcmVuY2VcIiB0YXJnZXQgaW4gY3VycmVudCBncmFwaCAke3JlZmVyZW5jZU5vZGUuaWRlbnRpdHl9IC0+ICR7YWN0dWFsVGFyZ2V0Tm9kZS5pZGVudGl0eX1gKVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gaWYgcmVmZXJlbmNlIG5vZGUga2V5IHdhcyBub3QgZm91bmQgaW4gdGhlIGN1cnJlbnQgZ3JhcGggZGF0YSwgcmVpbnRyb2R1Y2UgaXQgYXMgYSBOb2RlUmVmZXJlbmNlIG5vZGVcclxuICAgICAgICAgICAgcmVpbnRyb2R1Y2VOb2RlQXJyYXkucHVzaChyZWZlcmVuY2VOb2RlKVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg4oCiIFwiTm9kZVJlZmVyZW5jZVwiIHdhcyBub3QgZm91bmQgaW4gY3VycmVudCBncmFwaCAtICR7cmVmZXJlbmNlTm9kZS5wcm9wZXJ0aWVzLmtleX0uYClcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gcmVpbnRyb2R1Y2UgcmVmZXJlbmNlIG5vZGVzIHRoYXQgd2hlcmUgbm90IGZvdW5kIGluIGN1cnJlbnQgZ3JhcGhcclxuICAgICAgICBmb3IgKGxldCBub2RlIG9mIHJlaW50cm9kdWNlTm9kZUFycmF5KSB7XHJcbiAgICAgICAgICBub2RlRW50cnlEYXRhLnB1c2gobm9kZSlcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gcmVwbGFjZSBub2RlIHJlZmVyZW5jZSB3aXRoIGFjdHVhbCBncmFwaCBpZGVudGl0eSBvZiB0aGUgdGFyZ2V0IHJlZmVyZW5jZSBub2RlXHJcbiAgICAgICAgZm9yIChsZXQgZWRnZSBvZiBjb25uZWN0aW9uRW50cnlEYXRhKSB7XHJcbiAgICAgICAgICBpZiAocmVyb3V0ZU5vZGVNYXAuZ2V0KGVkZ2Uuc3RhcnQpKSB7XHJcbiAgICAgICAgICAgIGxldCBhY3R1YWxSZWZlcmVuY2VOb2RlID0gcmVyb3V0ZU5vZGVNYXAuZ2V0KGVkZ2Uuc3RhcnQpXHJcbiAgICAgICAgICAgIGVkZ2Uuc3RhcnQgPSBhY3R1YWxSZWZlcmVuY2VOb2RlLmlkZW50aXR5XHJcbiAgICAgICAgICAgIC8vIGFkZCBjb25uZWN0aW9uIGtleXMgZm9yIGFjdHVhbCByZWZlcmVuY2Ugbm9kZXMgdGhhdCB0aGUgbGF0dGVyIGZ1bmN0aW9uIHJlbHkgb24uXHJcbiAgICAgICAgICAgIGVkZ2Uuc3RhcnRLZXkgPSBhY3R1YWxSZWZlcmVuY2VOb2RlLnByb3BlcnRpZXMua2V5XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAocmVyb3V0ZU5vZGVNYXAuZ2V0KGVkZ2UuZW5kKSkge1xyXG4gICAgICAgICAgICBsZXQgYWN0dWFsUmVmZXJlbmNlTm9kZSA9IHJlcm91dGVOb2RlTWFwLmdldChlZGdlLmVuZClcclxuICAgICAgICAgICAgZWRnZS5lbmQgPSBhY3R1YWxSZWZlcmVuY2VOb2RlLmlkZW50aXR5XHJcbiAgICAgICAgICAgIC8vIGFkZCBjb25uZWN0aW9uIGtleXMgZm9yIGFjdHVhbCByZWZlcmVuY2Ugbm9kZXMgdGhhdCB0aGUgbGF0dGVyIGZ1bmN0aW9uIHJlbHkgb24uXHJcbiAgICAgICAgICAgIGVkZ2UuZW5kS2V5ID0gYWN0dWFsUmVmZXJlbmNlTm9kZS5wcm9wZXJ0aWVzLmtleVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgaWRNYXAgPSB7IG5vZGVJZGVudGl0eTogbmV3IE1hcCgpIC8qKiBtYXBzIG9sZCBncmFwaCBkYXRhIGlkcyB0byBuZXcgZGF0YSBpZHMuIChhcyBpZHMgY2Fubm90IGJlIHNldCBpbiB0aGUgZGF0YWJhc2Ugd2hlbiBsb2FkZWQgdGhlIGdyYXBoIGRhdGEuKSAqLyB9XHJcbiAgICAgICAgZm9yIChsZXQgZW50cnkgb2Ygbm9kZUVudHJ5RGF0YSkge1xyXG4gICAgICAgICAgbGV0IGNyZWF0ZWROb2RlID0gYXdhaXQgaW1wbGVtZW50YXRpb24uYWRkTm9kZSh7IG5vZGVEYXRhOiBlbnRyeSB9KVxyXG4gICAgICAgICAgaWRNYXAubm9kZUlkZW50aXR5LnNldChlbnRyeS5pZGVudGl0eSwgY3JlYXRlZE5vZGUuaWRlbnRpdHkpIC8vIDxsb2FkZWQgcGFyYW1ldGVyIElEPjogPG5ldyBkYXRhYmFzZSBJRD5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGFkZCByZWZlcmVuY2UgdGFyZ2V0IG5vZGVzIHRvIHRoZSBsaXN0IG9mIG5vZGVzIGZvciB1c2FnZSBpbiBgYWRkQ29ubmVjdGlvbiBmdW5jdGlvblxyXG4gICAgICAgIGxldCBhY3R1YWxSZWZlcmVuY2VOb2RlQXJyYXkgPSBBcnJheS5mcm9tKHJlcm91dGVOb2RlTWFwLnZhbHVlcygpKVxyXG4gICAgICAgIGZvciAobGV0IGFjdHVhbFJlZmVyZW5jZU5vZGUgb2YgYWN0dWFsUmVmZXJlbmNlTm9kZUFycmF5KSB7XHJcbiAgICAgICAgICBpZE1hcC5ub2RlSWRlbnRpdHkuc2V0KGFjdHVhbFJlZmVyZW5jZU5vZGUuaWRlbnRpdHksIGFjdHVhbFJlZmVyZW5jZU5vZGUuaWRlbnRpdHkpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyByZWx5IG9uIGBrZXlgIHByb3BlcnR5IHRvIGNyZWF0ZSBjb25uZWN0aW9uc1xyXG4gICAgICAgIGNvbm5lY3Rpb25FbnRyeURhdGEubWFwKGNvbm5lY3Rpb24gPT4ge1xyXG4gICAgICAgICAgaWYgKCFjb25uZWN0aW9uLnN0YXJ0S2V5KSBjb25uZWN0aW9uLnN0YXJ0S2V5ID0gbm9kZUVudHJ5RGF0YS5maWx0ZXIobm9kZSA9PiBub2RlLmlkZW50aXR5ID09IGNvbm5lY3Rpb24uc3RhcnQpWzBdLnByb3BlcnRpZXMua2V5XHJcbiAgICAgICAgICBpZiAoIWNvbm5lY3Rpb24uZW5kS2V5KSBjb25uZWN0aW9uLmVuZEtleSA9IG5vZGVFbnRyeURhdGEuZmlsdGVyKG5vZGUgPT4gbm9kZS5pZGVudGl0eSA9PSBjb25uZWN0aW9uLmVuZClbMF0ucHJvcGVydGllcy5rZXlcclxuICAgICAgICB9KVxyXG4gICAgICAgIGZvciAobGV0IGVudHJ5IG9mIGNvbm5lY3Rpb25FbnRyeURhdGEpIHtcclxuICAgICAgICAgIGF3YWl0IGltcGxlbWVudGF0aW9uLmFkZENvbm5lY3Rpb24oeyBjb25uZWN0aW9uRGF0YTogZW50cnksIGlkTWFwIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG5cclxuICAgICAgYXN5bmMgZGVhbFdpdGhFeHRlcm5hbFJlZmVyZW5jZSh7IG5vZGVFbnRyeURhdGEsIGNvbm5lY3Rpb25FbnRyeURhdGEgfSkge1xyXG4gICAgICAgIC8vIGRlYWwgd2l0aCBFeHRlcm5hbCBSZXJvdXRlIC8gTm9kZVJlZmVyZW5jZVxyXG4gICAgICAgIGxldCBleHRlcm5hbFJlcm91dGVOb2RlQXJyYXkgPSBub2RlRW50cnlEYXRhXHJcbiAgICAgICAgICAuZmlsdGVyKG5vZGUgPT4gbm9kZS5sYWJlbHMuaW5jbHVkZXMoc2NoZW1lUmVmZXJlbmNlLm5vZGVMYWJlbC5yZXJvdXRlKSkgLy8gZXh0cmFjdCBSZXJvdXRlL05vZGVSZWZlcmVuY2Ugbm9kZXNcclxuICAgICAgICAgIC5maWx0ZXIocmVyb3V0ZU5vZGUgPT4gcmVyb3V0ZU5vZGUucHJvcGVydGllc1tzY2hlbWVSZWZlcmVuY2UucmVyb3V0ZVByb3BlcnR5LmV4dGVybmFsUmVmZXJlbmNlTm9kZUtleV0pIC8vIG9ubHkgZXh0ZXJuYWwgcmVyb3V0ZSBub2RlcyAod2l0aCBhbiBleHRlcm5hbCBrZXkgcHJvcGVydHkpXHJcblxyXG4gICAgICAgIGxldCByZXJvdXRlTm9kZU1hcCA9IG5ldyBNYXAoKVxyXG4gICAgICAgIGZvciAobGV0IHJlcm91dGVOb2RlIG9mIGV4dGVybmFsUmVyb3V0ZU5vZGVBcnJheSkge1xyXG4gICAgICAgICAgbGV0IGV4dGVybmFsS2V5ID0gcmVyb3V0ZU5vZGUucHJvcGVydGllc1tzY2hlbWVSZWZlcmVuY2UucmVyb3V0ZVByb3BlcnR5LmV4dGVybmFsUmVmZXJlbmNlTm9kZUtleV1cclxuICAgICAgICAgIGxldCBhY3R1YWxUYXJnZXROb2RlID0gYXdhaXQgaW1wbGVtZW50YXRpb24uZ2V0Tm9kZUJ5S2V5KHsga2V5OiBleHRlcm5hbEtleSwgc2hvdWxkVGhyb3c6IGZhbHNlIH0pXHJcbiAgICAgICAgICAvLyA8cmVmZXJlbmNlIGlkPjogPGFjdHVhbCBpZCBpbiBncmFwaD5cclxuICAgICAgICAgIGlmIChhY3R1YWxUYXJnZXROb2RlKSB7XHJcbiAgICAgICAgICAgIHJlcm91dGVOb2RlTWFwLnNldChyZXJvdXRlTm9kZSwgYWN0dWFsVGFyZ2V0Tm9kZSlcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYOKAoiBGb3VuZCBleHRlcm5hbCByZWZlcmVuY2UgdGFyZ2V0IG5vZGUgaW4gY3VycmVudCBncmFwaCAke3Jlcm91dGVOb2RlLmlkZW50aXR5fSAtPiAke2FjdHVhbFRhcmdldE5vZGUuaWRlbnRpdHl9YClcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFdhcm4gaWYgbm8gcmVyb3V0ZSBub2RlcyB3aGVyZSByZXNvbHZlZDogaWYgcmVmZXJlbmNlIG5vZGUga2V5IHdhcyBub3QgZm91bmQgaW4gdGhlIGN1cnJlbnQgZ3JhcGggZGF0YSwgcmVpbnRyb2R1Y2UgaXQgYXMgYSBOb2RlUmVmZXJlbmNlIG5vZGVcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYOKAoiBFeHRlcm5hbCByZWZlcmVuY2Ugbm9kZSAoXCIke2V4dGVybmFsS2V5fVwiKSB3YXMgbm90IGZvdW5kIGluIGN1cnJlbnQgZ3JhcGggZm9yIHJlcm91dGUgbm9kZSAtICR7cmVyb3V0ZU5vZGUucHJvcGVydGllcy5rZXl9LmApXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXJvdXRlTm9kZU1hcC5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XHJcbiAgICAgICAgICAvLyBjcmVhdGUgUkVGRVJFTkNFIGVkZ2UgYmV0d2VlbiByZXJvdXRlIG5vZGUgYW5kIHRoZSBhY3R1YWwgZXh0ZXJuYWwgZ3JhcGggdGFyZ2V0IHJlZmVyZW5jZSBub2RlXHJcbiAgICAgICAgICBsZXQgcmVmZXJlbmNlRWRnZSA9IGNyZWF0ZUVkZ2VEYXRhKHsgc3RhcnRJZDogcmVyb3V0ZU5vZGUuaWRlbnRpdHksIGVuZElkOiBhY3R1YWxUYXJnZXROb2RlLmlkZW50aXR5LCB0eXBlOiBzY2hlbWVSZWZlcmVuY2UuY29ubmVjdGlvblR5cGUucmVmZXJlbmNlIH0pXHJcbiAgICAgICAgICBjb25uZWN0aW9uRW50cnlEYXRhLnB1c2gocmVmZXJlbmNlRWRnZSlcclxuICAgICAgICB9KVxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gbG9hZCBub2RlcyBhbmQgY29ubmVjdGlvbnMgZnJvbSBqc29uIGZpbGUgZGF0YS5cclxuICAgICAgLy8gVE9ETzogY2hlY2sgaWYgdGhpcyBtZXRob2Qgc2hvdWxkIGJlIHBsYWNlZCBpbiBjb3JlIGFzIGl0IHJlbGllcyBvbiBub2RlIHJlZmVyZW5jZSAvIGV4dGVybmFsIHJlcm91dGUgY29uY2VwdFxyXG4gICAgICBhc3luYyBsb2FkR3JhcGhEYXRhKHsgbm9kZUVudHJ5RGF0YSA9IFtdLCBjb25uZWN0aW9uRW50cnlEYXRhID0gW10gfSA9IHt9KSB7XHJcbiAgICAgICAgYXdhaXQgaW1wbGVtZW50YXRpb24uZGVhbFdpdGhFeHRlcm5hbFJlZmVyZW5jZSh7IG5vZGVFbnRyeURhdGEsIGNvbm5lY3Rpb25FbnRyeURhdGEgfSkgLy8gbW9kaWZpZXMgbm9kZSAmIGNvbm5lY3Rpb24gYXJyYXlzXHJcblxyXG4gICAgICAgIGNvbnN0IGlkTWFwID0geyBub2RlSWRlbnRpdHk6IG5ldyBNYXAoKSAvKiogbWFwcyBvbGQgZ3JhcGggZGF0YSBpZHMgdG8gbmV3IGRhdGEgaWRzLiAoYXMgaWRzIGNhbm5vdCBiZSBzZXQgaW4gdGhlIGRhdGFiYXNlIHdoZW4gbG9hZGVkIHRoZSBncmFwaCBkYXRhLikgKi8gfVxyXG4gICAgICAgIGZvciAobGV0IGVudHJ5IG9mIG5vZGVFbnRyeURhdGEpIHtcclxuICAgICAgICAgIGxldCBjcmVhdGVkTm9kZSA9IGF3YWl0IGltcGxlbWVudGF0aW9uLmFkZE5vZGUoeyBub2RlRGF0YTogZW50cnkgfSlcclxuICAgICAgICAgIGlkTWFwLm5vZGVJZGVudGl0eS5zZXQoZW50cnkuaWRlbnRpdHksIGNyZWF0ZWROb2RlLmlkZW50aXR5KSAvLyA8bG9hZGVkIHBhcmFtZXRlciBJRD46IDxuZXcgZGF0YWJhc2UgSUQ+XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyByZWx5IG9uIGBrZXlgIHByb3BlcnR5IHRvIGNyZWF0ZSBjb25uZWN0aW9uc1xyXG4gICAgICAgIGNvbm5lY3Rpb25FbnRyeURhdGEubWFwKGNvbm5lY3Rpb24gPT4ge1xyXG4gICAgICAgICAgaWYgKCFjb25uZWN0aW9uLnN0YXJ0S2V5KSBjb25uZWN0aW9uLnN0YXJ0S2V5ID0gbm9kZUVudHJ5RGF0YS5maWx0ZXIobm9kZSA9PiBub2RlLmlkZW50aXR5ID09IGNvbm5lY3Rpb24uc3RhcnQpWzBdLnByb3BlcnRpZXMua2V5XHJcbiAgICAgICAgICBpZiAoIWNvbm5lY3Rpb24uZW5kS2V5KSBjb25uZWN0aW9uLmVuZEtleSA9IG5vZGVFbnRyeURhdGEuZmlsdGVyKG5vZGUgPT4gbm9kZS5pZGVudGl0eSA9PSBjb25uZWN0aW9uLmVuZClbMF0ucHJvcGVydGllcy5rZXlcclxuICAgICAgICB9KVxyXG4gICAgICAgIGZvciAobGV0IGVudHJ5IG9mIGNvbm5lY3Rpb25FbnRyeURhdGEpIHtcclxuICAgICAgICAgIGF3YWl0IGltcGxlbWVudGF0aW9uLmFkZENvbm5lY3Rpb24oeyBjb25uZWN0aW9uRGF0YTogZW50cnksIGlkTWFwIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBhZGROb2RlOiBhc3luYyAoeyBub2RlRGF0YSAvKmNvbmZvcm1zIHdpdGggdGhlIEN5cGhlciBxdWVyeSByZXN1bHRzIGRhdGEgY29udmVudGlvbiovIH0pID0+IHtcclxuICAgICAgICBhc3NlcnQobm9kZURhdGEucHJvcGVydGllcz8ua2V5LCAn4oCiIE5vZGUgZGF0YSBtdXN0IGhhdmUgYSBrZXkgcHJvcGVydHkgLSAnICsgbm9kZURhdGEpXHJcblxyXG4gICAgICAgIGxldCBsYWJlbFNlY3Rpb24gPSBub2RlRGF0YS5sYWJlbHMgJiYgbm9kZURhdGEubGFiZWxzLmxlbmd0aCA+IDAgPyBgOiR7anNvblRvQ2VwaGVyQWRhcHRlci5jb252ZXJ0QXJyYXlUb0NlcGhlckxhYmVsKG5vZGVEYXRhLmxhYmVscyl9YCA6ICcnXHJcbiAgICAgICAgbGV0IHNlc3Npb24gPSBhd2FpdCBncmFwaERCRHJpdmVyLnNlc3Npb24oKVxyXG4gICAgICAgIGxldCBxdWVyeSA9IGBcclxuICAgICAgICBjcmVhdGUgKG4ke2xhYmVsU2VjdGlvbn0geyR7anNvblRvQ2VwaGVyQWRhcHRlci5jb252ZXJ0T2JqZWN0VG9DZXBoZXJQcm9wZXJ0eShub2RlRGF0YS5wcm9wZXJ0aWVzKX19KVxyXG4gICAgICAgIHJldHVybiBuXHJcbiAgICAgIGBcclxuICAgICAgICBsZXQgcmVzdWx0ID0gYXdhaXQgc2Vzc2lvbi5ydW4ocXVlcnkpXHJcbiAgICAgICAgYXdhaXQgc2Vzc2lvbi5jbG9zZSgpXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5yZWNvcmRzWzBdLnRvT2JqZWN0KCkublxyXG4gICAgICB9LFxyXG4gICAgICBhZGRDb25uZWN0aW9uOiBhc3luYyAoeyBjb25uZWN0aW9uRGF0YSAvKmNvbmZvcm1zIHdpdGggdGhlIEN5cGhlciBxdWVyeSByZXN1bHRzIGRhdGEgY29udmVudGlvbiovLCBpZE1hcCAvKlVzZSBpZGVudGl0aWVzIHRvIGNyZWF0ZSBlZGdlcyAqLyB9KSA9PiB7XHJcbiAgICAgICAgYXNzZXJ0KHR5cGVvZiBjb25uZWN0aW9uRGF0YS5zdGFydCA9PSAnbnVtYmVyJyAmJiB0eXBlb2YgY29ubmVjdGlvbkRhdGEuZW5kID09ICdudW1iZXInLCBg4oCiIENvbm5lY3Rpb24gbXVzdCBoYXZlIGEgc3RhcnQgYW5kIGVuZCBub2Rlcy5gKVxyXG4gICAgICAgIGlmIChjb25uZWN0aW9uRGF0YS50eXBlID09IHNjaGVtZVJlZmVyZW5jZS5jb25uZWN0aW9uVHlwZS5uZXh0KSBhc3NlcnQoY29ubmVjdGlvbkRhdGEucHJvcGVydGllcz8ua2V5LCAn4oCiIENvbm5lY3Rpb24gb2JqZWN0IG11c3QgaGF2ZSBhIGtleSBwcm9wZXJ0eS4nKVxyXG4gICAgICAgIGxldCBub2RlQXJyYXkgPSBhd2FpdCBpbXBsZW1lbnRhdGlvbi5nZXRBbGxOb2RlKClcclxuICAgICAgICBsZXQgc2Vzc2lvbiA9IGF3YWl0IGdyYXBoREJEcml2ZXIuc2Vzc2lvbigpXHJcblxyXG4gICAgICAgIGxldCBxdWVyeSA9IGBcclxuICAgICAgICBtYXRjaCAoc291cmNlIHsga2V5OiAnJHtjb25uZWN0aW9uRGF0YS5zdGFydEtleX0nIH0pICR7aWRNYXAgPyBgd2hlcmUgSUQoc291cmNlKSA9ICR7aWRNYXAubm9kZUlkZW50aXR5LmdldChjb25uZWN0aW9uRGF0YS5zdGFydCl9YCA6ICcnfVxyXG4gICAgICAgIG1hdGNoIChkZXN0aW5hdGlvbiB7IGtleTogJyR7Y29ubmVjdGlvbkRhdGEuZW5kS2V5fScgfSkgJHtpZE1hcCA/IGB3aGVyZSBJRChkZXN0aW5hdGlvbikgPSAke2lkTWFwLm5vZGVJZGVudGl0eS5nZXQoY29ubmVjdGlvbkRhdGEuZW5kKX1gIDogJyd9XHJcbiAgICAgICAgY3JlYXRlIFxyXG4gICAgICAgICAgKHNvdXJjZSlcclxuICAgICAgICAgIC1bbDoke2Nvbm5lY3Rpb25EYXRhLnR5cGV9IHske2pzb25Ub0NlcGhlckFkYXB0ZXIuY29udmVydE9iamVjdFRvQ2VwaGVyUHJvcGVydHkoY29ubmVjdGlvbkRhdGEucHJvcGVydGllcyl9fV0tPlxyXG4gICAgICAgICAgKGRlc3RpbmF0aW9uKSBcclxuICAgICAgICByZXR1cm4gbFxyXG4gICAgICBgXHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IGF3YWl0IHNlc3Npb24ucnVuKHF1ZXJ5KVxyXG4gICAgICAgIC8vIHJlc3VsdC5yZWNvcmRzLmZvckVhY2gocmVjb3JkID0+IHJlY29yZC50b09iamVjdCgpIHw+IGNvbnNvbGUubG9nKVxyXG4gICAgICAgIGF3YWl0IHNlc3Npb24uY2xvc2UoKVxyXG4gICAgICAgIHJldHVybiByZXN1bHRcclxuICAgICAgfSxcclxuICAgICAgLy8gVE9ETzogVXBkYXRlIHRoaXMgZnVuY3Rpb24gdG8gY29uc2lkZXIgdGhlIHJldHVybmVkIGRlc3RpbmF0aW9uICYgc291cmNlIG5vZGVzLCB3b3VsZCBtYXRjaCB0aGVpciByb2xlIGluIHRoZSBjb25uZWN0aW9uIHBhaXIgKGUuZy4gY2hlY2sgYGdldE5vZGVDb25uZWN0aW9uYCBiZWxvdykuXHJcbiAgICAgIGdldE5vZGVDb25uZWN0aW9uQnlLZXk6IGFzeW5jIGZ1bmN0aW9uKHtcclxuICAgICAgICBkaXJlY3Rpb24gPSAnb3V0Z29pbmcnIC8qIGZpbHRlciBjb25uZWN0aW9uIGFycmF5IHRvIG1hdGNoIG91dGdvaW5nIGNvbm5lY3Rpb25zIG9ubHkqLyxcclxuICAgICAgICBzb3VyY2VLZXksXHJcbiAgICAgICAgZGVzdGluYXRpb25Ob2RlVHlwZSxcclxuICAgICAgfToge1xyXG4gICAgICAgIGRpcmVjdGlvbjogJ291dGdvaW5nJyB8ICdpbmNvbWluZycsXHJcbiAgICAgIH0pIHtcclxuICAgICAgICBhc3NlcnQoZGlyZWN0aW9uID09ICdvdXRnb2luZycsICfigKIgYGRpcmVjdGlvbmAgcGFyYW1ldGVyIHVuc3VwcG9ydGVkLicpXHJcbiAgICAgICAgbGV0IHNlc3Npb24gPSBhd2FpdCBncmFwaERCRHJpdmVyLnNlc3Npb24oKVxyXG4gICAgICAgIGxldCBxdWVyeSA9IGBcclxuICAgICAgICBtYXRjaCBcclxuICAgICAgICAgIChzb3VyY2UgeyBrZXk6ICcke3NvdXJjZUtleX0nIH0pXHJcbiAgICAgICAgICAtW2w6JHtzY2hlbWVSZWZlcmVuY2UuY29ubmVjdGlvblR5cGUubmV4dH1dLT5cclxuICAgICAgICAgIChkZXN0aW5hdGlvbiR7ZGVzdGluYXRpb25Ob2RlVHlwZSA/IGA6JHtkZXN0aW5hdGlvbk5vZGVUeXBlfWAgOiAnJ30pIFxyXG4gICAgICAgIHJldHVybiBsXHJcbiAgICAgICAgb3JkZXIgYnkgZGVzdGluYXRpb24ua2V5XHJcbiAgICAgIGBcclxuICAgICAgICBsZXQgcmVzdWx0ID0gYXdhaXQgc2Vzc2lvbi5ydW4ocXVlcnkpXHJcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnJlY29yZHMubWFwKHJlY29yZCA9PiByZWNvcmQudG9PYmplY3QoKS5sKVxyXG4gICAgICAgIGF3YWl0IHNlc3Npb24uY2xvc2UoKVxyXG4gICAgICAgIHJldHVybiByZXN1bHRcclxuICAgICAgfSxcclxuICAgICAgLyoqXHJcbiAgICAgICAqIEByZXR1cm5zIEFycmF5IG9mIG9iamVjdHMgW3tcclxuICAgICAgICogIGNvbm5lY3Rpb246IE9iamVjdCxcclxuICAgICAgICogIHNvdXJjZTogT2JqZWN0LFxyXG4gICAgICAgKiAgZGVzdGluYXRpb246IE9iamVjdFxyXG4gICAgICAgKiB9XVxyXG4gICAgICAgKi9cclxuICAgICAgZ2V0Tm9kZUNvbm5lY3Rpb246IGFzeW5jIGZ1bmN0aW9uKHtcclxuICAgICAgICBub2RlSUQsXHJcbiAgICAgICAgZGlyZWN0aW9uIC8qIGZpbHRlciBjb25uZWN0aW9uIGFycmF5IHRvIG1hdGNoIG91dGdvaW5nIGNvbm5lY3Rpb25zIG9ubHkqLyxcclxuICAgICAgICBvdGhlclBhaXJOb2RlVHlwZSxcclxuICAgICAgICBjb25uZWN0aW9uVHlwZSxcclxuICAgICAgfToge1xyXG4gICAgICAgIGRpcmVjdGlvbjogJ291dGdvaW5nJyB8ICdpbmNvbWluZycgfCB1bmRlZmluZWQgLypib3RoIGluY29taW5nIGFuZCBvdXRnb2luZyovLFxyXG4gICAgICB9KSB7XHJcbiAgICAgICAgbGV0IHNlc3Npb24gPSBhd2FpdCBncmFwaERCRHJpdmVyLnNlc3Npb24oKVxyXG4gICAgICAgIGxldCBjb25uZWN0aW9uVHlwZVF1ZXJ5ID0gY29ubmVjdGlvblR5cGUgPyBgOiR7Y29ubmVjdGlvblR5cGV9YCA6IGBgXHJcbiAgICAgICAgbGV0IGNvbm5lY3Rpb24gPSBkaXJlY3Rpb24gPT0gJ291dGdvaW5nJyA/IGAtW2Nvbm5lY3Rpb24ke2Nvbm5lY3Rpb25UeXBlUXVlcnl9XS0+YCA6IGRpcmVjdGlvbiA9PSAnaW5jb21pbmcnID8gYDwtW2Nvbm5lY3Rpb24ke2Nvbm5lY3Rpb25UeXBlUXVlcnl9XS1gIDogYC1bY29ubmVjdGlvbiR7Y29ubmVjdGlvblR5cGVRdWVyeX1dLWBcclxuICAgICAgICBsZXQgcXVlcnlcclxuXHJcbiAgICAgICAgLy8gc3dpdGNoIGRpcmVjdGlvbiB0byByZXR1cm4gZGVzdGluYXRpb24gYW5kIHNvdXJjZSBjb3JyZWN0bHkgYWNjb3JkaW5nIHRvIHRoZSBkaWZmZXJlbnQgY2FzZXMuXHJcbiAgICAgICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcclxuICAgICAgICAgIGNhc2UgJ291dGdvaW5nJzpcclxuICAgICAgICAgICAgcXVlcnkgPSBgXHJcbiAgICAgICAgICAgIG1hdGNoIChzb3VyY2UpICAke2Nvbm5lY3Rpb259IChkZXN0aW5hdGlvbiR7b3RoZXJQYWlyTm9kZVR5cGUgPyBgOiR7b3RoZXJQYWlyTm9kZVR5cGV9YCA6ICcnfSkgXHJcbiAgICAgICAgICAgIHdoZXJlIGlkKHNvdXJjZSk9JHtub2RlSUR9XHJcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0aW9uLCBzb3VyY2UsIGRlc3RpbmF0aW9uIG9yZGVyIGJ5IGRlc3RpbmF0aW9uLmtleVxyXG4gICAgICAgICAgYFxyXG4gICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgY2FzZSAnaW5jb21pbmcnOlxyXG4gICAgICAgICAgICBxdWVyeSA9IGBcclxuICAgICAgICAgICAgbWF0Y2ggKGRlc3RpbmF0aW9uKSAgJHtjb25uZWN0aW9ufSAoc291cmNlJHtvdGhlclBhaXJOb2RlVHlwZSA/IGA6JHtvdGhlclBhaXJOb2RlVHlwZX1gIDogJyd9KVxyXG4gICAgICAgICAgICB3aGVyZSBpZChkZXN0aW5hdGlvbik9JHtub2RlSUR9XHJcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0aW9uLCBzb3VyY2UsIGRlc3RpbmF0aW9uIG9yZGVyIGJ5IHNvdXJjZS5rZXlcclxuICAgICAgICAgIGBcclxuICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHF1ZXJ5ID0gYFxyXG4gICAgICAgICAgICBtYXRjaCAoc291cmNlKSAgJHtjb25uZWN0aW9ufSAoZGVzdGluYXRpb24ke290aGVyUGFpck5vZGVUeXBlID8gYDoke290aGVyUGFpck5vZGVUeXBlfWAgOiAnJ30pIFxyXG4gICAgICAgICAgICB3aGVyZSBpZChzb3VyY2UpPSR7bm9kZUlEfVxyXG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdGlvbiwgc291cmNlLCBkZXN0aW5hdGlvbiBvcmRlciBieSBkZXN0aW5hdGlvbi5rZXlcclxuICAgICAgICAgIGBcclxuICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IGF3YWl0IHNlc3Npb24ucnVuKHF1ZXJ5KVxyXG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC5yZWNvcmRzLm1hcChyZWNvcmQgPT4gcmVjb3JkLnRvT2JqZWN0KCkpXHJcbiAgICAgICAgYXdhaXQgc2Vzc2lvbi5jbG9zZSgpXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdFxyXG4gICAgICB9LFxyXG4gICAgICBnZXROb2RlQnlLZXk6IGFzeW5jIGZ1bmN0aW9uKHsga2V5LCBzaG91bGRUaHJvdyA9IHRydWUgfSkge1xyXG4gICAgICAgIGxldCBzZXNzaW9uID0gYXdhaXQgZ3JhcGhEQkRyaXZlci5zZXNzaW9uKClcclxuICAgICAgICBsZXQgcXVlcnkgPSBgXHJcbiAgICAgICAgbWF0Y2ggKG4ge2tleTogJyR7a2V5fSd9KVxyXG4gICAgICAgIHJldHVybiBuXHJcbiAgICAgIGBcclxuICAgICAgICBsZXQgcmVzdWx0ID0gYXdhaXQgc2Vzc2lvbi5ydW4ocXVlcnkpXHJcbiAgICAgICAgYXdhaXQgc2Vzc2lvbi5jbG9zZSgpXHJcbiAgICAgICAgaWYgKHNob3VsZFRocm93KSBhc3NlcnQocmVzdWx0LnJlY29yZHNbMF0sIGDigKIgQ2Fubm90IGZpbmQgbm9kZSB3aGVyZSBub2RlLmtleT1cIiR7a2V5fVwiYClcclxuICAgICAgICBpZiAocmVzdWx0LnJlY29yZHMubGVuZ3RoID09IDApIHJldHVybiBmYWxzZVxyXG4gICAgICAgIHJldHVybiByZXN1bHQucmVjb3Jkc1swXS50b09iamVjdCgpLm5cclxuICAgICAgfSxcclxuICAgICAgZ2V0Tm9kZUJ5SUQ6IGFzeW5jIGZ1bmN0aW9uKHsgaWQgfSkge1xyXG4gICAgICAgIGxldCBzZXNzaW9uID0gYXdhaXQgZ3JhcGhEQkRyaXZlci5zZXNzaW9uKClcclxuICAgICAgICBsZXQgcXVlcnkgPSBgXHJcbiAgICAgICAgbWF0Y2ggKG4pIHdoZXJlIGlkKG4pPSR7aWR9XHJcbiAgICAgICAgcmV0dXJuIG5cclxuICAgICAgYFxyXG4gICAgICAgIGxldCByZXN1bHQgPSBhd2FpdCBzZXNzaW9uLnJ1bihxdWVyeSlcclxuICAgICAgICBhd2FpdCBzZXNzaW9uLmNsb3NlKClcclxuICAgICAgICByZXR1cm4gcmVzdWx0LnJlY29yZHNbMF0udG9PYmplY3QoKS5uXHJcbiAgICAgIH0sXHJcbiAgICAgIGdldEFsbE5vZGU6IGFzeW5jIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGxldCBzZXNzaW9uID0gYXdhaXQgZ3JhcGhEQkRyaXZlci5zZXNzaW9uKClcclxuICAgICAgICBsZXQgcXVlcnkgPSBgXHJcbiAgICAgICAgbWF0Y2ggKG4pIHJldHVybiBuIG9yZGVyIGJ5IG4ua2V5XHJcbiAgICAgIGBcclxuICAgICAgICBsZXQgcmVzdWx0ID0gYXdhaXQgc2Vzc2lvbi5ydW4ocXVlcnkpXHJcbiAgICAgICAgYXdhaXQgc2Vzc2lvbi5jbG9zZSgpXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5yZWNvcmRzXHJcbiAgICAgICAgICAubWFwKHJlY29yZCA9PiByZWNvcmQudG9PYmplY3QoKS5uKVxyXG4gICAgICAgICAgLm1hcChub2RlID0+IHtcclxuICAgICAgICAgICAgLy8gbm9kZS5pZGVudGl0eSA9IG5vZGUuaWRlbnRpdHkudG9TdHJpbmcoKVxyXG4gICAgICAgICAgICByZXR1cm4gbm9kZVxyXG4gICAgICAgICAgfSlcclxuICAgICAgfSxcclxuICAgICAgZ2V0QWxsRWRnZTogYXN5bmMgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgbGV0IHNlc3Npb24gPSBhd2FpdCBncmFwaERCRHJpdmVyLnNlc3Npb24oKVxyXG4gICAgICAgIGxldCBxdWVyeSA9IGBcclxuICAgICAgICBtYXRjaCAoKS1bbF0tPihuKSByZXR1cm4gbCBvcmRlciBieSBuLmtleVxyXG4gICAgICBgXHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IGF3YWl0IHNlc3Npb24ucnVuKHF1ZXJ5KVxyXG4gICAgICAgIGF3YWl0IHNlc3Npb24uY2xvc2UoKVxyXG4gICAgICAgIHJldHVybiByZXN1bHQucmVjb3Jkc1xyXG4gICAgICAgICAgLm1hcChyZWNvcmQgPT4gcmVjb3JkLnRvT2JqZWN0KCkubClcclxuICAgICAgICAgIC5tYXAoZWRnZSA9PiB7XHJcbiAgICAgICAgICAgIC8vIE5vdGU6IEJvbHQgZHJpdmVyIG9wdGlvbiBoYW5kbGVzIGludGVnZXIgdHJhbnNmb3JtYXRpb24uXHJcbiAgICAgICAgICAgIC8vIGNoYW5nZSBudW1iZXJzIHRvIHN0cmluZyByZXByZXNlbnRhdGlvblxyXG4gICAgICAgICAgICAvLyBlZGdlLmlkZW50aXR5ID0gZWRnZS5pZGVudGl0eS50b1N0cmluZygpXHJcbiAgICAgICAgICAgIC8vIGVkZ2Uuc3RhcnQgPSBlZGdlLnN0YXJ0LnRvU3RyaW5nKClcclxuICAgICAgICAgICAgLy8gZWRnZS5lbmQgPSBlZGdlLmVuZC50b1N0cmluZygpXHJcbiAgICAgICAgICAgIHJldHVybiBlZGdlXHJcbiAgICAgICAgICB9KVxyXG4gICAgICB9LFxyXG4gICAgICBjb3VudE5vZGU6IGFzeW5jIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGxldCBzZXNzaW9uID0gYXdhaXQgZ3JhcGhEQkRyaXZlci5zZXNzaW9uKClcclxuICAgICAgICBsZXQgcXVlcnkgPSBgXHJcbiAgICAgICAgTUFUQ0ggKG4pXHJcbiAgICAgICAgUkVUVVJOIGNvdW50KG4pIGFzIGNvdW50XHJcbiAgICAgIGBcclxuICAgICAgICBsZXQgcmVzdWx0ID0gYXdhaXQgc2Vzc2lvbi5ydW4ocXVlcnkpXHJcbiAgICAgICAgYXdhaXQgc2Vzc2lvbi5jbG9zZSgpXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5yZWNvcmRzWzBdLnRvT2JqZWN0KCkuY291bnRcclxuICAgICAgfSxcclxuICAgICAgY291bnRFZGdlOiBhc3luYyBmdW5jdGlvbigpIHtcclxuICAgICAgICBsZXQgc2Vzc2lvbiA9IGF3YWl0IGdyYXBoREJEcml2ZXIuc2Vzc2lvbigpXHJcbiAgICAgICAgbGV0IHF1ZXJ5ID0gYFxyXG4gICAgICAgIE1BVENIICgpLVtyXS0+KClcclxuICAgICAgICBSRVRVUk4gY291bnQocikgYXMgY291bnRcclxuICAgICAgYFxyXG4gICAgICAgIGxldCByZXN1bHQgPSBhd2FpdCBzZXNzaW9uLnJ1bihxdWVyeSlcclxuICAgICAgICBhd2FpdCBzZXNzaW9uLmNsb3NlKClcclxuICAgICAgICByZXR1cm4gcmVzdWx0LnJlY29yZHNbMF0udG9PYmplY3QoKS5jb3VudFxyXG4gICAgICB9LFxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGltcGxlbWVudGF0aW9uXHJcbiAgfVxyXG4iXX0=