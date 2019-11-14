import promiseProperRace from '@dependency/promiseProperRace'
import { resolve } from 'path'
// import { iterateConnection } from './iterateConnection.js'

/**
 * Propagation Control - Handles the graph traversal propagation order
 * @yields a traversal configuration feed/iterator
 * @return results array
 **/
export async function* portNextImplementation({ forkEdge, additionalChildNode, graphInstance }) {
  let { eventEmitterCallback: emit } = function.sent
  let portNode = forkEdge.destination
  let handlePropagationFunctionName = portNode.properties.handlePropagationImplementation || 'chronological'

  let nodeIteratorFeed = await iterateNext({ node: forkEdge.destination, additionalChildNode, graphInstance })
  let traversalIteratorFeed = handlePropagationMethod[handlePropagationFunctionName]({ nodeIteratorFeed, emit }) // pass iterator to implementation and propagate back (through return statement) the results of the node promises after completion
  async function* trapAsyncIterator(iterator) {
    let iteratorResult = await iterator.next()
    while (!iteratorResult.done) {
      let traversalConfig = iteratorResult.value
      yield traversalConfig
      let { promise } = function.sent
      iteratorResult = await iterator.next({ promise })
    }
    return iteratorResult.value
  }
  return yield* trapAsyncIterator(traversalIteratorFeed)
}

/**
 * Loops through node connection to traverse the connected nodes' graphs
 * @param {*} nodeConnectionArray - array of connection for the particular node
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
      yield nextNode
    }
  }
}

/**
 * Controls the iteration over nodes and execution arrangement.
 */
const handlePropagationMethod = {
  /**
   * Race promise of nodes - first to resolve is the one to be returned
   */
  raceFirstPromise: async function*({ nodeIteratorFeed, emit }) {
    let g = { iterator: nodeIteratorFeed }
    g.result = await g.iterator.next() // initialize generator function execution and pass execution configurations.
    let nodePromiseArray = []
    while (!g.result.done) {
      let nodeData = g.result.value
      yield { node: nodeData }
      let { promise } = function.sent
      nodePromiseArray.push(promise)
      g.result = await g.iterator.next()
    }
    let nodeResolvedResult = await promiseProperRace(nodePromiseArray)
      .then(resolvedPromiseArray => {
        return resolvedPromiseArray[0] // as only one promise is return in the array - the first promise to be resolved.
      })
      .catch(error => {
        if (process.env.SZN_DEBUG == 'true') console.error(`🔀⚠️ promiseProperRace rejected because: ${error}`)
        else console.log(`🔀⚠️ promiseProperRace rejected because: ${error}`)
      })
    if (nodeResolvedResult) {
      emit(nodeResolvedResult) // emitting result is not immediate in this case, because the objective is to get a single resolved promise, and "promiseProperRace" maybe doesn't have the ability to stop uncompleted promises.
      return [nodeResolvedResult] // returned results must be wrapped in array so it could be forwarded through yeild* generator.
    }
  },

  /**
   * Insures all nodeConnection promises resolves.
   **/
  allPromise: async function*({ nodeIteratorFeed, emit }) {
    let g = { iterator: nodeIteratorFeed }
    g.result = await g.iterator.next() // initialize generator function execution and pass execution configurations.
    let nodePromiseArray = [] // order of call initialization
    let resolvedOrderedNodeResolvedResult = [] // order of completion
    while (!g.result.done) {
      let nodeData = g.result.value
      yield { node: nodeData }
      let { promise } = function.sent
      nodePromiseArray.push(promise) // promises are in the same arrangment of connection iteration.
      promise.then(result => emit(result)) // emit result for immediate usage by lisnters
      promise.then(result => resolvedOrderedNodeResolvedResult.push(result)) // arrange promises according to resolution order.
      g.result = await g.iterator.next()
    }
    // resolve all promises
    let nodeResolvedResultArray = await Promise.all(nodePromiseArray).catch(error => {
      if (process.env.SZN_DEBUG == 'true') console.error(`🔀⚠️ \`Promise.all\` for nodeConnectionArray rejected because: ${error}`)
      else console.log(error)
    })
    // ordered results according to promise completion.
    return resolvedOrderedNodeResolvedResult // return for all resolved results

    // Preserves the order of nodes original in connection array, i.e. does not order the node results according to the execution completion, rather according to the first visited during traversal.
    // for (let nextResult of nodeResolvedResultArray) {
    //   emit(nextResult)
    // }
  },

  /**
   * Sequential node execution - await each node till it finishes execution.
   **/
  chronological: async function*({ nodeIteratorFeed, emit }) {
    let nodeResultList = []
    for await (let nodeData of nodeIteratorFeed) {
      yield { node: nodeData }
      let { promise } = function.sent
      let nextResult = await promise
      emit(nextResult) // emit for immediate consumption
      nodeResultList.push(nextResult)
    }
    return nodeResultList
  },

  // implementation using while loop instead of `for await`, as it allows for passing initial config value for the generator function (that will use function.sent to catch it.)
  chronological_implementationUsingWhileLoop: async function*({ nodeIteratorFeed, emit }) {
    let nodeResultList = []
    let g = { iterator: nodeIteratorFeed }
    g.result = await g.iterator.next() // initialize generator function execution and pass execution configurations.
    while (!g.result.done) {
      let nodeData = g.result.value
      yield { node: nodeData }
      let { promise } = function.sent
      let nextResult = await promise
      emit(nextResult) // emit for immediate consumption
      nodeResultList.push(nextResult)
      g.result = await g.iterator.next()
    }
    return nodeResultList
  },
}
