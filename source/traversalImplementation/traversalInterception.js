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

// returns the process result of the root node, while returnning the aggregator for any nested nodes that will eventually be merged together through the Aggregator implementation. Used for CONFIGURE relationship with case switches.
export const traverseThenProcessWithLogicalOperator = targetFunction =>
  new Proxy(targetFunction, {
    async apply(target, thisArg, argArray) {
      let { traverser, processDataCallback } = argArray[0]
      const { eventEmitter, depth, aggregator } = traverser
      eventEmitter.on('nodeTraversalCompleted', data => {
        // console.log(data.value, ' resolved.')
      })

      if (traverser.shouldContinue()) {
        let traversalIterator = await Reflect.apply(...arguments)
        for await (let traversal of traversalIterator) {
          let relatedPort = traversal.group.config.portNode
          assert(relatedPort.properties.logicalOperator, `• port (key="${relatedPort.properties.key}") must have "logicalOperator" property assigned, to aggregate results.`)
          // conditional comparison type to use for resolving boolean results.
          let logicalOperator = relatedPort.properties.logicalOperator
          aggregator.merge(traversal.group.result, undefined, logicalOperator)
        }
      }

      if (traverser.shouldExecuteProcess()) {
        let processResult = await processDataCallback({ nextProcessData: aggregator.calculatedLogicalOperaion, additionalParameter: {} })
        if (traverser.shouldIncludeResult()) aggregator.add(processResult)
      }

      return depth == 0 ? aggregator.processResultArray : aggregator // check if top level call and not an initiated nested recursive call.
    },
  })

//TODO:
// export const traverseThenProcessWithObjectOfArray =
