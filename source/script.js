import assert from 'assert'
export * as modelAdapter from './databaseImplementation/boltCypherModelAdapter.js'
import * as aggregator from './aggregator.js'
import * as processData from './processData.js'
import * as handlePropagation from './handlePropagation.js'
import * as traverseNode from './traverseNode.js'
import * as traversalInterception from './traversalInterception.js'

export const implementation = {
  traversal: {
    traverseNode: traverseNode,
    handlePropagation: handlePropagation,
    traversalInterception: traversalInterception,
    aggregator: aggregator,
    processData: processData,
  }, 
  database: {
    boltCypherModelAdapterFunction
  }
}