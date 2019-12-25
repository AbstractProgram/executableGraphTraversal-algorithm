// Aggregates graph traversal results
export class AggregatorArray {
  // used in passing data to parent nodes for process use.
  value: Array
  constructor(initialValue: Array) {
    this.value = initialValue || []
    return this
  }

  // value for traversal depth 0
  get finalResult() {
    return this.value
  }

  // add item to aggregator
  add(item, aggregator = this) {
    // filter null and undefined
    // if (!item) throw new Error(`• Returned undefined or null result of data processing.`)
    if (item) aggregator.value.push(item)
    // return aggregator.value.unshift(item) // insert at start
  }
  // merge aggregators
  merge(additionalAggregatorArray: [Aggregator]) {
    let targetAggregator: Aggregator = this
    for (let additionalAggregator of additionalAggregatorArray) {
      targetAggregator.value = [...targetAggregator.value, ...additionalAggregator.value]
    }
    return targetAggregator
  }
}
