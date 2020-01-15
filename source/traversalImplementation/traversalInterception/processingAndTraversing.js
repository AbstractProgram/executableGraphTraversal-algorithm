import assert from 'assert'

// visiting each node before visiting it's child nodes.
export const processThenTraverse = targetFunction =>
  new Proxy(targetFunction, {
    async apply(target, thisArg, argArray) {
      let { traverserPosition, processDataCallback } = argArray[0]
      const { eventEmitter, depth, aggregator } = traverserPosition
      eventEmitter.on('nodeTraversalCompleted', data => {
        // console.log(data.value, ' resolved.')
      })

      if (traverserPosition.shouldExecuteProcess()) {
        let processResult = await processDataCallback({ nextProcessData: aggregator.value, additionalParameter: {} })
        if (traverserPosition.shouldIncludeResult()) aggregator.add(processResult)
      }

      if (traverserPosition.shouldContinue()) {
        let traversalResultIterator = await Reflect.apply(...arguments)
        for await (let traversal of traversalResultIterator) aggregator.merge(traversal.group.result, traversal.group.config /**Pass the related port node data, in case required*/)
      }

      return depth == 0 ? aggregator.finalResult : aggregator // check if top level call and not an initiated nested recursive call.
    },
  })

// vising the node after visiting the child nodes.
export const traverseThenProcess = targetFunction =>
  new Proxy(targetFunction, {
    async apply(target, thisArg, argArray) {
      let { traverserPosition, processDataCallback } = argArray[0]
      const { eventEmitter, depth, aggregator } = traverserPosition
      eventEmitter.on('nodeTraversalCompleted', data => {
        // console.log(data.value, ' resolved.')
      })

      if (traverserPosition.shouldContinue()) {
        let traversalResultIterator = await Reflect.apply(...arguments)
        for await (let traversal of traversalResultIterator) aggregator.merge(traversal.group.result, traversal.group.config /**Pass the related port node data, in case required*/)
      }

      if (traverserPosition.shouldExecuteProcess()) {
        let processResult = await processDataCallback({ nextProcessData: aggregator.value, additionalParameter: {} })
        if (traverserPosition.shouldIncludeResult()) aggregator.add(processResult)
      }

      return depth == 0 ? aggregator.finalResult : aggregator // check if top level call and not an initiated nested recursive call.
    },
  })
