"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.returnDataItemKey = returnDataItemKey;exports.timeout = timeout;exports.executeFunctionReference = executeFunctionReference;exports.executeShellscriptFile = executeShellscriptFile;exports.executeScriptSpawn = executeScriptSpawn;exports.templateRenderingWithInseritonPosition = exports.immediatelyExecuteMiddleware = void 0;var _applyDecoratedDescriptor2 = _interopRequireDefault(require("@babel/runtime/helpers/applyDecoratedDescriptor"));var _path = _interopRequireDefault(require("path"));
var _assert = _interopRequireDefault(require("assert"));
var _child_process = require("child_process");

async function returnDataItemKey({ stageNode, processNode, graph = this, nextProcessData }, { additionalParameter, traverseCallContext }) {var _processNode$properti, _processNode$properti2;
  if ((_processNode$properti = processNode.properties) === null || _processNode$properti === void 0 ? void 0 : _processNode$properti.name) return `${(_processNode$properti2 = processNode.properties) === null || _processNode$properti2 === void 0 ? void 0 : _processNode$properti2.name}`;
}


async function timeout({ stageNode, processNode, graph = this, nextProcessData }, { additionalParameter, traverseCallContext }) {var _processNode$properti3, _processNode$properti4;
  if (typeof ((_processNode$properti3 = processNode.properties) === null || _processNode$properti3 === void 0 ? void 0 : _processNode$properti3.timerDelay) != 'number') throw new Error('• DataItem must have a delay value.');
  let delay = (_processNode$properti4 = processNode.properties) === null || _processNode$properti4 === void 0 ? void 0 : _processNode$properti4.timerDelay;
  return await new Promise((resolve, reject) =>
  setTimeout(() => {var _processNode$properti5;

    resolve((_processNode$properti5 = processNode.properties) === null || _processNode$properti5 === void 0 ? void 0 : _processNode$properti5.name);
  }, delay));

}















async function executeFunctionReference({ stageNode, processNode, graph = this, nextProcessData }, { additionalParameter, traverseCallContext }) {
  let contextPropertyName = 'functionReferenceContext',
  referenceContext = graph.context[contextPropertyName];
  (0, _assert.default)(referenceContext, `• Context "${contextPropertyName}" variable is required to reference functions from graph database strings.`);

  let resource;
  const { resourceArray } = await graph.databaseWrapper.getResource({ concreteDatabase: graph.database, nodeID: processNode.identity });
  if (resourceArray.length > 1) throw new Error(`• Multiple resource relationships are not supported for Process node.`);else
  if (resourceArray.length == 0) return;else
  resource = resourceArray[0];

  (0, _assert.default)(resource.source.labels.includes(graph.schemeReference.nodeLabel.function), `• Unsupported Node type for resource connection.`);
  let functionName = resource.source.properties.functionName || function (e) {throw e;}(new Error(`• function resource must have a "functionName" - ${resource.source.properties.functionName}`));
  let functionCallback = referenceContext[functionName] || function (e) {throw e;}(new Error(`• reference function name "${functionName}" doesn't exist.`));
  try {
    return await functionCallback({ node: processNode, context: graph.context, graph, traverseCallContext });
  } catch (error) {
    console.error(error) && process.exit();
  }
}













async function executeShellscriptFile({ stageNode, processNode, graph = this, nextProcessData }, { additionalParameter, traverseCallContext }) {
  let message = ` _____                          _        
  | ____|__  __ ___   ___  _   _ | |_  ___ 
  |  _|  \\ \\/ // _ \\ / __|| | | || __|/ _ \\
  | |___  >  <|  __/| (__ | |_| || |_|  __/    
  |_____|/_/\\_\\\\___| \\___| \\__,_| \\__|\\___|`;
  let contextPropertyName = 'fileContext',
  referenceContext = graph.context[contextPropertyName];
  (0, _assert.default)(referenceContext, `• Context "${contextPropertyName}" variable is required to reference functions from graph database strings.`);

  let resource;
  const { resourceArray } = await graph.databaseWrapper.getResource({ concreteDatabase: graph.database, nodeID: processNode.identity });
  if (resourceArray.length > 1) throw new Error(`• Multiple resource relationships are not supported for Process node.`);else
  if (resourceArray.length == 0) return;else
  resource = resourceArray[0];
  let scriptReferenceKey = resource.source.properties.referenceKey;
  (0, _assert.default)(scriptReferenceKey, `• resource File node (with key: ${resource.source.properties.key}) must have "referenceKey" property.`);

  try {
    console.log(message);
    let scriptPath = referenceContext[scriptReferenceKey];
    (0, _assert.default)(scriptPath, `• referenceKey of File node (referenceKey = ${scriptReferenceKey}) was not found in the graph context: ${referenceContext} `);
    console.log(`\x1b[45m%s\x1b[0m`, `shellscript path: ${scriptPath}`);
    (0, _child_process.execSync)(`sh ${scriptPath}`, { cwd: _path.default.dirname(scriptPath), shell: true, stdio: ['inherit', 'inherit', 'inherit'] });
  } catch (error) {
    throw error;
    process.exit(1);
  }

  return null;
}








async function executeScriptSpawn({ stageNode, processNode, graph = this, nextProcessData }, { additionalParameter, traverseCallContext }) {
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










const immediatelyExecuteMiddleware = async ({ stageNode, processNode, graph = void 0, nextProcessData }, { additionalParameter, traverseCallContext }) => {var _graph$context$middle;
  const { nextFunction } = additionalParameter;
  let contextPropertyName = 'functionReferenceContext',
  referenceContext = graph.context[contextPropertyName];
  (0, _assert.default)(referenceContext, `• Context "${contextPropertyName}" variable is required to reference functions from graph database strings.`);
  (0, _assert.default)((_graph$context$middle = graph.context.middlewareParameter) === null || _graph$context$middle === void 0 ? void 0 : _graph$context$middle.context, `• Middleware graph traversal relies on context.middlewareParameter.context on the graph context instance`);

  let resource;
  const { resourceArray } = await graph.databaseWrapper.getResource({ concreteDatabase: graph.database, nodeID: processNode.identity });
  if (resourceArray.length > 1) throw new Error(`• Multiple resource relationships are not supported for Process node.`);else
  if (resourceArray.length == 0) return;else
  resource = resourceArray[0];

  (0, _assert.default)(resource.source.labels.includes(graph.schemeReference.nodeLabel.function), `• Unsupported Node type for resource connection.`);
  let functionName = resource.source.properties.functionName || function (e) {throw e;}(new Error(`• function resource must have a "functionName" - ${resource.source.properties.functionName}`));

  let functionCallback = referenceContext[functionName] || function (e) {throw e;}(new Error(`• reference function name "${functionName}" doesn't exist.`));
  try {
    let middleware = await functionCallback({ node: processNode });
    let context = graph.context.middlewareParameter.context,
    next = nextFunction;
    await middleware(context, next);
    return middleware;
  } catch (error) {
    console.error(error) && process.exit();
  }
};exports.immediatelyExecuteMiddleware = immediatelyExecuteMiddleware;


































const templateRenderingWithInseritonPosition = async ({ stageNode, processNode, graph = void 0, nextProcessData }, { additionalParameter, traverseCallContext }) => {
  let context = graph.context.middlewareParameter.context;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NvdXJjZS90cmF2ZXJzYWxJbXBsZW1lbnRhdGlvbi9wcm9jZXNzTm9kZS5qcyJdLCJuYW1lcyI6WyJyZXR1cm5EYXRhSXRlbUtleSIsInN0YWdlTm9kZSIsInByb2Nlc3NOb2RlIiwiZ3JhcGgiLCJuZXh0UHJvY2Vzc0RhdGEiLCJhZGRpdGlvbmFsUGFyYW1ldGVyIiwidHJhdmVyc2VDYWxsQ29udGV4dCIsInByb3BlcnRpZXMiLCJuYW1lIiwidGltZW91dCIsInRpbWVyRGVsYXkiLCJFcnJvciIsImRlbGF5IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJzZXRUaW1lb3V0IiwiZXhlY3V0ZUZ1bmN0aW9uUmVmZXJlbmNlIiwiY29udGV4dFByb3BlcnR5TmFtZSIsInJlZmVyZW5jZUNvbnRleHQiLCJjb250ZXh0IiwicmVzb3VyY2UiLCJyZXNvdXJjZUFycmF5IiwiZGF0YWJhc2VXcmFwcGVyIiwiZ2V0UmVzb3VyY2UiLCJjb25jcmV0ZURhdGFiYXNlIiwiZGF0YWJhc2UiLCJub2RlSUQiLCJpZGVudGl0eSIsImxlbmd0aCIsInNvdXJjZSIsImxhYmVscyIsImluY2x1ZGVzIiwic2NoZW1lUmVmZXJlbmNlIiwibm9kZUxhYmVsIiwiZnVuY3Rpb24iLCJmdW5jdGlvbk5hbWUiLCJmdW5jdGlvbkNhbGxiYWNrIiwibm9kZSIsImVycm9yIiwiY29uc29sZSIsInByb2Nlc3MiLCJleGl0IiwiZXhlY3V0ZVNoZWxsc2NyaXB0RmlsZSIsIm1lc3NhZ2UiLCJzY3JpcHRSZWZlcmVuY2VLZXkiLCJyZWZlcmVuY2VLZXkiLCJrZXkiLCJsb2ciLCJzY3JpcHRQYXRoIiwiY3dkIiwicGF0aCIsImRpcm5hbWUiLCJzaGVsbCIsInN0ZGlvIiwiZXhlY3V0ZVNjcmlwdFNwYXduIiwiY2hpbGRQcm9jZXNzIiwiY29tbWFuZCIsImFyZ3VtZW50Iiwiam9pbiIsIm9wdGlvbiIsIkpTT04iLCJzdHJpbmdpZnkiLCJzdGF0dXMiLCJpbW1lZGlhdGVseUV4ZWN1dGVNaWRkbGV3YXJlIiwibmV4dEZ1bmN0aW9uIiwibWlkZGxld2FyZVBhcmFtZXRlciIsIm1pZGRsZXdhcmUiLCJuZXh0IiwidGVtcGxhdGVSZW5kZXJpbmdXaXRoSW5zZXJpdG9uUG9zaXRpb24iLCJjbGllbnRTaWRlUGF0aCIsInRlbXBsYXRlUGF0aCIsImZpbGVQYXRoIiwicmVuZGVyZWRDb250ZW50Iiwic2NoZW1hIiwidGhpc0FyZyIsInNlbGYiLCJleGVjdXRpb25MZXZlbCIsImluaXRpYWxpemVOZXN0ZWRVbml0IiwibmVzdGVkVW5pdEtleSIsImFkZGl0aW9uYWxDaGlsZE5lc3RlZFVuaXQiLCJwYXRoUG9pbnRlcktleSIsInBhcmVudCIsIm5lc3RlZFVuaXRJbnN0YW5jZSIsInJlcXVlc3RPcHRpb24iLCJwb3J0QXBwSW5zdGFuY2UiLCJyZXF1ZXN0IiwiYm9keSIsImZpZWxkQXJyYXkiLCJmaWVsZCIsImZpbmQiLCJmaWVsZE5hbWUiLCJ1bml0SW5zdGFuY2UiLCJkYXRhc2V0IiwicmVzb2x2ZURhdGFzZXQiLCJwYXJlbnRSZXN1bHQiLCJzY2hlbWFNb2RlIiwiYXNzZXJ0Iiwibm90RXF1YWwiLCJ1bmRlZmluZWQiLCJkYXRhc2V0SGFuZGxpbmciLCJBcnJheSIsImlzQXJyYXkiLCJjaGlsZHJlbiIsIm9iamVjdCIsInByb21pc2VBcnJheSIsIm1hcCIsImRvY3VtZW50IiwibG9vcEluc2VydGlvblBvaW50IiwidHlwZSIsInN1YnNlcXVlbnREYXRhc2V0QXJyYXkiLCJhbGwiLCJzdWJzZXF1ZW50RGF0YXNldCIsImluZGV4IiwiZm9ybWF0RGF0YXNldE9mTmVzdGVkVHlwZSIsImV4dHJhZmllbGQiLCJmb3JFYWNoIiwiT2JqZWN0IiwiYXNzaWduIiwia2V5cyIsImJpbmQiLCJhbGdvcml0aG0iLCJmaWxlIiwibW9kdWxlIiwicmVxdWlyZSIsImRlZmF1bHQiLCJyZXNvbHZlciIsInJlc29sdmVyQXJndW1lbnQiLCJhcmdzIiwiZmlsdGVyIiwiQm9vbGVhbiIsInBvcnRDbGFzc0lu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LE9BQU8sR0FBRyxNQUFNaUMsUUFBUSxDQUFDO0FBQ3ZCSyxZQUFBQSxpQkFBaUIsRUFBRSxLQUFLOUMsZUFERDtBQUV2QjJDLFlBQUFBLElBQUksRUFBRUQsZ0JBRmlCO0FBR3ZCaEMsWUFBQUEsWUFIdUIsRUFBRCxDQUF4Qjs7QUFLRDtBQUNELGNBaEJKOzs7QUFtQkEsV0FBT0YsT0FBUDtBQUNEO0FBQ0YsQ0E3SkQiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnXG5pbXBvcnQgeyBleGVjLCBleGVjU3luYywgc3Bhd24sIHNwYXduU3luYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXR1cm5EYXRhSXRlbUtleSh7IHN0YWdlTm9kZSwgcHJvY2Vzc05vZGUsIGdyYXBoID0gdGhpcywgbmV4dFByb2Nlc3NEYXRhIH0sIHsgYWRkaXRpb25hbFBhcmFtZXRlciwgdHJhdmVyc2VDYWxsQ29udGV4dCB9KSB7XG4gIGlmIChwcm9jZXNzTm9kZS5wcm9wZXJ0aWVzPy5uYW1lKSByZXR1cm4gYCR7cHJvY2Vzc05vZGUucHJvcGVydGllcz8ubmFtZX1gXG59XG5cbi8vIGltcGxlbWVudGF0aW9uIGRlbGF5cyBwcm9taXNlcyBmb3IgdGVzdGluZyBgaXRlcmF0ZUNvbm5lY3Rpb25gIG9mIHByb21pc2VzIGUuZy4gYGFsbFByb21pc2VgLCBgcmFjZUZpcnN0UHJvbWlzZWAsIGV0Yy5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0aW1lb3V0KHsgc3RhZ2VOb2RlLCBwcm9jZXNzTm9kZSwgZ3JhcGggPSB0aGlzLCBuZXh0UHJvY2Vzc0RhdGEgfSwgeyBhZGRpdGlvbmFsUGFyYW1ldGVyLCB0cmF2ZXJzZUNhbGxDb250ZXh0IH0pIHtcbiAgaWYgKHR5cGVvZiBwcm9jZXNzTm9kZS5wcm9wZXJ0aWVzPy50aW1lckRlbGF5ICE9ICdudW1iZXInKSB0aHJvdyBuZXcgRXJyb3IoJ+KAoiBEYXRhSXRlbSBtdXN0IGhhdmUgYSBkZWxheSB2YWx1ZS4nKVxuICBsZXQgZGVsYXkgPSBwcm9jZXNzTm9kZS5wcm9wZXJ0aWVzPy50aW1lckRlbGF5XG4gIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgLy8gY29uc29sZS5sb2coYCR7ZGVsYXl9bXMgcGFzc2VkIGZvciBrZXkgJHtwcm9jZXNzTm9kZS5rZXl9LmApIC8vIGRlYnVnXG4gICAgICByZXNvbHZlKHByb2Nlc3NOb2RlLnByb3BlcnRpZXM/Lm5hbWUpXG4gICAgfSwgZGVsYXkpLFxuICApXG59XG5cbi8qKlxuICogUmVsaWVzIG9uIGZ1bmN0aW9uIHJlZmVyZW5jZSBjb25jZXB0IC0gd2hlcmUgYSBmdW5jdGlvbiBpcyBjYWxsZWQgZnJvbSB0aGUgZ3JhcGggdXNpbmcgYSBub2RlIHByb3BlcnR5IHRoYXQgaG9sZHMgaXQncyBuYW1lLCBhbmQgYSBjb250ZXh0IG9iamVjdCBwYXNzZWQgdG8gdGhlIGdyYXBoIHRyYXZlcnNlciwgaG9sZGluZyB0aGUgZnVuY3Rpb25zIG1hcC5cbiAqIGBwcm9jZXNzRGF0YWAgaW1wbGVtZW50YXRpb24gb2YgYGdyYXBoVHJhdmVyc2FsYCBtb2R1bGVcbiAqIGV4ZWN1dGUgZnVuY3Rpb25zIHRocm91Z2ggYSBzdHJpbmcgcmVmZXJlbmNlIGZyb20gdGhlIGdyYXBoIGRhdGFiYXNlIHRoYXQgbWF0Y2ggdGhlIGtleSBvZiB0aGUgYXBwbGljYXRpb24gcmVmZXJlbmNlIGNvbnRleHQgb2JqZWN0XG4gKiBOb3RlOiBjcmVhdGluZyBhIHNpbWlsYXIgaW1wbGVtZW50YXRpb24gdGhhdCB3b3VsZCByZXR1cm4gb25seSB0aGUgZnVuY3Rpb25zIGlzIG5vIGRpZmZlcmVudCB0aGFuIHJldHVybm5pbmcgdGhlIG5hbWVzIG9mIHRoZSBmdW5jdGlvbiwgYW5kIHRoZW4gdXNlIHRoZSBncmFwaCByZXN1bHQgYXJyYXkgb3V0c2lkZSB0aGUgdHJhdmVyc2FsIHRvIHJldHJpZXZlIHRoZSBmdW5jdGlvbiByZWZlcmVuY2VzIGZyb20gYW4gb2JqZWN0LlxuXG5Vc2VkIGZvcjpcbiAgLSB1c2VkIGZvciBleGVjdXRpbmcgdGFza3MgYW5kIGNoZWNrcy9jb25kaXRpb25zXG4gIC0gTWlkZGxld2FyZTpcbiAgICBBcHByb2FjaGVzIGZvciBtaWRkbGV3YXJlIGFnZ3JlZ2F0aW9uOiBcbiAgICAtIENyZWF0ZXMgbWlkZGxld2FyZSBhcnJheSBmcm9tIGdyYXBoLSAgVGhlIGdyYXBoIHRyYXZlcnNhbCBAcmV0dXJuIHtBcnJheSBvZiBPYmplY3RzfSB3aGVyZSBlYWNoIG9iamVjdCBjb250YWlucyBpbnN0cnVjdGlvbiBzZXR0aW5ncyB0byBiZSB1c2VkIHRocm91Z2ggYW4gaW1wbGVtZW50aW5nIG1vZHVsZSB0byBhZGQgdG8gYSBjaGFpbiBvZiBtaWRkbGV3YXJlcy4gXG4gICAgLSByZXR1cm4gbWlkZGxld2FyZSByZWZlcmVuY2UgbmFtZXMsIGFuZCB0aGVuIG1hdGNoaW5nIHRoZSBuYW1lcyB0byBmdW5jdGlvbiBvdXRzaWRlIHRoZSB0cmF2ZXJzYWwuXG4gICAgLSBFeGVjdXRpbmcgZ2VuZXJhdG9yIGZ1bmN0aW9ucyB3aXRoIG5vZGUgYXJndW1lbnRzIHRoYXQgcHJvZHVjZSBtaWRkbGV3YXJlIGZ1bmN0aW9ucy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4ZWN1dGVGdW5jdGlvblJlZmVyZW5jZSh7IHN0YWdlTm9kZSwgcHJvY2Vzc05vZGUsIGdyYXBoID0gdGhpcywgbmV4dFByb2Nlc3NEYXRhIH0sIHsgYWRkaXRpb25hbFBhcmFtZXRlciwgdHJhdmVyc2VDYWxsQ29udGV4dCB9KSB7XG4gIGxldCBjb250ZXh0UHJvcGVydHlOYW1lID0gJ2Z1bmN0aW9uUmVmZXJlbmNlQ29udGV4dCcsIC8vIFRPRE86IGFmdGVyIG1pZ3JhdGluZyB0byBvd24gcmVwb3NpdG9yeSwgdXNlIFN5bWJvbHMgaW5zdGVhZCBvZiBzdHJpbmcga2V5cyBhbmQgZXhwb3J0IHRoZW0gZm9yIGNsaWVudCB1c2FnZS5cbiAgICByZWZlcmVuY2VDb250ZXh0ID0gZ3JhcGguY29udGV4dFtjb250ZXh0UHJvcGVydHlOYW1lXVxuICBhc3NlcnQocmVmZXJlbmNlQ29udGV4dCwgYOKAoiBDb250ZXh0IFwiJHtjb250ZXh0UHJvcGVydHlOYW1lfVwiIHZhcmlhYmxlIGlzIHJlcXVpcmVkIHRvIHJlZmVyZW5jZSBmdW5jdGlvbnMgZnJvbSBncmFwaCBkYXRhYmFzZSBzdHJpbmdzLmApXG5cbiAgbGV0IHJlc291cmNlXG4gIGNvbnN0IHsgcmVzb3VyY2VBcnJheSB9ID0gYXdhaXQgZ3JhcGguZGF0YWJhc2VXcmFwcGVyLmdldFJlc291cmNlKHsgY29uY3JldGVEYXRhYmFzZTogZ3JhcGguZGF0YWJhc2UsIG5vZGVJRDogcHJvY2Vzc05vZGUuaWRlbnRpdHkgfSlcbiAgaWYgKHJlc291cmNlQXJyYXkubGVuZ3RoID4gMSkgdGhyb3cgbmV3IEVycm9yKGDigKIgTXVsdGlwbGUgcmVzb3VyY2UgcmVsYXRpb25zaGlwcyBhcmUgbm90IHN1cHBvcnRlZCBmb3IgUHJvY2VzcyBub2RlLmApXG4gIGVsc2UgaWYgKHJlc291cmNlQXJyYXkubGVuZ3RoID09IDApIHJldHVyblxuICBlbHNlIHJlc291cmNlID0gcmVzb3VyY2VBcnJheVswXVxuXG4gIGFzc2VydChyZXNvdXJjZS5zb3VyY2UubGFiZWxzLmluY2x1ZGVzKGdyYXBoLnNjaGVtZVJlZmVyZW5jZS5ub2RlTGFiZWwuZnVuY3Rpb24pLCBg4oCiIFVuc3VwcG9ydGVkIE5vZGUgdHlwZSBmb3IgcmVzb3VyY2UgY29ubmVjdGlvbi5gKVxuICBsZXQgZnVuY3Rpb25OYW1lID0gcmVzb3VyY2Uuc291cmNlLnByb3BlcnRpZXMuZnVuY3Rpb25OYW1lIHx8IHRocm93IG5ldyBFcnJvcihg4oCiIGZ1bmN0aW9uIHJlc291cmNlIG11c3QgaGF2ZSBhIFwiZnVuY3Rpb25OYW1lXCIgLSAke3Jlc291cmNlLnNvdXJjZS5wcm9wZXJ0aWVzLmZ1bmN0aW9uTmFtZX1gKVxuICBsZXQgZnVuY3Rpb25DYWxsYmFjayA9IHJlZmVyZW5jZUNvbnRleHRbZnVuY3Rpb25OYW1lXSB8fCB0aHJvdyBuZXcgRXJyb3IoYOKAoiByZWZlcmVuY2UgZnVuY3Rpb24gbmFtZSBcIiR7ZnVuY3Rpb25OYW1lfVwiIGRvZXNuJ3QgZXhpc3QuYClcbiAgdHJ5IHtcbiAgICByZXR1cm4gYXdhaXQgZnVuY3Rpb25DYWxsYmFjayh7IG5vZGU6IHByb2Nlc3NOb2RlLCBjb250ZXh0OiBncmFwaC5jb250ZXh0LCBncmFwaCwgdHJhdmVyc2VDYWxsQ29udGV4dCB9KVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpICYmIHByb2Nlc3MuZXhpdCgpXG4gIH1cbn1cblxuLypcbiBcbiAgIF9fX18gICAgICAgICAgICBfICAgICAgIF8gICAgIF9fX19fICAgICAgICAgICAgICAgICAgICAgXyAgIF8gICAgICAgICAgICAgXG4gIC8gX19ffCAgX19fIF8gX18oXylfIF9fIHwgfF8gIHwgX19fX3xfICBfX19fXyAgX19fIF8gICBffCB8XyhfKSBfX18gIF8gX18gIFxuICBcXF9fXyBcXCAvIF9ffCAnX198IHwgJ18gXFx8IF9ffCB8ICBffCBcXCBcXC8gLyBfIFxcLyBfX3wgfCB8IHwgX198IHwvIF8gXFx8ICdfIFxcIFxuICAgX19fKSB8IChfX3wgfCAgfCB8IHxfKSB8IHxfICB8IHxfX18gPiAgPCAgX18vIChfX3wgfF98IHwgfF98IHwgKF8pIHwgfCB8IHxcbiAgfF9fX18vIFxcX19ffF98ICB8X3wgLl9fLyBcXF9ffCB8X19fX18vXy9cXF9cXF9fX3xcXF9fX3xcXF9fLF98XFxfX3xffFxcX19fL3xffCB8X3xcbiAgICAgICAgICAgICAgICAgICAgfF98ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gUmVsaWVzIG9uIGZ1bmN0aW9uIHJlZmVyZW5jZSBjb25jZXB0LlxuKi9cblxuLy8gRXhlY3V0ZSB0YXNrIHNjcmlwdCBpbiB0aGUgc2FtZSBwcm9jZXNzIChub2RlanMgY2hpbGRwcm9jZXNzLmV4ZWNTeW5jKSB1c2luZyBhIHJlZmVyZW5jZSBzY3JpcHRQYXRoIHByb3BlcnR5LlxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4ZWN1dGVTaGVsbHNjcmlwdEZpbGUoeyBzdGFnZU5vZGUsIHByb2Nlc3NOb2RlLCBncmFwaCA9IHRoaXMsIG5leHRQcm9jZXNzRGF0YSB9LCB7IGFkZGl0aW9uYWxQYXJhbWV0ZXIsIHRyYXZlcnNlQ2FsbENvbnRleHQgfSkge1xuICBsZXQgbWVzc2FnZSA9IGAgX19fX18gICAgICAgICAgICAgICAgICAgICAgICAgIF8gICAgICAgIFxuICB8IF9fX198X18gIF9fIF9fXyAgIF9fXyAgXyAgIF8gfCB8XyAgX19fIFxuICB8ICBffCAgXFxcXCBcXFxcLyAvLyBfIFxcXFwgLyBfX3x8IHwgfCB8fCBfX3wvIF8gXFxcXFxuICB8IHxfX18gID4gIDx8ICBfXy98IChfXyB8IHxffCB8fCB8X3wgIF9fLyAgICBcbiAgfF9fX19ffC9fL1xcXFxfXFxcXFxcXFxfX198IFxcXFxfX198IFxcXFxfXyxffCBcXFxcX198XFxcXF9fX3xgXG4gIGxldCBjb250ZXh0UHJvcGVydHlOYW1lID0gJ2ZpbGVDb250ZXh0JyxcbiAgICByZWZlcmVuY2VDb250ZXh0ID0gZ3JhcGguY29udGV4dFtjb250ZXh0UHJvcGVydHlOYW1lXVxuICBhc3NlcnQocmVmZXJlbmNlQ29udGV4dCwgYOKAoiBDb250ZXh0IFwiJHtjb250ZXh0UHJvcGVydHlOYW1lfVwiIHZhcmlhYmxlIGlzIHJlcXVpcmVkIHRvIHJlZmVyZW5jZSBmdW5jdGlvbnMgZnJvbSBncmFwaCBkYXRhYmFzZSBzdHJpbmdzLmApXG5cbiAgbGV0IHJlc291cmNlXG4gIGNvbnN0IHsgcmVzb3VyY2VBcnJheSB9ID0gYXdhaXQgZ3JhcGguZGF0YWJhc2VXcmFwcGVyLmdldFJlc291cmNlKHsgY29uY3JldGVEYXRhYmFzZTogZ3JhcGguZGF0YWJhc2UsIG5vZGVJRDogcHJvY2Vzc05vZGUuaWRlbnRpdHkgfSlcbiAgaWYgKHJlc291cmNlQXJyYXkubGVuZ3RoID4gMSkgdGhyb3cgbmV3IEVycm9yKGDigKIgTXVsdGlwbGUgcmVzb3VyY2UgcmVsYXRpb25zaGlwcyBhcmUgbm90IHN1cHBvcnRlZCBmb3IgUHJvY2VzcyBub2RlLmApXG4gIGVsc2UgaWYgKHJlc291cmNlQXJyYXkubGVuZ3RoID09IDApIHJldHVyblxuICBlbHNlIHJlc291cmNlID0gcmVzb3VyY2VBcnJheVswXVxuICBsZXQgc2NyaXB0UmVmZXJlbmNlS2V5ID0gcmVzb3VyY2Uuc291cmNlLnByb3BlcnRpZXMucmVmZXJlbmNlS2V5XG4gIGFzc2VydChzY3JpcHRSZWZlcmVuY2VLZXksIGDigKIgcmVzb3VyY2UgRmlsZSBub2RlICh3aXRoIGtleTogJHtyZXNvdXJjZS5zb3VyY2UucHJvcGVydGllcy5rZXl9KSBtdXN0IGhhdmUgXCJyZWZlcmVuY2VLZXlcIiBwcm9wZXJ0eS5gKVxuXG4gIHRyeSB7XG4gICAgY29uc29sZS5sb2cobWVzc2FnZSlcbiAgICBsZXQgc2NyaXB0UGF0aCA9IHJlZmVyZW5jZUNvbnRleHRbc2NyaXB0UmVmZXJlbmNlS2V5XVxuICAgIGFzc2VydChzY3JpcHRQYXRoLCBg4oCiIHJlZmVyZW5jZUtleSBvZiBGaWxlIG5vZGUgKHJlZmVyZW5jZUtleSA9ICR7c2NyaXB0UmVmZXJlbmNlS2V5fSkgd2FzIG5vdCBmb3VuZCBpbiB0aGUgZ3JhcGggY29udGV4dDogJHtyZWZlcmVuY2VDb250ZXh0fSBgKVxuICAgIGNvbnNvbGUubG9nKGBcXHgxYls0NW0lc1xceDFiWzBtYCwgYHNoZWxsc2NyaXB0IHBhdGg6ICR7c2NyaXB0UGF0aH1gKVxuICAgIGV4ZWNTeW5jKGBzaCAke3NjcmlwdFBhdGh9YCwgeyBjd2Q6IHBhdGguZGlybmFtZShzY3JpcHRQYXRoKSwgc2hlbGw6IHRydWUsIHN0ZGlvOiBbJ2luaGVyaXQnLCAnaW5oZXJpdCcsICdpbmhlcml0J10gfSlcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB0aHJvdyBlcnJvclxuICAgIHByb2Nlc3MuZXhpdCgxKVxuICB9XG4gIC8vIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCA1MDApKSAvLyB3YWl0IHggc2Vjb25kcyBiZWZvcmUgbmV4dCBzY3JpcHQgZXhlY3V0aW9uIC8vIGltcG9ydGFudCB0byBwcmV2ZW50ICd1bmFibGUgdG8gcmUtb3BlbiBzdGRpbicgZXJyb3IgYmV0d2VlbiBzaGVsbHMuXG4gIHJldHVybiBudWxsXG59XG5cbi8qKlxuICBSdW4gY2hpbGRwcm9jZXNzIHN5bmNobm9sb3VzIHNwYXduIGNvbW1hbmQ6IFxuICBSZXF1aXJlZCBwcm9wZXJ0aWVzIG9uIHByb2Nlc3Mgbm9kZTogXG4gIEBwYXJhbSB7U3RyaW5nfSBjb21tYW5kXG4gIEBwYXJhbSB7U3RyaW5nW119IGFyZ3VtZW50XG4gIEBwYXJhbSB7SnNvbiBzdHJpbmdpZmllcyBzdHJpbmd9IG9wdGlvblxuKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleGVjdXRlU2NyaXB0U3Bhd24oeyBzdGFnZU5vZGUsIHByb2Nlc3NOb2RlLCBncmFwaCA9IHRoaXMsIG5leHRQcm9jZXNzRGF0YSB9LCB7IGFkZGl0aW9uYWxQYXJhbWV0ZXIsIHRyYXZlcnNlQ2FsbENvbnRleHQgfSkge1xuICBsZXQgY2hpbGRQcm9jZXNzXG4gIHRyeSB7XG4gICAgbGV0IGNvbW1hbmQgPSBwcm9jZXNzTm9kZS5wcm9wZXJ0aWVzLmNvbW1hbmQsXG4gICAgICBhcmd1bWVudCA9IHByb2Nlc3NOb2RlLnByb3BlcnRpZXMuYXJndW1lbnQuam9pbignICcpLFxuICAgICAgb3B0aW9uID0gSlNPTi5zdHJpbmdpZnkocHJvY2Vzc05vZGUucHJvcGVydGllcy5vcHRpb24pXG4gICAgY29uc29sZS5sb2coYFxceDFiWzQ1bSVzXFx4MWJbMG1gLCBgJHtjb21tYW5kfSAke2FyZ3VtZW50fWApXG4gICAgY2hpbGRQcm9jZXNzID0gc3Bhd25TeW5jKGNvbW1hbmQsIGFyZ3VtZW50LCBvcHRpb24pXG4gICAgaWYgKGNoaWxkUHJvY2Vzcy5zdGF0dXMgPiAwKSB0aHJvdyBjaGlsZFByb2Nlc3MuZXJyb3JcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBwcm9jZXNzLmV4aXQoY2hpbGRQcm9jZXNzLnN0YXR1cylcbiAgfVxufVxuXG4vKlxuICAgX18gIF9fIF8gICAgIF8gICAgIF8gXyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gIHwgIFxcLyAgKF8pIF9ffCB8IF9ffCB8IHwgX19fX18gICAgICBfX19fIF8gXyBfXyBfX18gXG4gIHwgfFxcL3wgfCB8LyBfYCB8LyBfYCB8IHwvIF8gXFwgXFwgL1xcIC8gLyBfYCB8ICdfXy8gXyBcXFxuICB8IHwgIHwgfCB8IChffCB8IChffCB8IHwgIF9fL1xcIFYgIFYgLyAoX3wgfCB8IHwgIF9fL1xuICB8X3wgIHxffF98XFxfXyxffFxcX18sX3xffFxcX19ffCBcXF8vXFxfLyBcXF9fLF98X3wgIFxcX19ffFxuICBJbW1lZGlhdGVseSBleGVjdXRlIG1pZGRsZXdhcmVcbiAgTm90ZTogQ2hlY2sgZ3JhcGhJbnRlcmNlcHRpb24gbWV0aG9kIFwiaGFuZGxlTWlkZGxld2FyZU5leHRDYWxsXCJcbiovXG5leHBvcnQgY29uc3QgaW1tZWRpYXRlbHlFeGVjdXRlTWlkZGxld2FyZSA9IGFzeW5jICh7IHN0YWdlTm9kZSwgcHJvY2Vzc05vZGUsIGdyYXBoID0gdGhpcywgbmV4dFByb2Nlc3NEYXRhIH0sIHsgYWRkaXRpb25hbFBhcmFtZXRlciwgdHJhdmVyc2VDYWxsQ29udGV4dCB9KSA9PiB7XG4gIGNvbnN0IHsgbmV4dEZ1bmN0aW9uIH0gPSBhZGRpdGlvbmFsUGFyYW1ldGVyXG4gIGxldCBjb250ZXh0UHJvcGVydHlOYW1lID0gJ2Z1bmN0aW9uUmVmZXJlbmNlQ29udGV4dCcsXG4gICAgcmVmZXJlbmNlQ29udGV4dCA9IGdyYXBoLmNvbnRleHRbY29udGV4dFByb3BlcnR5TmFtZV1cbiAgYXNzZXJ0KHJlZmVyZW5jZUNvbnRleHQsIGDigKIgQ29udGV4dCBcIiR7Y29udGV4dFByb3BlcnR5TmFtZX1cIiB2YXJpYWJsZSBpcyByZXF1aXJlZCB0byByZWZlcmVuY2UgZnVuY3Rpb25zIGZyb20gZ3JhcGggZGF0YWJhc2Ugc3RyaW5ncy5gKVxuICBhc3NlcnQoZ3JhcGguY29udGV4dC5taWRkbGV3YXJlUGFyYW1ldGVyPy5jb250ZXh0LCBg4oCiIE1pZGRsZXdhcmUgZ3JhcGggdHJhdmVyc2FsIHJlbGllcyBvbiBjb250ZXh0Lm1pZGRsZXdhcmVQYXJhbWV0ZXIuY29udGV4dCBvbiB0aGUgZ3JhcGggY29udGV4dCBpbnN0YW5jZWApXG5cbiAgbGV0IHJlc291cmNlXG4gIGNvbnN0IHsgcmVzb3VyY2VBcnJheSB9ID0gYXdhaXQgZ3JhcGguZGF0YWJhc2VXcmFwcGVyLmdldFJlc291cmNlKHsgY29uY3JldGVEYXRhYmFzZTogZ3JhcGguZGF0YWJhc2UsIG5vZGVJRDogcHJvY2Vzc05vZGUuaWRlbnRpdHkgfSlcbiAgaWYgKHJlc291cmNlQXJyYXkubGVuZ3RoID4gMSkgdGhyb3cgbmV3IEVycm9yKGDigKIgTXVsdGlwbGUgcmVzb3VyY2UgcmVsYXRpb25zaGlwcyBhcmUgbm90IHN1cHBvcnRlZCBmb3IgUHJvY2VzcyBub2RlLmApXG4gIGVsc2UgaWYgKHJlc291cmNlQXJyYXkubGVuZ3RoID09IDApIHJldHVyblxuICBlbHNlIHJlc291cmNlID0gcmVzb3VyY2VBcnJheVswXVxuXG4gIGFzc2VydChyZXNvdXJjZS5zb3VyY2UubGFiZWxzLmluY2x1ZGVzKGdyYXBoLnNjaGVtZVJlZmVyZW5jZS5ub2RlTGFiZWwuZnVuY3Rpb24pLCBg4oCiIFVuc3VwcG9ydGVkIE5vZGUgdHlwZSBmb3IgcmVzb3VyY2UgY29ubmVjdGlvbi5gKVxuICBsZXQgZnVuY3Rpb25OYW1lID0gcmVzb3VyY2Uuc291cmNlLnByb3BlcnRpZXMuZnVuY3Rpb25OYW1lIHx8IHRocm93IG5ldyBFcnJvcihg4oCiIGZ1bmN0aW9uIHJlc291cmNlIG11c3QgaGF2ZSBhIFwiZnVuY3Rpb25OYW1lXCIgLSAke3Jlc291cmNlLnNvdXJjZS5wcm9wZXJ0aWVzLmZ1bmN0aW9uTmFtZX1gKVxuICAvLyBhIGZ1bmN0aW9uIHRoYXQgY29tcGxpZXMgd2l0aCBncmFwaFRyYXZlcnNhbCBwcm9jZXNzRGF0YSBpbXBsZW1lbnRhdGlvbi5cbiAgbGV0IGZ1bmN0aW9uQ2FsbGJhY2sgPSByZWZlcmVuY2VDb250ZXh0W2Z1bmN0aW9uTmFtZV0gfHwgdGhyb3cgbmV3IEVycm9yKGDigKIgcmVmZXJlbmNlIGZ1bmN0aW9uIG5hbWUgXCIke2Z1bmN0aW9uTmFtZX1cIiBkb2Vzbid0IGV4aXN0LmApXG4gIHRyeSB7XG4gICAgbGV0IG1pZGRsZXdhcmUgPSBhd2FpdCBmdW5jdGlvbkNhbGxiYWNrKHsgbm9kZTogcHJvY2Vzc05vZGUgfSkgLy8gZXhwcmVjdGVkIHRvIHJldHVybiBhIEtvYSBtaWRkbGV3YXJlIGNvbXBseWluZyBmdW5jdGlvbi5cbiAgICBsZXQgY29udGV4dCA9IGdyYXBoLmNvbnRleHQubWlkZGxld2FyZVBhcmFtZXRlci5jb250ZXh0LFxuICAgICAgbmV4dCA9IG5leHRGdW5jdGlvblxuICAgIGF3YWl0IG1pZGRsZXdhcmUoY29udGV4dCwgbmV4dCkgLy8gZXhlY3V0ZSBtaWRkbGV3YXJlXG4gICAgcmV0dXJuIG1pZGRsZXdhcmUgLy8gYWxsb3cgdG8gYWdncmVnYXRlIG1pZGRsZXdhcmUgZnVuY3Rpb24gZm9yIGRlYnVnZ2luZyBwdXJwb3Nlcy5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycm9yKSAmJiBwcm9jZXNzLmV4aXQoKVxuICB9XG59XG5cbi8qXG4gICBfX19fXyAgICAgICAgICAgICAgICAgICAgXyAgICAgICBfICAgICAgIFxuICB8XyAgIF98X18gXyBfXyBfX18gIF8gX18gfCB8IF9fIF98IHxfIF9fXyBcbiAgICB8IHwvIF8gXFwgJ18gYCBfIFxcfCAnXyBcXHwgfC8gX2AgfCBfXy8gXyBcXFxuICAgIHwgfCAgX18vIHwgfCB8IHwgfCB8XykgfCB8IChffCB8IHx8ICBfXy9cbiAgICB8X3xcXF9fX3xffCB8X3wgfF98IC5fXy98X3xcXF9fLF98XFxfX1xcX19ffFxuICAgICAgICAgICAgICAgICAgICAgfF98ICAgICAgICAgICAgICAgICAgICBcbiovXG5cbi8qKlxuICogQHJldHVybiB7U3RyaW5nfSBTdHJpbmcgb2YgcmVuZGVyZWQgSFRNTCBkb2N1bWVudCBjb250ZW50LlxuIFVuZGVyc2NvcmUgdGVtcGxhdGluZyBvcHRpb25zIC0gaHR0cHM6Ly8yYWxpdHkuY29tLzIwMTIvMDYvdW5kZXJzY29yZS10ZW1wbGF0ZXMuaHRtbFxuXG4gIDEuIHRyYXZlcnNlIG5lc3RlZFxuICAyLiBhZ2dyZWdhdGUgaW50byBuZXN0ZWQgYXJyYXlzIChieSBpbnNlcnRpb24gcG9zaXRpb24ga2V5cykuXG4gIDMuIHJlbmRlciBjdXJyZW50IG5vZGUgdGVtcGxhdGUgd2l0aCBpbnNldGlvbiBwb3NpdGlvbiBjb250ZW50LlxuICA0LiBcblxuICBTZXJ2ZXItc2lkZSB0ZW1wbGF0ZSBzeXN0ZW0gKHJ1bi10aW1lIHN1YnN0aXR1dGlvbiBoYXBwZW5zIG9uIHRoZSB3ZWIgc2VydmVyKTogXG4gICAgLSBUZW1wbGF0ZSByZXNvdXJjZTogdGVtcGxhdGUgZmlsZSB3aXRoIGluc2VydGlvbiBwb2ludHMuXG4gICAgLSBDb250ZW50IHJlc291cmNlICh0ZW1wbGF0ZSBwYXJ0cyk6IEFyZ3VtbmV0cyBwYXNzZWQgdG8gdGhlIHBhcnNlZCB0ZW1wbGF0ZSBmdW5jdGlvbi4gXG4gICAgLSBUZW1wbGF0ZSBlbmdpbmUvcHJvY2Vzc2luZy9yZW5kZW5pbmcgZWxlbWVudC9tb2R1bGU6IHVuZGVyc2NvcmUudGVtcGxhdGUgXG5cbiAgc2VydmVyLXNpZGUgamF2YXNjcmlwdCB0aGF0IGlzIGxvY2F0ZWQgaW4gdGhlIHRlbXBsYXRlcywgaXMgZXhlY3V0ZWQuIFJlbmRlcmluZyB0ZW1wbGF0ZSByZXF1aXJlcyBhbiBvYmplY3Qgb2YgZnVuY3Rpb25zIGZvciBlYWNoIGluc2V0aW9uIHBvc2l0aW9uIGtleS5cbiAgV2hlcmU6XG4gICAgLSBpbnNlcnQgb2JqZWN0IGZ1bmN0aW9ucyBhcmUgY2FsbGVkIGFuZCBleHBlY3QgdG8gcmV0dXJuIGEgc3RyaW5nLiBGdW5jdGlvbnMgcmVwcmVzZW50LSB0aGUgYWxnb3JpdGhtcyB1c2VkIHRvIGRlYWwgd2l0aCBjb250ZW50IHZhbHVlIGFuZCBhZGQgaXQgdG8gdGhlIGRvY3VtZW50IGluIGEgc3BlY2lmaWMgcG9zaXRpb24sXG4gICAgICB3aGljaCB3aWxsIHJlY2VpdmUgdGhlIHBhcmFtZXRlcnMgdGhhdCBjYW4gY2hhbmdlIGl0J3MgYmVoYXZpb3IuIFVzaW5nIGEgZnVuY3Rpb24gYWxsb3dzIGZvciBjcmVhdGluZyBzcGVjaWZpYyBsb2dpYyBmb3IgZWFjaCBpbnNldGlvbiBwb2ludC5cbiAgICAtIEVhY2ggaW5zZXJ0aW9uIHBvc2l0aW9uIGlzIGRpc3Rpbmd1aXNoZWQgYnkgdGhlIGtleXMgb2YgdGhlIGluc2VydCBvYmplY3QuIFxuICAgIC0gQ29udGVudCB2YWx1ZSAoU3RyaW5nIHwgQXJyYXkgfCBPYmplY3QpIC0gd2hpY2ggaW5zZXJ0IGZ1bmN0aW9uIGlzIGluaXRpYWxpemVkIHdpdGgsIGFuZCBoYW5kbGVzIGl0LiBcblxuICAvLyBUT0RPOiBkZWFsIHdpdGggcG9zdCByZW5kZXJpbmcgcHJvY2Vzc2luZyBhbGdvcml0aG1zLCB3aGVuIHJlcXVpcmVkLlxuICAvLyBUT0RPOiBkZWFsIHdpdGggd3JhcHBpbmcgbGF5b3V0cyBlLmcuIGxheW91dEVsZW1lbnQ6ICd3ZWJhcHAtbGF5b3V0LWxpc3QnXG4gKi9cbmV4cG9ydCBjb25zdCB0ZW1wbGF0ZVJlbmRlcmluZ1dpdGhJbnNlcml0b25Qb3NpdGlvbiA9IGFzeW5jICh7IHN0YWdlTm9kZSwgcHJvY2Vzc05vZGUsIGdyYXBoID0gdGhpcywgbmV4dFByb2Nlc3NEYXRhIH0sIHsgYWRkaXRpb25hbFBhcmFtZXRlciwgdHJhdmVyc2VDYWxsQ29udGV4dCB9KSA9PiB7XG4gIGxldCBjb250ZXh0ID0gZ3JhcGguY29udGV4dC5taWRkbGV3YXJlUGFyYW1ldGVyLmNvbnRleHRcbiAgYXNzZXJ0KGNvbnRleHQuY2xpZW50U2lkZVBhdGgsIFwi4oCiIGNsaWVudFNpZGVQYXRoIGNhbm5vdCBiZSB1bmRlZmluZWQuIGkuZS4gcHJldmlvdXMgbWlkZGxld2FyZXMgc2hvdWxkJ3ZlIHNldCBpdFwiKVxuICBsZXQgdGVtcGxhdGVQYXRoID0gcGF0aC5qb2luKGNvbnRleHQuY2xpZW50U2lkZVBhdGgsIG5vZGUuZmlsZVBhdGgpXG5cbiAgcmV0dXJuIHJlbmRlcmVkQ29udGVudFxufVxuXG4vKlxuICAgX19fXyAgX19fX18gX19fXyAgX19fXyAgX19fX18gX19fXyAgICBfICBfX19fXyBfX19fXyBfX19fICBcbiAgfCAgXyBcXHwgX19fX3wgIF8gXFx8ICBfIFxcfCBfX19fLyBfX198ICAvIFxcfF8gICBffCBfX19ffCAgXyBcXCBcbiAgfCB8IHwgfCAgX3wgfCB8XykgfCB8XykgfCAgX3x8IHwgICAgIC8gXyBcXCB8IHwgfCAgX3wgfCB8IHwgfFxuICB8IHxffCB8IHxfX198ICBfXy98ICBfIDx8IHxfX3wgfF9fXyAvIF9fXyBcXHwgfCB8IHxfX198IHxffCB8XG4gIHxfX19fL3xfX19fX3xffCAgIHxffCBcXF9cXF9fX19fXFxfX19fL18vICAgXFxfXFxffCB8X19fX198X19fXy8gXG4gIFJlcXVpcmVzIHJlZmFjdG9yaW5nIGFuZCBtaWdyYXRpb24gXG4qL1xuXG4vKlxuVE9ETzogYXMgdGhlcmVgeiBpcyBhbiBBUEkgU2NoZW1hLCBhIGRhdGFiYXNlIHNjaGVtYSBjYW4gbWFrZSBjb250ZW50IGV4dHJlbWVseSBkeW5hbWljLiAtRGF0YWJhc2Ugc2NoZW1hIGlzIGRpZmZlcmVudCBmcm9tIEFQSSBTY2hlbWEuICAgICAgICAgXG5cbiAgIF9fXyAgX19ffCB8X18gICBfX18gXyBfXyBfX18gICBfXyBfIFxuICAvIF9ffC8gX198ICdfIFxcIC8gXyBcXCAnXyBgIF8gXFwgLyBfYCB8XG4gIFxcX18gXFwgKF9ffCB8IHwgfCAgX18vIHwgfCB8IHwgfCAoX3wgfFxuICB8X19fL1xcX19ffF98IHxffFxcX19ffF98IHxffCB8X3xcXF9fLF98XG4gQVBJIFNjaGVtYVxuICAoV2hpbGUgdGhlIGRhdGFiYXNlIG1vZGVscyBhcmUgc2VwYXJhdGUgaW4gdGhlaXIgb3duIGZ1bmN0aW9ucyBvciBjb3VsZCBiZSBleHBvc2VkIHRocm91Z2ggYSBjbGFzcyBtb2R1bGUpXG5cbiAgLSBSZXNvbHZlciBmdW5jdGlvbiA9IGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGRhdGEuXG4gIC0gRGF0YSBsb2FkZXIgPSBtb2R1bGUgdGhhdCBhZ2dyZWdhdGVzIGR1cGxpY2F0ZSBjYWxscy4gU29sdmluZyB0aGUgbisxIHByb2JsZW0sIHdoZXJlIGVhY2ggcXVlcnkgaGFzIGEgc3Vic2VxdWVudCBxdWVyeSwgbGluZWFyIGdyYXBoLiBUbyBub2RlanMgaXQgdXNlcyBuZXh0VGljayBmdW5jdGlvbiB0byBhbmFseXNlIHRoZSBwcm9taXNlcyBiZWZvcmUgdGhlaXIgZXhlY3V0aW9uIGFuZCBwcmV2ZW50IG11bHRpcGxlIHJvdW5kIHRyaXBzIHRvIHRoZSBzZXJ2ZXIgZm9yIHRoZSBzYW1lIGRhdGEuXG4gIC0gTWFwcGluZyAtIHRocm91Z2ggcm9zb2x2ZXIgZnVuY3Rpb25zLlxuICAtIFNjaGVtYSA9IGlzIHRoZSBzdHJ1Y3R1cmUgJiByZWxhdGlvbnNoaXBzIG9mIHRoZSBhcGkgZGF0YS4gaS5lLiBkZWZpbmVzIGhvdyBhIGNsaWVudCBjYW4gZmV0Y2ggYW5kIHVwZGF0ZSBkYXRhLlxuICAgICAgZWFjaCBzY2hlbWEgaGFzIGFwaSBlbnRyeXBvaW50cy4gRWFjaCBmaWVsZCBjb3JyZXNwb25kcyB0byBhIHJlc29sdmVyIGZ1bmN0aW9uLlxuICBEYXRhIGZldGNoaW5nIGNvbXBsZXhpdHkgYW5kIGRhdGEgc3RydWN0dXJpbmcgaXMgaGFuZGxlZCBieSBzZXJ2ZXIgc2lkZSByYXRoZXIgdGhhbiBjbGllbnQuXG5cbiAgMyB0eXBlcyBvZiBwb3NzaWJsZSBhcGkgYWN0aW9uczogXG4gIC0gUXVlcnlcbiAgLSBNdXRhdGlvblxuICAtIFN1YnNjcmlwdGlvbiAtIGNyZWF0ZXMgYSBzdGVhZHkgY29ubmVjdGlvbiB3aXRoIHRoZSBzZXJ2ZXIuXG5cbiAgRmV0Y2hpbmcgYXBwcm9hY2hlczogXG4gIOKAoiBJbXBlcmF0aXZlIGZldGNoaW5nOiBcbiAgICAgIC0gY29uc3RydWN0cyAmIHNlbmRzIEhUVFAgcmVxdWVzdCwgZS5nLiB1c2luZyBqcyBmZXRjaC5cbiAgICAgIC0gcmVjZWl2ZSAmIHBhcnNlIHNlcnZlciByZXNwb25zZS5cbiAgICAgIC0gc3RvcmUgZGF0YSBsb2NhbGx5LCBlLmcuIGluIG1lbW9yeSBvciBwZXJzaXN0ZW50LiBcbiAgICAgIC0gZGlzcGxheSBVSS5cbiAg4oCiIERlY2xhcmF0aXZlIGZldGNoaW5nIGUuZy4gdXNpbmcgR3JhcGhRTCBjbGllbnRzOiBcbiAgICAgIC0gRGVzY3JpYmUgZGF0YSByZXF1aXJlbWVudHMuXG4gICAgICAtIERpc3BsYXkgaW5mb3JtYXRpb24gaW4gdGhlIFVJLlxuXG4gIFJlcXVlc3Q6IFxuICB7XG4gICAgICBhY3Rpb246IHF1ZXJ5LFxuICAgICAgZW50cnlwb2ludDoge1xuICAgICAgICAgIGtleTogXCJBcnRpY2xlXCJcbiAgICAgIH0sXG4gICAgICBmdW5jdGlvbjoge1xuICAgICAgICAgIG5hbWU6IFwic2luZ2xlXCIsXG4gICAgICAgICAgYXJnczoge1xuICAgICAgICAgICAgICBrZXk6IFwiYXJ0aWNsZTFcIlxuICAgICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBmaWVsZDogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgICAga2V5bmFtZTogXCJ0aXRsZVwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgIGtleW5hbWU6IFwicGFyYWdyYXBoXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAga2V5bmFtZTogXCJhdXRob3JzXCJcbiAgICAgICAgICB9LFxuICAgICAgXVxuICB9XG5cbiAgUmVzcG9uc2UgOlxuICB7XG4gICAgICBkYXRhOiB7XG4gICAgICAgICAgdGl0bGU6IFwiLi4uXCIsXG4gICAgICAgICAgcGFyYWdyYXBoOiAnLi4uJyxcbiAgICAgICAgICBhdXRob3I6IHtcbiAgICAgICAgICAgICAgbmFtZTogJy4uLicsXG4gICAgICAgICAgICAgIGFnZTogMjBcbiAgICAgICAgICB9XG4gICAgICB9XG4gIH1cblxuXG4gIE5lc3RlZCBVbml0IGV4ZWN1dGlvbiBzdGVwczogIFxu4oCiIFxuKi9cblxubGV0IHNjaGVtYSA9ICgpID0+IHtcbiAgLyoqXG4gICAqIEltcGxlbWVudGF0aW9uIHR5cGUgYWdncmVnYXRlSW50b0NvbnRlbnRBcnJheVxuICAgKi9cbiAgLyogZXhtcGxlIHJlcXVlc3QgYm9keTogXG57XG4gICAgXCJmaWVsZE5hbWVcIjogXCJhcnRpY2xlXCIsXG4gICAgXCJmaWVsZFwiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIFwiZmllbGROYW1lXCI6IFwidGl0bGVcIixcbiAgICAgICAgICAgIFwiZmllbGRcIjogW11cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgXCJmaWVsZE5hbWVcIjogXCJwYXJhZ3JhcGhcIixcbiAgICAgICAgICAgIFwiZmllbGRcIjogW11cbiAgICAgICAgfVxuICAgIF0sXG4gICAgXCJzY2hlbWFNb2RlXCI6IFwibm9uU3RyaWN0XCIsIC8vIGFsbG93IGVtcHR5IGRhdGFzZXRzIGZvciBzcGVjaWZpZWQgZmllbGRzIGluIHRoZSBuZXN0ZWQgdW5pdCBzY2hlbWEuXG4gICAgXCJleHRyYWZpZWxkXCI6IHRydWUgLy8gaW5jbHVkZXMgZmllbGRzIHRoYXQgYXJlIG5vdCBleHRyYWN0ZWQgdXNpbmcgdGhlIHNjaGVtYS5cbn0gKi9cbiAgLy8gY29uc3QgeyBhZGQsIGV4ZWN1dGUsIGNvbmRpdGlvbmFsLCBleGVjdXRpb25MZXZlbCB9ID0gcmVxdWlyZSgnQGRlcGVuZGVuY3kvY29tbW9uUGF0dGVybi9zb3VyY2UvZGVjb3JhdG9yVXRpbGl0eS5qcycpXG4gIGZ1bmN0aW9uIHNjaGVtYSh7IHRoaXNBcmcgfSkge1xuICAgIC8vIGZ1bmN0aW9uIHdyYXBwZXIgdG8gc2V0IHRoaXNBcmcgb24gaW1wbGVtZW50YWlvbiBvYmplY3QgZnVuY3Rpb25zLlxuXG4gICAgbGV0IHNlbGYgPSB7XG4gICAgICBAZXhlY3V0aW9uTGV2ZWwoKVxuICAgICAgYXN5bmMgaW5pdGlhbGl6ZU5lc3RlZFVuaXQoeyBuZXN0ZWRVbml0S2V5LCBhZGRpdGlvbmFsQ2hpbGROZXN0ZWRVbml0ID0gW10sIHBhdGhQb2ludGVyS2V5ID0gbnVsbCwgcGFyZW50ID0gdGhpcywgYXJndW1lbnQgPSB7fSB9KSB7XG4gICAgICAgIC8vIEVudHJ5cG9pbnQgSW5zdGFuY2VcbiAgICAgICAgLy8gZXh0cmFjdCByZXF1ZXN0IGRhdGEgYWN0aW9uIGFyZ3VtZW50cy4gYXJndW1lbnRzIGZvciBhIHF1ZXJ5L211dGF0aW9uL3N1YnNjcmlwdGlvbi5cbiAgICAgICAgaWYgKHRoaXMuZXhlY3V0aW9uTGV2ZWwgPT0gJ3RvcExldmVsJykge1xuICAgICAgICAgIG5lc3RlZFVuaXRJbnN0YW5jZS5yZXF1ZXN0T3B0aW9uID0gdGhpcy5wb3J0QXBwSW5zdGFuY2UuY29udGV4dC5yZXF1ZXN0LmJvZHlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBjaGlsZC9uZXN0ZWRcbiAgICAgICAgICBsZXQgZmllbGRBcnJheSA9IHBhcmVudC5yZXF1ZXN0T3B0aW9uLmZpZWxkIC8vIG9iamVjdCBhcnJheVxuICAgICAgICAgIGlmICgoZmllbGRBcnJheSAmJiBmaWVsZEFycmF5Lmxlbmd0aCA9PSAwKSB8fCAhZmllbGRBcnJheSkge1xuICAgICAgICAgICAgbmVzdGVkVW5pdEluc3RhbmNlLnJlcXVlc3RPcHRpb24gPSB7fSAvLyBjb250aW51ZSB0byByZXNvbHZlIGRhdGFzZXQgYW5kIGFsbCBzdWJzZXF1ZW50IE5lc3RlZHVuaXRzIG9mIG5lc3RlZCBkYXRhc2V0IGluIGNhc2UgYXJlIG9iamVjdHMuXG4gICAgICAgICAgfSBlbHNlIGlmIChmaWVsZEFycmF5KSB7XG4gICAgICAgICAgICBuZXN0ZWRVbml0SW5zdGFuY2UucmVxdWVzdE9wdGlvbiA9IGZpZWxkQXJyYXkuZmluZChmaWVsZCA9PiBmaWVsZC5maWVsZE5hbWUgPT0gdW5pdEluc3RhbmNlLmZpZWxkTmFtZSkgLy8gd2hlcmUgZmllbGROYW1lcyBtYXRjaFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNoZWNrIGlmIGZpZWxkbmFtZSBleGlzdHMgaW4gdGhlIHJlcXVlc3Qgb3B0aW9uLCBpZiBub3Qgc2tpcCBuZXN0ZWQgdW5pdC5cbiAgICAgICAgaWYgKCFuZXN0ZWRVbml0SW5zdGFuY2UucmVxdWVzdE9wdGlvbikgcmV0dXJuIC8vIGZpZWxkTmFtZSB3YXMgbm90IHNwZWNpZmllZCBpbiB0aGUgcGFyZW50IG5lc3RlZFVuaXQsIHRoZXJlZm9yZSBza2lwIGl0cyBleGVjdXRpb25cbiAgICAgICAgbmVzdGVkVW5pdEluc3RhbmNlLmRhdGFzZXQgPSBhd2FpdCB1bml0SW5zdGFuY2UucmVzb2x2ZURhdGFzZXQoeyBwYXJlbnRSZXN1bHQ6IGFyZ3VtZW50LmRhdGFzZXQgfHwgcGFyZW50LmRhdGFzZXQgfSlcbiAgICAgICAgLy8gVE9ETzogRml4IHJlcXVlc3RPcHRpb24gLSBpLmUuIGFib3ZlIGl0IGlzIHVzZWQgdG8gcGFzcyBcImZpZWxkXCIgb3B0aW9uIG9ubHkuXG4gICAgICAgIGlmICh0aGlzLnBvcnRBcHBJbnN0YW5jZS5jb250ZXh0LnJlcXVlc3QuYm9keS5zY2hlbWFNb2RlID09ICdub25TdHJpY3QnKSB7XG4gICAgICAgICAgLy8gRG9uJ3QgZW5mb3JjZSBzdHJpY3Qgc2NoZW1hLCBpLmUuIGFsbCBuZXN0ZWQgY2hpbGRyZW4gc2hvdWxkIGV4aXN0LlxuICAgICAgICAgIC8vIGlmKG5lc3RlZFVuaXRJbnN0YW5jZS5kYXRhc2V0KSBuZXN0ZWRVbml0SW5zdGFuY2UuZGF0YXNldCA9IG51bGwgLy8gVE9ETzogdGhyb3dzIGVycm9yIGFzIG5leHQgaXQgaXMgYmVpbmcgdXNlZC5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhc3NlcnQubm90RXF1YWwobmVzdGVkVW5pdEluc3RhbmNlLmRhdGFzZXQsIHVuZGVmaW5lZCwgYOKAoiByZXR1cm5lZCBkYXRhc2V0IGNhbm5vdCBiZSB1bmRlZmluZWQgZm9yIGZpZWxkTmFtZTogJHt1bml0SW5zdGFuY2UuZmllbGROYW1lfS5gKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gY2hlY2sgdHlwZSBvZiBkYXRhc2V0XG4gICAgICAgIGxldCBkYXRhc2V0SGFuZGxpbmdcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkobmVzdGVkVW5pdEluc3RhbmNlLmRhdGFzZXQpICYmIG5lc3RlZFVuaXRJbnN0YW5jZS5jaGlsZHJlbiAmJiBuZXN0ZWRVbml0SW5zdGFuY2UuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgIC8vIGFycmF5XG4gICAgICAgICAgZGF0YXNldEhhbmRsaW5nID0gJ3NlcXVlbmNlJ1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBuZXN0ZWRVbml0SW5zdGFuY2UuZGF0YXNldCA9PSAnb2JqZWN0JyAmJiBuZXN0ZWRVbml0SW5zdGFuY2UuY2hpbGRyZW4gJiYgbmVzdGVkVW5pdEluc3RhbmNlLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAvLyBvYmplY3RcbiAgICAgICAgICBkYXRhc2V0SGFuZGxpbmcgPSAnbmVzdGVkJ1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIG5vbi1uZXN0ZWQgdmFsdWVcbiAgICAgICAgICBkYXRhc2V0SGFuZGxpbmcgPSAnbm9uTmVzdGVkJ1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaGFuZGxlIGFycmF5LCBvYmplY3QsIG9yIG5vbi1uZXN0ZWQgdmFsdWVcbiAgICAgICAgbGV0IG9iamVjdCA9IHt9IC8vIGZvcm1hdHRlZCBvYmplY3Qgd2l0aCByZXF1ZXN0ZWQgZmllbGRzXG4gICAgICAgIHN3aXRjaCAoZGF0YXNldEhhbmRsaW5nKSB7XG4gICAgICAgICAgY2FzZSAnc2VxdWVuY2UnOlxuICAgICAgICAgICAgbGV0IHByb21pc2VBcnJheSA9IG5lc3RlZFVuaXRJbnN0YW5jZS5kYXRhc2V0Lm1hcChkb2N1bWVudCA9PiB7XG4gICAgICAgICAgICAgIGxldCBhcmd1bWVudCA9IHt9XG4gICAgICAgICAgICAgIGFyZ3VtZW50WydkYXRhc2V0J10gPSBkb2N1bWVudFxuICAgICAgICAgICAgICByZXR1cm4gbmVzdGVkVW5pdEluc3RhbmNlLmxvb3BJbnNlcnRpb25Qb2ludCh7IHR5cGU6ICdhZ2dyZWdhdGVJbnRvQ29udGVudEFycmF5JywgYXJndW1lbnQgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBsZXQgc3Vic2VxdWVudERhdGFzZXRBcnJheSA9IGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VBcnJheSlcbiAgICAgICAgICAgIG9iamVjdFt1bml0SW5zdGFuY2UuZmllbGROYW1lXSA9IHN1YnNlcXVlbnREYXRhc2V0QXJyYXkubWFwKChzdWJzZXF1ZW50RGF0YXNldCwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZm9ybWF0RGF0YXNldE9mTmVzdGVkVHlwZSh7XG4gICAgICAgICAgICAgICAgc3Vic2VxdWVudERhdGFzZXQsXG4gICAgICAgICAgICAgICAgZGF0YXNldDogbmVzdGVkVW5pdEluc3RhbmNlLmRhdGFzZXRbaW5kZXhdLFxuICAgICAgICAgICAgICAgIG9wdGlvbjoge1xuICAgICAgICAgICAgICAgICAgZXh0cmFmaWVsZDogbmVzdGVkVW5pdEluc3RhbmNlLnJlcXVlc3RPcHRpb24uZXh0cmFmaWVsZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlICduZXN0ZWQnOiAvLyBpZiBmaWVsZCB0cmVhdGVkIGFzIGFuIG9iamVjdCB3aXRoIG5lc3RlZCBmaWVsZHNcbiAgICAgICAgICAgIGxldCBzdWJzZXF1ZW50RGF0YXNldCA9IGF3YWl0IG5lc3RlZFVuaXRJbnN0YW5jZS5sb29wSW5zZXJ0aW9uUG9pbnQoeyB0eXBlOiAnYWdncmVnYXRlSW50b0NvbnRlbnRBcnJheScgfSlcbiAgICAgICAgICAgIG9iamVjdFt1bml0SW5zdGFuY2UuZmllbGROYW1lXSA9IHRoaXMuZm9ybWF0RGF0YXNldE9mTmVzdGVkVHlwZSh7XG4gICAgICAgICAgICAgIHN1YnNlcXVlbnREYXRhc2V0LFxuICAgICAgICAgICAgICBkYXRhc2V0OiBuZXN0ZWRVbml0SW5zdGFuY2UuZGF0YXNldCxcbiAgICAgICAgICAgICAgb3B0aW9uOiB7XG4gICAgICAgICAgICAgICAgZXh0cmFmaWVsZDogbmVzdGVkVW5pdEluc3RhbmNlLnJlcXVlc3RPcHRpb24uZXh0cmFmaWVsZCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBjYXNlICdub25OZXN0ZWQnOlxuICAgICAgICAgICAgLy8gbG9vcGluZyBvdmVyIG5lc3RlZCB1bml0cyBjYW4gbWFuaXB1bGF0ZSB0aGUgZGF0YSBpbiBhIGRpZmZlcmVudCB3YXkgdGhhbiByZWd1bGFyIGFnZ3JlZ2F0aW9uIGludG8gYW4gYXJyYXkuXG4gICAgICAgICAgICBvYmplY3RbdW5pdEluc3RhbmNlLmZpZWxkTmFtZV0gPSBuZXN0ZWRVbml0SW5zdGFuY2UuZGF0YXNldFxuXG4gICAgICAgICAgICBicmVha1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZGVhbCB3aXRoIHJlcXVlc3RlZCBhbGwgZmllbGRzIHdpdGhvdXQgdGhlIGZpZWxkIG9wdGlvbiB3aGVyZSBleGVjdXRpb24gb2Ygc3VibmVzdGVkdW5pdHMgaXMgcmVxdWlyZWQgdG8gbWFuaXB1bGF0ZSB0aGUgZGF0YS5cblxuICAgICAgICByZXR1cm4gb2JqZWN0XG4gICAgICB9LFxuXG4gICAgICBmb3JtYXREYXRhc2V0T2ZOZXN0ZWRUeXBlKHsgc3Vic2VxdWVudERhdGFzZXQsIGRhdGFzZXQsIG9wdGlvbiB9KSB7XG4gICAgICAgIGxldCBvYmplY3QgPSB7fVxuICAgICAgICBzdWJzZXF1ZW50RGF0YXNldC5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgICAgICBvYmplY3QgPSBPYmplY3QuYXNzaWduKG9iamVjdCwgZmllbGQpXG4gICAgICAgIH0pXG4gICAgICAgIGlmIChvcHRpb24uZXh0cmFmaWVsZCkge1xuICAgICAgICAgIC8vIGV4dHJhZmllbGQgb3B0aW9uXG4gICAgICAgICAgb2JqZWN0ID0gT2JqZWN0LmFzc2lnbihkYXRhc2V0LCBvYmplY3QpIC8vIG92ZXJyaWRlIHN1YnNlcXVlbnQgZmllbGRzIGFuZCBrZWVwIHVudHJhY2tlZCBmaWVsZHMuXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9iamVjdFxuICAgICAgfSxcbiAgICB9XG5cbiAgICBPYmplY3Qua2V5cyhzZWxmKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgc2VsZltrZXldID0gc2VsZltrZXldLmJpbmQodGhpc0FyZylcbiAgICB9LCB7fSlcbiAgICByZXR1cm4gc2VsZlxuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZURhdGFzZXQoe1xuICAgIHBhcmVudFJlc3VsdCA9IG51bGwsXG4gICAgLy8gdGhpcy5hcmdzIC0gbmVzdGVkVW5pdCBhcmdzIGZpZWxkLlxuICB9KSB7XG4gICAgLy8gWzJdIHJlcXVpcmUgJiBjaGVjayBjb25kaXRpb25cbiAgICBsZXQgZGF0YXNldFxuICAgIGNvbnN0IGFsZ29yaXRobSA9IHRoaXMuZmlsZS5hbGdvcml0aG0gLy8gcmVzb2x2ZXIgZm9yIGRhdGFzZXRcbiAgICBzd2l0Y2ggKFxuICAgICAgYWxnb3JpdGhtLnR5cGUgLy8gaW4gb3JkZXIgdG8gY2hvb3NlIGhvdyB0byBoYW5kbGUgdGhlIGFsZ29yaXRobSAoYXMgYSBtb2R1bGUgPyBhIGZpbGUgdG8gYmUgaW1wb3J0ZWQgPy4uLilcbiAgICApIHtcbiAgICAgIGNhc2UgJ2ZpbGUnOlxuICAgICAgZGVmYXVsdDpcbiAgICAgICAge1xuICAgICAgICAgIGxldCBtb2R1bGUgPSByZXF1aXJlKGFsZ29yaXRobS5wYXRoKS5kZWZhdWx0XG4gICAgICAgICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICdmdW5jdGlvbicpIG1vZHVsZSA9IG1vZHVsZS5kZWZhdWx0IC8vIGNhc2UgZXM2IG1vZHVsZSBsb2FkZWQgd2l0aCByZXF1aXJlIGZ1bmN0aW9uICh3aWxsIGxvYWQgaXQgYXMgYW4gb2JqZWN0KVxuICAgICAgICAgIGxldCByZXNvbHZlciA9IG1vZHVsZSgpIC8qaW5pdGlhbCBleGVjdXRlIGZvciBzZXR0aW5nIHBhcmFtZXRlciBjb250ZXh0LiovXG4gICAgICAgICAgbGV0IHJlc29sdmVyQXJndW1lbnQgPSBPYmplY3QuYXNzaWduKC4uLlt0aGlzLmFyZ3MsIGFsZ29yaXRobS5hcmd1bWVudF0uZmlsdGVyKEJvb2xlYW4pKSAvLyByZW1vdmUgdW5kZWZpbmVkL251bGwvZmFsc2Ugb2JqZWN0cyBiZWZvcmUgbWVyZ2luZy5cbiAgICAgICAgICBkYXRhc2V0ID0gYXdhaXQgcmVzb2x2ZXIoe1xuICAgICAgICAgICAgcG9ydENsYXNzSW5zdGFuY2U6IHRoaXMucG9ydEFwcEluc3RhbmNlLCAvLyBjb250YWlucyBhbHNvIHBvcnRDbGFzc0luc3RhbmNlLmNvbnRleHQgb2YgdGhlIHJlcXVlc3QuXG4gICAgICAgICAgICBhcmdzOiByZXNvbHZlckFyZ3VtZW50LFxuICAgICAgICAgICAgcGFyZW50UmVzdWx0LCAvLyBwYXJlbnQgZGF0YXNldCByZXN1bHQuXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgICBicmVha1xuICAgIH1cblxuICAgIHJldHVybiBkYXRhc2V0XG4gIH1cbn1cbiJdfQ==