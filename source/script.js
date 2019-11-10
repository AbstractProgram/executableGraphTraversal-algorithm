import assert from 'assert'
import { boltCypherModelAdapterFunction } from './databaseImplementation/boltCypherModelAdapter.js'
import { simpleMemoryModelAdapterFunction } from './databaseImplementation/simpleMemoryModelAdapter.js'
import { redisModelAdapterFunction } from './databaseImplementation/redisGraphModelAdapter.js'
// add all exported functions as implementations.
import * as aggregator from './traversalImplementation/aggregator.js'
import * as processData from './traversalImplementation/processData.js'
import * as handlePropagation from './traversalImplementation/handlePropagation.js'
import * as traverseNode from './traversalImplementation/traverseNode.js'
import * as traversalInterception from './traversalImplementation/traversalInterception.js'

export const  traversal = {
  traverseNode: traverseNode,
  handlePropagation: handlePropagation, // Port
  traversalInterception: traversalInterception, // Stage
  aggregator: aggregator,
  processData: processData, // Process
}

export const  database = {
  redisModelAdapterFunction,
  simpleMemoryModelAdapterFunction,
  boltCypherModelAdapterFunction
}