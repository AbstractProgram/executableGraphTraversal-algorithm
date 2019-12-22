import assert from 'assert'

// visiting each node before visiting it's child nodes.
export const processThenTraverse = targetFunction =>
  new Proxy(targetFunction, {
    async apply(target, thisArg, argArray) {
      let { traverser, processDataCallback } = argArray[0]
      const { eventEmitter, depth, aggregator } = traverser
      eventEmitter.on('nodeTraversalCompleted', data => {
        // console.log(data.value, ' resolved.')
      })

      if (traverser.shouldExecuteProcess()) {
        let processResult = await processDataCallback({ nextProcessData: aggregator.value, additionalParameter: {} })
        if (traverser.shouldIncludeResult()) aggregator.add(processResult)
      }

      if (traverser.shouldContinue()) {
        let traversalIterator = await Reflect.apply(...arguments)
        for await (let traversal of traversalIterator) aggregator.merge(traversal.group.result)
      }

      return depth == 0 ? aggregator.value : aggregator // check if top level call and not an initiated nested recursive call.
    },
  })

// vising the node after visiting the child nodes.
export const traverseThenProcess = targetFunction =>
  new Proxy(targetFunction, {
    async apply(target, thisArg, argArray) {
      let { traverser, processDataCallback } = argArray[0]
      const { eventEmitter, depth, aggregator } = traverser
      eventEmitter.on('nodeTraversalCompleted', data => {
        // console.log(data.value, ' resolved.')
      })

      if (traverser.shouldContinue()) {
        let traversalIterator = await Reflect.apply(...arguments)
        for await (let traversal of traversalIterator) aggregator.merge(traversal.group.result)
      }

      if (traverser.shouldExecuteProcess()) {
        let processResult = await processDataCallback({ nextProcessData: aggregator.value, additionalParameter: {} })
        if (traverser.shouldIncludeResult()) aggregator.add(processResult)
      }

      return depth == 0 ? aggregator.value : aggregator // check if top level call and not an initiated nested recursive call.
    },
  })
