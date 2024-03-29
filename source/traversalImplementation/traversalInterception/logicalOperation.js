import assert from 'assert'

// returns the process result of the root node, while returnning the aggregator for any nested nodes that will eventually be merged together through the Aggregator implementation. Used for CONFIGURE relationship with case switches.
export const traverseThenProcessWithLogicalOperator = targetFunction =>
  new Proxy(targetFunction, {
    async apply(target, thisArg, argArray) {
      let { traverserPosition, processDataCallback } = argArray[0]
      const { eventEmitter, depth, aggregator } = traverserPosition
      eventEmitter.on('nodeTraversalCompleted', data => {
        // console.log(data.value, ' resolved.')
      })

      if (traverserPosition.shouldContinue()) {
        let traversalResultIterator = await Reflect.apply(...arguments)
        for await (let traversal of traversalResultIterator) {
          let relatedPort = traversal.group.config.portNode
          assert(relatedPort.properties.logicalOperator, `• port (key="${relatedPort.properties.key}") must have "logicalOperator" property assigned, to aggregate results.`)
          // conditional comparison type to use for resolving boolean results.
          let logicalOperator = relatedPort.properties.logicalOperator
          aggregator.merge(traversal.group.result, traversal.group.config, logicalOperator)
        }
      }

      if (traverserPosition.shouldExecuteProcess()) {
        let processResult = await processDataCallback({ nextProcessData: aggregator.value, additionalParameter: {} })
        if (traverserPosition.shouldIncludeResult()) aggregator.add(processResult)
      }

      return depth == 0 ? aggregator.finalResult : aggregator // check if top level call and not an initiated nested recursive call.
    },
  })
