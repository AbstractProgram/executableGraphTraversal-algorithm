// visiting each node before visiting it's child nodes.
// The middlewares that follow the Koa specification use next to call one another. In this case the nextFunction will be used instead, in which it controlls the propagation of nested traversal nodes.
export const handleMiddlewareNextCall = targetFunction =>
  new Proxy(targetFunction, {
    async apply(target, thisArg, argArray) {
      let { traverser, processDataCallback } = argArray[0]
      const { depth, aggregator } = traverser
      let nextCalled = false
      // A next function that will be used to compose in a sense the middlewares that are being executed during traversal. As middlewares relies on `next` function to chain the events.
      const nextFunction = async () => {
        nextCalled = true
        if (traverser.shouldContinue()) {
          let traversalIterator = await Reflect.apply(...arguments)
          for await (let traversal of traversalIterator) aggregator.merge(traversal.group.result)
        }
      }

      if (traverser.shouldExecuteProcess()) {
        let processResult = await processDataCallback({ nextProcessData: aggregator.value, additionalParameter: { nextFunction } })
        if (traverser.shouldIncludeResult()) aggregator.add(processResult)
      }

      if (!nextCalled) await nextFunction() // in some cases the data process returns without calling nextFunction (when it is a regular node, not a process intending to execute a middleware).

      return depth == 0 ? aggregator.value : aggregator // check if top level call and not an initiated nested recursive call.
    },
  })
