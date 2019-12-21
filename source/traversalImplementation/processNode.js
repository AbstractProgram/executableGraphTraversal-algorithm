import path from 'path'
import assert from 'assert'
import { exec, execSync, spawn, spawnSync } from 'child_process'

export async function returnDataItemKey({ stageNode, processNode, graph = this, nextProcessData }, { additionalParameter, traverseCallContext }) {
  if (processNode.properties?.name) return `${processNode.properties?.name}`
}

// implementation delays promises for testing `iterateConnection` of promises e.g. `allPromise`, `raceFirstPromise`, etc.
export async function timeout({ stageNode, processNode, graph = this, nextProcessData }, { additionalParameter, traverseCallContext }) {
  if (typeof processNode.properties?.timerDelay != 'number') throw new Error('• DataItem must have a delay value.')
  let delay = processNode.properties?.timerDelay
  return await new Promise((resolve, reject) =>
    setTimeout(() => {
      // console.log(`${delay}ms passed for key ${processNode.key}.`) // debug
      resolve(processNode.properties?.name)
    }, delay),
  )
}

/**
 * Relies on function reference concept - where a function is called from the graph using a node property that holds it's name, and a context object passed to the graph traverser, holding the functions map.
 * `processData` implementation of `graphTraversal` module
 * execute functions through a string reference from the graph database that match the key of the application reference context object
 * Note: creating a similar implementation that would return only the functions is no different than returnning the names of the function, and then use the graph result array outside the traversal to retrieve the function references from an object.

Used for:
  - used for executing tasks and checks/conditions
  - Middleware:
    Approaches for middleware aggregation: 
    - Creates middleware array from graph-  The graph traversal @return {Array of Objects} where each object contains instruction settings to be used through an implementing module to add to a chain of middlewares. 
    - return middleware reference names, and then matching the names to function outside the traversal.
    - Executing generator functions with node arguments that produce middleware functions.
 */
export async function executeFunctionReference({ stageNode, processNode, graph = this, nextProcessData }, { additionalParameter, traverseCallContext }) {
  let contextPropertyName = 'functionReferenceContext', // TODO: after migrating to own repository, use Symbols instead of string keys and export them for client usage.
    referenceContext = graph.context[contextPropertyName]
  assert(referenceContext, `• Context "${contextPropertyName}" variable is required to reference functions from graph database strings.`)

  let resource
  const { resourceArray } = await graph.databaseWrapper.getResource({ concreteDatabase: graph.database, nodeID: processNode.identity })
  if (resourceArray.length > 1) throw new Error(`• Multiple resource relationships are not supported for Process node.`)
  else if (resourceArray.length == 0) return
  else resource = resourceArray[0]

  assert(resource.source.labels.includes(graph.schemeReference.nodeLabel.function), `• Unsupported Node type for resource connection.`)
  let functionName = resource.source.properties.functionName || throw new Error(`• function resource must have a "functionName" - ${resource.source.properties.functionName}`)
  let functionCallback = referenceContext[functionName] || throw new Error(`• reference function name "${functionName}" doesn't exist.`)
  try {
    return await functionCallback({ node: processNode, context: graph.context, graph, traverseCallContext })
  } catch (error) {
    console.error(error) && process.exit()
  }
}

/*
 
   ____            _       _     _____                     _   _             
  / ___|  ___ _ __(_)_ __ | |_  | ____|_  _____  ___ _   _| |_(_) ___  _ __  
  \___ \ / __| '__| | '_ \| __| |  _| \ \/ / _ \/ __| | | | __| |/ _ \| '_ \ 
   ___) | (__| |  | | |_) | |_  | |___ >  <  __/ (__| |_| | |_| | (_) | | | |
  |____/ \___|_|  |_| .__/ \__| |_____/_/\_\___|\___|\__,_|\__|_|\___/|_| |_|
                    |_|                                                      
 Relies on function reference concept.
*/

// Execute task script in the same process (nodejs childprocess.execSync) using a reference scriptPath property.
export async function executeShellscriptFile({ stageNode, processNode, graph = this, nextProcessData }, { additionalParameter, traverseCallContext }) {
  let message = ` _____                          _        
  | ____|__  __ ___   ___  _   _ | |_  ___ 
  |  _|  \\ \\/ // _ \\ / __|| | | || __|/ _ \\
  | |___  >  <|  __/| (__ | |_| || |_|  __/    
  |_____|/_/\\_\\\\___| \\___| \\__,_| \\__|\\___|`
  let contextPropertyName = 'fileContext',
    referenceContext = graph.context[contextPropertyName]
  assert(referenceContext, `• Context "${contextPropertyName}" variable is required to reference functions from graph database strings.`)

  let resource
  const { resourceArray } = await graph.databaseWrapper.getResource({ concreteDatabase: graph.database, nodeID: processNode.identity })
  if (resourceArray.length > 1) throw new Error(`• Multiple resource relationships are not supported for Process node.`)
  else if (resourceArray.length == 0) return
  else resource = resourceArray[0]
  let scriptReferenceKey = resource.source.properties.referenceKey
  assert(scriptReferenceKey, `• resource File node (with key: ${resource.source.properties.key}) must have "referenceKey" property.`)

  try {
    console.log(message)
    let scriptPath = referenceContext[scriptReferenceKey]
    assert(scriptPath, `• referenceKey of File node (referenceKey = ${scriptReferenceKey}) was not found in the graph context: ${referenceContext} `)
    console.log(`\x1b[45m%s\x1b[0m`, `shellscript path: ${scriptPath}`)
    execSync(`sh ${scriptPath}`, { cwd: path.dirname(scriptPath), shell: true, stdio: ['inherit', 'inherit', 'inherit'] })
  } catch (error) {
    throw error
    process.exit(1)
  }
  // await new Promise(resolve => setTimeout(resolve, 500)) // wait x seconds before next script execution // important to prevent 'unable to re-open stdin' error between shells.
  return null
}

/**
  Run childprocess synchnolous spawn command: 
  Required properties on process node: 
  @param {String} command
  @param {String[]} argument
  @param {Json stringifies string} option
*/
export async function executeScriptSpawn({ stageNode, processNode, graph = this, nextProcessData }, { additionalParameter, traverseCallContext }) {
  let childProcess
  try {
    let command = processNode.properties.command,
      argument = processNode.properties.argument.join(' '),
      option = JSON.stringify(processNode.properties.option)
    console.log(`\x1b[45m%s\x1b[0m`, `${command} ${argument}`)
    childProcess = spawnSync(command, argument, option)
    if (childProcess.status > 0) throw childProcess.error
  } catch (error) {
    process.exit(childProcess.status)
  }
}

/*
   __  __ _     _     _ _                             
  |  \/  (_) __| | __| | | _____      ____ _ _ __ ___ 
  | |\/| | |/ _` |/ _` | |/ _ \ \ /\ / / _` | '__/ _ \
  | |  | | | (_| | (_| | |  __/\ V  V / (_| | | |  __/
  |_|  |_|_|\__,_|\__,_|_|\___| \_/\_/ \__,_|_|  \___|
  Immediately execute middleware
  Note: Check graphInterception method "handleMiddlewareNextCall"
*/
export const immediatelyExecuteMiddleware = async ({ stageNode, processNode, graph = this, nextProcessData }, { additionalParameter, traverseCallContext }) => {
  const { nextFunction } = additionalParameter
  let contextPropertyName = 'functionReferenceContext',
    referenceContext = graph.context[contextPropertyName]
  assert(referenceContext, `• Context "${contextPropertyName}" variable is required to reference functions from graph database strings.`)
  assert(graph.context.middlewareParameter?.context, `• Middleware graph traversal relies on context.middlewareParameter.context on the graph context instance`)

  let resource
  const { resourceArray } = await graph.databaseWrapper.getResource({ concreteDatabase: graph.database, nodeID: processNode.identity })
  if (resourceArray.length > 1) throw new Error(`• Multiple resource relationships are not supported for Process node.`)
  else if (resourceArray.length == 0) return
  else resource = resourceArray[0]

  assert(resource.source.labels.includes(graph.schemeReference.nodeLabel.function), `• Unsupported Node type for resource connection.`)
  let functionName = resource.source.properties.functionName || throw new Error(`• function resource must have a "functionName" - ${resource.source.properties.functionName}`)
  // a function that complies with graphTraversal processData implementation.
  let functionCallback = referenceContext[functionName] || throw new Error(`• reference function name "${functionName}" doesn't exist.`)
  try {
    let middleware = await functionCallback({ node: processNode }) // exprected to return a Koa middleware complying function.
    let context = graph.context.middlewareParameter.context,
      next = nextFunction
    await middleware(context, next) // execute middleware
    return middleware // allow to aggregate middleware function for debugging purposes.
  } catch (error) {
    console.error(error) && process.exit()
  }
}

/*
   _____                    _       _       
  |_   _|__ _ __ ___  _ __ | | __ _| |_ ___ 
    | |/ _ \ '_ ` _ \| '_ \| |/ _` | __/ _ \
    | |  __/ | | | | | |_) | | (_| | ||  __/
    |_|\___|_| |_| |_| .__/|_|\__,_|\__\___|
                     |_|                    
*/

/**
 * @return {String} String of rendered HTML document content.
 Underscore templating options - https://2ality.com/2012/06/underscore-templates.html

  1. traverse nested
  2. aggregate into nested arrays (by insertion position keys).
  3. render current node template with insetion position content.
  4. 

  Server-side template system (run-time substitution happens on the web server): 
    - Template resource: template file with insertion points.
    - Content resource (template parts): Argumnets passed to the parsed template function. 
    - Template engine/processing/rendening element/module: underscore.template 

  server-side javascript that is located in the templates, is executed. Rendering template requires an object of functions for each insetion position key.
  Where:
    - insert object functions are called and expect to return a string. Functions represent- the algorithms used to deal with content value and add it to the document in a specific position,
      which will receive the parameters that can change it's behavior. Using a function allows for creating specific logic for each insetion point.
    - Each insertion position is distinguished by the keys of the insert object. 
    - Content value (String | Array | Object) - which insert function is initialized with, and handles it. 

  // TODO: deal with post rendering processing algorithms, when required.
  // TODO: deal with wrapping layouts e.g. layoutElement: 'webapp-layout-list'
 */
export const templateRenderingWithInseritonPosition = async ({ stageNode, processNode, graph = this, nextProcessData }, { additionalParameter, traverseCallContext }) => {
  let context = graph.context.middlewareParameter.context
  assert(context.clientSidePath, "• clientSidePath cannot be undefined. i.e. previous middlewares should've set it")
  let templatePath = path.join(context.clientSidePath, node.filePath)

  return renderedContent
}

/*
   ____  _____ ____  ____  _____ ____    _  _____ _____ ____  
  |  _ \| ____|  _ \|  _ \| ____/ ___|  / \|_   _| ____|  _ \ 
  | | | |  _| | |_) | |_) |  _|| |     / _ \ | | |  _| | | | |
  | |_| | |___|  __/|  _ <| |__| |___ / ___ \| | | |___| |_| |
  |____/|_____|_|   |_| \_\_____\____/_/   \_\_| |_____|____/ 
  Requires refactoring and migration 
*/

/*
TODO: as there`z is an API Schema, a database schema can make content extremely dynamic. -Database schema is different from API Schema.         

   ___  ___| |__   ___ _ __ ___   __ _ 
  / __|/ __| '_ \ / _ \ '_ ` _ \ / _` |
  \__ \ (__| | | |  __/ | | | | | (_| |
  |___/\___|_| |_|\___|_| |_| |_|\__,_|
 API Schema
  (While the database models are separate in their own functions or could be exposed through a class module)

  - Resolver function = a function that returns data.
  - Data loader = module that aggregates duplicate calls. Solving the n+1 problem, where each query has a subsequent query, linear graph. To nodejs it uses nextTick function to analyse the promises before their execution and prevent multiple round trips to the server for the same data.
  - Mapping - through rosolver functions.
  - Schema = is the structure & relationships of the api data. i.e. defines how a client can fetch and update data.
      each schema has api entrypoints. Each field corresponds to a resolver function.
  Data fetching complexity and data structuring is handled by server side rather than client.

  3 types of possible api actions: 
  - Query
  - Mutation
  - Subscription - creates a steady connection with the server.

  Fetching approaches: 
  • Imperative fetching: 
      - constructs & sends HTTP request, e.g. using js fetch.
      - receive & parse server response.
      - store data locally, e.g. in memory or persistent. 
      - display UI.
  • Declarative fetching e.g. using GraphQL clients: 
      - Describe data requirements.
      - Display information in the UI.

  Request: 
  {
      action: query,
      entrypoint: {
          key: "Article"
      },
      function: {
          name: "single",
          args: {
              key: "article1"
          }
      },
      field: [
          {
              keyname: "title"
          },
          {
              keyname: "paragraph"
          },
          {
              keyname: "authors"
          },
      ]
  }

  Response :
  {
      data: {
          title: "...",
          paragraph: '...',
          author: {
              name: '...',
              age: 20
          }
      }
  }


  Nested Unit execution steps:  
• 
*/

let schema = () => {
  /**
   * Implementation type aggregateIntoContentArray
   */
  /* exmple request body: 
{
    "fieldName": "article",
    "field": [
        {
            "fieldName": "title",
            "field": []
        },
        {
            "fieldName": "paragraph",
            "field": []
        }
    ],
    "schemaMode": "nonStrict", // allow empty datasets for specified fields in the nested unit schema.
    "extrafield": true // includes fields that are not extracted using the schema.
} */
  // const { add, execute, conditional, executionLevel } = require('@dependency/commonPattern/source/decoratorUtility.js')
  function schema({ thisArg }) {
    // function wrapper to set thisArg on implementaion object functions.

    let self = {
      @executionLevel()
      async initializeNestedUnit({ nestedUnitKey, additionalChildNestedUnit = [], pathPointerKey = null, parent = this, argument = {} }) {
        // Entrypoint Instance
        // extract request data action arguments. arguments for a query/mutation/subscription.
        if (this.executionLevel == 'topLevel') {
          nestedUnitInstance.requestOption = this.portAppInstance.context.request.body
        } else {
          // child/nested
          let fieldArray = parent.requestOption.field // object array
          if ((fieldArray && fieldArray.length == 0) || !fieldArray) {
            nestedUnitInstance.requestOption = {} // continue to resolve dataset and all subsequent Nestedunits of nested dataset in case are objects.
          } else if (fieldArray) {
            nestedUnitInstance.requestOption = fieldArray.find(field => field.fieldName == unitInstance.fieldName) // where fieldNames match
          }
        }

        // check if fieldname exists in the request option, if not skip nested unit.
        if (!nestedUnitInstance.requestOption) return // fieldName was not specified in the parent nestedUnit, therefore skip its execution
        nestedUnitInstance.dataset = await unitInstance.resolveDataset({ parentResult: argument.dataset || parent.dataset })
        // TODO: Fix requestOption - i.e. above it is used to pass "field" option only.
        if (this.portAppInstance.context.request.body.schemaMode == 'nonStrict') {
          // Don't enforce strict schema, i.e. all nested children should exist.
          // if(nestedUnitInstance.dataset) nestedUnitInstance.dataset = null // TODO: throws error as next it is being used.
        } else {
          assert.notEqual(nestedUnitInstance.dataset, undefined, `• returned dataset cannot be undefined for fieldName: ${unitInstance.fieldName}.`)
        }

        // check type of dataset
        let datasetHandling
        if (Array.isArray(nestedUnitInstance.dataset) && nestedUnitInstance.children && nestedUnitInstance.children.length > 0) {
          // array
          datasetHandling = 'sequence'
        } else if (typeof nestedUnitInstance.dataset == 'object' && nestedUnitInstance.children && nestedUnitInstance.children.length > 0) {
          // object
          datasetHandling = 'nested'
        } else {
          // non-nested value
          datasetHandling = 'nonNested'
        }

        // handle array, object, or non-nested value
        let object = {} // formatted object with requested fields
        switch (datasetHandling) {
          case 'sequence':
            let promiseArray = nestedUnitInstance.dataset.map(document => {
              let argument = {}
              argument['dataset'] = document
              return nestedUnitInstance.loopInsertionPoint({ type: 'aggregateIntoContentArray', argument })
            })
            let subsequentDatasetArray = await Promise.all(promiseArray)
            object[unitInstance.fieldName] = subsequentDatasetArray.map((subsequentDataset, index) => {
              return this.formatDatasetOfNestedType({
                subsequentDataset,
                dataset: nestedUnitInstance.dataset[index],
                option: {
                  extrafield: nestedUnitInstance.requestOption.extrafield,
                },
              })
            })

            break
          case 'nested': // if field treated as an object with nested fields
            let subsequentDataset = await nestedUnitInstance.loopInsertionPoint({ type: 'aggregateIntoContentArray' })
            object[unitInstance.fieldName] = this.formatDatasetOfNestedType({
              subsequentDataset,
              dataset: nestedUnitInstance.dataset,
              option: {
                extrafield: nestedUnitInstance.requestOption.extrafield,
              },
            })

            break
          default:
          case 'nonNested':
            // looping over nested units can manipulate the data in a different way than regular aggregation into an array.
            object[unitInstance.fieldName] = nestedUnitInstance.dataset

            break
        }

        // deal with requested all fields without the field option where execution of subnestedunits is required to manipulate the data.

        return object
      },

      formatDatasetOfNestedType({ subsequentDataset, dataset, option }) {
        let object = {}
        subsequentDataset.forEach(field => {
          object = Object.assign(object, field)
        })
        if (option.extrafield) {
          // extrafield option
          object = Object.assign(dataset, object) // override subsequent fields and keep untracked fields.
        }
        return object
      },
    }

    Object.keys(self).forEach(function(key) {
      self[key] = self[key].bind(thisArg)
    }, {})
    return self
  }

  async function resolveDataset({
    parentResult = null,
    // this.args - nestedUnit args field.
  }) {
    // [2] require & check condition
    let dataset
    const algorithm = this.file.algorithm // resolver for dataset
    switch (
      algorithm.type // in order to choose how to handle the algorithm (as a module ? a file to be imported ?...)
    ) {
      case 'file':
      default:
        {
          let module = require(algorithm.path).default
          if (typeof module !== 'function') module = module.default // case es6 module loaded with require function (will load it as an object)
          let resolver = module() /*initial execute for setting parameter context.*/
          let resolverArgument = Object.assign(...[this.args, algorithm.argument].filter(Boolean)) // remove undefined/null/false objects before merging.
          dataset = await resolver({
            portClassInstance: this.portAppInstance, // contains also portClassInstance.context of the request.
            args: resolverArgument,
            parentResult, // parent dataset result.
          })
        }
        break
    }

    return dataset
  }
}
