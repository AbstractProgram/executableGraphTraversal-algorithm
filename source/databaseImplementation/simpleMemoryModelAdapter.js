export function simpleMemoryModelAdapterFunction() {
  // Scope internal private data structure
  const nodeArray = [],
    connectionArray = []
  return {
    getAllNode: () => nodeArray,
    getAllConnection: () => connectionArray,
    // get query for Node document
    getByKey: async function({ key }) {
      let node = nodeArray.filter(value => value.key == key)[0]
      if (!node) throw new Error(`• node key "${key}" not found in array.`)
      return node
    },
    getConnectionByKey: async function({ key }) {
      let connection = connectionArray.filter(value => value.key == key)[0]
      if (!connection) throw new Error(`• connection key "${key}" not found in array.`)
      return connection
    },
  }
}
