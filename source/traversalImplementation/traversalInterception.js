import assert from 'assert'

// visiting each node before visiting it's child nodes.
// The middlewares that follow the Koa specification use next to call one another. In this case the nextFunction will be used instead, in which it controlls the propagation of nested traversal nodes.
export const handleMiddlewareNextCall = ({ dataProcessCallback, targetFunction, aggregator }) => {
  return new Proxy(targetFunction, {
    async apply(target, thisArg, argArray) {
      let { nodeInstance, traversalDepth, eventEmitter } = argArray[0]
      let nextCalled = false
      // A next function that will be used to compose in a sense the middlewares that are being executed during traversal. As middlewares relies on `next` function to chain the events.
      const nextFunction = async () => {
        nextCalled = true
        let traversalResultIterator = await Reflect.apply(...arguments)
        for await (let traversalResult of traversalResultIterator) aggregator.merge(traversalResult.result)
      }

      let result = await dataProcessCallback({ nextProcessData: aggregator.value, additionalParameter: { nextFunction } })
      if (!nextCalled) await nextFunction() // in some cases the data process returns without calling nextFunction (when it is a regular node, not a process intending to execute a middleware).

      return traversalDepth == 0 ? aggregator.value : aggregator // check if top level call and not an initiated nested recursive call.
    },
  })
}

// visiting each node before visiting it's child nodes.
export const processThenTraverse = ({ dataProcessCallback, targetFunction, aggregator }) => {
  return new Proxy(targetFunction, {
    async apply(target, thisArg, argArray) {
      let { nodeInstance, traversalDepth, eventEmitter } = argArray[0]
      eventEmitter.on('nodeTraversalCompleted', data => {
        // console.log(data.value, ' resolved.')
      })

      let result = await dataProcessCallback({ nextProcessData: aggregator.value, additionalParameter: {} })

      let traversalResultIterator = await Reflect.apply(...arguments)
      for await (let traversalResult of traversalResultIterator) aggregator.merge(traversalResult.result)

      return traversalDepth == 0 ? aggregator.value : aggregator // check if top level call and not an initiated nested recursive call.
    },
  })
}

// vising the node after visiting the child nodes.
export const traverseThenProcess = ({ dataProcessCallback, targetFunction, aggregator }) => {
  return new Proxy(targetFunction, {
    async apply(target, thisArg, argArray) {
      let { nodeInstance, traversalDepth, eventEmitter } = argArray[0]
      eventEmitter.on('nodeTraversalCompleted', data => {
        // console.log(data.value, ' resolved.')
      })

      let traversalResultIterator = await Reflect.apply(...arguments)
      for await (let traversalResult of traversalResultIterator) aggregator.merge(traversalResult.result)

      let result = await dataProcessCallback({ nextProcessData: aggregator.value, additionalParameter: {} })

      return traversalDepth == 0 ? aggregator.value : aggregator // check if top level call and not an initiated nested recursive call.
    },
  })
}

// returns the process result of the root node, while returnning the aggregator for any nested nodes that will eventually be merged together through the Aggregator implementation. Used for CONFIGURE relationship with case switches.
export const traverseThenProcessWithLogicalOperator = ({ dataProcessCallback, targetFunction, aggregator }) => {
  return new Proxy(targetFunction, {
    async apply(target, thisArg, argArray) {
      let { nodeInstance, traversalDepth, eventEmitter } = argArray[0]
      eventEmitter.on('nodeTraversalCompleted', data => {
        // console.log(data.value, ' resolved.')
      })

      let traversalResultIterator = await Reflect.apply(...arguments)
      for await (let traversalResult of traversalResultIterator) {
        let relatedPort = traversalResult.config.port
        assert(relatedPort.properties.logicalOperator, `• port (key="${relatedPort.properties.key}") must have "logicalOperator" property assigned, to aggregate results.`)
        // conditional comparison type to use for resolving boolean results.
        let logicalOperator = relatedPort.properties.logicalOperator
        aggregator.merge(traversalResult.result, undefined, logicalOperator)
      }

      let result = await dataProcessCallback({ nextProcessData: aggregator.calculatedLogicalOperaion, additionalParameter: {} })

      return traversalDepth == 0 ? [result] : aggregator // check if top level call and not an initiated nested recursive call.
    },
  })
}

// export const traverseThenProcessForSwitch = ({ dataProcessCallback, targetFunction, aggregator }) => {
//   return new Proxy(targetFunction, {
//     async apply(target, thisArg, argArray) {
//       let { nodeInstance, traversalDepth, eventEmitter } = argArray[0]

//       let traversalResultIterator = await Reflect.apply(...arguments)
//       for await (let traversalResult of traversalResultIterator) aggregator.merge(traversalResult.result)

//       let result = await dataProcessCallback({ nextProcessData: aggregator.value, additionalParameter: {} })

//       return traversalDepth == 0 ? aggregator.value : aggregator // check if top level call and not an initiated nested recursive call.
//     },
//   })
// }
