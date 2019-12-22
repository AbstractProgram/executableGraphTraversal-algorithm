import assert from 'assert'
import { boltCypherModelAdapterFunction } from './databaseImplementation/boltCypherModelAdapter.js'
import { simpleMemoryModelAdapterFunction } from './databaseImplementation/simpleMemoryModelAdapter.js'
import { redisModelAdapterFunction } from './databaseImplementation/redisGraphModelAdapter.js'
// add all exported functions as implementations.
import * as aggregator from './traversalImplementation/aggregator'
import * as processNode from './traversalImplementation/processNode'
import * as portNode from './traversalImplementation/portNode'
import * as traversalInterception from './traversalImplementation/traversalInterception'

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
