// Aggregates graph traversal results
export class AggregatorArray {
  value: Array
  constructor(initialValue: Array) {
    this.value = initialValue || []
    return this
  }
  // add item to aggregator
  add(item, aggregator = this) {
    // filter null and undefined
    // if (!item) throw new Error(`• Returned undefined or null result of data processing.`)
    if (item) aggregator.value.push(item)
    // return aggregator.value.unshift(item) // insert at start
  }
  // merge aggregators
  merge(additionalAggregatorArray: [Aggregator], targetAggregator: Aggregator = this) {
    for (let additionalAggregator of additionalAggregatorArray) {
      targetAggregator.value = [...targetAggregator.value, ...additionalAggregator.value]
    }
    return targetAggregator
  }
}

export class ConditionCheck {
  value: Boolean
  constructor(initialValue) {
    this.value = initialValue || true // assume true till check fails.
    return this
  }
}

// Conditions aggregator
export class ConditionAggregator {
  processResultArray: Array
  calculatedLogicalOperaion: Boolean // the result of the logical operation on the array values.

  constructor(initialValue: Array) {
    this.processResultArray = initialValue || []
    return this
  }

  // add item to aggregator
  add(item, aggregator = this) {
    aggregator.processResultArray.push(item) // add item regardless if it is a true boolean or false boolean, as it is needed to be checked by the logical operator.
  }

  // merge aggregators
  merge(additionalAggregatorArray: Aggregator, targetAggregator: Aggregator = this, logicalOperator: 'and' | 'or') {
    if (!targetAggregator.calculatedLogicalOperaion) targetAggregator.calculateLogicalOperation(logicalOperator)
    // TODO: test if it works with multiple nested condition statges.
    for (let additionalAggregator of additionalAggregatorArray) {
      if (!additionalAggregator.calculatedLogicalOperaion) additionalAggregator.calculateLogicalOperation(logicalOperator)
      targetAggregator.calculatedLogicalOperaion = Boolean(additionalAggregator.calculatedLogicalOperaion) && Boolean(targetAggregator.calculatedLogicalOperaion)
    }
    return targetAggregator
  }

  calculateLogicalOperation(logicalOperator) {
    switch (logicalOperator) {
      case 'or':
        this.calculatedLogicalOperaion = this.processResultArray.some(item => Boolean(item))
        break
      case 'and':
      default:
        this.calculatedLogicalOperaion = this.processResultArray.every(item => Boolean(item))
        break
    }
  }
}
