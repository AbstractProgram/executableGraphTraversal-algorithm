import promiseProperRace from '@dependency/promiseProperRace'
import { resolve } from 'path'
// import { iterateConnection } from './iterateConnection.js'

/**
 * Race promise of nodes - first to resolve is the one to be returned
 */
export async function* raceFirstPromise({ nodeIteratorFeed, emit }) {
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
}

/**
 * Insures all nodeConnection promises resolves.
 **/
export async function* allPromise({ nodeIteratorFeed, emit }) {
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
}

/**
 * Sequential node execution - await each node till it finishes execution.
 **/
export async function* chronological({ nodeIteratorFeed, emit }) {
  let nodeResultList = []
  for await (let nodeData of nodeIteratorFeed) {
    yield { node: nodeData }
    let { promise } = function.sent
    let nextResult = await promise
    emit(nextResult) // emit for immediate consumption
    nodeResultList.push(nextResult)
  }
  return nodeResultList
}

// implementation using while loop instead of `for await`, as it allows for passing initial config value for the generator function (that will use function.sent to catch it.)
export async function* chronological_implementationUsingWhileLoop({ nodeIteratorFeed, emit }) {
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
}
