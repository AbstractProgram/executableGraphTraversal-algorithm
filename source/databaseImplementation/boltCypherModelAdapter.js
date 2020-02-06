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

    close: () => graphDBDriver.close(),


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NvdXJjZS9kYXRhYmFzZUltcGxlbWVudGF0aW9uL2JvbHRDeXBoZXJNb2RlbEFkYXB0ZXIuanMiXSwibmFtZXMiOlsiYm9sdFByb3RvY29sRHJpdmVyIiwicmVxdWlyZSIsInYxIiwianNvblRvQ2VwaGVyQWRhcHRlciIsImNvbnZlcnRPYmplY3RUb0NlcGhlclByb3BlcnR5Iiwib2JqZWN0IiwicHJvcGVydHlBcnJheSIsImtleSIsInZhbHVlIiwiT2JqZWN0IiwiZW50cmllcyIsInB1c2giLCJtYXAiLCJpdGVtIiwiam9pbiIsIkVycm9yIiwiY29udmVydEFycmF5VG9DZXBoZXJMYWJlbCIsImFycmF5IiwiaWRlbnRpdHlOdW1iZXIiLCJjcmVhdGVFZGdlRGF0YSIsInN0YXJ0SWQiLCJlbmRJZCIsInR5cGUiLCJpZGVudGl0eSIsInN0YXJ0IiwiZW5kIiwicHJvcGVydGllcyIsImJvbHRDeXBoZXJNb2RlbEFkYXB0ZXJGdW5jdGlvbiIsInVybCIsInByb3RvY29sIiwiaG9zdG5hbWUiLCJwb3J0IiwiYXV0aGVudGljYXRpb24iLCJ1c2VybmFtZSIsInBhc3N3b3JkIiwic2NoZW1lUmVmZXJlbmNlIiwiZ3JhcGhEQkRyaXZlciIsImRyaXZlciIsImF1dGgiLCJiYXNpYyIsImRpc2FibGVMb3NzbGVzc0ludGVnZXJzIiwiaW1wbGVtZW50YXRpb24iLCJkcml2ZXJJbnN0YW5jZSIsImNsb3NlIiwicmVwbGFjZU5vZGVXaXRoQW5vdGhlcl9sb2FkR3JhcGhEYXRhIiwibm9kZUVudHJ5RGF0YSIsImNvbm5lY3Rpb25FbnRyeURhdGEiLCJyZWZlcmVuY2VOb2RlQXJyYXkiLCJmaWx0ZXIiLCJub2RlIiwibGFiZWxzIiwiaW5jbHVkZXMiLCJub2RlTGFiZWwiLCJub2RlUmVmZXJlbmNlIiwic29tZSIsImkiLCJyZXJvdXRlTm9kZU1hcCIsIk1hcCIsInJlaW50cm9kdWNlTm9kZUFycmF5IiwicmVmZXJlbmNlTm9kZSIsImFjdHVhbFRhcmdldE5vZGUiLCJnZXROb2RlQnlLZXkiLCJzaG91bGRUaHJvdyIsInNldCIsImNvbnNvbGUiLCJsb2ciLCJlZGdlIiwiZ2V0IiwiYWN0dWFsUmVmZXJlbmNlTm9kZSIsInN0YXJ0S2V5IiwiZW5kS2V5IiwiaWRNYXAiLCJub2RlSWRlbnRpdHkiLCJlbnRyeSIsImNyZWF0ZWROb2RlIiwiYWRkTm9kZSIsIm5vZGVEYXRhIiwiYWN0dWFsUmVmZXJlbmNlTm9kZUFycmF5IiwiQXJyYXkiLCJmcm9tIiwidmFsdWVzIiwiY29ubmVjdGlvbiIsImFkZENvbm5lY3Rpb24iLCJjb25uZWN0aW9uRGF0YSIsImRlYWxXaXRoRXh0ZXJuYWxSZWZlcmVuY2UiLCJleHRlcm5hbFJlcm91dGVOb2RlQXJyYXkiLCJyZXJvdXRlIiwicmVyb3V0ZU5vZGUiLCJyZXJvdXRlUHJvcGVydHkiLCJleHRlcm5hbFJlZmVyZW5jZU5vZGVLZXkiLCJleHRlcm5hbEtleSIsImZvckVhY2giLCJyZWZlcmVuY2VFZGdlIiwiY29ubmVjdGlvblR5cGUiLCJyZWZlcmVuY2UiLCJsb2FkR3JhcGhEYXRhIiwibGFiZWxTZWN0aW9uIiwibGVuZ3RoIiwic2Vzc2lvbiIsInF1ZXJ5IiwicmVzdWx0IiwicnVuIiwicmVjb3JkcyIsInRvT2JqZWN0IiwibiIsIm5leHQiLCJub2RlQXJyYXkiLCJnZXRBbGxOb2RlIiwiZ2V0Tm9kZUNvbm5lY3Rpb25CeUtleSIsImRpcmVjdGlvbiIsInNvdXJjZUtleSIsImRlc3RpbmF0aW9uTm9kZVR5cGUiLCJyZWNvcmQiLCJsIiwiZ2V0Tm9kZUNvbm5lY3Rpb24iLCJub2RlSUQiLCJvdGhlclBhaXJOb2RlVHlwZSIsImNvbm5lY3Rpb25UeXBlUXVlcnkiLCJnZXROb2RlQnlJRCIsImlkIiwiZ2V0QWxsRWRnZSIsImNvdW50Tm9kZSIsImNvdW50IiwiY291bnRFZGdlIl0sIm1hcHBpbmdzIjoiZ05BQUE7O0FBRUEsb0RBREEsTUFBTUEsa0JBQWtCLEdBQUdDLE9BQU8sQ0FBQyxjQUFELENBQVAsQ0FBd0JDLEVBQW5EOztB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LEdBQUk7OztPQUFiO0FBSUEsVUFBSUMsTUFBTSxHQUFHLE1BQU1GLE9BQU8sQ0FBQ0csR0FBUixDQUFZRixLQUFaLENBQW5CO0FBQ0EsWUFBTUQsT0FBTyxDQUFDdkQsS0FBUixFQUFOO0FBQ0EsYUFBT3lELE1BQU0sQ0FBQ0UsT0FBUCxDQUFlLENBQWYsRUFBa0JDLFFBQWxCLEdBQTZCbUIsS0FBcEM7QUFDRCxLQW5Tb0IsRUFBdkI7O0FBcVNBLFNBQU9qRixjQUFQO0FBQ0QsQ0FuVEksQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0J1xyXG5jb25zdCBib2x0UHJvdG9jb2xEcml2ZXIgPSByZXF1aXJlKCduZW80ai1kcml2ZXInKS52MVxyXG5pbXBvcnQgZ2VuZXJhdGVVVUlEIGZyb20gJ3V1aWQvdjQnXHJcbi8vIGNvbnZlbnRpb24gb2YgZGF0YSBzdHJ1Y3R1cmUgLSBgY29ubmVjdGlvbjogeyBzb3VyY2U6IFs8bm9kZUtleT4sIDxwb3J0S2V5Pl0sIGRlc3RpbmF0aW9uOiBbPG5vZGVLZXk+LCA8cG9ydEtleT5dIH1gXHJcbmNvbnN0IGpzb25Ub0NlcGhlckFkYXB0ZXIgPSB7XHJcbiAgY29udmVydE9iamVjdFRvQ2VwaGVyUHJvcGVydHkob2JqZWN0KSB7XHJcbiAgICBsZXQgcHJvcGVydHlBcnJheSA9IFtdXHJcbiAgICBmb3IgKGxldCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMob2JqZWN0KSkge1xyXG4gICAgICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xyXG4gICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxyXG4gICAgICAgIGNhc2UgJ251bWJlcic6XHJcbiAgICAgICAgICBwcm9wZXJ0eUFycmF5LnB1c2goYCR7a2V5fTogJHt2YWx1ZX1gKVxyXG4gICAgICAgICAgYnJlYWtcclxuICAgICAgICBjYXNlICdzdHJpbmcnOlxyXG4gICAgICAgICAgcHJvcGVydHlBcnJheS5wdXNoKGAke2tleX06JyR7dmFsdWV9J2ApIC8vIE5vdGU6IHVzZSBzaW5nbGUtcXVvdGVzIHRvIGFsbG93IGpzb24gc3RyaW5ncyB0aGF0IHJlbHkgb24gZG91YmxlIHFvdXRlcy5cclxuICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgY2FzZSAnb2JqZWN0JzogLy8gYW4gYXJyYXkgKGFzIHRoZSBwcm9wZXJ0eSBjYW5ub3QgYmUgYW4gb2JqZWN0IGluIHByb3BlcnR5IGdyYXBoIGRhdGFiYXNlcylcclxuICAgICAgICAgIHByb3BlcnR5QXJyYXkucHVzaChgJHtrZXl9OiBbJHt2YWx1ZS5tYXAoaXRlbSA9PiAodHlwZW9mIGl0ZW0gPT0gJ3N0cmluZycgPyBgJyR7aXRlbX0nYCA6IGl0ZW0pKS5qb2luKCcsICcpfV1gKVxyXG4gICAgICAgICAgYnJlYWtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDigKIgXCIke3R5cGVvZiB2YWx1ZX1cIiBQcm9wZXJ0eSB2YWx1ZSB0eXBlIGZvciBncmFwaCBkYXRhIGlzIG5vdCBzdXBwb3J0ZWQuYClcclxuICAgICAgICAgIGJyZWFrXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBwcm9wZXJ0eUFycmF5LmpvaW4oJywgJylcclxuICB9LFxyXG4gIGNvbnZlcnRBcnJheVRvQ2VwaGVyTGFiZWwoYXJyYXkpIHtcclxuICAgIHJldHVybiBhcnJheS5qb2luKCc6JylcclxuICB9LFxyXG59XHJcblxyXG5sZXQgaWRlbnRpdHlOdW1iZXIgPSAtMSAvLyB0aGlzIGlzIGp1c3QgdXNlZCB0byBjcmVhdGUgaWRzIHRoYXQgY291bGQgbm90IGNvbmZsaWN0IHdpdGggY3VycmVudGx5IGV4aXN0aW5nIGlkcy5cclxuZnVuY3Rpb24gY3JlYXRlRWRnZURhdGEoeyBzdGFydElkLCBlbmRJZCwgdHlwZSB9KSB7XHJcbiAgaWRlbnRpdHlOdW1iZXItLVxyXG4gIHJldHVybiB7XHJcbiAgICBpZGVudGl0eTogaWRlbnRpdHlOdW1iZXIsXHJcbiAgICBzdGFydDogc3RhcnRJZCxcclxuICAgIGVuZDogZW5kSWQsXHJcbiAgICB0eXBlLFxyXG4gICAgcHJvcGVydGllczoge1xyXG4gICAgICBrZXk6IGdlbmVyYXRlVVVJRCgpLFxyXG4gICAgfSxcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBib2x0Q3lwaGVyTW9kZWxBZGFwdGVyRnVuY3Rpb24gPSAoeyB1cmwgPSB7IHByb3RvY29sOiAnYm9sdCcsIGhvc3RuYW1lOiAnbG9jYWxob3N0JywgcG9ydDogNzY4NyB9LCBhdXRoZW50aWNhdGlvbiA9IHsgdXNlcm5hbWU6ICduZW80aicsIHBhc3N3b3JkOiAndGVzdCcgfSB9ID0ge30pID0+XHJcbiAgZnVuY3Rpb24oeyBzY2hlbWVSZWZlcmVuY2UgfSA9IHt9KSB7XHJcbiAgICBhc3NlcnQoc2NoZW1lUmVmZXJlbmNlLCBg4oCiIHNjaGVtZVJlZmVyZW5jZSBtdXN0IGJlIHBhc3NlZCB0byBpbml0aWFsaXplIHRoZSBtb2RlbCBhZGFwdGVyLmApXHJcbiAgICBjb25zdCBncmFwaERCRHJpdmVyID0gYm9sdFByb3RvY29sRHJpdmVyLmRyaXZlcihgJHt1cmwucHJvdG9jb2x9Oi8vJHt1cmwuaG9zdG5hbWV9OiR7dXJsLnBvcnR9YCwgYm9sdFByb3RvY29sRHJpdmVyLmF1dGguYmFzaWMoYXV0aGVudGljYXRpb24udXNlcm5hbWUsIGF1dGhlbnRpY2F0aW9uLnBhc3N3b3JkKSwge1xyXG4gICAgICBkaXNhYmxlTG9zc2xlc3NJbnRlZ2VyczogdHJ1ZSwgLy8gbmVvNGogcmVwcmVzZW50cyBJRHMgYXMgaW50ZWdlcnMsIGFuZCB0aHJvdWdoIHRoZSBKUyBkcml2ZXIgdHJhbnNmb3JtcyB0aGVtIHRvIHN0cmluZ3MgdG8gcmVwcmVzZW50IGhpZ2ggdmFsdWVzIGFwcHJveGltYXRlbHkgMl41MyArXHJcbiAgICAgIC8vIG1heENvbm5lY3Rpb25Qb29sU2l6ZTogcHJvY2Vzcy5lbnYuRFJJVkVSX01BWF9DT05ORUNUSU9OX1BPT0xfU0laRSB8fCA1MCwgICAgICAgICAgICAgICAgICAgICAvLyBtYXhpbXVtIG51bWJlciBvZiBjb25uZWN0aW9ucyB0byB0aGUgY29ubmVjdGlvbiBwb29sXHJcbiAgICAgIC8vIG1heENvbm5lY3Rpb25MaWZldGltZTogcHJvY2Vzcy5lbnYuRFJJVkVSX01BWF9DT05ORUNUSU9OX0xJRkVUSU1FIHx8IDQgKiA2MCAqIDYwICogMTAwMCwgICAgICAvLyB0aW1lIGluIG1zLCA0IGhvdXJzIG1heGltdW0gY29ubmVjdGlvbiBsaWZldGltZVxyXG4gICAgICAvLyBtYXhUcmFuc2FjdGlvblJldHJ5VGltZTogcHJvY2Vzcy5lbnYuRFJJVkVSX01BWF9UUkFOU0FDVElPTl9SRVRSWV9USU1FIHx8IDMgKiAxMDAwLCAgICAgICAgICAgLy8gdGltZSBpbiBtcyB0byByZXRyeSBhIHRyYW5zYWN0aW9uXHJcbiAgICAgIC8vIGNvbm5lY3Rpb25BY3F1aXNpdGlvblRpbWVvdXQ6IHByb2Nlc3MuZW52LkRSSVZFUl9DT05ORUNUSU9OX0FDUVVJU0lUSU9OX1RJTUVPVVQgfHwgMiAqIDEwMDAsICAvLyB0aW1lIGluIG1zIHRvIHdhaXQgZm9yIGEgY29ubmVjdGlvbiB0byBiZWNvbWUgYXZhaWxhYmxlIGluIHRoZSBwb29sXHJcbiAgICAgIC8vIHRydXN0OiBwcm9jZXNzLmVudi5EUklWRVJfVExTX1RSVVNUIHx8ICdUUlVTVF9BTExfQ0VSVElGSUNBVEVTJywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0bHMgdHJ1c3QgY29uZmlndXJhdGlvblxyXG4gICAgICAvLyBlbmNyeXB0ZWQ6IHByb2Nlc3MuZW52LkRSSVZFUl9UTFNfRU5BQkxFRCB8fCAnRU5DUllQVElPTl9PRkYnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZW5hYmxlL2Rpc2FibGUgVExTIGVuY3J5cHRpb24gdG8gY2xpZW50XHJcbiAgICB9KVxyXG5cclxuICAgIGNvbnN0IGltcGxlbWVudGF0aW9uID0ge1xyXG4gICAgICBkcml2ZXJJbnN0YW5jZTogZ3JhcGhEQkRyaXZlciwgLy8gZXhwb3NlIGRyaXZlciBpbnN0YW5jZVxyXG4gICAgICAvLyBwcm92aWRlIGEgbWV0aG9kIHRvIENsb3NlIGFsbCBvcGVuIHNlc3Npb25zIGFuZCBvdGhlciBhc3NvY2lhdGVkIHJlc291cmNlcy5cclxuICAgICAgY2xvc2U6ICgpID0+IGdyYXBoREJEcml2ZXIuY2xvc2UoKSxcclxuXHJcbiAgICAgIC8vIFRoaXMgaXMga2VwdCBmb3IgZnV0dXJlIHJlZmVyZW5jZSBvbmx5OlxyXG4gICAgICBhc3luYyByZXBsYWNlTm9kZVdpdGhBbm90aGVyX2xvYWRHcmFwaERhdGEoeyBub2RlRW50cnlEYXRhID0gW10sIGNvbm5lY3Rpb25FbnRyeURhdGEgPSBbXSB9ID0ge30pIHtcclxuICAgICAgICAvLyBkZWFsIHdpdGggYE5vZGVSZWZlcmVuY2VgXHJcbiAgICAgICAgbGV0IHJlZmVyZW5jZU5vZGVBcnJheSA9IG5vZGVFbnRyeURhdGEuZmlsdGVyKG5vZGUgPT4gbm9kZS5sYWJlbHMuaW5jbHVkZXMoc2NoZW1lUmVmZXJlbmNlLm5vZGVMYWJlbC5ub2RlUmVmZXJlbmNlKSkgLy8gZXh0cmFjdCBgTm9kZVJlZmVyZW5jZWAgbm9kZXNcclxuICAgICAgICBub2RlRW50cnlEYXRhID0gbm9kZUVudHJ5RGF0YS5maWx0ZXIobm9kZSA9PiAhcmVmZXJlbmNlTm9kZUFycmF5LnNvbWUoaSA9PiBpID09IG5vZGUpKSAvLyByZW1vdmUgcmVmZXJlbmNlIG5vZGVzIGZyb20gbm9kZSBhcnJheS5cclxuICAgICAgICBsZXQgcmVyb3V0ZU5vZGVNYXAgPSBuZXcgTWFwKClcclxuICAgICAgICBsZXQgcmVpbnRyb2R1Y2VOb2RlQXJyYXkgPSBbXVxyXG4gICAgICAgIGZvciAobGV0IHJlZmVyZW5jZU5vZGUgb2YgcmVmZXJlbmNlTm9kZUFycmF5KSB7XHJcbiAgICAgICAgICBsZXQgYWN0dWFsVGFyZ2V0Tm9kZSA9IGF3YWl0IGltcGxlbWVudGF0aW9uLmdldE5vZGVCeUtleSh7IGtleTogcmVmZXJlbmNlTm9kZS5wcm9wZXJ0aWVzLmtleSwgc2hvdWxkVGhyb3c6IGZhbHNlIH0pXHJcbiAgICAgICAgICAvLyA8cmVmZXJlbmNlIGlkPjogPGFjdHVhbCBpZCBpbiBncmFwaD5cclxuICAgICAgICAgIGlmIChhY3R1YWxUYXJnZXROb2RlKSB7XHJcbiAgICAgICAgICAgIHJlcm91dGVOb2RlTWFwLnNldChyZWZlcmVuY2VOb2RlLmlkZW50aXR5LCBhY3R1YWxUYXJnZXROb2RlKVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg4oCiIEZvdW5kIFwiTm9kZVJlZmVyZW5jZVwiIHRhcmdldCBpbiBjdXJyZW50IGdyYXBoICR7cmVmZXJlbmNlTm9kZS5pZGVudGl0eX0gLT4gJHthY3R1YWxUYXJnZXROb2RlLmlkZW50aXR5fWApXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBpZiByZWZlcmVuY2Ugbm9kZSBrZXkgd2FzIG5vdCBmb3VuZCBpbiB0aGUgY3VycmVudCBncmFwaCBkYXRhLCByZWludHJvZHVjZSBpdCBhcyBhIE5vZGVSZWZlcmVuY2Ugbm9kZVxyXG4gICAgICAgICAgICByZWludHJvZHVjZU5vZGVBcnJheS5wdXNoKHJlZmVyZW5jZU5vZGUpXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDigKIgXCJOb2RlUmVmZXJlbmNlXCIgd2FzIG5vdCBmb3VuZCBpbiBjdXJyZW50IGdyYXBoIC0gJHtyZWZlcmVuY2VOb2RlLnByb3BlcnRpZXMua2V5fS5gKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyByZWludHJvZHVjZSByZWZlcmVuY2Ugbm9kZXMgdGhhdCB3aGVyZSBub3QgZm91bmQgaW4gY3VycmVudCBncmFwaFxyXG4gICAgICAgIGZvciAobGV0IG5vZGUgb2YgcmVpbnRyb2R1Y2VOb2RlQXJyYXkpIHtcclxuICAgICAgICAgIG5vZGVFbnRyeURhdGEucHVzaChub2RlKVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyByZXBsYWNlIG5vZGUgcmVmZXJlbmNlIHdpdGggYWN0dWFsIGdyYXBoIGlkZW50aXR5IG9mIHRoZSB0YXJnZXQgcmVmZXJlbmNlIG5vZGVcclxuICAgICAgICBmb3IgKGxldCBlZGdlIG9mIGNvbm5lY3Rpb25FbnRyeURhdGEpIHtcclxuICAgICAgICAgIGlmIChyZXJvdXRlTm9kZU1hcC5nZXQoZWRnZS5zdGFydCkpIHtcclxuICAgICAgICAgICAgbGV0IGFjdHVhbFJlZmVyZW5jZU5vZGUgPSByZXJvdXRlTm9kZU1hcC5nZXQoZWRnZS5zdGFydClcclxuICAgICAgICAgICAgZWRnZS5zdGFydCA9IGFjdHVhbFJlZmVyZW5jZU5vZGUuaWRlbnRpdHlcclxuICAgICAgICAgICAgLy8gYWRkIGNvbm5lY3Rpb24ga2V5cyBmb3IgYWN0dWFsIHJlZmVyZW5jZSBub2RlcyB0aGF0IHRoZSBsYXR0ZXIgZnVuY3Rpb24gcmVseSBvbi5cclxuICAgICAgICAgICAgZWRnZS5zdGFydEtleSA9IGFjdHVhbFJlZmVyZW5jZU5vZGUucHJvcGVydGllcy5rZXlcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChyZXJvdXRlTm9kZU1hcC5nZXQoZWRnZS5lbmQpKSB7XHJcbiAgICAgICAgICAgIGxldCBhY3R1YWxSZWZlcmVuY2VOb2RlID0gcmVyb3V0ZU5vZGVNYXAuZ2V0KGVkZ2UuZW5kKVxyXG4gICAgICAgICAgICBlZGdlLmVuZCA9IGFjdHVhbFJlZmVyZW5jZU5vZGUuaWRlbnRpdHlcclxuICAgICAgICAgICAgLy8gYWRkIGNvbm5lY3Rpb24ga2V5cyBmb3IgYWN0dWFsIHJlZmVyZW5jZSBub2RlcyB0aGF0IHRoZSBsYXR0ZXIgZnVuY3Rpb24gcmVseSBvbi5cclxuICAgICAgICAgICAgZWRnZS5lbmRLZXkgPSBhY3R1YWxSZWZlcmVuY2VOb2RlLnByb3BlcnRpZXMua2V5XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBpZE1hcCA9IHsgbm9kZUlkZW50aXR5OiBuZXcgTWFwKCkgLyoqIG1hcHMgb2xkIGdyYXBoIGRhdGEgaWRzIHRvIG5ldyBkYXRhIGlkcy4gKGFzIGlkcyBjYW5ub3QgYmUgc2V0IGluIHRoZSBkYXRhYmFzZSB3aGVuIGxvYWRlZCB0aGUgZ3JhcGggZGF0YS4pICovIH1cclxuICAgICAgICBmb3IgKGxldCBlbnRyeSBvZiBub2RlRW50cnlEYXRhKSB7XHJcbiAgICAgICAgICBsZXQgY3JlYXRlZE5vZGUgPSBhd2FpdCBpbXBsZW1lbnRhdGlvbi5hZGROb2RlKHsgbm9kZURhdGE6IGVudHJ5IH0pXHJcbiAgICAgICAgICBpZE1hcC5ub2RlSWRlbnRpdHkuc2V0KGVudHJ5LmlkZW50aXR5LCBjcmVhdGVkTm9kZS5pZGVudGl0eSkgLy8gPGxvYWRlZCBwYXJhbWV0ZXIgSUQ+OiA8bmV3IGRhdGFiYXNlIElEPlxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gYWRkIHJlZmVyZW5jZSB0YXJnZXQgbm9kZXMgdG8gdGhlIGxpc3Qgb2Ygbm9kZXMgZm9yIHVzYWdlIGluIGBhZGRDb25uZWN0aW9uIGZ1bmN0aW9uXHJcbiAgICAgICAgbGV0IGFjdHVhbFJlZmVyZW5jZU5vZGVBcnJheSA9IEFycmF5LmZyb20ocmVyb3V0ZU5vZGVNYXAudmFsdWVzKCkpXHJcbiAgICAgICAgZm9yIChsZXQgYWN0dWFsUmVmZXJlbmNlTm9kZSBvZiBhY3R1YWxSZWZlcmVuY2VOb2RlQXJyYXkpIHtcclxuICAgICAgICAgIGlkTWFwLm5vZGVJZGVudGl0eS5zZXQoYWN0dWFsUmVmZXJlbmNlTm9kZS5pZGVudGl0eSwgYWN0dWFsUmVmZXJlbmNlTm9kZS5pZGVudGl0eSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHJlbHkgb24gYGtleWAgcHJvcGVydHkgdG8gY3JlYXRlIGNvbm5lY3Rpb25zXHJcbiAgICAgICAgY29ubmVjdGlvbkVudHJ5RGF0YS5tYXAoY29ubmVjdGlvbiA9PiB7XHJcbiAgICAgICAgICBpZiAoIWNvbm5lY3Rpb24uc3RhcnRLZXkpIGNvbm5lY3Rpb24uc3RhcnRLZXkgPSBub2RlRW50cnlEYXRhLmZpbHRlcihub2RlID0+IG5vZGUuaWRlbnRpdHkgPT0gY29ubmVjdGlvbi5zdGFydClbMF0ucHJvcGVydGllcy5rZXlcclxuICAgICAgICAgIGlmICghY29ubmVjdGlvbi5lbmRLZXkpIGNvbm5lY3Rpb24uZW5kS2V5ID0gbm9kZUVudHJ5RGF0YS5maWx0ZXIobm9kZSA9PiBub2RlLmlkZW50aXR5ID09IGNvbm5lY3Rpb24uZW5kKVswXS5wcm9wZXJ0aWVzLmtleVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgZm9yIChsZXQgZW50cnkgb2YgY29ubmVjdGlvbkVudHJ5RGF0YSkge1xyXG4gICAgICAgICAgYXdhaXQgaW1wbGVtZW50YXRpb24uYWRkQ29ubmVjdGlvbih7IGNvbm5lY3Rpb25EYXRhOiBlbnRyeSwgaWRNYXAgfSlcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBhc3luYyBkZWFsV2l0aEV4dGVybmFsUmVmZXJlbmNlKHsgbm9kZUVudHJ5RGF0YSwgY29ubmVjdGlvbkVudHJ5RGF0YSB9KSB7XHJcbiAgICAgICAgLy8gZGVhbCB3aXRoIEV4dGVybmFsIFJlcm91dGUgLyBOb2RlUmVmZXJlbmNlXHJcbiAgICAgICAgbGV0IGV4dGVybmFsUmVyb3V0ZU5vZGVBcnJheSA9IG5vZGVFbnRyeURhdGFcclxuICAgICAgICAgIC5maWx0ZXIobm9kZSA9PiBub2RlLmxhYmVscy5pbmNsdWRlcyhzY2hlbWVSZWZlcmVuY2Uubm9kZUxhYmVsLnJlcm91dGUpKSAvLyBleHRyYWN0IFJlcm91dGUvTm9kZVJlZmVyZW5jZSBub2Rlc1xyXG4gICAgICAgICAgLmZpbHRlcihyZXJvdXRlTm9kZSA9PiByZXJvdXRlTm9kZS5wcm9wZXJ0aWVzW3NjaGVtZVJlZmVyZW5jZS5yZXJvdXRlUHJvcGVydHkuZXh0ZXJuYWxSZWZlcmVuY2VOb2RlS2V5XSkgLy8gb25seSBleHRlcm5hbCByZXJvdXRlIG5vZGVzICh3aXRoIGFuIGV4dGVybmFsIGtleSBwcm9wZXJ0eSlcclxuXHJcbiAgICAgICAgbGV0IHJlcm91dGVOb2RlTWFwID0gbmV3IE1hcCgpXHJcbiAgICAgICAgZm9yIChsZXQgcmVyb3V0ZU5vZGUgb2YgZXh0ZXJuYWxSZXJvdXRlTm9kZUFycmF5KSB7XHJcbiAgICAgICAgICBsZXQgZXh0ZXJuYWxLZXkgPSByZXJvdXRlTm9kZS5wcm9wZXJ0aWVzW3NjaGVtZVJlZmVyZW5jZS5yZXJvdXRlUHJvcGVydHkuZXh0ZXJuYWxSZWZlcmVuY2VOb2RlS2V5XVxyXG4gICAgICAgICAgbGV0IGFjdHVhbFRhcmdldE5vZGUgPSBhd2FpdCBpbXBsZW1lbnRhdGlvbi5nZXROb2RlQnlLZXkoeyBrZXk6IGV4dGVybmFsS2V5LCBzaG91bGRUaHJvdzogZmFsc2UgfSlcclxuICAgICAgICAgIC8vIDxyZWZlcmVuY2UgaWQ+OiA8YWN0dWFsIGlkIGluIGdyYXBoPlxyXG4gICAgICAgICAgaWYgKGFjdHVhbFRhcmdldE5vZGUpIHtcclxuICAgICAgICAgICAgcmVyb3V0ZU5vZGVNYXAuc2V0KHJlcm91dGVOb2RlLCBhY3R1YWxUYXJnZXROb2RlKVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg4oCiIEZvdW5kIGV4dGVybmFsIHJlZmVyZW5jZSB0YXJnZXQgbm9kZSBpbiBjdXJyZW50IGdyYXBoICR7cmVyb3V0ZU5vZGUuaWRlbnRpdHl9IC0+ICR7YWN0dWFsVGFyZ2V0Tm9kZS5pZGVudGl0eX1gKVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gV2FybiBpZiBubyByZXJvdXRlIG5vZGVzIHdoZXJlIHJlc29sdmVkOiBpZiByZWZlcmVuY2Ugbm9kZSBrZXkgd2FzIG5vdCBmb3VuZCBpbiB0aGUgY3VycmVudCBncmFwaCBkYXRhLCByZWludHJvZHVjZSBpdCBhcyBhIE5vZGVSZWZlcmVuY2Ugbm9kZVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg4oCiIEV4dGVybmFsIHJlZmVyZW5jZSBub2RlIChcIiR7ZXh0ZXJuYWxLZXl9XCIpIHdhcyBub3QgZm91bmQgaW4gY3VycmVudCBncmFwaCBmb3IgcmVyb3V0ZSBub2RlIC0gJHtyZXJvdXRlTm9kZS5wcm9wZXJ0aWVzLmtleX0uYClcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlcm91dGVOb2RlTWFwLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcclxuICAgICAgICAgIC8vIGNyZWF0ZSBSRUZFUkVOQ0UgZWRnZSBiZXR3ZWVuIHJlcm91dGUgbm9kZSBhbmQgdGhlIGFjdHVhbCBleHRlcm5hbCBncmFwaCB0YXJnZXQgcmVmZXJlbmNlIG5vZGVcclxuICAgICAgICAgIGxldCByZWZlcmVuY2VFZGdlID0gY3JlYXRlRWRnZURhdGEoeyBzdGFydElkOiByZXJvdXRlTm9kZS5pZGVudGl0eSwgZW5kSWQ6IGFjdHVhbFRhcmdldE5vZGUuaWRlbnRpdHksIHR5cGU6IHNjaGVtZVJlZmVyZW5jZS5jb25uZWN0aW9uVHlwZS5yZWZlcmVuY2UgfSlcclxuICAgICAgICAgIGNvbm5lY3Rpb25FbnRyeURhdGEucHVzaChyZWZlcmVuY2VFZGdlKVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyBsb2FkIG5vZGVzIGFuZCBjb25uZWN0aW9ucyBmcm9tIGpzb24gZmlsZSBkYXRhLlxyXG4gICAgICAvLyBUT0RPOiBjaGVjayBpZiB0aGlzIG1ldGhvZCBzaG91bGQgYmUgcGxhY2VkIGluIGNvcmUgYXMgaXQgcmVsaWVzIG9uIG5vZGUgcmVmZXJlbmNlIC8gZXh0ZXJuYWwgcmVyb3V0ZSBjb25jZXB0XHJcbiAgICAgIGFzeW5jIGxvYWRHcmFwaERhdGEoeyBub2RlRW50cnlEYXRhID0gW10sIGNvbm5lY3Rpb25FbnRyeURhdGEgPSBbXSB9ID0ge30pIHtcclxuICAgICAgICBhd2FpdCBpbXBsZW1lbnRhdGlvbi5kZWFsV2l0aEV4dGVybmFsUmVmZXJlbmNlKHsgbm9kZUVudHJ5RGF0YSwgY29ubmVjdGlvbkVudHJ5RGF0YSB9KSAvLyBtb2RpZmllcyBub2RlICYgY29ubmVjdGlvbiBhcnJheXNcclxuXHJcbiAgICAgICAgY29uc3QgaWRNYXAgPSB7IG5vZGVJZGVudGl0eTogbmV3IE1hcCgpIC8qKiBtYXBzIG9sZCBncmFwaCBkYXRhIGlkcyB0byBuZXcgZGF0YSBpZHMuIChhcyBpZHMgY2Fubm90IGJlIHNldCBpbiB0aGUgZGF0YWJhc2Ugd2hlbiBsb2FkZWQgdGhlIGdyYXBoIGRhdGEuKSAqLyB9XHJcbiAgICAgICAgZm9yIChsZXQgZW50cnkgb2Ygbm9kZUVudHJ5RGF0YSkge1xyXG4gICAgICAgICAgbGV0IGNyZWF0ZWROb2RlID0gYXdhaXQgaW1wbGVtZW50YXRpb24uYWRkTm9kZSh7IG5vZGVEYXRhOiBlbnRyeSB9KVxyXG4gICAgICAgICAgaWRNYXAubm9kZUlkZW50aXR5LnNldChlbnRyeS5pZGVudGl0eSwgY3JlYXRlZE5vZGUuaWRlbnRpdHkpIC8vIDxsb2FkZWQgcGFyYW1ldGVyIElEPjogPG5ldyBkYXRhYmFzZSBJRD5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHJlbHkgb24gYGtleWAgcHJvcGVydHkgdG8gY3JlYXRlIGNvbm5lY3Rpb25zXHJcbiAgICAgICAgY29ubmVjdGlvbkVudHJ5RGF0YS5tYXAoY29ubmVjdGlvbiA9PiB7XHJcbiAgICAgICAgICBpZiAoIWNvbm5lY3Rpb24uc3RhcnRLZXkpIGNvbm5lY3Rpb24uc3RhcnRLZXkgPSBub2RlRW50cnlEYXRhLmZpbHRlcihub2RlID0+IG5vZGUuaWRlbnRpdHkgPT0gY29ubmVjdGlvbi5zdGFydClbMF0ucHJvcGVydGllcy5rZXlcclxuICAgICAgICAgIGlmICghY29ubmVjdGlvbi5lbmRLZXkpIGNvbm5lY3Rpb24uZW5kS2V5ID0gbm9kZUVudHJ5RGF0YS5maWx0ZXIobm9kZSA9PiBub2RlLmlkZW50aXR5ID09IGNvbm5lY3Rpb24uZW5kKVswXS5wcm9wZXJ0aWVzLmtleVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgZm9yIChsZXQgZW50cnkgb2YgY29ubmVjdGlvbkVudHJ5RGF0YSkge1xyXG4gICAgICAgICAgYXdhaXQgaW1wbGVtZW50YXRpb24uYWRkQ29ubmVjdGlvbih7IGNvbm5lY3Rpb25EYXRhOiBlbnRyeSwgaWRNYXAgfSlcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIGFkZE5vZGU6IGFzeW5jICh7IG5vZGVEYXRhIC8qY29uZm9ybXMgd2l0aCB0aGUgQ3lwaGVyIHF1ZXJ5IHJlc3VsdHMgZGF0YSBjb252ZW50aW9uKi8gfSkgPT4ge1xyXG4gICAgICAgIGFzc2VydChub2RlRGF0YS5wcm9wZXJ0aWVzPy5rZXksICfigKIgTm9kZSBkYXRhIG11c3QgaGF2ZSBhIGtleSBwcm9wZXJ0eSAtICcgKyBub2RlRGF0YSlcclxuXHJcbiAgICAgICAgbGV0IGxhYmVsU2VjdGlvbiA9IG5vZGVEYXRhLmxhYmVscyAmJiBub2RlRGF0YS5sYWJlbHMubGVuZ3RoID4gMCA/IGA6JHtqc29uVG9DZXBoZXJBZGFwdGVyLmNvbnZlcnRBcnJheVRvQ2VwaGVyTGFiZWwobm9kZURhdGEubGFiZWxzKX1gIDogJydcclxuICAgICAgICBsZXQgc2Vzc2lvbiA9IGF3YWl0IGdyYXBoREJEcml2ZXIuc2Vzc2lvbigpXHJcbiAgICAgICAgbGV0IHF1ZXJ5ID0gYFxyXG4gICAgICAgIGNyZWF0ZSAobiR7bGFiZWxTZWN0aW9ufSB7JHtqc29uVG9DZXBoZXJBZGFwdGVyLmNvbnZlcnRPYmplY3RUb0NlcGhlclByb3BlcnR5KG5vZGVEYXRhLnByb3BlcnRpZXMpfX0pXHJcbiAgICAgICAgcmV0dXJuIG5cclxuICAgICAgYFxyXG4gICAgICAgIGxldCByZXN1bHQgPSBhd2FpdCBzZXNzaW9uLnJ1bihxdWVyeSlcclxuICAgICAgICBhd2FpdCBzZXNzaW9uLmNsb3NlKClcclxuICAgICAgICByZXR1cm4gcmVzdWx0LnJlY29yZHNbMF0udG9PYmplY3QoKS5uXHJcbiAgICAgIH0sXHJcbiAgICAgIGFkZENvbm5lY3Rpb246IGFzeW5jICh7IGNvbm5lY3Rpb25EYXRhIC8qY29uZm9ybXMgd2l0aCB0aGUgQ3lwaGVyIHF1ZXJ5IHJlc3VsdHMgZGF0YSBjb252ZW50aW9uKi8sIGlkTWFwIC8qVXNlIGlkZW50aXRpZXMgdG8gY3JlYXRlIGVkZ2VzICovIH0pID0+IHtcclxuICAgICAgICBhc3NlcnQodHlwZW9mIGNvbm5lY3Rpb25EYXRhLnN0YXJ0ID09ICdudW1iZXInICYmIHR5cGVvZiBjb25uZWN0aW9uRGF0YS5lbmQgPT0gJ251bWJlcicsIGDigKIgQ29ubmVjdGlvbiBtdXN0IGhhdmUgYSBzdGFydCBhbmQgZW5kIG5vZGVzLmApXHJcbiAgICAgICAgaWYgKGNvbm5lY3Rpb25EYXRhLnR5cGUgPT0gc2NoZW1lUmVmZXJlbmNlLmNvbm5lY3Rpb25UeXBlLm5leHQpIGFzc2VydChjb25uZWN0aW9uRGF0YS5wcm9wZXJ0aWVzPy5rZXksICfigKIgQ29ubmVjdGlvbiBvYmplY3QgbXVzdCBoYXZlIGEga2V5IHByb3BlcnR5LicpXHJcbiAgICAgICAgbGV0IG5vZGVBcnJheSA9IGF3YWl0IGltcGxlbWVudGF0aW9uLmdldEFsbE5vZGUoKVxyXG4gICAgICAgIGxldCBzZXNzaW9uID0gYXdhaXQgZ3JhcGhEQkRyaXZlci5zZXNzaW9uKClcclxuXHJcbiAgICAgICAgbGV0IHF1ZXJ5ID0gYFxyXG4gICAgICAgIG1hdGNoIChzb3VyY2UgeyBrZXk6ICcke2Nvbm5lY3Rpb25EYXRhLnN0YXJ0S2V5fScgfSkgJHtpZE1hcCA/IGB3aGVyZSBJRChzb3VyY2UpID0gJHtpZE1hcC5ub2RlSWRlbnRpdHkuZ2V0KGNvbm5lY3Rpb25EYXRhLnN0YXJ0KX1gIDogJyd9XHJcbiAgICAgICAgbWF0Y2ggKGRlc3RpbmF0aW9uIHsga2V5OiAnJHtjb25uZWN0aW9uRGF0YS5lbmRLZXl9JyB9KSAke2lkTWFwID8gYHdoZXJlIElEKGRlc3RpbmF0aW9uKSA9ICR7aWRNYXAubm9kZUlkZW50aXR5LmdldChjb25uZWN0aW9uRGF0YS5lbmQpfWAgOiAnJ31cclxuICAgICAgICBjcmVhdGUgXHJcbiAgICAgICAgICAoc291cmNlKVxyXG4gICAgICAgICAgLVtsOiR7Y29ubmVjdGlvbkRhdGEudHlwZX0geyR7anNvblRvQ2VwaGVyQWRhcHRlci5jb252ZXJ0T2JqZWN0VG9DZXBoZXJQcm9wZXJ0eShjb25uZWN0aW9uRGF0YS5wcm9wZXJ0aWVzKX19XS0+XHJcbiAgICAgICAgICAoZGVzdGluYXRpb24pIFxyXG4gICAgICAgIHJldHVybiBsXHJcbiAgICAgIGBcclxuICAgICAgICBsZXQgcmVzdWx0ID0gYXdhaXQgc2Vzc2lvbi5ydW4ocXVlcnkpXHJcbiAgICAgICAgLy8gcmVzdWx0LnJlY29yZHMuZm9yRWFjaChyZWNvcmQgPT4gcmVjb3JkLnRvT2JqZWN0KCkgfD4gY29uc29sZS5sb2cpXHJcbiAgICAgICAgYXdhaXQgc2Vzc2lvbi5jbG9zZSgpXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdFxyXG4gICAgICB9LFxyXG4gICAgICAvLyBUT0RPOiBVcGRhdGUgdGhpcyBmdW5jdGlvbiB0byBjb25zaWRlciB0aGUgcmV0dXJuZWQgZGVzdGluYXRpb24gJiBzb3VyY2Ugbm9kZXMsIHdvdWxkIG1hdGNoIHRoZWlyIHJvbGUgaW4gdGhlIGNvbm5lY3Rpb24gcGFpciAoZS5nLiBjaGVjayBgZ2V0Tm9kZUNvbm5lY3Rpb25gIGJlbG93KS5cclxuICAgICAgZ2V0Tm9kZUNvbm5lY3Rpb25CeUtleTogYXN5bmMgZnVuY3Rpb24oe1xyXG4gICAgICAgIGRpcmVjdGlvbiA9ICdvdXRnb2luZycgLyogZmlsdGVyIGNvbm5lY3Rpb24gYXJyYXkgdG8gbWF0Y2ggb3V0Z29pbmcgY29ubmVjdGlvbnMgb25seSovLFxyXG4gICAgICAgIHNvdXJjZUtleSxcclxuICAgICAgICBkZXN0aW5hdGlvbk5vZGVUeXBlLFxyXG4gICAgICB9OiB7XHJcbiAgICAgICAgZGlyZWN0aW9uOiAnb3V0Z29pbmcnIHwgJ2luY29taW5nJyxcclxuICAgICAgfSkge1xyXG4gICAgICAgIGFzc2VydChkaXJlY3Rpb24gPT0gJ291dGdvaW5nJywgJ+KAoiBgZGlyZWN0aW9uYCBwYXJhbWV0ZXIgdW5zdXBwb3J0ZWQuJylcclxuICAgICAgICBsZXQgc2Vzc2lvbiA9IGF3YWl0IGdyYXBoREJEcml2ZXIuc2Vzc2lvbigpXHJcbiAgICAgICAgbGV0IHF1ZXJ5ID0gYFxyXG4gICAgICAgIG1hdGNoIFxyXG4gICAgICAgICAgKHNvdXJjZSB7IGtleTogJyR7c291cmNlS2V5fScgfSlcclxuICAgICAgICAgIC1bbDoke3NjaGVtZVJlZmVyZW5jZS5jb25uZWN0aW9uVHlwZS5uZXh0fV0tPlxyXG4gICAgICAgICAgKGRlc3RpbmF0aW9uJHtkZXN0aW5hdGlvbk5vZGVUeXBlID8gYDoke2Rlc3RpbmF0aW9uTm9kZVR5cGV9YCA6ICcnfSkgXHJcbiAgICAgICAgcmV0dXJuIGxcclxuICAgICAgICBvcmRlciBieSBkZXN0aW5hdGlvbi5rZXlcclxuICAgICAgYFxyXG4gICAgICAgIGxldCByZXN1bHQgPSBhd2FpdCBzZXNzaW9uLnJ1bihxdWVyeSlcclxuICAgICAgICByZXN1bHQgPSByZXN1bHQucmVjb3Jkcy5tYXAocmVjb3JkID0+IHJlY29yZC50b09iamVjdCgpLmwpXHJcbiAgICAgICAgYXdhaXQgc2Vzc2lvbi5jbG9zZSgpXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdFxyXG4gICAgICB9LFxyXG4gICAgICAvKipcclxuICAgICAgICogQHJldHVybnMgQXJyYXkgb2Ygb2JqZWN0cyBbe1xyXG4gICAgICAgKiAgY29ubmVjdGlvbjogT2JqZWN0LFxyXG4gICAgICAgKiAgc291cmNlOiBPYmplY3QsXHJcbiAgICAgICAqICBkZXN0aW5hdGlvbjogT2JqZWN0XHJcbiAgICAgICAqIH1dXHJcbiAgICAgICAqL1xyXG4gICAgICBnZXROb2RlQ29ubmVjdGlvbjogYXN5bmMgZnVuY3Rpb24oe1xyXG4gICAgICAgIG5vZGVJRCxcclxuICAgICAgICBkaXJlY3Rpb24gLyogZmlsdGVyIGNvbm5lY3Rpb24gYXJyYXkgdG8gbWF0Y2ggb3V0Z29pbmcgY29ubmVjdGlvbnMgb25seSovLFxyXG4gICAgICAgIG90aGVyUGFpck5vZGVUeXBlLFxyXG4gICAgICAgIGNvbm5lY3Rpb25UeXBlLFxyXG4gICAgICB9OiB7XHJcbiAgICAgICAgZGlyZWN0aW9uOiAnb3V0Z29pbmcnIHwgJ2luY29taW5nJyB8IHVuZGVmaW5lZCAvKmJvdGggaW5jb21pbmcgYW5kIG91dGdvaW5nKi8sXHJcbiAgICAgIH0pIHtcclxuICAgICAgICBsZXQgc2Vzc2lvbiA9IGF3YWl0IGdyYXBoREJEcml2ZXIuc2Vzc2lvbigpXHJcbiAgICAgICAgbGV0IGNvbm5lY3Rpb25UeXBlUXVlcnkgPSBjb25uZWN0aW9uVHlwZSA/IGA6JHtjb25uZWN0aW9uVHlwZX1gIDogYGBcclxuICAgICAgICBsZXQgY29ubmVjdGlvbiA9IGRpcmVjdGlvbiA9PSAnb3V0Z29pbmcnID8gYC1bY29ubmVjdGlvbiR7Y29ubmVjdGlvblR5cGVRdWVyeX1dLT5gIDogZGlyZWN0aW9uID09ICdpbmNvbWluZycgPyBgPC1bY29ubmVjdGlvbiR7Y29ubmVjdGlvblR5cGVRdWVyeX1dLWAgOiBgLVtjb25uZWN0aW9uJHtjb25uZWN0aW9uVHlwZVF1ZXJ5fV0tYFxyXG4gICAgICAgIGxldCBxdWVyeVxyXG5cclxuICAgICAgICAvLyBzd2l0Y2ggZGlyZWN0aW9uIHRvIHJldHVybiBkZXN0aW5hdGlvbiBhbmQgc291cmNlIGNvcnJlY3RseSBhY2NvcmRpbmcgdG8gdGhlIGRpZmZlcmVudCBjYXNlcy5cclxuICAgICAgICBzd2l0Y2ggKGRpcmVjdGlvbikge1xyXG4gICAgICAgICAgY2FzZSAnb3V0Z29pbmcnOlxyXG4gICAgICAgICAgICBxdWVyeSA9IGBcclxuICAgICAgICAgICAgbWF0Y2ggKHNvdXJjZSkgICR7Y29ubmVjdGlvbn0gKGRlc3RpbmF0aW9uJHtvdGhlclBhaXJOb2RlVHlwZSA/IGA6JHtvdGhlclBhaXJOb2RlVHlwZX1gIDogJyd9KSBcclxuICAgICAgICAgICAgd2hlcmUgaWQoc291cmNlKT0ke25vZGVJRH1cclxuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3Rpb24sIHNvdXJjZSwgZGVzdGluYXRpb24gb3JkZXIgYnkgZGVzdGluYXRpb24ua2V5XHJcbiAgICAgICAgICBgXHJcbiAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICBjYXNlICdpbmNvbWluZyc6XHJcbiAgICAgICAgICAgIHF1ZXJ5ID0gYFxyXG4gICAgICAgICAgICBtYXRjaCAoZGVzdGluYXRpb24pICAke2Nvbm5lY3Rpb259IChzb3VyY2Uke290aGVyUGFpck5vZGVUeXBlID8gYDoke290aGVyUGFpck5vZGVUeXBlfWAgOiAnJ30pXHJcbiAgICAgICAgICAgIHdoZXJlIGlkKGRlc3RpbmF0aW9uKT0ke25vZGVJRH1cclxuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3Rpb24sIHNvdXJjZSwgZGVzdGluYXRpb24gb3JkZXIgYnkgc291cmNlLmtleVxyXG4gICAgICAgICAgYFxyXG4gICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgcXVlcnkgPSBgXHJcbiAgICAgICAgICAgIG1hdGNoIChzb3VyY2UpICAke2Nvbm5lY3Rpb259IChkZXN0aW5hdGlvbiR7b3RoZXJQYWlyTm9kZVR5cGUgPyBgOiR7b3RoZXJQYWlyTm9kZVR5cGV9YCA6ICcnfSkgXHJcbiAgICAgICAgICAgIHdoZXJlIGlkKHNvdXJjZSk9JHtub2RlSUR9XHJcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0aW9uLCBzb3VyY2UsIGRlc3RpbmF0aW9uIG9yZGVyIGJ5IGRlc3RpbmF0aW9uLmtleVxyXG4gICAgICAgICAgYFxyXG4gICAgICAgICAgICBicmVha1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgcmVzdWx0ID0gYXdhaXQgc2Vzc2lvbi5ydW4ocXVlcnkpXHJcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnJlY29yZHMubWFwKHJlY29yZCA9PiByZWNvcmQudG9PYmplY3QoKSlcclxuICAgICAgICBhd2FpdCBzZXNzaW9uLmNsb3NlKClcclxuICAgICAgICByZXR1cm4gcmVzdWx0XHJcbiAgICAgIH0sXHJcbiAgICAgIGdldE5vZGVCeUtleTogYXN5bmMgZnVuY3Rpb24oeyBrZXksIHNob3VsZFRocm93ID0gdHJ1ZSB9KSB7XHJcbiAgICAgICAgbGV0IHNlc3Npb24gPSBhd2FpdCBncmFwaERCRHJpdmVyLnNlc3Npb24oKVxyXG4gICAgICAgIGxldCBxdWVyeSA9IGBcclxuICAgICAgICBtYXRjaCAobiB7a2V5OiAnJHtrZXl9J30pXHJcbiAgICAgICAgcmV0dXJuIG5cclxuICAgICAgYFxyXG4gICAgICAgIGxldCByZXN1bHQgPSBhd2FpdCBzZXNzaW9uLnJ1bihxdWVyeSlcclxuICAgICAgICBhd2FpdCBzZXNzaW9uLmNsb3NlKClcclxuICAgICAgICBpZiAoc2hvdWxkVGhyb3cpIGFzc2VydChyZXN1bHQucmVjb3Jkc1swXSwgYOKAoiBDYW5ub3QgZmluZCBub2RlIHdoZXJlIG5vZGUua2V5PVwiJHtrZXl9XCJgKVxyXG4gICAgICAgIGlmIChyZXN1bHQucmVjb3Jkcy5sZW5ndGggPT0gMCkgcmV0dXJuIGZhbHNlXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5yZWNvcmRzWzBdLnRvT2JqZWN0KCkublxyXG4gICAgICB9LFxyXG4gICAgICBnZXROb2RlQnlJRDogYXN5bmMgZnVuY3Rpb24oeyBpZCB9KSB7XHJcbiAgICAgICAgbGV0IHNlc3Npb24gPSBhd2FpdCBncmFwaERCRHJpdmVyLnNlc3Npb24oKVxyXG4gICAgICAgIGxldCBxdWVyeSA9IGBcclxuICAgICAgICBtYXRjaCAobikgd2hlcmUgaWQobik9JHtpZH1cclxuICAgICAgICByZXR1cm4gblxyXG4gICAgICBgXHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IGF3YWl0IHNlc3Npb24ucnVuKHF1ZXJ5KVxyXG4gICAgICAgIGF3YWl0IHNlc3Npb24uY2xvc2UoKVxyXG4gICAgICAgIHJldHVybiByZXN1bHQucmVjb3Jkc1swXS50b09iamVjdCgpLm5cclxuICAgICAgfSxcclxuICAgICAgZ2V0QWxsTm9kZTogYXN5bmMgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgbGV0IHNlc3Npb24gPSBhd2FpdCBncmFwaERCRHJpdmVyLnNlc3Npb24oKVxyXG4gICAgICAgIGxldCBxdWVyeSA9IGBcclxuICAgICAgICBtYXRjaCAobikgcmV0dXJuIG4gb3JkZXIgYnkgbi5rZXlcclxuICAgICAgYFxyXG4gICAgICAgIGxldCByZXN1bHQgPSBhd2FpdCBzZXNzaW9uLnJ1bihxdWVyeSlcclxuICAgICAgICBhd2FpdCBzZXNzaW9uLmNsb3NlKClcclxuICAgICAgICByZXR1cm4gcmVzdWx0LnJlY29yZHNcclxuICAgICAgICAgIC5tYXAocmVjb3JkID0+IHJlY29yZC50b09iamVjdCgpLm4pXHJcbiAgICAgICAgICAubWFwKG5vZGUgPT4ge1xyXG4gICAgICAgICAgICAvLyBub2RlLmlkZW50aXR5ID0gbm9kZS5pZGVudGl0eS50b1N0cmluZygpXHJcbiAgICAgICAgICAgIHJldHVybiBub2RlXHJcbiAgICAgICAgICB9KVxyXG4gICAgICB9LFxyXG4gICAgICBnZXRBbGxFZGdlOiBhc3luYyBmdW5jdGlvbigpIHtcclxuICAgICAgICBsZXQgc2Vzc2lvbiA9IGF3YWl0IGdyYXBoREJEcml2ZXIuc2Vzc2lvbigpXHJcbiAgICAgICAgbGV0IHF1ZXJ5ID0gYFxyXG4gICAgICAgIG1hdGNoICgpLVtsXS0+KG4pIHJldHVybiBsIG9yZGVyIGJ5IG4ua2V5XHJcbiAgICAgIGBcclxuICAgICAgICBsZXQgcmVzdWx0ID0gYXdhaXQgc2Vzc2lvbi5ydW4ocXVlcnkpXHJcbiAgICAgICAgYXdhaXQgc2Vzc2lvbi5jbG9zZSgpXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5yZWNvcmRzXHJcbiAgICAgICAgICAubWFwKHJlY29yZCA9PiByZWNvcmQudG9PYmplY3QoKS5sKVxyXG4gICAgICAgICAgLm1hcChlZGdlID0+IHtcclxuICAgICAgICAgICAgLy8gTm90ZTogQm9sdCBkcml2ZXIgb3B0aW9uIGhhbmRsZXMgaW50ZWdlciB0cmFuc2Zvcm1hdGlvbi5cclxuICAgICAgICAgICAgLy8gY2hhbmdlIG51bWJlcnMgdG8gc3RyaW5nIHJlcHJlc2VudGF0aW9uXHJcbiAgICAgICAgICAgIC8vIGVkZ2UuaWRlbnRpdHkgPSBlZGdlLmlkZW50aXR5LnRvU3RyaW5nKClcclxuICAgICAgICAgICAgLy8gZWRnZS5zdGFydCA9IGVkZ2Uuc3RhcnQudG9TdHJpbmcoKVxyXG4gICAgICAgICAgICAvLyBlZGdlLmVuZCA9IGVkZ2UuZW5kLnRvU3RyaW5nKClcclxuICAgICAgICAgICAgcmV0dXJuIGVkZ2VcclxuICAgICAgICAgIH0pXHJcbiAgICAgIH0sXHJcbiAgICAgIGNvdW50Tm9kZTogYXN5bmMgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgbGV0IHNlc3Npb24gPSBhd2FpdCBncmFwaERCRHJpdmVyLnNlc3Npb24oKVxyXG4gICAgICAgIGxldCBxdWVyeSA9IGBcclxuICAgICAgICBNQVRDSCAobilcclxuICAgICAgICBSRVRVUk4gY291bnQobikgYXMgY291bnRcclxuICAgICAgYFxyXG4gICAgICAgIGxldCByZXN1bHQgPSBhd2FpdCBzZXNzaW9uLnJ1bihxdWVyeSlcclxuICAgICAgICBhd2FpdCBzZXNzaW9uLmNsb3NlKClcclxuICAgICAgICByZXR1cm4gcmVzdWx0LnJlY29yZHNbMF0udG9PYmplY3QoKS5jb3VudFxyXG4gICAgICB9LFxyXG4gICAgICBjb3VudEVkZ2U6IGFzeW5jIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGxldCBzZXNzaW9uID0gYXdhaXQgZ3JhcGhEQkRyaXZlci5zZXNzaW9uKClcclxuICAgICAgICBsZXQgcXVlcnkgPSBgXHJcbiAgICAgICAgTUFUQ0ggKCktW3JdLT4oKVxyXG4gICAgICAgIFJFVFVSTiBjb3VudChyKSBhcyBjb3VudFxyXG4gICAgICBgXHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IGF3YWl0IHNlc3Npb24ucnVuKHF1ZXJ5KVxyXG4gICAgICAgIGF3YWl0IHNlc3Npb24uY2xvc2UoKVxyXG4gICAgICAgIHJldHVybiByZXN1bHQucmVjb3Jkc1swXS50b09iamVjdCgpLmNvdW50XHJcbiAgICAgIH0sXHJcbiAgICB9XHJcbiAgICByZXR1cm4gaW1wbGVtZW50YXRpb25cclxuICB9XHJcbiJdfQ==