import assert from 'assert'
import { boltCypherModelAdapterFunction } from './databaseImplementation/boltCypherModelAdapter.js'
import { simpleMemoryModelAdapterFunction } from './databaseImplementation/simpleMemoryModelAdapter.js'
import { redisModelAdapterFunction } from './databaseImplementation/redisGraphModelAdapter.js'
// add all exported functions as implementations.
import * as aggregator from './traversalImplementation/aggregator.js'
import * as processNode from './traversalImplementation/processNode.js'
import * as portNode from './traversalImplementation/portNode.js'
import * as traverseNode from './traversalImplementation/traverseNode.js'
import * as traversalInterception from './traversalImplementation/traversalInterception.js'

export const traversal = {
  traversalInterception: traversalInterception, // Stage
  aggregator: aggregator,
  portNode: portNode,
  processNode: processNode,
}

export const database = {
  redisModelAdapterFunction,
  simpleMemoryModelAdapterFunction,
  boltCypherModelAdapterFunction,
}
