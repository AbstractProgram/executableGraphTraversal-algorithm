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
