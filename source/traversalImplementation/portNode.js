import promiseProperRace from '@dependency/promiseProperRace'
import { resolve } from 'path'
// import { iterateConnection } from './iterateConnection.js'

/**  The purpose of this function is to find & yield next nodes.
 * @yields {Object { node: <node instance>} } a traversal configuration feed/iterato
 **/
export async function* propagationControl({ forkEdge, additionalChildNode, graphInstance }) {
  let portNode = forkEdge.destination
  let nodeIteratorFeed = await iterateNext({ node: forkEdge.destination, additionalChildNode, graphInstance })
  yield* nodeIteratorFeed
}

/**
 * TODO:
 * Selective implementation - where a switch is used to pick the next node from many, by comparing a value to case values.
 **/
// export async function* selectivePropagation({ forkEdge, additionalChildNode, graphInstance }) {
//   let portNode = forkEdge.destination
//   console.log(portNode.properties.key)
//   let nodeIteratorFeed = await iterateNext({ node: forkEdge.destination, additionalChildNode, graphInstance })
//   yield* nodeIteratorFeed
// }

/**
 * Loops through node connection to traverse the connected nodes' graphs
 * @param {*} nodeConnectionArray - array of connection for the particular node
 * @yield { Object{node: <node data>} }
 */
async function* iterateNext({ node, additionalChildNode, graphInstance } = {}) {
  const { nextArray } = await graphInstance.databaseWrapper.getNext({ concreteDatabase: graphInstance.database, nodeID: node.identity })
  if (nextArray.length == 0) return

  // Bulk action - sort connection array - in addition to the database sorting of the query results.
  nextArray.sort((former, latter) => former.connection.properties?.order - latter.connection.properties?.order) // using `order` property

  for (let next of nextArray) {
    // deal with additional nodes
    let insertAdditional = additionalChildNode.reduce(
      (accumolator, additional, index, array) => {
        if (additional.placement.connectionKey == next.connection.properties.key) {
          // additional.placement.position is a string that can be 'before' | 'after'
          accumolator[additional.placement.position].push(additional.node) && delete array[index]
        }
        return accumolator
      },
      { before: [], after: [] },
    )
    additionalChildNode = additionalChildNode.filter(n => n) // filter empty (deleted) items

    // add additional nodes to current node and yield all sequentially.
    for (let nextNode of [...insertAdditional.before, next.destination, ...insertAdditional.after]) {
      yield { node: nextNode }
    }
  }
}
