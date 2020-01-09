// visiting each node before visiting it's child nodes.
// The middlewares that follow the Koa specification use next to call one another. In this case the nextFunction will be used instead, in which it controlls the propagation of nested traversal nodes.
export const handleMiddlewareNextCall = targetFunction =>
  new Proxy(targetFunction, {
    async apply(target, thisArg, argArray) {
      let { traverser, processDataCallback } = argArray[0]
      const { depth, aggregator } = traverser

      let nextCalled = false
      /* A next function that will be used to compose in a sense the middlewares that are being executed during traversal. As middlewares relies on `next` function to chain the events.
        Note: supports the Downstream & Upstream execution of middlewares - where: 
            - Middlewares wait for the next middleware to in the chain to finish execution.
            - Middlewares can choose to hult the downstream of the execution chain by not calling "next" function.
      */
      const nextFunction = async () => {
        nextCalled = true
        if (traverser.shouldContinue()) {
          // "traverseGroupIterationRecursiveCall" execution
          let traversalIterator = await Reflect.apply(...arguments)
          for await (let traversal of traversalIterator) aggregator.merge(traversal.group.result, traversal.group.config /**Pass the related port node data, in case required*/)
        }
      }

      // Middleware execution should invoke next function and wait for child nodes and next nodes to finish execution, in order to mimic the actual middleware down & up stream behavior.
      let processResult
      if (traverser.shouldExecuteProcess()) {
        processResult = await processDataCallback({ nextProcessData: aggregator.value, additionalParameter: { nextFunction } })
        if (traverser.shouldIncludeResult()) aggregator.add(processResult)
      }

      // console.log(`${traverser.node.properties.key.substring(0, 2)} BEFORE NEXT`)
      // Note: Take into consideration stages with no middleware processes and on other hand, middlewares that do not call `next` function.
      // if the processResult is null, i.e. no process was executed in the current stage.
      if (!nextCalled && !processResult) await nextFunction() // in some cases the data process returns without calling nextFunction (when it is a regular node, not a process intending to execute a middleware).
      // console.log(`${traverser.node.properties.key.substring(0, 2)} AFTER NEXT`)

      return depth == 0 ? aggregator.finalResult : aggregator // check if top level call and not an initiated nested recursive call.
    },
  })
