// Conditions aggregator
export class ConditionAggregator {
  processResultArray: Array
  calculatedLogicalOperaion: Boolean // the result of the logical operation on the array values.

  // used in passing data to parent nodes for process use.
  get value() {
    return this.calculatedLogicalOperaion
  }

  // value for traversal depth 0
  get finalResult() {
    return this.processResultArray
  }

  constructor(initialValue: Array) {
    this.processResultArray = initialValue || []
    return this
  }

  // add item to aggregator
  add(item, aggregator = this) {
    aggregator.processResultArray.push(item) // add item regardless if it is a true boolean or false boolean, as it is needed to be checked by the logical operator.
  }

  // merge aggregators
  merge(additionalAggregatorArray: Aggregator, logicalOperator: 'and' | 'or') {
    let targetAggregator: Aggregator = this
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
