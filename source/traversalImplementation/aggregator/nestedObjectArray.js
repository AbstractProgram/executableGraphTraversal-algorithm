import assert from 'assert'

// Aggregate nested graph results by port group name/key.
export class AggregatorObjectOfArray {
  object: Object
  currentValue: any

  get value() {
    return this.object
  }
  // finalResult getter is used for returning result from the node with depth of 0, i.e. the final traversal result.
  get finalResult() {
    return this.currentValue
  }

  constructor(initialValue: Object) {
    this.object = initialValue || {}

    return this
  }

  // add item to aggregator
  add(item) {
    if (item) this.currentValue = item
  }

  // merge aggregators
  merge(additionalAggregatorArray: [Aggregator], groupConfig) {
    let targetAggregator: Aggregator = this
    let groupKey = groupConfig.portNode.properties.groupKey
    assert(groupKey, `• groupKey property must exist in the port node.`)

    // initialize groupKey property in the aggregator object
    targetAggregator.object[groupKey] ||= []

    for (let additionalAggregator of additionalAggregatorArray) {
      targetAggregator.object[groupKey] = [...targetAggregator.object[groupKey], additionalAggregator.currentValue]
    }

    return targetAggregator
  }
}
