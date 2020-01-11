export * from './scriptExecution.js'
export * from './middlewareExecution.js'
export * from './templateRendering.js'
export * from './schema.js'

import path from 'path'
import assert from 'assert'

export async function returnDataItemKey({ stageNode, processNode, traverser = this, nextProcessData }, { additionalParameter, traverseCallContext }) {
  if (processNode.properties?.name) return `${processNode.properties?.name}`
}

// implementation delays promises for testing `iterateConnection` of promises e.g. `allPromise`, `raceFirstPromise`, etc.
export async function timeout({ stageNode, processNode, traverser = this, nextProcessData }, { additionalParameter, traverseCallContext }) {
  if (typeof processNode.properties?.timerDelay != 'number') throw new Error('• DataItem must have a delay value.')
  let delay = processNode.properties?.timerDelay
  return await new Promise((resolve, reject) =>
    setTimeout(() => {
      // console.log(`${delay}ms passed for key ${processNode.key}.`) // debug
      resolve(processNode.properties?.name)
    }, delay),
  )
}

/**
 * Relies on function reference concept - where a function is called from the graph using a node property that holds it's name, and a context object passed to the graph traverser, holding the functions map.
 * `processData` implementation of `graphTraversal` module
 * execute functions through a string reference from the graph database that match the key of the application reference context object
 * Note: creating a similar implementation that would return only the functions is no different than returnning the names of the function, and then use the graph result array outside the traversal to retrieve the function references from an object.

Used for:
  - used for executing tasks and checks/conditions
  - Middleware:
    Approaches for middleware aggregation: 
    - Creates middleware array from graph-  The graph traversal @return {Array of Objects} where each object contains instruction settings to be used through an implementing module to add to a chain of middlewares. 
    - return middleware reference names, and then matching the names to function outside the traversal.
    - Executing generator functions with node arguments that produce middleware functions.
 */
export async function executeFunctionReference({ stageNode, processNode, traverser = this, nextProcessData }, { additionalParameter, traverseCallContext }) {
  let functionCallback = await traverser::traverser.traverserInstruction.resourceResolution.resolveResource({ targetNode: processNode, contextPropertyName: 'functionReferenceContext' })

  try {
    // Pass parameter object of traverserState
    return await functionCallback({ node: processNode, traverser, traverseCallContext })
  } catch (error) {
    console.error(error) && process.exit()
  }
}
