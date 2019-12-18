"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.returnDataItemKey = returnDataItemKey;exports.timeout = timeout;exports.executeFunctionReference = executeFunctionReference;exports.executeShellscriptFile = executeShellscriptFile;exports.executeScriptSpawn = executeScriptSpawn;exports.templateRenderingWithInseritonPosition = exports.immediatelyExecuteMiddleware = void 0;var _applyDecoratedDescriptor2 = _interopRequireDefault(require("@babel/runtime/helpers/applyDecoratedDescriptor"));var _path = _interopRequireDefault(require("path"));
var _assert = _interopRequireDefault(require("assert"));
var _child_process = require("child_process");

async function returnDataItemKey({ stageNode, processNode, graphInstance, nextProcessData }, { additionalParameter, traverseCallContext }) {var _processNode$properti, _processNode$properti2;
  if ((_processNode$properti = processNode.properties) === null || _processNode$properti === void 0 ? void 0 : _processNode$properti.name) return `${(_processNode$properti2 = processNode.properties) === null || _processNode$properti2 === void 0 ? void 0 : _processNode$properti2.name}`;
}


async function timeout({ stageNode, processNode, graphInstance, nextProcessData }, { additionalParameter, traverseCallContext }) {var _processNode$properti3, _processNode$properti4;
  if (typeof ((_processNode$properti3 = processNode.properties) === null || _processNode$properti3 === void 0 ? void 0 : _processNode$properti3.timerDelay) != 'number') throw new Error('• DataItem must have a delay value.');
  let delay = (_processNode$properti4 = processNode.properties) === null || _processNode$properti4 === void 0 ? void 0 : _processNode$properti4.timerDelay;
  return await new Promise((resolve, reject) =>
  setTimeout(() => {var _processNode$properti5;

    resolve((_processNode$properti5 = processNode.properties) === null || _processNode$properti5 === void 0 ? void 0 : _processNode$properti5.name);
  }, delay));

}















async function executeFunctionReference({ stageNode, processNode, graphInstance, nextProcessData }, { additionalParameter, traverseCallContext }) {
  let contextPropertyName = 'functionReferenceContext',
  referenceContext = graphInstance.context[contextPropertyName];
  (0, _assert.default)(referenceContext, `• Context "${contextPropertyName}" variable is required to reference functions from graph database strings.`);

  let resource;
  const { resourceArray } = await graphInstance.databaseWrapper.getResource({ concreteDatabase: graphInstance.database, nodeID: processNode.identity });
  if (resourceArray.length > 1) throw new Error(`• Multiple resource relationships are not supported for Process node.`);else
  if (resourceArray.length == 0) return;else
  resource = resourceArray[0];

  (0, _assert.default)(resource.source.labels.includes(graphInstance.schemeReference.nodeLabel.function), `• Unsupported Node type for resource connection.`);
  let functionName = resource.source.properties.functionName || function (e) {throw e;}(new Error(`• function resource must have a "functionName" - ${resource.source.properties.functionName}`));
  let functionCallback = referenceContext[functionName] || function (e) {throw e;}(new Error(`• reference function name "${functionName}" doesn't exist.`));
  try {
    return await functionCallback({ node: processNode, context: graphInstance.context, graphInstance, traverseCallContext });
  } catch (error) {
    console.error(error) && process.exit();
  }
}













async function executeShellscriptFile({ stageNode, processNode, graphInstance, nextProcessData }, { additionalParameter, traverseCallContext }) {
  let message = ` _____                          _        
  | ____|__  __ ___   ___  _   _ | |_  ___ 
  |  _|  \\ \\/ // _ \\ / __|| | | || __|/ _ \\
  | |___  >  <|  __/| (__ | |_| || |_|  __/    
  |_____|/_/\\_\\\\___| \\___| \\__,_| \\__|\\___|`;
  let contextPropertyName = 'fileContext',
  referenceContext = graphInstance.context[contextPropertyName];
  (0, _assert.default)(referenceContext, `• Context "${contextPropertyName}" variable is required to reference functions from graph database strings.`);

  let resource;
  const { resourceArray } = await graphInstance.databaseWrapper.getResource({ concreteDatabase: graphInstance.database, nodeID: processNode.identity });
  if (resourceArray.length > 1) throw new Error(`• Multiple resource relationships are not supported for Process node.`);else
  if (resourceArray.length == 0) return;else
  resource = resourceArray[0];
  let scriptReferenceKey = resource.source.properties.referenceKey;
  (0, _assert.default)(scriptReferenceKey, `• resource File node (with key: ${resource.source.properties.key}) must have "referenceKey" property.`);

  try {
    console.log(message);
    let scriptPath = referenceContext[scriptReferenceKey];
    (0, _assert.default)(scriptPath, `• referenceKey of File node (referenceKey = ${scriptReferenceKey}) was not found in the graphInstance context: ${referenceContext} `);
    console.log(`\x1b[45m%s\x1b[0m`, `shellscript path: ${scriptPath}`);
    (0, _child_process.execSync)(`sh ${scriptPath}`, { cwd: _path.default.dirname(scriptPath), shell: true, stdio: ['inherit', 'inherit', 'inherit'] });
  } catch (error) {
    throw error;
    process.exit(1);
  }

  return null;
}








async function executeScriptSpawn({ stageNode, processNode, graphInstance, nextProcessData }, { additionalParameter, traverseCallContext }) {
  let childProcess;
  try {
    let command = processNode.properties.command,
    argument = processNode.properties.argument.join(' '),
    option = JSON.stringify(processNode.properties.option);
    console.log(`\x1b[45m%s\x1b[0m`, `${command} ${argument}`);
    childProcess = (0, _child_process.spawnSync)(command, argument, option);
    if (childProcess.status > 0) throw childProcess.error;
  } catch (error) {
    process.exit(childProcess.status);
  }
}










const immediatelyExecuteMiddleware = async ({ stageNode, processNode, graphInstance, nextProcessData }, { additionalParameter, traverseCallContext }) => {var _graphInstance$contex;
  const { nextFunction } = additionalParameter;
  let contextPropertyName = 'functionReferenceContext',
  referenceContext = graphInstance.context[contextPropertyName];
  (0, _assert.default)(referenceContext, `• Context "${contextPropertyName}" variable is required to reference functions from graph database strings.`);
  (0, _assert.default)((_graphInstance$contex = graphInstance.context.middlewareParameter) === null || _graphInstance$contex === void 0 ? void 0 : _graphInstance$contex.context, `• Middleware graph traversal relies on context.middlewareParameter.context on the graph context instance`);

  let resource;
  const { resourceArray } = await graphInstance.databaseWrapper.getResource({ concreteDatabase: graphInstance.database, nodeID: processNode.identity });
  if (resourceArray.length > 1) throw new Error(`• Multiple resource relationships are not supported for Process node.`);else
  if (resourceArray.length == 0) return;else
  resource = resourceArray[0];

  (0, _assert.default)(resource.source.labels.includes(graphInstance.schemeReference.nodeLabel.function), `• Unsupported Node type for resource connection.`);
  let functionName = resource.source.properties.functionName || function (e) {throw e;}(new Error(`• function resource must have a "functionName" - ${resource.source.properties.functionName}`));

  let functionCallback = referenceContext[functionName] || function (e) {throw e;}(new Error(`• reference function name "${functionName}" doesn't exist.`));
  try {
    let middleware = await functionCallback({ node: processNode });
    let context = graphInstance.context.middlewareParameter.context,
    next = nextFunction;
    await middleware(context, next);
    return middleware;
  } catch (error) {
    console.error(error) && process.exit();
  }
};exports.immediatelyExecuteMiddleware = immediatelyExecuteMiddleware;


































const templateRenderingWithInseritonPosition = async ({ stageNode, processNode, graphInstance, nextProcessData }, { additionalParameter, traverseCallContext }) => {
  let context = graphInstance.context.middlewareParameter.context;
  (0, _assert.default)(context.clientSidePath, "• clientSidePath cannot be undefined. i.e. previous middlewares should've set it");
  let templatePath = _path.default.join(context.clientSidePath, node.filePath);

  return renderedContent;
};exports.templateRenderingWithInseritonPosition = templateRenderingWithInseritonPosition;




















































































let schema = () => {




















  function schema({ thisArg }) {var _dec, _obj;


    let self = (_dec =
    executionLevel(), (_obj = {
      async initializeNestedUnit({ nestedUnitKey, additionalChildNestedUnit = [], pathPointerKey = null, parent = this, argument = {} }) {


        if (this.executionLevel == 'topLevel') {
          nestedUnitInstance.requestOption = this.portAppInstance.context.request.body;
        } else {

          let fieldArray = parent.requestOption.field;
          if (fieldArray && fieldArray.length == 0 || !fieldArray) {
            nestedUnitInstance.requestOption = {};
          } else if (fieldArray) {
            nestedUnitInstance.requestOption = fieldArray.find(field => field.fieldName == unitInstance.fieldName);
          }
        }


        if (!nestedUnitInstance.requestOption) return;
        nestedUnitInstance.dataset = await unitInstance.resolveDataset({ parentResult: argument.dataset || parent.dataset });

        if (this.portAppInstance.context.request.body.schemaMode == 'nonStrict') {


        } else {
          _assert.default.notEqual(nestedUnitInstance.dataset, undefined, `• returned dataset cannot be undefined for fieldName: ${unitInstance.fieldName}.`);
        }


        let datasetHandling;
        if (Array.isArray(nestedUnitInstance.dataset) && nestedUnitInstance.children && nestedUnitInstance.children.length > 0) {

          datasetHandling = 'sequence';
        } else if (typeof nestedUnitInstance.dataset == 'object' && nestedUnitInstance.children && nestedUnitInstance.children.length > 0) {

          datasetHandling = 'nested';
        } else {

          datasetHandling = 'nonNested';
        }


        let object = {};
        switch (datasetHandling) {
          case 'sequence':
            let promiseArray = nestedUnitInstance.dataset.map(document => {
              let argument = {};
              argument['dataset'] = document;
              return nestedUnitInstance.loopInsertionPoint({ type: 'aggregateIntoContentArray', argument });
            });
            let subsequentDatasetArray = await Promise.all(promiseArray);
            object[unitInstance.fieldName] = subsequentDatasetArray.map((subsequentDataset, index) => {
              return this.formatDatasetOfNestedType({
                subsequentDataset,
                dataset: nestedUnitInstance.dataset[index],
                option: {
                  extrafield: nestedUnitInstance.requestOption.extrafield } });


            });

            break;
          case 'nested':
            let subsequentDataset = await nestedUnitInstance.loopInsertionPoint({ type: 'aggregateIntoContentArray' });
            object[unitInstance.fieldName] = this.formatDatasetOfNestedType({
              subsequentDataset,
              dataset: nestedUnitInstance.dataset,
              option: {
                extrafield: nestedUnitInstance.requestOption.extrafield } });



            break;
          default:
          case 'nonNested':

            object[unitInstance.fieldName] = nestedUnitInstance.dataset;

            break;}




        return object;
      },

      formatDatasetOfNestedType({ subsequentDataset, dataset, option }) {
        let object = {};
        subsequentDataset.forEach(field => {
          object = Object.assign(object, field);
        });
        if (option.extrafield) {

          object = Object.assign(dataset, object);
        }
        return object;
      } }, ((0, _applyDecoratedDescriptor2.default)(_obj, "initializeNestedUnit", [_dec], Object.getOwnPropertyDescriptor(_obj, "initializeNestedUnit"), _obj)), _obj));


    Object.keys(self).forEach(function (key) {
      self[key] = self[key].bind(thisArg);
    }, {});
    return self;
  }

  async function resolveDataset({
    parentResult = null })

  {

    let dataset;
    const algorithm = this.file.algorithm;
    switch (
    algorithm.type) {

      case 'file':
      default:
        {
          let module = require(algorithm.path).default;
          if (typeof module !== 'function') module = module.default;
          let resolver = module();
          let resolverArgument = Object.assign(...[this.args, algorithm.argument].filter(Boolean));
          dataset = await resolver({
            portClassInstance: this.portAppInstance,
            args: resolverArgument,
            parentResult });

        }
        break;}


    return dataset;
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NvdXJjZS90cmF2ZXJzYWxJbXBsZW1lbnRhdGlvbi9wcm9jZXNzTm9kZS5qcyJdLCJuYW1lcyI6WyJyZXR1cm5EYXRhSXRlbUtleSIsInN0YWdlTm9kZSIsInByb2Nlc3NOb2RlIiwiZ3JhcGhJbnN0YW5jZSIsIm5leHRQcm9jZXNzRGF0YSIsImFkZGl0aW9uYWxQYXJhbWV0ZXIiLCJ0cmF2ZXJzZUNhbGxDb250ZXh0IiwicHJvcGVydGllcyIsIm5hbWUiLCJ0aW1lb3V0IiwidGltZXJEZWxheSIsIkVycm9yIiwiZGVsYXkiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInNldFRpbWVvdXQiLCJleGVjdXRlRnVuY3Rpb25SZWZlcmVuY2UiLCJjb250ZXh0UHJvcGVydHlOYW1lIiwicmVmZXJlbmNlQ29udGV4dCIsImNvbnRleHQiLCJyZXNvdXJjZSIsInJlc291cmNlQXJyYXkiLCJkYXRhYmFzZVdyYXBwZXIiLCJnZXRSZXNvdXJjZSIsImNvbmNyZXRlRGF0YWJhc2UiLCJkYXRhYmFzZSIsIm5vZGVJRCIsImlkZW50aXR5IiwibGVuZ3RoIiwic291cmNlIiwibGFiZWxzIiwiaW5jbHVkZXMiLCJzY2hlbWVSZWZlcmVuY2UiLCJub2RlTGFiZWwiLCJmdW5jdGlvbiIsImZ1bmN0aW9uTmFtZSIsImZ1bmN0aW9uQ2FsbGJhY2siLCJub2RlIiwiZXJyb3IiLCJjb25zb2xlIiwicHJvY2VzcyIsImV4aXQiLCJleGVjdXRlU2hlbGxzY3JpcHRGaWxlIiwibWVzc2FnZSIsInNjcmlwdFJlZmVyZW5jZUtleSIsInJlZmVyZW5jZUtleSIsImtleSIsImxvZyIsInNjcmlwdFBhdGgiLCJjd2QiLCJwYXRoIiwiZGlybmFtZSIsInNoZWxsIiwic3RkaW8iLCJleGVjdXRlU2NyaXB0U3Bhd24iLCJjaGlsZFByb2Nlc3MiLCJjb21tYW5kIiwiYXJndW1lbnQiLCJqb2luIiwib3B0aW9uIiwiSlNPTiIsInN0cmluZ2lmeSIsInN0YXR1cyIsImltbWVkaWF0ZWx5RXhlY3V0ZU1pZGRsZXdhcmUiLCJuZXh0RnVuY3Rpb24iLCJtaWRkbGV3YXJlUGFyYW1ldGVyIiwibWlkZGxld2FyZSIsIm5leHQiLCJ0ZW1wbGF0ZVJlbmRlcmluZ1dpdGhJbnNlcml0b25Qb3NpdGlvbiIsImNsaWVudFNpZGVQYXRoIiwidGVtcGxhdGVQYXRoIiwiZmlsZVBhdGgiLCJyZW5kZXJlZENvbnRlbnQiLCJzY2hlbWEiLCJ0aGlzQXJnIiwic2VsZiIsImV4ZWN1dGlvbkxldmVsIiwiaW5pdGlhbGl6ZU5lc3RlZFVuaXQiLCJuZXN0ZWRVbml0S2V5IiwiYWRkaXRpb25hbENoaWxkTmVzdGVkVW5pdCIsInBhdGhQb2ludGVyS2V5IiwicGFyZW50IiwibmVzdGVkVW5pdEluc3RhbmNlIiwicmVxdWVzdE9wdGlvbiIsInBvcnRBcHBJbnN0YW5jZSIsInJlcXVlc3QiLCJib2R5IiwiZmllbGRBcnJheSIsImZpZWxkIiwiZmluZCIsImZpZWxkTmFtZSIsInVuaXRJbnN0YW5jZSIsImRhdGFzZXQiLCJyZXNvbHZlRGF0YXNldCIsInBhcmVudFJlc3VsdCIsInNjaGVtYU1vZGUiLCJhc3NlcnQiLCJub3RFcXVhbCIsInVuZGVmaW5lZCIsImRhdGFzZXRIYW5kbGluZyIsIkFycmF5IiwiaXNBcnJheSIsImNoaWxkcmVuIiwib2JqZWN0IiwicHJvbWlzZUFycmF5IiwibWFwIiwiZG9jdW1lbnQiLCJsb29wSW5zZXJ0aW9uUG9pbnQiLCJ0eXBlIiwic3Vic2VxdWVudERhdGFzZXRBcnJheSIsImFsbCIsInN1YnNlcXVlbnREYXRhc2V0IiwiaW5kZXgiLCJmb3JtYXREYXRhc2V0T2ZOZXN0ZWRUeXBlIiwiZXh0cmFmaWVsZCIsImZvckVhY2giLCJPYmplY3QiLCJhc3NpZ24iLCJrZXlzIiwiYmluZCIsImFsZ29yaXRobSIsImZpbGUiLCJtb2R1bGUiLCJyZXF1aXJlIiwiZGVmYXVsdCIsInJlc29sdmVyIiwicmVzb2x2ZXJBcmd1bWVudCIsImFyZ3MiLCJmaWx0ZXIiLCJCb29sZWFuIiwicG9y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aUJBQWlCLEVBQUUsS0FBSzlDLGVBREQ7QUFFdkIyQyxZQUFBQSxJQUFJLEVBQUVELGdCQUZpQjtBQUd2QmhDLFlBQUFBLFlBSHVCLEVBQUQsQ0FBeEI7O0FBS0Q7QUFDRCxjQWhCSjs7O0FBbUJBLFdBQU9GLE9BQVA7QUFDRDtBQUNGLENBN0pEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0J1xuaW1wb3J0IHsgZXhlYywgZXhlY1N5bmMsIHNwYXduLCBzcGF3blN5bmMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJ1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmV0dXJuRGF0YUl0ZW1LZXkoeyBzdGFnZU5vZGUsIHByb2Nlc3NOb2RlLCBncmFwaEluc3RhbmNlLCBuZXh0UHJvY2Vzc0RhdGEgfSwgeyBhZGRpdGlvbmFsUGFyYW1ldGVyLCB0cmF2ZXJzZUNhbGxDb250ZXh0IH0pIHtcbiAgaWYgKHByb2Nlc3NOb2RlLnByb3BlcnRpZXM/Lm5hbWUpIHJldHVybiBgJHtwcm9jZXNzTm9kZS5wcm9wZXJ0aWVzPy5uYW1lfWBcbn1cblxuLy8gaW1wbGVtZW50YXRpb24gZGVsYXlzIHByb21pc2VzIGZvciB0ZXN0aW5nIGBpdGVyYXRlQ29ubmVjdGlvbmAgb2YgcHJvbWlzZXMgZS5nLiBgYWxsUHJvbWlzZWAsIGByYWNlRmlyc3RQcm9taXNlYCwgZXRjLlxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRpbWVvdXQoeyBzdGFnZU5vZGUsIHByb2Nlc3NOb2RlLCBncmFwaEluc3RhbmNlLCBuZXh0UHJvY2Vzc0RhdGEgfSwgeyBhZGRpdGlvbmFsUGFyYW1ldGVyLCB0cmF2ZXJzZUNhbGxDb250ZXh0IH0pIHtcbiAgaWYgKHR5cGVvZiBwcm9jZXNzTm9kZS5wcm9wZXJ0aWVzPy50aW1lckRlbGF5ICE9ICdudW1iZXInKSB0aHJvdyBuZXcgRXJyb3IoJ+KAoiBEYXRhSXRlbSBtdXN0IGhhdmUgYSBkZWxheSB2YWx1ZS4nKVxuICBsZXQgZGVsYXkgPSBwcm9jZXNzTm9kZS5wcm9wZXJ0aWVzPy50aW1lckRlbGF5XG4gIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgLy8gY29uc29sZS5sb2coYCR7ZGVsYXl9bXMgcGFzc2VkIGZvciBrZXkgJHtwcm9jZXNzTm9kZS5rZXl9LmApIC8vIGRlYnVnXG4gICAgICByZXNvbHZlKHByb2Nlc3NOb2RlLnByb3BlcnRpZXM/Lm5hbWUpXG4gICAgfSwgZGVsYXkpLFxuICApXG59XG5cbi8qKlxuICogUmVsaWVzIG9uIGZ1bmN0aW9uIHJlZmVyZW5jZSBjb25jZXB0IC0gd2hlcmUgYSBmdW5jdGlvbiBpcyBjYWxsZWQgZnJvbSB0aGUgZ3JhcGggdXNpbmcgYSBub2RlIHByb3BlcnR5IHRoYXQgaG9sZHMgaXQncyBuYW1lLCBhbmQgYSBjb250ZXh0IG9iamVjdCBwYXNzZWQgdG8gdGhlIGdyYXBoIHRyYXZlcnNlciwgaG9sZGluZyB0aGUgZnVuY3Rpb25zIG1hcC5cbiAqIGBwcm9jZXNzRGF0YWAgaW1wbGVtZW50YXRpb24gb2YgYGdyYXBoVHJhdmVyc2FsYCBtb2R1bGVcbiAqIGV4ZWN1dGUgZnVuY3Rpb25zIHRocm91Z2ggYSBzdHJpbmcgcmVmZXJlbmNlIGZyb20gdGhlIGdyYXBoIGRhdGFiYXNlIHRoYXQgbWF0Y2ggdGhlIGtleSBvZiB0aGUgYXBwbGljYXRpb24gcmVmZXJlbmNlIGNvbnRleHQgb2JqZWN0XG4gKiBOb3RlOiBjcmVhdGluZyBhIHNpbWlsYXIgaW1wbGVtZW50YXRpb24gdGhhdCB3b3VsZCByZXR1cm4gb25seSB0aGUgZnVuY3Rpb25zIGlzIG5vIGRpZmZlcmVudCB0aGFuIHJldHVybm5pbmcgdGhlIG5hbWVzIG9mIHRoZSBmdW5jdGlvbiwgYW5kIHRoZW4gdXNlIHRoZSBncmFwaCByZXN1bHQgYXJyYXkgb3V0c2lkZSB0aGUgdHJhdmVyc2FsIHRvIHJldHJpZXZlIHRoZSBmdW5jdGlvbiByZWZlcmVuY2VzIGZyb20gYW4gb2JqZWN0LlxuXG5Vc2VkIGZvcjpcbiAgLSB1c2VkIGZvciBleGVjdXRpbmcgdGFza3MgYW5kIGNoZWNrcy9jb25kaXRpb25zXG4gIC0gTWlkZGxld2FyZTpcbiAgICBBcHByb2FjaGVzIGZvciBtaWRkbGV3YXJlIGFnZ3JlZ2F0aW9uOiBcbiAgICAtIENyZWF0ZXMgbWlkZGxld2FyZSBhcnJheSBmcm9tIGdyYXBoLSAgVGhlIGdyYXBoIHRyYXZlcnNhbCBAcmV0dXJuIHtBcnJheSBvZiBPYmplY3RzfSB3aGVyZSBlYWNoIG9iamVjdCBjb250YWlucyBpbnN0cnVjdGlvbiBzZXR0aW5ncyB0byBiZSB1c2VkIHRocm91Z2ggYW4gaW1wbGVtZW50aW5nIG1vZHVsZSB0byBhZGQgdG8gYSBjaGFpbiBvZiBtaWRkbGV3YXJlcy4gXG4gICAgLSByZXR1cm4gbWlkZGxld2FyZSByZWZlcmVuY2UgbmFtZXMsIGFuZCB0aGVuIG1hdGNoaW5nIHRoZSBuYW1lcyB0byBmdW5jdGlvbiBvdXRzaWRlIHRoZSB0cmF2ZXJzYWwuXG4gICAgLSBFeGVjdXRpbmcgZ2VuZXJhdG9yIGZ1bmN0aW9ucyB3aXRoIG5vZGUgYXJndW1lbnRzIHRoYXQgcHJvZHVjZSBtaWRkbGV3YXJlIGZ1bmN0aW9ucy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4ZWN1dGVGdW5jdGlvblJlZmVyZW5jZSh7IHN0YWdlTm9kZSwgcHJvY2Vzc05vZGUsIGdyYXBoSW5zdGFuY2UsIG5leHRQcm9jZXNzRGF0YSB9LCB7IGFkZGl0aW9uYWxQYXJhbWV0ZXIsIHRyYXZlcnNlQ2FsbENvbnRleHQgfSkge1xuICBsZXQgY29udGV4dFByb3BlcnR5TmFtZSA9ICdmdW5jdGlvblJlZmVyZW5jZUNvbnRleHQnLCAvLyBUT0RPOiBhZnRlciBtaWdyYXRpbmcgdG8gb3duIHJlcG9zaXRvcnksIHVzZSBTeW1ib2xzIGluc3RlYWQgb2Ygc3RyaW5nIGtleXMgYW5kIGV4cG9ydCB0aGVtIGZvciBjbGllbnQgdXNhZ2UuXG4gICAgcmVmZXJlbmNlQ29udGV4dCA9IGdyYXBoSW5zdGFuY2UuY29udGV4dFtjb250ZXh0UHJvcGVydHlOYW1lXVxuICBhc3NlcnQocmVmZXJlbmNlQ29udGV4dCwgYOKAoiBDb250ZXh0IFwiJHtjb250ZXh0UHJvcGVydHlOYW1lfVwiIHZhcmlhYmxlIGlzIHJlcXVpcmVkIHRvIHJlZmVyZW5jZSBmdW5jdGlvbnMgZnJvbSBncmFwaCBkYXRhYmFzZSBzdHJpbmdzLmApXG5cbiAgbGV0IHJlc291cmNlXG4gIGNvbnN0IHsgcmVzb3VyY2VBcnJheSB9ID0gYXdhaXQgZ3JhcGhJbnN0YW5jZS5kYXRhYmFzZVdyYXBwZXIuZ2V0UmVzb3VyY2UoeyBjb25jcmV0ZURhdGFiYXNlOiBncmFwaEluc3RhbmNlLmRhdGFiYXNlLCBub2RlSUQ6IHByb2Nlc3NOb2RlLmlkZW50aXR5IH0pXG4gIGlmIChyZXNvdXJjZUFycmF5Lmxlbmd0aCA+IDEpIHRocm93IG5ldyBFcnJvcihg4oCiIE11bHRpcGxlIHJlc291cmNlIHJlbGF0aW9uc2hpcHMgYXJlIG5vdCBzdXBwb3J0ZWQgZm9yIFByb2Nlc3Mgbm9kZS5gKVxuICBlbHNlIGlmIChyZXNvdXJjZUFycmF5Lmxlbmd0aCA9PSAwKSByZXR1cm5cbiAgZWxzZSByZXNvdXJjZSA9IHJlc291cmNlQXJyYXlbMF1cblxuICBhc3NlcnQocmVzb3VyY2Uuc291cmNlLmxhYmVscy5pbmNsdWRlcyhncmFwaEluc3RhbmNlLnNjaGVtZVJlZmVyZW5jZS5ub2RlTGFiZWwuZnVuY3Rpb24pLCBg4oCiIFVuc3VwcG9ydGVkIE5vZGUgdHlwZSBmb3IgcmVzb3VyY2UgY29ubmVjdGlvbi5gKVxuICBsZXQgZnVuY3Rpb25OYW1lID0gcmVzb3VyY2Uuc291cmNlLnByb3BlcnRpZXMuZnVuY3Rpb25OYW1lIHx8IHRocm93IG5ldyBFcnJvcihg4oCiIGZ1bmN0aW9uIHJlc291cmNlIG11c3QgaGF2ZSBhIFwiZnVuY3Rpb25OYW1lXCIgLSAke3Jlc291cmNlLnNvdXJjZS5wcm9wZXJ0aWVzLmZ1bmN0aW9uTmFtZX1gKVxuICBsZXQgZnVuY3Rpb25DYWxsYmFjayA9IHJlZmVyZW5jZUNvbnRleHRbZnVuY3Rpb25OYW1lXSB8fCB0aHJvdyBuZXcgRXJyb3IoYOKAoiByZWZlcmVuY2UgZnVuY3Rpb24gbmFtZSBcIiR7ZnVuY3Rpb25OYW1lfVwiIGRvZXNuJ3QgZXhpc3QuYClcbiAgdHJ5IHtcbiAgICByZXR1cm4gYXdhaXQgZnVuY3Rpb25DYWxsYmFjayh7IG5vZGU6IHByb2Nlc3NOb2RlLCBjb250ZXh0OiBncmFwaEluc3RhbmNlLmNvbnRleHQsIGdyYXBoSW5zdGFuY2UsIHRyYXZlcnNlQ2FsbENvbnRleHQgfSlcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycm9yKSAmJiBwcm9jZXNzLmV4aXQoKVxuICB9XG59XG5cbi8qXG4gXG4gICBfX19fICAgICAgICAgICAgXyAgICAgICBfICAgICBfX19fXyAgICAgICAgICAgICAgICAgICAgIF8gICBfICAgICAgICAgICAgIFxuICAvIF9fX3wgIF9fXyBfIF9fKF8pXyBfXyB8IHxfICB8IF9fX198XyAgX19fX18gIF9fXyBfICAgX3wgfF8oXykgX19fICBfIF9fICBcbiAgXFxfX18gXFwgLyBfX3wgJ19ffCB8ICdfIFxcfCBfX3wgfCAgX3wgXFwgXFwvIC8gXyBcXC8gX198IHwgfCB8IF9ffCB8LyBfIFxcfCAnXyBcXCBcbiAgIF9fXykgfCAoX198IHwgIHwgfCB8XykgfCB8XyAgfCB8X19fID4gIDwgIF9fLyAoX198IHxffCB8IHxffCB8IChfKSB8IHwgfCB8XG4gIHxfX19fLyBcXF9fX3xffCAgfF98IC5fXy8gXFxfX3wgfF9fX19fL18vXFxfXFxfX198XFxfX198XFxfXyxffFxcX198X3xcXF9fXy98X3wgfF98XG4gICAgICAgICAgICAgICAgICAgIHxffCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuIFJlbGllcyBvbiBmdW5jdGlvbiByZWZlcmVuY2UgY29uY2VwdC5cbiovXG5cbi8vIEV4ZWN1dGUgdGFzayBzY3JpcHQgaW4gdGhlIHNhbWUgcHJvY2VzcyAobm9kZWpzIGNoaWxkcHJvY2Vzcy5leGVjU3luYykgdXNpbmcgYSByZWZlcmVuY2Ugc2NyaXB0UGF0aCBwcm9wZXJ0eS5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleGVjdXRlU2hlbGxzY3JpcHRGaWxlKHsgc3RhZ2VOb2RlLCBwcm9jZXNzTm9kZSwgZ3JhcGhJbnN0YW5jZSwgbmV4dFByb2Nlc3NEYXRhIH0sIHsgYWRkaXRpb25hbFBhcmFtZXRlciwgdHJhdmVyc2VDYWxsQ29udGV4dCB9KSB7XG4gIGxldCBtZXNzYWdlID0gYCBfX19fXyAgICAgICAgICAgICAgICAgICAgICAgICAgXyAgICAgICAgXG4gIHwgX19fX3xfXyAgX18gX19fICAgX19fICBfICAgXyB8IHxfICBfX18gXG4gIHwgIF98ICBcXFxcIFxcXFwvIC8vIF8gXFxcXCAvIF9ffHwgfCB8IHx8IF9ffC8gXyBcXFxcXG4gIHwgfF9fXyAgPiAgPHwgIF9fL3wgKF9fIHwgfF98IHx8IHxffCAgX18vICAgIFxuICB8X19fX198L18vXFxcXF9cXFxcXFxcXF9fX3wgXFxcXF9fX3wgXFxcXF9fLF98IFxcXFxfX3xcXFxcX19ffGBcbiAgbGV0IGNvbnRleHRQcm9wZXJ0eU5hbWUgPSAnZmlsZUNvbnRleHQnLFxuICAgIHJlZmVyZW5jZUNvbnRleHQgPSBncmFwaEluc3RhbmNlLmNvbnRleHRbY29udGV4dFByb3BlcnR5TmFtZV1cbiAgYXNzZXJ0KHJlZmVyZW5jZUNvbnRleHQsIGDigKIgQ29udGV4dCBcIiR7Y29udGV4dFByb3BlcnR5TmFtZX1cIiB2YXJpYWJsZSBpcyByZXF1aXJlZCB0byByZWZlcmVuY2UgZnVuY3Rpb25zIGZyb20gZ3JhcGggZGF0YWJhc2Ugc3RyaW5ncy5gKVxuXG4gIGxldCByZXNvdXJjZVxuICBjb25zdCB7IHJlc291cmNlQXJyYXkgfSA9IGF3YWl0IGdyYXBoSW5zdGFuY2UuZGF0YWJhc2VXcmFwcGVyLmdldFJlc291cmNlKHsgY29uY3JldGVEYXRhYmFzZTogZ3JhcGhJbnN0YW5jZS5kYXRhYmFzZSwgbm9kZUlEOiBwcm9jZXNzTm9kZS5pZGVudGl0eSB9KVxuICBpZiAocmVzb3VyY2VBcnJheS5sZW5ndGggPiAxKSB0aHJvdyBuZXcgRXJyb3IoYOKAoiBNdWx0aXBsZSByZXNvdXJjZSByZWxhdGlvbnNoaXBzIGFyZSBub3Qgc3VwcG9ydGVkIGZvciBQcm9jZXNzIG5vZGUuYClcbiAgZWxzZSBpZiAocmVzb3VyY2VBcnJheS5sZW5ndGggPT0gMCkgcmV0dXJuXG4gIGVsc2UgcmVzb3VyY2UgPSByZXNvdXJjZUFycmF5WzBdXG4gIGxldCBzY3JpcHRSZWZlcmVuY2VLZXkgPSByZXNvdXJjZS5zb3VyY2UucHJvcGVydGllcy5yZWZlcmVuY2VLZXlcbiAgYXNzZXJ0KHNjcmlwdFJlZmVyZW5jZUtleSwgYOKAoiByZXNvdXJjZSBGaWxlIG5vZGUgKHdpdGgga2V5OiAke3Jlc291cmNlLnNvdXJjZS5wcm9wZXJ0aWVzLmtleX0pIG11c3QgaGF2ZSBcInJlZmVyZW5jZUtleVwiIHByb3BlcnR5LmApXG5cbiAgdHJ5IHtcbiAgICBjb25zb2xlLmxvZyhtZXNzYWdlKVxuICAgIGxldCBzY3JpcHRQYXRoID0gcmVmZXJlbmNlQ29udGV4dFtzY3JpcHRSZWZlcmVuY2VLZXldXG4gICAgYXNzZXJ0KHNjcmlwdFBhdGgsIGDigKIgcmVmZXJlbmNlS2V5IG9mIEZpbGUgbm9kZSAocmVmZXJlbmNlS2V5ID0gJHtzY3JpcHRSZWZlcmVuY2VLZXl9KSB3YXMgbm90IGZvdW5kIGluIHRoZSBncmFwaEluc3RhbmNlIGNvbnRleHQ6ICR7cmVmZXJlbmNlQ29udGV4dH0gYClcbiAgICBjb25zb2xlLmxvZyhgXFx4MWJbNDVtJXNcXHgxYlswbWAsIGBzaGVsbHNjcmlwdCBwYXRoOiAke3NjcmlwdFBhdGh9YClcbiAgICBleGVjU3luYyhgc2ggJHtzY3JpcHRQYXRofWAsIHsgY3dkOiBwYXRoLmRpcm5hbWUoc2NyaXB0UGF0aCksIHNoZWxsOiB0cnVlLCBzdGRpbzogWydpbmhlcml0JywgJ2luaGVyaXQnLCAnaW5oZXJpdCddIH0pXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgdGhyb3cgZXJyb3JcbiAgICBwcm9jZXNzLmV4aXQoMSlcbiAgfVxuICAvLyBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgNTAwKSkgLy8gd2FpdCB4IHNlY29uZHMgYmVmb3JlIG5leHQgc2NyaXB0IGV4ZWN1dGlvbiAvLyBpbXBvcnRhbnQgdG8gcHJldmVudCAndW5hYmxlIHRvIHJlLW9wZW4gc3RkaW4nIGVycm9yIGJldHdlZW4gc2hlbGxzLlxuICByZXR1cm4gbnVsbFxufVxuXG4vKipcbiAgUnVuIGNoaWxkcHJvY2VzcyBzeW5jaG5vbG91cyBzcGF3biBjb21tYW5kOiBcbiAgUmVxdWlyZWQgcHJvcGVydGllcyBvbiBwcm9jZXNzIG5vZGU6IFxuICBAcGFyYW0ge1N0cmluZ30gY29tbWFuZFxuICBAcGFyYW0ge1N0cmluZ1tdfSBhcmd1bWVudFxuICBAcGFyYW0ge0pzb24gc3RyaW5naWZpZXMgc3RyaW5nfSBvcHRpb25cbiovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhlY3V0ZVNjcmlwdFNwYXduKHsgc3RhZ2VOb2RlLCBwcm9jZXNzTm9kZSwgZ3JhcGhJbnN0YW5jZSwgbmV4dFByb2Nlc3NEYXRhIH0sIHsgYWRkaXRpb25hbFBhcmFtZXRlciwgdHJhdmVyc2VDYWxsQ29udGV4dCB9KSB7XG4gIGxldCBjaGlsZFByb2Nlc3NcbiAgdHJ5IHtcbiAgICBsZXQgY29tbWFuZCA9IHByb2Nlc3NOb2RlLnByb3BlcnRpZXMuY29tbWFuZCxcbiAgICAgIGFyZ3VtZW50ID0gcHJvY2Vzc05vZGUucHJvcGVydGllcy5hcmd1bWVudC5qb2luKCcgJyksXG4gICAgICBvcHRpb24gPSBKU09OLnN0cmluZ2lmeShwcm9jZXNzTm9kZS5wcm9wZXJ0aWVzLm9wdGlvbilcbiAgICBjb25zb2xlLmxvZyhgXFx4MWJbNDVtJXNcXHgxYlswbWAsIGAke2NvbW1hbmR9ICR7YXJndW1lbnR9YClcbiAgICBjaGlsZFByb2Nlc3MgPSBzcGF3blN5bmMoY29tbWFuZCwgYXJndW1lbnQsIG9wdGlvbilcbiAgICBpZiAoY2hpbGRQcm9jZXNzLnN0YXR1cyA+IDApIHRocm93IGNoaWxkUHJvY2Vzcy5lcnJvclxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHByb2Nlc3MuZXhpdChjaGlsZFByb2Nlc3Muc3RhdHVzKVxuICB9XG59XG5cbi8qXG4gICBfXyAgX18gXyAgICAgXyAgICAgXyBfICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgfCAgXFwvICAoXykgX198IHwgX198IHwgfCBfX19fXyAgICAgIF9fX18gXyBfIF9fIF9fXyBcbiAgfCB8XFwvfCB8IHwvIF9gIHwvIF9gIHwgfC8gXyBcXCBcXCAvXFwgLyAvIF9gIHwgJ19fLyBfIFxcXG4gIHwgfCAgfCB8IHwgKF98IHwgKF98IHwgfCAgX18vXFwgViAgViAvIChffCB8IHwgfCAgX18vXG4gIHxffCAgfF98X3xcXF9fLF98XFxfXyxffF98XFxfX198IFxcXy9cXF8vIFxcX18sX3xffCAgXFxfX198XG4gIEltbWVkaWF0ZWx5IGV4ZWN1dGUgbWlkZGxld2FyZVxuICBOb3RlOiBDaGVjayBncmFwaEludGVyY2VwdGlvbiBtZXRob2QgXCJoYW5kbGVNaWRkbGV3YXJlTmV4dENhbGxcIlxuKi9cbmV4cG9ydCBjb25zdCBpbW1lZGlhdGVseUV4ZWN1dGVNaWRkbGV3YXJlID0gYXN5bmMgKHsgc3RhZ2VOb2RlLCBwcm9jZXNzTm9kZSwgZ3JhcGhJbnN0YW5jZSwgbmV4dFByb2Nlc3NEYXRhIH0sIHsgYWRkaXRpb25hbFBhcmFtZXRlciwgdHJhdmVyc2VDYWxsQ29udGV4dCB9KSA9PiB7XG4gIGNvbnN0IHsgbmV4dEZ1bmN0aW9uIH0gPSBhZGRpdGlvbmFsUGFyYW1ldGVyXG4gIGxldCBjb250ZXh0UHJvcGVydHlOYW1lID0gJ2Z1bmN0aW9uUmVmZXJlbmNlQ29udGV4dCcsXG4gICAgcmVmZXJlbmNlQ29udGV4dCA9IGdyYXBoSW5zdGFuY2UuY29udGV4dFtjb250ZXh0UHJvcGVydHlOYW1lXVxuICBhc3NlcnQocmVmZXJlbmNlQ29udGV4dCwgYOKAoiBDb250ZXh0IFwiJHtjb250ZXh0UHJvcGVydHlOYW1lfVwiIHZhcmlhYmxlIGlzIHJlcXVpcmVkIHRvIHJlZmVyZW5jZSBmdW5jdGlvbnMgZnJvbSBncmFwaCBkYXRhYmFzZSBzdHJpbmdzLmApXG4gIGFzc2VydChncmFwaEluc3RhbmNlLmNvbnRleHQubWlkZGxld2FyZVBhcmFtZXRlcj8uY29udGV4dCwgYOKAoiBNaWRkbGV3YXJlIGdyYXBoIHRyYXZlcnNhbCByZWxpZXMgb24gY29udGV4dC5taWRkbGV3YXJlUGFyYW1ldGVyLmNvbnRleHQgb24gdGhlIGdyYXBoIGNvbnRleHQgaW5zdGFuY2VgKVxuXG4gIGxldCByZXNvdXJjZVxuICBjb25zdCB7IHJlc291cmNlQXJyYXkgfSA9IGF3YWl0IGdyYXBoSW5zdGFuY2UuZGF0YWJhc2VXcmFwcGVyLmdldFJlc291cmNlKHsgY29uY3JldGVEYXRhYmFzZTogZ3JhcGhJbnN0YW5jZS5kYXRhYmFzZSwgbm9kZUlEOiBwcm9jZXNzTm9kZS5pZGVudGl0eSB9KVxuICBpZiAocmVzb3VyY2VBcnJheS5sZW5ndGggPiAxKSB0aHJvdyBuZXcgRXJyb3IoYOKAoiBNdWx0aXBsZSByZXNvdXJjZSByZWxhdGlvbnNoaXBzIGFyZSBub3Qgc3VwcG9ydGVkIGZvciBQcm9jZXNzIG5vZGUuYClcbiAgZWxzZSBpZiAocmVzb3VyY2VBcnJheS5sZW5ndGggPT0gMCkgcmV0dXJuXG4gIGVsc2UgcmVzb3VyY2UgPSByZXNvdXJjZUFycmF5WzBdXG5cbiAgYXNzZXJ0KHJlc291cmNlLnNvdXJjZS5sYWJlbHMuaW5jbHVkZXMoZ3JhcGhJbnN0YW5jZS5zY2hlbWVSZWZlcmVuY2Uubm9kZUxhYmVsLmZ1bmN0aW9uKSwgYOKAoiBVbnN1cHBvcnRlZCBOb2RlIHR5cGUgZm9yIHJlc291cmNlIGNvbm5lY3Rpb24uYClcbiAgbGV0IGZ1bmN0aW9uTmFtZSA9IHJlc291cmNlLnNvdXJjZS5wcm9wZXJ0aWVzLmZ1bmN0aW9uTmFtZSB8fCB0aHJvdyBuZXcgRXJyb3IoYOKAoiBmdW5jdGlvbiByZXNvdXJjZSBtdXN0IGhhdmUgYSBcImZ1bmN0aW9uTmFtZVwiIC0gJHtyZXNvdXJjZS5zb3VyY2UucHJvcGVydGllcy5mdW5jdGlvbk5hbWV9YClcbiAgLy8gYSBmdW5jdGlvbiB0aGF0IGNvbXBsaWVzIHdpdGggZ3JhcGhUcmF2ZXJzYWwgcHJvY2Vzc0RhdGEgaW1wbGVtZW50YXRpb24uXG4gIGxldCBmdW5jdGlvbkNhbGxiYWNrID0gcmVmZXJlbmNlQ29udGV4dFtmdW5jdGlvbk5hbWVdIHx8IHRocm93IG5ldyBFcnJvcihg4oCiIHJlZmVyZW5jZSBmdW5jdGlvbiBuYW1lIFwiJHtmdW5jdGlvbk5hbWV9XCIgZG9lc24ndCBleGlzdC5gKVxuICB0cnkge1xuICAgIGxldCBtaWRkbGV3YXJlID0gYXdhaXQgZnVuY3Rpb25DYWxsYmFjayh7IG5vZGU6IHByb2Nlc3NOb2RlIH0pIC8vIGV4cHJlY3RlZCB0byByZXR1cm4gYSBLb2EgbWlkZGxld2FyZSBjb21wbHlpbmcgZnVuY3Rpb24uXG4gICAgbGV0IGNvbnRleHQgPSBncmFwaEluc3RhbmNlLmNvbnRleHQubWlkZGxld2FyZVBhcmFtZXRlci5jb250ZXh0LFxuICAgICAgbmV4dCA9IG5leHRGdW5jdGlvblxuICAgIGF3YWl0IG1pZGRsZXdhcmUoY29udGV4dCwgbmV4dCkgLy8gZXhlY3V0ZSBtaWRkbGV3YXJlXG4gICAgcmV0dXJuIG1pZGRsZXdhcmUgLy8gYWxsb3cgdG8gYWdncmVnYXRlIG1pZGRsZXdhcmUgZnVuY3Rpb24gZm9yIGRlYnVnZ2luZyBwdXJwb3Nlcy5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycm9yKSAmJiBwcm9jZXNzLmV4aXQoKVxuICB9XG59XG5cbi8qXG4gICBfX19fXyAgICAgICAgICAgICAgICAgICAgXyAgICAgICBfICAgICAgIFxuICB8XyAgIF98X18gXyBfXyBfX18gIF8gX18gfCB8IF9fIF98IHxfIF9fXyBcbiAgICB8IHwvIF8gXFwgJ18gYCBfIFxcfCAnXyBcXHwgfC8gX2AgfCBfXy8gXyBcXFxuICAgIHwgfCAgX18vIHwgfCB8IHwgfCB8XykgfCB8IChffCB8IHx8ICBfXy9cbiAgICB8X3xcXF9fX3xffCB8X3wgfF98IC5fXy98X3xcXF9fLF98XFxfX1xcX19ffFxuICAgICAgICAgICAgICAgICAgICAgfF98ICAgICAgICAgICAgICAgICAgICBcbiovXG5cbi8qKlxuICogQHJldHVybiB7U3RyaW5nfSBTdHJpbmcgb2YgcmVuZGVyZWQgSFRNTCBkb2N1bWVudCBjb250ZW50LlxuIFVuZGVyc2NvcmUgdGVtcGxhdGluZyBvcHRpb25zIC0gaHR0cHM6Ly8yYWxpdHkuY29tLzIwMTIvMDYvdW5kZXJzY29yZS10ZW1wbGF0ZXMuaHRtbFxuXG4gIDEuIHRyYXZlcnNlIG5lc3RlZFxuICAyLiBhZ2dyZWdhdGUgaW50byBuZXN0ZWQgYXJyYXlzIChieSBpbnNlcnRpb24gcG9zaXRpb24ga2V5cykuXG4gIDMuIHJlbmRlciBjdXJyZW50IG5vZGUgdGVtcGxhdGUgd2l0aCBpbnNldGlvbiBwb3NpdGlvbiBjb250ZW50LlxuICA0LiBcblxuICBTZXJ2ZXItc2lkZSB0ZW1wbGF0ZSBzeXN0ZW0gKHJ1bi10aW1lIHN1YnN0aXR1dGlvbiBoYXBwZW5zIG9uIHRoZSB3ZWIgc2VydmVyKTogXG4gICAgLSBUZW1wbGF0ZSByZXNvdXJjZTogdGVtcGxhdGUgZmlsZSB3aXRoIGluc2VydGlvbiBwb2ludHMuXG4gICAgLSBDb250ZW50IHJlc291cmNlICh0ZW1wbGF0ZSBwYXJ0cyk6IEFyZ3VtbmV0cyBwYXNzZWQgdG8gdGhlIHBhcnNlZCB0ZW1wbGF0ZSBmdW5jdGlvbi4gXG4gICAgLSBUZW1wbGF0ZSBlbmdpbmUvcHJvY2Vzc2luZy9yZW5kZW5pbmcgZWxlbWVudC9tb2R1bGU6IHVuZGVyc2NvcmUudGVtcGxhdGUgXG5cbiAgc2VydmVyLXNpZGUgamF2YXNjcmlwdCB0aGF0IGlzIGxvY2F0ZWQgaW4gdGhlIHRlbXBsYXRlcywgaXMgZXhlY3V0ZWQuIFJlbmRlcmluZyB0ZW1wbGF0ZSByZXF1aXJlcyBhbiBvYmplY3Qgb2YgZnVuY3Rpb25zIGZvciBlYWNoIGluc2V0aW9uIHBvc2l0aW9uIGtleS5cbiAgV2hlcmU6XG4gICAgLSBpbnNlcnQgb2JqZWN0IGZ1bmN0aW9ucyBhcmUgY2FsbGVkIGFuZCBleHBlY3QgdG8gcmV0dXJuIGEgc3RyaW5nLiBGdW5jdGlvbnMgcmVwcmVzZW50LSB0aGUgYWxnb3JpdGhtcyB1c2VkIHRvIGRlYWwgd2l0aCBjb250ZW50IHZhbHVlIGFuZCBhZGQgaXQgdG8gdGhlIGRvY3VtZW50IGluIGEgc3BlY2lmaWMgcG9zaXRpb24sXG4gICAgICB3aGljaCB3aWxsIHJlY2VpdmUgdGhlIHBhcmFtZXRlcnMgdGhhdCBjYW4gY2hhbmdlIGl0J3MgYmVoYXZpb3IuIFVzaW5nIGEgZnVuY3Rpb24gYWxsb3dzIGZvciBjcmVhdGluZyBzcGVjaWZpYyBsb2dpYyBmb3IgZWFjaCBpbnNldGlvbiBwb2ludC5cbiAgICAtIEVhY2ggaW5zZXJ0aW9uIHBvc2l0aW9uIGlzIGRpc3Rpbmd1aXNoZWQgYnkgdGhlIGtleXMgb2YgdGhlIGluc2VydCBvYmplY3QuIFxuICAgIC0gQ29udGVudCB2YWx1ZSAoU3RyaW5nIHwgQXJyYXkgfCBPYmplY3QpIC0gd2hpY2ggaW5zZXJ0IGZ1bmN0aW9uIGlzIGluaXRpYWxpemVkIHdpdGgsIGFuZCBoYW5kbGVzIGl0LiBcblxuICAvLyBUT0RPOiBkZWFsIHdpdGggcG9zdCByZW5kZXJpbmcgcHJvY2Vzc2luZyBhbGdvcml0aG1zLCB3aGVuIHJlcXVpcmVkLlxuICAvLyBUT0RPOiBkZWFsIHdpdGggd3JhcHBpbmcgbGF5b3V0cyBlLmcuIGxheW91dEVsZW1lbnQ6ICd3ZWJhcHAtbGF5b3V0LWxpc3QnXG4gKi9cbmV4cG9ydCBjb25zdCB0ZW1wbGF0ZVJlbmRlcmluZ1dpdGhJbnNlcml0b25Qb3NpdGlvbiA9IGFzeW5jICh7IHN0YWdlTm9kZSwgcHJvY2Vzc05vZGUsIGdyYXBoSW5zdGFuY2UsIG5leHRQcm9jZXNzRGF0YSB9LCB7IGFkZGl0aW9uYWxQYXJhbWV0ZXIsIHRyYXZlcnNlQ2FsbENvbnRleHQgfSkgPT4ge1xuICBsZXQgY29udGV4dCA9IGdyYXBoSW5zdGFuY2UuY29udGV4dC5taWRkbGV3YXJlUGFyYW1ldGVyLmNvbnRleHRcbiAgYXNzZXJ0KGNvbnRleHQuY2xpZW50U2lkZVBhdGgsIFwi4oCiIGNsaWVudFNpZGVQYXRoIGNhbm5vdCBiZSB1bmRlZmluZWQuIGkuZS4gcHJldmlvdXMgbWlkZGxld2FyZXMgc2hvdWxkJ3ZlIHNldCBpdFwiKVxuICBsZXQgdGVtcGxhdGVQYXRoID0gcGF0aC5qb2luKGNvbnRleHQuY2xpZW50U2lkZVBhdGgsIG5vZGUuZmlsZVBhdGgpXG5cbiAgcmV0dXJuIHJlbmRlcmVkQ29udGVudFxufVxuXG4vKlxuICAgX19fXyAgX19fX18gX19fXyAgX19fXyAgX19fX18gX19fXyAgICBfICBfX19fXyBfX19fXyBfX19fICBcbiAgfCAgXyBcXHwgX19fX3wgIF8gXFx8ICBfIFxcfCBfX19fLyBfX198ICAvIFxcfF8gICBffCBfX19ffCAgXyBcXCBcbiAgfCB8IHwgfCAgX3wgfCB8XykgfCB8XykgfCAgX3x8IHwgICAgIC8gXyBcXCB8IHwgfCAgX3wgfCB8IHwgfFxuICB8IHxffCB8IHxfX198ICBfXy98ICBfIDx8IHxfX3wgfF9fXyAvIF9fXyBcXHwgfCB8IHxfX198IHxffCB8XG4gIHxfX19fL3xfX19fX3xffCAgIHxffCBcXF9cXF9fX19fXFxfX19fL18vICAgXFxfXFxffCB8X19fX198X19fXy8gXG4gIFJlcXVpcmVzIHJlZmFjdG9yaW5nIGFuZCBtaWdyYXRpb24gXG4qL1xuXG4vKlxuVE9ETzogYXMgdGhlcmVgeiBpcyBhbiBBUEkgU2NoZW1hLCBhIGRhdGFiYXNlIHNjaGVtYSBjYW4gbWFrZSBjb250ZW50IGV4dHJlbWVseSBkeW5hbWljLiAtRGF0YWJhc2Ugc2NoZW1hIGlzIGRpZmZlcmVudCBmcm9tIEFQSSBTY2hlbWEuICAgICAgICAgXG5cbiAgIF9fXyAgX19ffCB8X18gICBfX18gXyBfXyBfX18gICBfXyBfIFxuICAvIF9ffC8gX198ICdfIFxcIC8gXyBcXCAnXyBgIF8gXFwgLyBfYCB8XG4gIFxcX18gXFwgKF9ffCB8IHwgfCAgX18vIHwgfCB8IHwgfCAoX3wgfFxuICB8X19fL1xcX19ffF98IHxffFxcX19ffF98IHxffCB8X3xcXF9fLF98XG4gQVBJIFNjaGVtYVxuICAoV2hpbGUgdGhlIGRhdGFiYXNlIG1vZGVscyBhcmUgc2VwYXJhdGUgaW4gdGhlaXIgb3duIGZ1bmN0aW9ucyBvciBjb3VsZCBiZSBleHBvc2VkIHRocm91Z2ggYSBjbGFzcyBtb2R1bGUpXG5cbiAgLSBSZXNvbHZlciBmdW5jdGlvbiA9IGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGRhdGEuXG4gIC0gRGF0YSBsb2FkZXIgPSBtb2R1bGUgdGhhdCBhZ2dyZWdhdGVzIGR1cGxpY2F0ZSBjYWxscy4gU29sdmluZyB0aGUgbisxIHByb2JsZW0sIHdoZXJlIGVhY2ggcXVlcnkgaGFzIGEgc3Vic2VxdWVudCBxdWVyeSwgbGluZWFyIGdyYXBoLiBUbyBub2RlanMgaXQgdXNlcyBuZXh0VGljayBmdW5jdGlvbiB0byBhbmFseXNlIHRoZSBwcm9taXNlcyBiZWZvcmUgdGhlaXIgZXhlY3V0aW9uIGFuZCBwcmV2ZW50IG11bHRpcGxlIHJvdW5kIHRyaXBzIHRvIHRoZSBzZXJ2ZXIgZm9yIHRoZSBzYW1lIGRhdGEuXG4gIC0gTWFwcGluZyAtIHRocm91Z2ggcm9zb2x2ZXIgZnVuY3Rpb25zLlxuICAtIFNjaGVtYSA9IGlzIHRoZSBzdHJ1Y3R1cmUgJiByZWxhdGlvbnNoaXBzIG9mIHRoZSBhcGkgZGF0YS4gaS5lLiBkZWZpbmVzIGhvdyBhIGNsaWVudCBjYW4gZmV0Y2ggYW5kIHVwZGF0ZSBkYXRhLlxuICAgICAgZWFjaCBzY2hlbWEgaGFzIGFwaSBlbnRyeXBvaW50cy4gRWFjaCBmaWVsZCBjb3JyZXNwb25kcyB0byBhIHJlc29sdmVyIGZ1bmN0aW9uLlxuICBEYXRhIGZldGNoaW5nIGNvbXBsZXhpdHkgYW5kIGRhdGEgc3RydWN0dXJpbmcgaXMgaGFuZGxlZCBieSBzZXJ2ZXIgc2lkZSByYXRoZXIgdGhhbiBjbGllbnQuXG5cbiAgMyB0eXBlcyBvZiBwb3NzaWJsZSBhcGkgYWN0aW9uczogXG4gIC0gUXVlcnlcbiAgLSBNdXRhdGlvblxuICAtIFN1YnNjcmlwdGlvbiAtIGNyZWF0ZXMgYSBzdGVhZHkgY29ubmVjdGlvbiB3aXRoIHRoZSBzZXJ2ZXIuXG5cbiAgRmV0Y2hpbmcgYXBwcm9hY2hlczogXG4gIOKAoiBJbXBlcmF0aXZlIGZldGNoaW5nOiBcbiAgICAgIC0gY29uc3RydWN0cyAmIHNlbmRzIEhUVFAgcmVxdWVzdCwgZS5nLiB1c2luZyBqcyBmZXRjaC5cbiAgICAgIC0gcmVjZWl2ZSAmIHBhcnNlIHNlcnZlciByZXNwb25zZS5cbiAgICAgIC0gc3RvcmUgZGF0YSBsb2NhbGx5LCBlLmcuIGluIG1lbW9yeSBvciBwZXJzaXN0ZW50LiBcbiAgICAgIC0gZGlzcGxheSBVSS5cbiAg4oCiIERlY2xhcmF0aXZlIGZldGNoaW5nIGUuZy4gdXNpbmcgR3JhcGhRTCBjbGllbnRzOiBcbiAgICAgIC0gRGVzY3JpYmUgZGF0YSByZXF1aXJlbWVudHMuXG4gICAgICAtIERpc3BsYXkgaW5mb3JtYXRpb24gaW4gdGhlIFVJLlxuXG4gIFJlcXVlc3Q6IFxuICB7XG4gICAgICBhY3Rpb246IHF1ZXJ5LFxuICAgICAgZW50cnlwb2ludDoge1xuICAgICAgICAgIGtleTogXCJBcnRpY2xlXCJcbiAgICAgIH0sXG4gICAgICBmdW5jdGlvbjoge1xuICAgICAgICAgIG5hbWU6IFwic2luZ2xlXCIsXG4gICAgICAgICAgYXJnczoge1xuICAgICAgICAgICAgICBrZXk6IFwiYXJ0aWNsZTFcIlxuICAgICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBmaWVsZDogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgICAga2V5bmFtZTogXCJ0aXRsZVwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgIGtleW5hbWU6IFwicGFyYWdyYXBoXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAga2V5bmFtZTogXCJhdXRob3JzXCJcbiAgICAgICAgICB9LFxuICAgICAgXVxuICB9XG5cbiAgUmVzcG9uc2UgOlxuICB7XG4gICAgICBkYXRhOiB7XG4gICAgICAgICAgdGl0bGU6IFwiLi4uXCIsXG4gICAgICAgICAgcGFyYWdyYXBoOiAnLi4uJyxcbiAgICAgICAgICBhdXRob3I6IHtcbiAgICAgICAgICAgICAgbmFtZTogJy4uLicsXG4gICAgICAgICAgICAgIGFnZTogMjBcbiAgICAgICAgICB9XG4gICAgICB9XG4gIH1cblxuXG4gIE5lc3RlZCBVbml0IGV4ZWN1dGlvbiBzdGVwczogIFxu4oCiIFxuKi9cblxubGV0IHNjaGVtYSA9ICgpID0+IHtcbiAgLyoqXG4gICAqIEltcGxlbWVudGF0aW9uIHR5cGUgYWdncmVnYXRlSW50b0NvbnRlbnRBcnJheVxuICAgKi9cbiAgLyogZXhtcGxlIHJlcXVlc3QgYm9keTogXG57XG4gICAgXCJmaWVsZE5hbWVcIjogXCJhcnRpY2xlXCIsXG4gICAgXCJmaWVsZFwiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIFwiZmllbGROYW1lXCI6IFwidGl0bGVcIixcbiAgICAgICAgICAgIFwiZmllbGRcIjogW11cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgXCJmaWVsZE5hbWVcIjogXCJwYXJhZ3JhcGhcIixcbiAgICAgICAgICAgIFwiZmllbGRcIjogW11cbiAgICAgICAgfVxuICAgIF0sXG4gICAgXCJzY2hlbWFNb2RlXCI6IFwibm9uU3RyaWN0XCIsIC8vIGFsbG93IGVtcHR5IGRhdGFzZXRzIGZvciBzcGVjaWZpZWQgZmllbGRzIGluIHRoZSBuZXN0ZWQgdW5pdCBzY2hlbWEuXG4gICAgXCJleHRyYWZpZWxkXCI6IHRydWUgLy8gaW5jbHVkZXMgZmllbGRzIHRoYXQgYXJlIG5vdCBleHRyYWN0ZWQgdXNpbmcgdGhlIHNjaGVtYS5cbn0gKi9cbiAgLy8gY29uc3QgeyBhZGQsIGV4ZWN1dGUsIGNvbmRpdGlvbmFsLCBleGVjdXRpb25MZXZlbCB9ID0gcmVxdWlyZSgnQGRlcGVuZGVuY3kvY29tbW9uUGF0dGVybi9zb3VyY2UvZGVjb3JhdG9yVXRpbGl0eS5qcycpXG4gIGZ1bmN0aW9uIHNjaGVtYSh7IHRoaXNBcmcgfSkge1xuICAgIC8vIGZ1bmN0aW9uIHdyYXBwZXIgdG8gc2V0IHRoaXNBcmcgb24gaW1wbGVtZW50YWlvbiBvYmplY3QgZnVuY3Rpb25zLlxuXG4gICAgbGV0IHNlbGYgPSB7XG4gICAgICBAZXhlY3V0aW9uTGV2ZWwoKVxuICAgICAgYXN5bmMgaW5pdGlhbGl6ZU5lc3RlZFVuaXQoeyBuZXN0ZWRVbml0S2V5LCBhZGRpdGlvbmFsQ2hpbGROZXN0ZWRVbml0ID0gW10sIHBhdGhQb2ludGVyS2V5ID0gbnVsbCwgcGFyZW50ID0gdGhpcywgYXJndW1lbnQgPSB7fSB9KSB7XG4gICAgICAgIC8vIEVudHJ5cG9pbnQgSW5zdGFuY2VcbiAgICAgICAgLy8gZXh0cmFjdCByZXF1ZXN0IGRhdGEgYWN0aW9uIGFyZ3VtZW50cy4gYXJndW1lbnRzIGZvciBhIHF1ZXJ5L211dGF0aW9uL3N1YnNjcmlwdGlvbi5cbiAgICAgICAgaWYgKHRoaXMuZXhlY3V0aW9uTGV2ZWwgPT0gJ3RvcExldmVsJykge1xuICAgICAgICAgIG5lc3RlZFVuaXRJbnN0YW5jZS5yZXF1ZXN0T3B0aW9uID0gdGhpcy5wb3J0QXBwSW5zdGFuY2UuY29udGV4dC5yZXF1ZXN0LmJvZHlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBjaGlsZC9uZXN0ZWRcbiAgICAgICAgICBsZXQgZmllbGRBcnJheSA9IHBhcmVudC5yZXF1ZXN0T3B0aW9uLmZpZWxkIC8vIG9iamVjdCBhcnJheVxuICAgICAgICAgIGlmICgoZmllbGRBcnJheSAmJiBmaWVsZEFycmF5Lmxlbmd0aCA9PSAwKSB8fCAhZmllbGRBcnJheSkge1xuICAgICAgICAgICAgbmVzdGVkVW5pdEluc3RhbmNlLnJlcXVlc3RPcHRpb24gPSB7fSAvLyBjb250aW51ZSB0byByZXNvbHZlIGRhdGFzZXQgYW5kIGFsbCBzdWJzZXF1ZW50IE5lc3RlZHVuaXRzIG9mIG5lc3RlZCBkYXRhc2V0IGluIGNhc2UgYXJlIG9iamVjdHMuXG4gICAgICAgICAgfSBlbHNlIGlmIChmaWVsZEFycmF5KSB7XG4gICAgICAgICAgICBuZXN0ZWRVbml0SW5zdGFuY2UucmVxdWVzdE9wdGlvbiA9IGZpZWxkQXJyYXkuZmluZChmaWVsZCA9PiBmaWVsZC5maWVsZE5hbWUgPT0gdW5pdEluc3RhbmNlLmZpZWxkTmFtZSkgLy8gd2hlcmUgZmllbGROYW1lcyBtYXRjaFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNoZWNrIGlmIGZpZWxkbmFtZSBleGlzdHMgaW4gdGhlIHJlcXVlc3Qgb3B0aW9uLCBpZiBub3Qgc2tpcCBuZXN0ZWQgdW5pdC5cbiAgICAgICAgaWYgKCFuZXN0ZWRVbml0SW5zdGFuY2UucmVxdWVzdE9wdGlvbikgcmV0dXJuIC8vIGZpZWxkTmFtZSB3YXMgbm90IHNwZWNpZmllZCBpbiB0aGUgcGFyZW50IG5lc3RlZFVuaXQsIHRoZXJlZm9yZSBza2lwIGl0cyBleGVjdXRpb25cbiAgICAgICAgbmVzdGVkVW5pdEluc3RhbmNlLmRhdGFzZXQgPSBhd2FpdCB1bml0SW5zdGFuY2UucmVzb2x2ZURhdGFzZXQoeyBwYXJlbnRSZXN1bHQ6IGFyZ3VtZW50LmRhdGFzZXQgfHwgcGFyZW50LmRhdGFzZXQgfSlcbiAgICAgICAgLy8gVE9ETzogRml4IHJlcXVlc3RPcHRpb24gLSBpLmUuIGFib3ZlIGl0IGlzIHVzZWQgdG8gcGFzcyBcImZpZWxkXCIgb3B0aW9uIG9ubHkuXG4gICAgICAgIGlmICh0aGlzLnBvcnRBcHBJbnN0YW5jZS5jb250ZXh0LnJlcXVlc3QuYm9keS5zY2hlbWFNb2RlID09ICdub25TdHJpY3QnKSB7XG4gICAgICAgICAgLy8gRG9uJ3QgZW5mb3JjZSBzdHJpY3Qgc2NoZW1hLCBpLmUuIGFsbCBuZXN0ZWQgY2hpbGRyZW4gc2hvdWxkIGV4aXN0LlxuICAgICAgICAgIC8vIGlmKG5lc3RlZFVuaXRJbnN0YW5jZS5kYXRhc2V0KSBuZXN0ZWRVbml0SW5zdGFuY2UuZGF0YXNldCA9IG51bGwgLy8gVE9ETzogdGhyb3dzIGVycm9yIGFzIG5leHQgaXQgaXMgYmVpbmcgdXNlZC5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhc3NlcnQubm90RXF1YWwobmVzdGVkVW5pdEluc3RhbmNlLmRhdGFzZXQsIHVuZGVmaW5lZCwgYOKAoiByZXR1cm5lZCBkYXRhc2V0IGNhbm5vdCBiZSB1bmRlZmluZWQgZm9yIGZpZWxkTmFtZTogJHt1bml0SW5zdGFuY2UuZmllbGROYW1lfS5gKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gY2hlY2sgdHlwZSBvZiBkYXRhc2V0XG4gICAgICAgIGxldCBkYXRhc2V0SGFuZGxpbmdcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkobmVzdGVkVW5pdEluc3RhbmNlLmRhdGFzZXQpICYmIG5lc3RlZFVuaXRJbnN0YW5jZS5jaGlsZHJlbiAmJiBuZXN0ZWRVbml0SW5zdGFuY2UuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgIC8vIGFycmF5XG4gICAgICAgICAgZGF0YXNldEhhbmRsaW5nID0gJ3NlcXVlbmNlJ1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBuZXN0ZWRVbml0SW5zdGFuY2UuZGF0YXNldCA9PSAnb2JqZWN0JyAmJiBuZXN0ZWRVbml0SW5zdGFuY2UuY2hpbGRyZW4gJiYgbmVzdGVkVW5pdEluc3RhbmNlLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAvLyBvYmplY3RcbiAgICAgICAgICBkYXRhc2V0SGFuZGxpbmcgPSAnbmVzdGVkJ1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIG5vbi1uZXN0ZWQgdmFsdWVcbiAgICAgICAgICBkYXRhc2V0SGFuZGxpbmcgPSAnbm9uTmVzdGVkJ1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaGFuZGxlIGFycmF5LCBvYmplY3QsIG9yIG5vbi1uZXN0ZWQgdmFsdWVcbiAgICAgICAgbGV0IG9iamVjdCA9IHt9IC8vIGZvcm1hdHRlZCBvYmplY3Qgd2l0aCByZXF1ZXN0ZWQgZmllbGRzXG4gICAgICAgIHN3aXRjaCAoZGF0YXNldEhhbmRsaW5nKSB7XG4gICAgICAgICAgY2FzZSAnc2VxdWVuY2UnOlxuICAgICAgICAgICAgbGV0IHByb21pc2VBcnJheSA9IG5lc3RlZFVuaXRJbnN0YW5jZS5kYXRhc2V0Lm1hcChkb2N1bWVudCA9PiB7XG4gICAgICAgICAgICAgIGxldCBhcmd1bWVudCA9IHt9XG4gICAgICAgICAgICAgIGFyZ3VtZW50WydkYXRhc2V0J10gPSBkb2N1bWVudFxuICAgICAgICAgICAgICByZXR1cm4gbmVzdGVkVW5pdEluc3RhbmNlLmxvb3BJbnNlcnRpb25Qb2ludCh7IHR5cGU6ICdhZ2dyZWdhdGVJbnRvQ29udGVudEFycmF5JywgYXJndW1lbnQgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBsZXQgc3Vic2VxdWVudERhdGFzZXRBcnJheSA9IGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VBcnJheSlcbiAgICAgICAgICAgIG9iamVjdFt1bml0SW5zdGFuY2UuZmllbGROYW1lXSA9IHN1YnNlcXVlbnREYXRhc2V0QXJyYXkubWFwKChzdWJzZXF1ZW50RGF0YXNldCwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZm9ybWF0RGF0YXNldE9mTmVzdGVkVHlwZSh7XG4gICAgICAgICAgICAgICAgc3Vic2VxdWVudERhdGFzZXQsXG4gICAgICAgICAgICAgICAgZGF0YXNldDogbmVzdGVkVW5pdEluc3RhbmNlLmRhdGFzZXRbaW5kZXhdLFxuICAgICAgICAgICAgICAgIG9wdGlvbjoge1xuICAgICAgICAgICAgICAgICAgZXh0cmFmaWVsZDogbmVzdGVkVW5pdEluc3RhbmNlLnJlcXVlc3RPcHRpb24uZXh0cmFmaWVsZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlICduZXN0ZWQnOiAvLyBpZiBmaWVsZCB0cmVhdGVkIGFzIGFuIG9iamVjdCB3aXRoIG5lc3RlZCBmaWVsZHNcbiAgICAgICAgICAgIGxldCBzdWJzZXF1ZW50RGF0YXNldCA9IGF3YWl0IG5lc3RlZFVuaXRJbnN0YW5jZS5sb29wSW5zZXJ0aW9uUG9pbnQoeyB0eXBlOiAnYWdncmVnYXRlSW50b0NvbnRlbnRBcnJheScgfSlcbiAgICAgICAgICAgIG9iamVjdFt1bml0SW5zdGFuY2UuZmllbGROYW1lXSA9IHRoaXMuZm9ybWF0RGF0YXNldE9mTmVzdGVkVHlwZSh7XG4gICAgICAgICAgICAgIHN1YnNlcXVlbnREYXRhc2V0LFxuICAgICAgICAgICAgICBkYXRhc2V0OiBuZXN0ZWRVbml0SW5zdGFuY2UuZGF0YXNldCxcbiAgICAgICAgICAgICAgb3B0aW9uOiB7XG4gICAgICAgICAgICAgICAgZXh0cmFmaWVsZDogbmVzdGVkVW5pdEluc3RhbmNlLnJlcXVlc3RPcHRpb24uZXh0cmFmaWVsZCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBjYXNlICdub25OZXN0ZWQnOlxuICAgICAgICAgICAgLy8gbG9vcGluZyBvdmVyIG5lc3RlZCB1bml0cyBjYW4gbWFuaXB1bGF0ZSB0aGUgZGF0YSBpbiBhIGRpZmZlcmVudCB3YXkgdGhhbiByZWd1bGFyIGFnZ3JlZ2F0aW9uIGludG8gYW4gYXJyYXkuXG4gICAgICAgICAgICBvYmplY3RbdW5pdEluc3RhbmNlLmZpZWxkTmFtZV0gPSBuZXN0ZWRVbml0SW5zdGFuY2UuZGF0YXNldFxuXG4gICAgICAgICAgICBicmVha1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZGVhbCB3aXRoIHJlcXVlc3RlZCBhbGwgZmllbGRzIHdpdGhvdXQgdGhlIGZpZWxkIG9wdGlvbiB3aGVyZSBleGVjdXRpb24gb2Ygc3VibmVzdGVkdW5pdHMgaXMgcmVxdWlyZWQgdG8gbWFuaXB1bGF0ZSB0aGUgZGF0YS5cblxuICAgICAgICByZXR1cm4gb2JqZWN0XG4gICAgICB9LFxuXG4gICAgICBmb3JtYXREYXRhc2V0T2ZOZXN0ZWRUeXBlKHsgc3Vic2VxdWVudERhdGFzZXQsIGRhdGFzZXQsIG9wdGlvbiB9KSB7XG4gICAgICAgIGxldCBvYmplY3QgPSB7fVxuICAgICAgICBzdWJzZXF1ZW50RGF0YXNldC5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgICAgICBvYmplY3QgPSBPYmplY3QuYXNzaWduKG9iamVjdCwgZmllbGQpXG4gICAgICAgIH0pXG4gICAgICAgIGlmIChvcHRpb24uZXh0cmFmaWVsZCkge1xuICAgICAgICAgIC8vIGV4dHJhZmllbGQgb3B0aW9uXG4gICAgICAgICAgb2JqZWN0ID0gT2JqZWN0LmFzc2lnbihkYXRhc2V0LCBvYmplY3QpIC8vIG92ZXJyaWRlIHN1YnNlcXVlbnQgZmllbGRzIGFuZCBrZWVwIHVudHJhY2tlZCBmaWVsZHMuXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9iamVjdFxuICAgICAgfSxcbiAgICB9XG5cbiAgICBPYmplY3Qua2V5cyhzZWxmKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgc2VsZltrZXldID0gc2VsZltrZXldLmJpbmQodGhpc0FyZylcbiAgICB9LCB7fSlcbiAgICByZXR1cm4gc2VsZlxuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZURhdGFzZXQoe1xuICAgIHBhcmVudFJlc3VsdCA9IG51bGwsXG4gICAgLy8gdGhpcy5hcmdzIC0gbmVzdGVkVW5pdCBhcmdzIGZpZWxkLlxuICB9KSB7XG4gICAgLy8gWzJdIHJlcXVpcmUgJiBjaGVjayBjb25kaXRpb25cbiAgICBsZXQgZGF0YXNldFxuICAgIGNvbnN0IGFsZ29yaXRobSA9IHRoaXMuZmlsZS5hbGdvcml0aG0gLy8gcmVzb2x2ZXIgZm9yIGRhdGFzZXRcbiAgICBzd2l0Y2ggKFxuICAgICAgYWxnb3JpdGhtLnR5cGUgLy8gaW4gb3JkZXIgdG8gY2hvb3NlIGhvdyB0byBoYW5kbGUgdGhlIGFsZ29yaXRobSAoYXMgYSBtb2R1bGUgPyBhIGZpbGUgdG8gYmUgaW1wb3J0ZWQgPy4uLilcbiAgICApIHtcbiAgICAgIGNhc2UgJ2ZpbGUnOlxuICAgICAgZGVmYXVsdDpcbiAgICAgICAge1xuICAgICAgICAgIGxldCBtb2R1bGUgPSByZXF1aXJlKGFsZ29yaXRobS5wYXRoKS5kZWZhdWx0XG4gICAgICAgICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICdmdW5jdGlvbicpIG1vZHVsZSA9IG1vZHVsZS5kZWZhdWx0IC8vIGNhc2UgZXM2IG1vZHVsZSBsb2FkZWQgd2l0aCByZXF1aXJlIGZ1bmN0aW9uICh3aWxsIGxvYWQgaXQgYXMgYW4gb2JqZWN0KVxuICAgICAgICAgIGxldCByZXNvbHZlciA9IG1vZHVsZSgpIC8qaW5pdGlhbCBleGVjdXRlIGZvciBzZXR0aW5nIHBhcmFtZXRlciBjb250ZXh0LiovXG4gICAgICAgICAgbGV0IHJlc29sdmVyQXJndW1lbnQgPSBPYmplY3QuYXNzaWduKC4uLlt0aGlzLmFyZ3MsIGFsZ29yaXRobS5hcmd1bWVudF0uZmlsdGVyKEJvb2xlYW4pKSAvLyByZW1vdmUgdW5kZWZpbmVkL251bGwvZmFsc2Ugb2JqZWN0cyBiZWZvcmUgbWVyZ2luZy5cbiAgICAgICAgICBkYXRhc2V0ID0gYXdhaXQgcmVzb2x2ZXIoe1xuICAgICAgICAgICAgcG9ydENsYXNzSW5zdGFuY2U6IHRoaXMucG9ydEFwcEluc3RhbmNlLCAvLyBjb250YWlucyBhbHNvIHBvcnRDbGFzc0luc3RhbmNlLmNvbnRleHQgb2YgdGhlIHJlcXVlc3QuXG4gICAgICAgICAgICBhcmdzOiByZXNvbHZlckFyZ3VtZW50LFxuICAgICAgICAgICAgcGFyZW50UmVzdWx0LCAvLyBwYXJlbnQgZGF0YXNldCByZXN1bHQuXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgICBicmVha1xuICAgIH1cblxuICAgIHJldHVybiBkYXRhc2V0XG4gIH1cbn1cbiJdfQ==