import assert from 'assert'

/*
  Immediately execute middleware
  Note: Check graphInterception method "handleMiddlewareNextCall"
*/
export const immediatelyExecuteMiddleware = async function({ stageNode, processNode, graph = this, nextProcessData }, { additionalParameter, traverseCallContext }) {
  const { nextFunction } = additionalParameter
  assert(graph.context.middlewareParameter?.context, `• Middleware graph traversal relies on context.middlewareParameter.context on the graph context instance`)

  let functionCallback = await graph.traverserInstruction.resourceResolution.resolveResource({ targetNode: processNode, graph, contextPropertyName: 'functionReferenceContext' })

  try {
    let middleware = await functionCallback({ node: processNode, graph }) // expected to return a Koa middleware complying function.
    let context = graph.context.middlewareParameter.context,
      next = nextFunction
    await middleware(context, next) // execute middleware
    return middleware // allow to aggregate middleware function for debugging purposes.
  } catch (error) {
    console.error(error) && process.exit()
  }
}
