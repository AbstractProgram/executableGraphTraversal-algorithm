import assert from 'assert'

/*
  Immediately execute middleware
  The middleware graph is only responsible for chaining and executing middlewares, and not responsible for passing 'context' parameter. As the middlewares should be already parially applied or curried with context parameter outside graph traversal.
  Note: Check graphInterception method "handleMiddlewareNextCall"
*/
export const immediatelyExecuteMiddleware = async function({ stageNode, processNode, traverser = this, nextProcessData }, { additionalParameter, traverseCallContext }) {
  // TODO: previously dependent on external value `middlewareParameter`.
  assert(traverser.context.middlewareParameter, `• Middleware graph traversal relies on context.middlewareParameter on the traverser context instance`)

  const { nextFunction } = additionalParameter

  let functionCallback = await traverser::traverser.traverserInstruction.resourceResolution.resolveResource({ targetNode: processNode, contextPropertyName: 'functionReferenceContext' })

  try {
    // this function must receive only a single parameter "next", used for executing the middleware and succeeding the current middleware, when finished. The context is passed to the funciton externally by currying.
    // @param TraverserState <Object> - Passing a single traverser state, allows for easier changes/refactoring to be made.
    let middlewareExecution = await functionCallback({ node: processNode, traverser }) // expected to return a Koa middleware complying function.
    await middlewareExecution(nextFunction) // execute middleware
    return middlewareExecution // allow to aggregate middleware function for debugging purposes.
  } catch (error) {
    console.error(error) && process.exit()
  }
}
