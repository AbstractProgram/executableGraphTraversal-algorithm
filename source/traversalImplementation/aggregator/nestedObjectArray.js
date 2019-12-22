// TODO: Aggregate for each node by insertion position - nested array aggregation
// export class AggregatorObjectOfArray {
//   value: Object
//   constructor(initialValue: Object) {
//     this.value = initialValue || {}
//     return this
//   }
//   // add item to aggregator
//   add(item, aggregator = this) {
//     if (item) aggregator.value.push(item)
//   }
//   // merge aggregators
//   merge(additionalAggregatorArray: [Aggregator], targetAggregator: Aggregator = this) {
//     for (let additionalAggregator of additionalAggregatorArray) {
//       targetAggregator.value = [...targetAggregator.value, ...additionalAggregator.value]
//     }
//     return targetAggregator
//   }
// }
