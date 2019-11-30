"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.returnDataItemKey = returnDataItemKey;exports.timeout = timeout;exports.executeFunctionReference = executeFunctionReference;exports.executeShellscriptFile = executeShellscriptFile;exports.executeScriptSpawn = executeScriptSpawn;exports.immediatelyExecuteMiddleware = void 0;var _applyDecoratedDescriptor2 = _interopRequireDefault(require("@babel/runtime/helpers/applyDecoratedDescriptor"));var _path = _interopRequireDefault(require("path"));
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
  let functionCallback = referenceContext[functionName] || function (e) {throw e;}(new Error(`• reference function name doesn't exist.`));
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

  let functionCallback = referenceContext[functionName] || function (e) {throw e;}(new Error(`• reference function name doesn't exist.`));
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






















async function initializeNestedUnit({ nestedUnitKey, additionalChildNestedUnit = [], pathPointerKey = null }) {


  let view = await nestedUnitInstance.loopInsertionPoint({ type: 'aggregateIntoTemplateObject' });

  (0, _assert.default)(this.portAppInstance.config.clientSidePath, "• clientSidePath cannot be undefined. i.e. previous middlewares should've set it");
  let templatePath = _path.default.join(this.portAppInstance.config.clientSidePath, unitInstance.file.filePath);
  let renderedContent;
  switch (unitInstance.processDataImplementation) {
    default:
    case 'underscoreRendering':
      renderedContent = await this.underscoreRendering({ templatePath, view });
      break;}


  switch (unitInstance.processRenderedContent) {
    case 'wrapJsTag':
      renderedContent = `<script type="module" async>${renderedContent}</script>`;
      break;
    default:}


  return renderedContent;
}

async function underscoreRendering({ templatePath, view }) {

  let templateString = await filesystem.readFileSync(templatePath, 'utf-8');

  const templateArgument = {
    templateController: this,
    context: this.portAppInstance.context,
    Application,
    argument: {} };

  let renderedContent = underscore.template(templateString)(
  Object.assign(
  {},
  templateArgument,
  { view, templateArgument }));


  return renderedContent;
}

function renderedContentString(viewName, viewObject) {

  if (viewObject[viewName] && Array.isArray(viewObject[viewName])) {
    return viewObject[viewName].join('');
  }
}

let traversePort = async function aggregateIntoTemplateObject() {
  let view = {};
  if (this.insertionPoint) {
    for (let insertionPoint of this.insertionPoint) {
      let children = await this.filterAndOrderChildren({ insertionPointKey: insertionPoint.key });
      let subsequent = await this.initializeInsertionPoint({ insertionPoint, children });
      if (!(insertionPoint.name in view)) view[insertionPoint.name] = [];
      Array.prototype.push.apply(view[insertionPoint.name], subsequent);
    }
  }
  return view;
};













































































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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NvdXJjZS90cmF2ZXJzYWxJbXBsZW1lbnRhdGlvbi9wcm9jZXNzTm9kZS5qcyJdLCJuYW1lcyI6WyJyZXR1cm5EYXRhSXRlbUtleSIsInN0YWdlTm9kZSIsInByb2Nlc3NOb2RlIiwiZ3JhcGhJbnN0YW5jZSIsIm5leHRQcm9jZXNzRGF0YSIsImFkZGl0aW9uYWxQYXJhbWV0ZXIiLCJ0cmF2ZXJzZUNhbGxDb250ZXh0IiwicHJvcGVydGllcyIsIm5hbWUiLCJ0aW1lb3V0IiwidGltZXJEZWxheSIsIkVycm9yIiwiZGVsYXkiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInNldFRpbWVvdXQiLCJleGVjdXRlRnVuY3Rpb25SZWZlcmVuY2UiLCJjb250ZXh0UHJvcGVydHlOYW1lIiwicmVmZXJlbmNlQ29udGV4dCIsImNvbnRleHQiLCJyZXNvdXJjZSIsInJlc291cmNlQXJyYXkiLCJkYXRhYmFzZVdyYXBwZXIiLCJnZXRSZXNvdXJjZSIsImNvbmNyZXRlRGF0YWJhc2UiLCJkYXRhYmFzZSIsIm5vZGVJRCIsImlkZW50aXR5IiwibGVuZ3RoIiwic291cmNlIiwibGFiZWxzIiwiaW5jbHVkZXMiLCJzY2hlbWVSZWZlcmVuY2UiLCJub2RlTGFiZWwiLCJmdW5jdGlvbiIsImZ1bmN0aW9uTmFtZSIsImZ1bmN0aW9uQ2FsbGJhY2siLCJub2RlIiwiZXJyb3IiLCJjb25zb2xlIiwicHJvY2VzcyIsImV4aXQiLCJleGVjdXRlU2hlbGxzY3JpcHRGaWxlIiwibWVzc2FnZSIsInNjcmlwdFJlZmVyZW5jZUtleSIsInJlZmVyZW5jZUtleSIsImtleSIsImxvZyIsInNjcmlwdFBhdGgiLCJjd2QiLCJwYXRoIiwiZGlybmFtZSIsInNoZWxsIiwic3RkaW8iLCJleGVjdXRlU2NyaXB0U3Bhd24iLCJjaGlsZFByb2Nlc3MiLCJjb21tYW5kIiwiYXJndW1lbnQiLCJqb2luIiwib3B0aW9uIiwiSlNPTiIsInN0cmluZ2lmeSIsInN0YXR1cyIsImltbWVkaWF0ZWx5RXhlY3V0ZU1pZGRsZXdhcmUiLCJuZXh0RnVuY3Rpb24iLCJtaWRkbGV3YXJlUGFyYW1ldGVyIiwibWlkZGxld2FyZSIsIm5leHQiLCJpbml0aWFsaXplTmVzdGVkVW5pdCIsIm5lc3RlZFVuaXRLZXkiLCJhZGRpdGlvbmFsQ2hpbGROZXN0ZWRVbml0IiwicGF0aFBvaW50ZXJLZXkiLCJ2aWV3IiwibmVzdGVkVW5pdEluc3RhbmNlIiwibG9vcEluc2VydGlvblBvaW50IiwidHlwZSIsInBvcnRBcHBJbnN0YW5jZSIsImNvbmZpZyIsImNsaWVudFNpZGVQYXRoIiwidGVtcGxhdGVQYXRoIiwidW5pdEluc3RhbmNlIiwiZmlsZSIsImZpbGVQYXRoIiwicmVuZGVyZWRDb250ZW50IiwicHJvY2Vzc0RhdGFJbXBsZW1lbnRhdGlvbiIsInVuZGVyc2NvcmVSZW5kZXJpbmciLCJwcm9jZXNzUmVuZGVyZWRDb250ZW50IiwidGVtcGxhdGVTdHJpbmciLCJmaWxlc3lzdGVtIiwicmVhZEZpbGVTeW5jIiwidGVtcGxhdGVBcmd1bWVudCIsInRlbXBsYXRlQ29udHJvbGxlciIsIkFwcGxpY2F0aW9uIiwidW5kZXJzY29yZSIsInRlbXBsYXRlIiwiT2JqZWN0IiwiYXNzaWduIiwicmVuZGVyZWRDb250ZW50U3RyaW5nIiwidmlld05hbWUiLCJ2aWV3T2JqZWN0IiwiQXJyYXkiLCJpc0FycmF5IiwidHJhdmVyc2VQb3J0IiwiYWdncmVnYXRlSW50b1RlbXBsYXRlT2JqZWN0IiwiaW5zZXJ0aW9uUG9pbnQiLCJjaGlsZHJlbiIsImZpbHRlckFuZE9yZGVyQ2hpbGRyZW4iLCJpbnNlcnRpb25Qb2ludEtleSIsInN1YnNlcXVlbnQiLCJpbml0aWFsaXplSW5zZXJ0aW9uUG9pbnQiLCJwcm90b3R5cGUiLCJwdXNoIiwiYXBwbHkiLCJzY2hlbWEiLCJ0aGlzQXJnIiwic2VsZiIsImV4ZWN1dGlvbkxldmVsIiwicGFyZW50IiwicmVxdWVzdE9wdGlvbiIsInJlcXVlc3QiLCJib2R5IiwiZmllbGRBcnJheSIsImZpZWxkIiwiZmluZCIsImZpZWxkTmFtZSIsImRhdGFzZXQiLCJyZXNvbHZlRGF0YXNldCIsInBhcmVudFJlc3VsdCIsInNjaGVtYU1vZGUiLCJhc3NlcnQiLCJub3RFcXVhbCIsInVuZGVmaW5lZCIsImRhdGFzZXRIYW5kbGluZyIsIm9iamVjdCIsInByb21pc2VBcnJheSIsIm1hcCIsImRvY3VtZW50Iiwic3Vic2VxdWVudERhdGFzZXRBcnJheSIsImFsbCIsInN1YnNlcXVlbnREYXRhc2V0IiwiaW5kZXgiLCJmb3JtYXREYXRhc2V0T2ZOZXN0ZWRUeXBlIiwiZXh0cmFmaWVsZCIsImZvckVhY2giLCJrZXlzIiwiYmluZCIsImFsZ29yaXRobSIsIm1vZHVsZSIsInJlcXVpcmUiLCJkZWZhdWx0IiwicmVzb2x2ZXIiLCJyZXNvbHZlckFyZ3VtZW50IiwiYXJncyIsImZpbHRlciIsIkJvb2xlYW4iLCJwb3J0Q2xhc3NJbnN0YW5jZSJdLCJtYXBwaW5ncyI6IjhpQkFBQTtBQUNBO0FBQ0E7O0FBRU8sZUFBZUEsaUJBQWYsQ0FBaUMsRUFBRUMsU0FBRixFQUFhQyxXQUFiLEVBQTBCQyxhQUExQixFQUF5Q0MsZUFBekMsRUFBakMsRUFBNkYsRUFBRUMsbUJBQUYsRUFBdUJDLG1CQUF2QixFQUE3RixFQUEySTtBQUNoSiwrQkFBSUosV0FBVyxDQUFDSyxVQUFoQiwwREFBSSxzQkFBd0JDLElBQTVCLEVBQWtDLE9BQVEsR0FBRCwwQkFBR04sV0FBVyxDQUFDSyxVQUFmLDJEQUFHLHVCQUF3QkMsSUFBSyxFQUF2QztBQUNuQzs7O0FBR00sZUFBZUMsT0FBZixDQUF1QixFQUFFUixTQUFGLEVBQWFDLFdBQWIsRUFBMEJDLGFBQTFCLEVBQXlDQyxlQUF6QyxFQUF2QixFQUFtRixFQUFFQyxtQkFBRixFQUF1QkMsbUJBQXZCLEVBQW5GLEVBQWlJO0FBQ3RJLE1BQUksa0NBQU9KLFdBQVcsQ0FBQ0ssVUFBbkIsMkRBQU8sdUJBQXdCRyxVQUEvQixLQUE2QyxRQUFqRCxFQUEyRCxNQUFNLElBQUlDLEtBQUosQ0FBVSxx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Q0FBQ0MsTUFBUCxDQUFjLEdBQUcsQ0FBQyxLQUFLd0QsSUFBTixFQUFZTixTQUFTLENBQUN6RixRQUF0QixFQUFnQ2dHLE1BQWhDLENBQXVDQyxPQUF2QyxDQUFqQixDQUF2QjtBQUNBN0IsVUFBQUEsT0FBTyxHQUFHLE1BQU15QixRQUFRLENBQUM7QUFDdkJLLFlBQUFBLGlCQUFpQixFQUFFLEtBQUsvRSxlQUREO0FBRXZCNEUsWUFBQUEsSUFBSSxFQUFFRCxnQkFGaUI7QUFHdkJ4QixZQUFBQSxZQUh1QixFQUFELENBQXhCOztBQUtEO0FBQ0QsY0FoQko7OztBQW1CQSxXQUFPRixPQUFQO0FBQ0Q7QUFDRixDQTdKRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCdcbmltcG9ydCB7IGV4ZWMsIGV4ZWNTeW5jLCBzcGF3biwgc3Bhd25TeW5jIH0gZnJvbSAnY2hpbGRfcHJvY2VzcydcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJldHVybkRhdGFJdGVtS2V5KHsgc3RhZ2VOb2RlLCBwcm9jZXNzTm9kZSwgZ3JhcGhJbnN0YW5jZSwgbmV4dFByb2Nlc3NEYXRhIH0sIHsgYWRkaXRpb25hbFBhcmFtZXRlciwgdHJhdmVyc2VDYWxsQ29udGV4dCB9KSB7XG4gIGlmIChwcm9jZXNzTm9kZS5wcm9wZXJ0aWVzPy5uYW1lKSByZXR1cm4gYCR7cHJvY2Vzc05vZGUucHJvcGVydGllcz8ubmFtZX1gXG59XG5cbi8vIGltcGxlbWVudGF0aW9uIGRlbGF5cyBwcm9taXNlcyBmb3IgdGVzdGluZyBgaXRlcmF0ZUNvbm5lY3Rpb25gIG9mIHByb21pc2VzIGUuZy4gYGFsbFByb21pc2VgLCBgcmFjZUZpcnN0UHJvbWlzZWAsIGV0Yy5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0aW1lb3V0KHsgc3RhZ2VOb2RlLCBwcm9jZXNzTm9kZSwgZ3JhcGhJbnN0YW5jZSwgbmV4dFByb2Nlc3NEYXRhIH0sIHsgYWRkaXRpb25hbFBhcmFtZXRlciwgdHJhdmVyc2VDYWxsQ29udGV4dCB9KSB7XG4gIGlmICh0eXBlb2YgcHJvY2Vzc05vZGUucHJvcGVydGllcz8udGltZXJEZWxheSAhPSAnbnVtYmVyJykgdGhyb3cgbmV3IEVycm9yKCfigKIgRGF0YUl0ZW0gbXVzdCBoYXZlIGEgZGVsYXkgdmFsdWUuJylcbiAgbGV0IGRlbGF5ID0gcHJvY2Vzc05vZGUucHJvcGVydGllcz8udGltZXJEZWxheVxuICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKGAke2RlbGF5fW1zIHBhc3NlZCBmb3Iga2V5ICR7cHJvY2Vzc05vZGUua2V5fS5gKSAvLyBkZWJ1Z1xuICAgICAgcmVzb2x2ZShwcm9jZXNzTm9kZS5wcm9wZXJ0aWVzPy5uYW1lKVxuICAgIH0sIGRlbGF5KSxcbiAgKVxufVxuXG4vKipcbiAqIFJlbGllcyBvbiBmdW5jdGlvbiByZWZlcmVuY2UgY29uY2VwdCAtIHdoZXJlIGEgZnVuY3Rpb24gaXMgY2FsbGVkIGZyb20gdGhlIGdyYXBoIHVzaW5nIGEgbm9kZSBwcm9wZXJ0eSB0aGF0IGhvbGRzIGl0J3MgbmFtZSwgYW5kIGEgY29udGV4dCBvYmplY3QgcGFzc2VkIHRvIHRoZSBncmFwaCB0cmF2ZXJzZXIsIGhvbGRpbmcgdGhlIGZ1bmN0aW9ucyBtYXAuXG4gKiBgcHJvY2Vzc0RhdGFgIGltcGxlbWVudGF0aW9uIG9mIGBncmFwaFRyYXZlcnNhbGAgbW9kdWxlXG4gKiBleGVjdXRlIGZ1bmN0aW9ucyB0aHJvdWdoIGEgc3RyaW5nIHJlZmVyZW5jZSBmcm9tIHRoZSBncmFwaCBkYXRhYmFzZSB0aGF0IG1hdGNoIHRoZSBrZXkgb2YgdGhlIGFwcGxpY2F0aW9uIHJlZmVyZW5jZSBjb250ZXh0IG9iamVjdFxuICogTm90ZTogY3JlYXRpbmcgYSBzaW1pbGFyIGltcGxlbWVudGF0aW9uIHRoYXQgd291bGQgcmV0dXJuIG9ubHkgdGhlIGZ1bmN0aW9ucyBpcyBubyBkaWZmZXJlbnQgdGhhbiByZXR1cm5uaW5nIHRoZSBuYW1lcyBvZiB0aGUgZnVuY3Rpb24sIGFuZCB0aGVuIHVzZSB0aGUgZ3JhcGggcmVzdWx0IGFycmF5IG91dHNpZGUgdGhlIHRyYXZlcnNhbCB0byByZXRyaWV2ZSB0aGUgZnVuY3Rpb24gcmVmZXJlbmNlcyBmcm9tIGFuIG9iamVjdC5cblxuVXNlZCBmb3I6XG4gIC0gdXNlZCBmb3IgZXhlY3V0aW5nIHRhc2tzIGFuZCBjaGVja3MvY29uZGl0aW9uc1xuICAtIE1pZGRsZXdhcmU6XG4gICAgQXBwcm9hY2hlcyBmb3IgbWlkZGxld2FyZSBhZ2dyZWdhdGlvbjogXG4gICAgLSBDcmVhdGVzIG1pZGRsZXdhcmUgYXJyYXkgZnJvbSBncmFwaC0gIFRoZSBncmFwaCB0cmF2ZXJzYWwgQHJldHVybiB7QXJyYXkgb2YgT2JqZWN0c30gd2hlcmUgZWFjaCBvYmplY3QgY29udGFpbnMgaW5zdHJ1Y3Rpb24gc2V0dGluZ3MgdG8gYmUgdXNlZCB0aHJvdWdoIGFuIGltcGxlbWVudGluZyBtb2R1bGUgdG8gYWRkIHRvIGEgY2hhaW4gb2YgbWlkZGxld2FyZXMuIFxuICAgIC0gcmV0dXJuIG1pZGRsZXdhcmUgcmVmZXJlbmNlIG5hbWVzLCBhbmQgdGhlbiBtYXRjaGluZyB0aGUgbmFtZXMgdG8gZnVuY3Rpb24gb3V0c2lkZSB0aGUgdHJhdmVyc2FsLlxuICAgIC0gRXhlY3V0aW5nIGdlbmVyYXRvciBmdW5jdGlvbnMgd2l0aCBub2RlIGFyZ3VtZW50cyB0aGF0IHByb2R1Y2UgbWlkZGxld2FyZSBmdW5jdGlvbnMuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleGVjdXRlRnVuY3Rpb25SZWZlcmVuY2UoeyBzdGFnZU5vZGUsIHByb2Nlc3NOb2RlLCBncmFwaEluc3RhbmNlLCBuZXh0UHJvY2Vzc0RhdGEgfSwgeyBhZGRpdGlvbmFsUGFyYW1ldGVyLCB0cmF2ZXJzZUNhbGxDb250ZXh0IH0pIHtcbiAgbGV0IGNvbnRleHRQcm9wZXJ0eU5hbWUgPSAnZnVuY3Rpb25SZWZlcmVuY2VDb250ZXh0JywgLy8gVE9ETzogYWZ0ZXIgbWlncmF0aW5nIHRvIG93biByZXBvc2l0b3J5LCB1c2UgU3ltYm9scyBpbnN0ZWFkIG9mIHN0cmluZyBrZXlzIGFuZCBleHBvcnQgdGhlbSBmb3IgY2xpZW50IHVzYWdlLlxuICAgIHJlZmVyZW5jZUNvbnRleHQgPSBncmFwaEluc3RhbmNlLmNvbnRleHRbY29udGV4dFByb3BlcnR5TmFtZV1cbiAgYXNzZXJ0KHJlZmVyZW5jZUNvbnRleHQsIGDigKIgQ29udGV4dCBcIiR7Y29udGV4dFByb3BlcnR5TmFtZX1cIiB2YXJpYWJsZSBpcyByZXF1aXJlZCB0byByZWZlcmVuY2UgZnVuY3Rpb25zIGZyb20gZ3JhcGggZGF0YWJhc2Ugc3RyaW5ncy5gKVxuXG4gIGxldCByZXNvdXJjZVxuICBjb25zdCB7IHJlc291cmNlQXJyYXkgfSA9IGF3YWl0IGdyYXBoSW5zdGFuY2UuZGF0YWJhc2VXcmFwcGVyLmdldFJlc291cmNlKHsgY29uY3JldGVEYXRhYmFzZTogZ3JhcGhJbnN0YW5jZS5kYXRhYmFzZSwgbm9kZUlEOiBwcm9jZXNzTm9kZS5pZGVudGl0eSB9KVxuICBpZiAocmVzb3VyY2VBcnJheS5sZW5ndGggPiAxKSB0aHJvdyBuZXcgRXJyb3IoYOKAoiBNdWx0aXBsZSByZXNvdXJjZSByZWxhdGlvbnNoaXBzIGFyZSBub3Qgc3VwcG9ydGVkIGZvciBQcm9jZXNzIG5vZGUuYClcbiAgZWxzZSBpZiAocmVzb3VyY2VBcnJheS5sZW5ndGggPT0gMCkgcmV0dXJuXG4gIGVsc2UgcmVzb3VyY2UgPSByZXNvdXJjZUFycmF5WzBdXG5cbiAgYXNzZXJ0KHJlc291cmNlLnNvdXJjZS5sYWJlbHMuaW5jbHVkZXMoZ3JhcGhJbnN0YW5jZS5zY2hlbWVSZWZlcmVuY2Uubm9kZUxhYmVsLmZ1bmN0aW9uKSwgYOKAoiBVbnN1cHBvcnRlZCBOb2RlIHR5cGUgZm9yIHJlc291cmNlIGNvbm5lY3Rpb24uYClcbiAgbGV0IGZ1bmN0aW9uTmFtZSA9IHJlc291cmNlLnNvdXJjZS5wcm9wZXJ0aWVzLmZ1bmN0aW9uTmFtZSB8fCB0aHJvdyBuZXcgRXJyb3IoYOKAoiBmdW5jdGlvbiByZXNvdXJjZSBtdXN0IGhhdmUgYSBcImZ1bmN0aW9uTmFtZVwiIC0gJHtyZXNvdXJjZS5zb3VyY2UucHJvcGVydGllcy5mdW5jdGlvbk5hbWV9YClcbiAgbGV0IGZ1bmN0aW9uQ2FsbGJhY2sgPSByZWZlcmVuY2VDb250ZXh0W2Z1bmN0aW9uTmFtZV0gfHwgdGhyb3cgbmV3IEVycm9yKGDigKIgcmVmZXJlbmNlIGZ1bmN0aW9uIG5hbWUgZG9lc24ndCBleGlzdC5gKVxuICB0cnkge1xuICAgIHJldHVybiBhd2FpdCBmdW5jdGlvbkNhbGxiYWNrKHsgbm9kZTogcHJvY2Vzc05vZGUsIGNvbnRleHQ6IGdyYXBoSW5zdGFuY2UuY29udGV4dCwgZ3JhcGhJbnN0YW5jZSwgdHJhdmVyc2VDYWxsQ29udGV4dCB9KVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpICYmIHByb2Nlc3MuZXhpdCgpXG4gIH1cbn1cblxuLypcbiBcbiAgIF9fX18gICAgICAgICAgICBfICAgICAgIF8gICAgIF9fX19fICAgICAgICAgICAgICAgICAgICAgXyAgIF8gICAgICAgICAgICAgXG4gIC8gX19ffCAgX19fIF8gX18oXylfIF9fIHwgfF8gIHwgX19fX3xfICBfX19fXyAgX19fIF8gICBffCB8XyhfKSBfX18gIF8gX18gIFxuICBcXF9fXyBcXCAvIF9ffCAnX198IHwgJ18gXFx8IF9ffCB8ICBffCBcXCBcXC8gLyBfIFxcLyBfX3wgfCB8IHwgX198IHwvIF8gXFx8ICdfIFxcIFxuICAgX19fKSB8IChfX3wgfCAgfCB8IHxfKSB8IHxfICB8IHxfX18gPiAgPCAgX18vIChfX3wgfF98IHwgfF98IHwgKF8pIHwgfCB8IHxcbiAgfF9fX18vIFxcX19ffF98ICB8X3wgLl9fLyBcXF9ffCB8X19fX18vXy9cXF9cXF9fX3xcXF9fX3xcXF9fLF98XFxfX3xffFxcX19fL3xffCB8X3xcbiAgICAgICAgICAgICAgICAgICAgfF98ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gUmVsaWVzIG9uIGZ1bmN0aW9uIHJlZmVyZW5jZSBjb25jZXB0LlxuKi9cblxuLy8gRXhlY3V0ZSB0YXNrIHNjcmlwdCBpbiB0aGUgc2FtZSBwcm9jZXNzIChub2RlanMgY2hpbGRwcm9jZXNzLmV4ZWNTeW5jKSB1c2luZyBhIHJlZmVyZW5jZSBzY3JpcHRQYXRoIHByb3BlcnR5LlxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4ZWN1dGVTaGVsbHNjcmlwdEZpbGUoeyBzdGFnZU5vZGUsIHByb2Nlc3NOb2RlLCBncmFwaEluc3RhbmNlLCBuZXh0UHJvY2Vzc0RhdGEgfSwgeyBhZGRpdGlvbmFsUGFyYW1ldGVyLCB0cmF2ZXJzZUNhbGxDb250ZXh0IH0pIHtcbiAgbGV0IG1lc3NhZ2UgPSBgIF9fX19fICAgICAgICAgICAgICAgICAgICAgICAgICBfICAgICAgICBcbiAgfCBfX19ffF9fICBfXyBfX18gICBfX18gIF8gICBfIHwgfF8gIF9fXyBcbiAgfCAgX3wgIFxcXFwgXFxcXC8gLy8gXyBcXFxcIC8gX198fCB8IHwgfHwgX198LyBfIFxcXFxcbiAgfCB8X19fICA+ICA8fCAgX18vfCAoX18gfCB8X3wgfHwgfF98ICBfXy8gICAgXG4gIHxfX19fX3wvXy9cXFxcX1xcXFxcXFxcX19ffCBcXFxcX19ffCBcXFxcX18sX3wgXFxcXF9ffFxcXFxfX198YFxuICBsZXQgY29udGV4dFByb3BlcnR5TmFtZSA9ICdmaWxlQ29udGV4dCcsXG4gICAgcmVmZXJlbmNlQ29udGV4dCA9IGdyYXBoSW5zdGFuY2UuY29udGV4dFtjb250ZXh0UHJvcGVydHlOYW1lXVxuICBhc3NlcnQocmVmZXJlbmNlQ29udGV4dCwgYOKAoiBDb250ZXh0IFwiJHtjb250ZXh0UHJvcGVydHlOYW1lfVwiIHZhcmlhYmxlIGlzIHJlcXVpcmVkIHRvIHJlZmVyZW5jZSBmdW5jdGlvbnMgZnJvbSBncmFwaCBkYXRhYmFzZSBzdHJpbmdzLmApXG5cbiAgbGV0IHJlc291cmNlXG4gIGNvbnN0IHsgcmVzb3VyY2VBcnJheSB9ID0gYXdhaXQgZ3JhcGhJbnN0YW5jZS5kYXRhYmFzZVdyYXBwZXIuZ2V0UmVzb3VyY2UoeyBjb25jcmV0ZURhdGFiYXNlOiBncmFwaEluc3RhbmNlLmRhdGFiYXNlLCBub2RlSUQ6IHByb2Nlc3NOb2RlLmlkZW50aXR5IH0pXG4gIGlmIChyZXNvdXJjZUFycmF5Lmxlbmd0aCA+IDEpIHRocm93IG5ldyBFcnJvcihg4oCiIE11bHRpcGxlIHJlc291cmNlIHJlbGF0aW9uc2hpcHMgYXJlIG5vdCBzdXBwb3J0ZWQgZm9yIFByb2Nlc3Mgbm9kZS5gKVxuICBlbHNlIGlmIChyZXNvdXJjZUFycmF5Lmxlbmd0aCA9PSAwKSByZXR1cm5cbiAgZWxzZSByZXNvdXJjZSA9IHJlc291cmNlQXJyYXlbMF1cbiAgbGV0IHNjcmlwdFJlZmVyZW5jZUtleSA9IHJlc291cmNlLnNvdXJjZS5wcm9wZXJ0aWVzLnJlZmVyZW5jZUtleVxuICBhc3NlcnQoc2NyaXB0UmVmZXJlbmNlS2V5LCBg4oCiIHJlc291cmNlIEZpbGUgbm9kZSAod2l0aCBrZXk6ICR7cmVzb3VyY2Uuc291cmNlLnByb3BlcnRpZXMua2V5fSkgbXVzdCBoYXZlIFwicmVmZXJlbmNlS2V5XCIgcHJvcGVydHkuYClcblxuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UpXG4gICAgbGV0IHNjcmlwdFBhdGggPSByZWZlcmVuY2VDb250ZXh0W3NjcmlwdFJlZmVyZW5jZUtleV1cbiAgICBhc3NlcnQoc2NyaXB0UGF0aCwgYOKAoiByZWZlcmVuY2VLZXkgb2YgRmlsZSBub2RlIChyZWZlcmVuY2VLZXkgPSAke3NjcmlwdFJlZmVyZW5jZUtleX0pIHdhcyBub3QgZm91bmQgaW4gdGhlIGdyYXBoSW5zdGFuY2UgY29udGV4dDogJHtyZWZlcmVuY2VDb250ZXh0fSBgKVxuICAgIGNvbnNvbGUubG9nKGBcXHgxYls0NW0lc1xceDFiWzBtYCwgYHNoZWxsc2NyaXB0IHBhdGg6ICR7c2NyaXB0UGF0aH1gKVxuICAgIGV4ZWNTeW5jKGBzaCAke3NjcmlwdFBhdGh9YCwgeyBjd2Q6IHBhdGguZGlybmFtZShzY3JpcHRQYXRoKSwgc2hlbGw6IHRydWUsIHN0ZGlvOiBbJ2luaGVyaXQnLCAnaW5oZXJpdCcsICdpbmhlcml0J10gfSlcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB0aHJvdyBlcnJvclxuICAgIHByb2Nlc3MuZXhpdCgxKVxuICB9XG4gIC8vIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCA1MDApKSAvLyB3YWl0IHggc2Vjb25kcyBiZWZvcmUgbmV4dCBzY3JpcHQgZXhlY3V0aW9uIC8vIGltcG9ydGFudCB0byBwcmV2ZW50ICd1bmFibGUgdG8gcmUtb3BlbiBzdGRpbicgZXJyb3IgYmV0d2VlbiBzaGVsbHMuXG4gIHJldHVybiBudWxsXG59XG5cbi8qKlxuICBSdW4gY2hpbGRwcm9jZXNzIHN5bmNobm9sb3VzIHNwYXduIGNvbW1hbmQ6IFxuICBSZXF1aXJlZCBwcm9wZXJ0aWVzIG9uIHByb2Nlc3Mgbm9kZTogXG4gIEBwYXJhbSB7U3RyaW5nfSBjb21tYW5kXG4gIEBwYXJhbSB7U3RyaW5nW119IGFyZ3VtZW50XG4gIEBwYXJhbSB7SnNvbiBzdHJpbmdpZmllcyBzdHJpbmd9IG9wdGlvblxuKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleGVjdXRlU2NyaXB0U3Bhd24oeyBzdGFnZU5vZGUsIHByb2Nlc3NOb2RlLCBncmFwaEluc3RhbmNlLCBuZXh0UHJvY2Vzc0RhdGEgfSwgeyBhZGRpdGlvbmFsUGFyYW1ldGVyLCB0cmF2ZXJzZUNhbGxDb250ZXh0IH0pIHtcbiAgbGV0IGNoaWxkUHJvY2Vzc1xuICB0cnkge1xuICAgIGxldCBjb21tYW5kID0gcHJvY2Vzc05vZGUucHJvcGVydGllcy5jb21tYW5kLFxuICAgICAgYXJndW1lbnQgPSBwcm9jZXNzTm9kZS5wcm9wZXJ0aWVzLmFyZ3VtZW50LmpvaW4oJyAnKSxcbiAgICAgIG9wdGlvbiA9IEpTT04uc3RyaW5naWZ5KHByb2Nlc3NOb2RlLnByb3BlcnRpZXMub3B0aW9uKVxuICAgIGNvbnNvbGUubG9nKGBcXHgxYls0NW0lc1xceDFiWzBtYCwgYCR7Y29tbWFuZH0gJHthcmd1bWVudH1gKVxuICAgIGNoaWxkUHJvY2VzcyA9IHNwYXduU3luYyhjb21tYW5kLCBhcmd1bWVudCwgb3B0aW9uKVxuICAgIGlmIChjaGlsZFByb2Nlc3Muc3RhdHVzID4gMCkgdGhyb3cgY2hpbGRQcm9jZXNzLmVycm9yXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcHJvY2Vzcy5leGl0KGNoaWxkUHJvY2Vzcy5zdGF0dXMpXG4gIH1cbn1cblxuLypcbiAgIF9fICBfXyBfICAgICBfICAgICBfIF8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICB8ICBcXC8gIChfKSBfX3wgfCBfX3wgfCB8IF9fX19fICAgICAgX19fXyBfIF8gX18gX19fIFxuICB8IHxcXC98IHwgfC8gX2AgfC8gX2AgfCB8LyBfIFxcIFxcIC9cXCAvIC8gX2AgfCAnX18vIF8gXFxcbiAgfCB8ICB8IHwgfCAoX3wgfCAoX3wgfCB8ICBfXy9cXCBWICBWIC8gKF98IHwgfCB8ICBfXy9cbiAgfF98ICB8X3xffFxcX18sX3xcXF9fLF98X3xcXF9fX3wgXFxfL1xcXy8gXFxfXyxffF98ICBcXF9fX3xcbiAgSW1tZWRpYXRlbHkgZXhlY3V0ZSBtaWRkbGV3YXJlXG4gIE5vdGU6IENoZWNrIGdyYXBoSW50ZXJjZXB0aW9uIG1ldGhvZCBcImhhbmRsZU1pZGRsZXdhcmVOZXh0Q2FsbFwiXG4qL1xuZXhwb3J0IGNvbnN0IGltbWVkaWF0ZWx5RXhlY3V0ZU1pZGRsZXdhcmUgPSBhc3luYyAoeyBzdGFnZU5vZGUsIHByb2Nlc3NOb2RlLCBncmFwaEluc3RhbmNlLCBuZXh0UHJvY2Vzc0RhdGEgfSwgeyBhZGRpdGlvbmFsUGFyYW1ldGVyLCB0cmF2ZXJzZUNhbGxDb250ZXh0IH0pID0+IHtcbiAgY29uc3QgeyBuZXh0RnVuY3Rpb24gfSA9IGFkZGl0aW9uYWxQYXJhbWV0ZXJcbiAgbGV0IGNvbnRleHRQcm9wZXJ0eU5hbWUgPSAnZnVuY3Rpb25SZWZlcmVuY2VDb250ZXh0JyxcbiAgICByZWZlcmVuY2VDb250ZXh0ID0gZ3JhcGhJbnN0YW5jZS5jb250ZXh0W2NvbnRleHRQcm9wZXJ0eU5hbWVdXG4gIGFzc2VydChyZWZlcmVuY2VDb250ZXh0LCBg4oCiIENvbnRleHQgXCIke2NvbnRleHRQcm9wZXJ0eU5hbWV9XCIgdmFyaWFibGUgaXMgcmVxdWlyZWQgdG8gcmVmZXJlbmNlIGZ1bmN0aW9ucyBmcm9tIGdyYXBoIGRhdGFiYXNlIHN0cmluZ3MuYClcbiAgYXNzZXJ0KGdyYXBoSW5zdGFuY2UuY29udGV4dC5taWRkbGV3YXJlUGFyYW1ldGVyPy5jb250ZXh0LCBg4oCiIE1pZGRsZXdhcmUgZ3JhcGggdHJhdmVyc2FsIHJlbGllcyBvbiBjb250ZXh0Lm1pZGRsZXdhcmVQYXJhbWV0ZXIuY29udGV4dCBvbiB0aGUgZ3JhcGggY29udGV4dCBpbnN0YW5jZWApXG5cbiAgbGV0IHJlc291cmNlXG4gIGNvbnN0IHsgcmVzb3VyY2VBcnJheSB9ID0gYXdhaXQgZ3JhcGhJbnN0YW5jZS5kYXRhYmFzZVdyYXBwZXIuZ2V0UmVzb3VyY2UoeyBjb25jcmV0ZURhdGFiYXNlOiBncmFwaEluc3RhbmNlLmRhdGFiYXNlLCBub2RlSUQ6IHByb2Nlc3NOb2RlLmlkZW50aXR5IH0pXG4gIGlmIChyZXNvdXJjZUFycmF5Lmxlbmd0aCA+IDEpIHRocm93IG5ldyBFcnJvcihg4oCiIE11bHRpcGxlIHJlc291cmNlIHJlbGF0aW9uc2hpcHMgYXJlIG5vdCBzdXBwb3J0ZWQgZm9yIFByb2Nlc3Mgbm9kZS5gKVxuICBlbHNlIGlmIChyZXNvdXJjZUFycmF5Lmxlbmd0aCA9PSAwKSByZXR1cm5cbiAgZWxzZSByZXNvdXJjZSA9IHJlc291cmNlQXJyYXlbMF1cblxuICBhc3NlcnQocmVzb3VyY2Uuc291cmNlLmxhYmVscy5pbmNsdWRlcyhncmFwaEluc3RhbmNlLnNjaGVtZVJlZmVyZW5jZS5ub2RlTGFiZWwuZnVuY3Rpb24pLCBg4oCiIFVuc3VwcG9ydGVkIE5vZGUgdHlwZSBmb3IgcmVzb3VyY2UgY29ubmVjdGlvbi5gKVxuICBsZXQgZnVuY3Rpb25OYW1lID0gcmVzb3VyY2Uuc291cmNlLnByb3BlcnRpZXMuZnVuY3Rpb25OYW1lIHx8IHRocm93IG5ldyBFcnJvcihg4oCiIGZ1bmN0aW9uIHJlc291cmNlIG11c3QgaGF2ZSBhIFwiZnVuY3Rpb25OYW1lXCIgLSAke3Jlc291cmNlLnNvdXJjZS5wcm9wZXJ0aWVzLmZ1bmN0aW9uTmFtZX1gKVxuICAvLyBhIGZ1bmN0aW9uIHRoYXQgY29tcGxpZXMgd2l0aCBncmFwaFRyYXZlcnNhbCBwcm9jZXNzRGF0YSBpbXBsZW1lbnRhdGlvbi5cbiAgbGV0IGZ1bmN0aW9uQ2FsbGJhY2sgPSByZWZlcmVuY2VDb250ZXh0W2Z1bmN0aW9uTmFtZV0gfHwgdGhyb3cgbmV3IEVycm9yKGDigKIgcmVmZXJlbmNlIGZ1bmN0aW9uIG5hbWUgZG9lc24ndCBleGlzdC5gKVxuICB0cnkge1xuICAgIGxldCBtaWRkbGV3YXJlID0gYXdhaXQgZnVuY3Rpb25DYWxsYmFjayh7IG5vZGU6IHByb2Nlc3NOb2RlIH0pIC8vIGV4cHJlY3RlZCB0byByZXR1cm4gYSBLb2EgbWlkZGxld2FyZSBjb21wbHlpbmcgZnVuY3Rpb24uXG4gICAgbGV0IGNvbnRleHQgPSBncmFwaEluc3RhbmNlLmNvbnRleHQubWlkZGxld2FyZVBhcmFtZXRlci5jb250ZXh0LFxuICAgICAgbmV4dCA9IG5leHRGdW5jdGlvblxuICAgIGF3YWl0IG1pZGRsZXdhcmUoY29udGV4dCwgbmV4dCkgLy8gZXhlY3V0ZSBtaWRkbGV3YXJlXG4gICAgcmV0dXJuIG1pZGRsZXdhcmUgLy8gYWxsb3cgdG8gYWdncmVnYXRlIG1pZGRsZXdhcmUgZnVuY3Rpb24gZm9yIGRlYnVnZ2luZyBwdXJwb3Nlcy5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycm9yKSAmJiBwcm9jZXNzLmV4aXQoKVxuICB9XG59XG5cbi8qXG4gICBfX19fICBfX19fXyBfX19fICBfX19fICBfX19fXyBfX19fICAgIF8gIF9fX19fIF9fX19fIF9fX18gIFxuICB8ICBfIFxcfCBfX19ffCAgXyBcXHwgIF8gXFx8IF9fX18vIF9fX3wgIC8gXFx8XyAgIF98IF9fX198ICBfIFxcIFxuICB8IHwgfCB8ICBffCB8IHxfKSB8IHxfKSB8ICBffHwgfCAgICAgLyBfIFxcIHwgfCB8ICBffCB8IHwgfCB8XG4gIHwgfF98IHwgfF9fX3wgIF9fL3wgIF8gPHwgfF9ffCB8X19fIC8gX19fIFxcfCB8IHwgfF9fX3wgfF98IHxcbiAgfF9fX18vfF9fX19ffF98ICAgfF98IFxcX1xcX19fX19cXF9fX18vXy8gICBcXF9cXF98IHxfX19fX3xfX19fLyBcbiAgUmVxdWlyZXMgcmVmYWN0b3JpbmcgYW5kIG1pZ3JhdGlvbiBcbiovXG4vKlxuICAgX19fX18gICAgICAgICAgICAgICAgICAgIF8gICAgICAgXyAgICAgICBcbiAgfF8gICBffF9fIF8gX18gX19fICBfIF9fIHwgfCBfXyBffCB8XyBfX18gXG4gICAgfCB8LyBfIFxcICdfIGAgXyBcXHwgJ18gXFx8IHwvIF9gIHwgX18vIF8gXFxcbiAgICB8IHwgIF9fLyB8IHwgfCB8IHwgfF8pIHwgfCAoX3wgfCB8fCAgX18vXG4gICAgfF98XFxfX198X3wgfF98IHxffCAuX18vfF98XFxfXyxffFxcX19cXF9fX3xcbiAgICAgICAgICAgICAgICAgICAgIHxffCAgICAgICAgICAgICAgICAgICAgXG4qL1xuXG4vKipcbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IFN0cmluZyBvZiByZW5kZXJlZCBIVE1MIGRvY3VtZW50IGNvbnRlbnQuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGluaXRpYWxpemVOZXN0ZWRVbml0KHsgbmVzdGVkVW5pdEtleSwgYWRkaXRpb25hbENoaWxkTmVzdGVkVW5pdCA9IFtdLCBwYXRoUG9pbnRlcktleSA9IG51bGwgfSkge1xuICAvLyB2aWV3cyBhcmd1bWVudCB0aGF0IHdpbGwgYmUgaW5pdGlhbGxpemVkIGluc2lkZSB0ZW1wbGF0ZXM6XG4gIC8vIGxvb3AgdGhyb3VnaCB0ZW1wbGF0ZSBhbmQgY3JlYXRlIHJlbmRlcmVkIHZpZXcgY29udGVudC5cbiAgbGV0IHZpZXcgPSBhd2FpdCBuZXN0ZWRVbml0SW5zdGFuY2UubG9vcEluc2VydGlvblBvaW50KHsgdHlwZTogJ2FnZ3JlZ2F0ZUludG9UZW1wbGF0ZU9iamVjdCcgfSlcblxuICBhc3NlcnQodGhpcy5wb3J0QXBwSW5zdGFuY2UuY29uZmlnLmNsaWVudFNpZGVQYXRoLCBcIuKAoiBjbGllbnRTaWRlUGF0aCBjYW5ub3QgYmUgdW5kZWZpbmVkLiBpLmUuIHByZXZpb3VzIG1pZGRsZXdhcmVzIHNob3VsZCd2ZSBzZXQgaXRcIilcbiAgbGV0IHRlbXBsYXRlUGF0aCA9IHBhdGguam9pbih0aGlzLnBvcnRBcHBJbnN0YW5jZS5jb25maWcuY2xpZW50U2lkZVBhdGgsIHVuaXRJbnN0YW5jZS5maWxlLmZpbGVQYXRoKVxuICBsZXQgcmVuZGVyZWRDb250ZW50XG4gIHN3aXRjaCAodW5pdEluc3RhbmNlLnByb2Nlc3NEYXRhSW1wbGVtZW50YXRpb24pIHtcbiAgICBkZWZhdWx0OlxuICAgIGNhc2UgJ3VuZGVyc2NvcmVSZW5kZXJpbmcnOlxuICAgICAgcmVuZGVyZWRDb250ZW50ID0gYXdhaXQgdGhpcy51bmRlcnNjb3JlUmVuZGVyaW5nKHsgdGVtcGxhdGVQYXRoLCB2aWV3IH0pXG4gICAgICBicmVha1xuICB9XG5cbiAgc3dpdGNoICh1bml0SW5zdGFuY2UucHJvY2Vzc1JlbmRlcmVkQ29udGVudCkge1xuICAgIGNhc2UgJ3dyYXBKc1RhZyc6XG4gICAgICByZW5kZXJlZENvbnRlbnQgPSBgPHNjcmlwdCB0eXBlPVwibW9kdWxlXCIgYXN5bmM+JHtyZW5kZXJlZENvbnRlbnR9PC9zY3JpcHQ+YFxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OiAvLyBza2lwXG4gIH1cblxuICByZXR1cm4gcmVuZGVyZWRDb250ZW50XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHVuZGVyc2NvcmVSZW5kZXJpbmcoeyB0ZW1wbGF0ZVBhdGgsIHZpZXcgfSkge1xuICAvLyBMb2FkIHRlbXBsYXRlIGZpbGUuXG4gIGxldCB0ZW1wbGF0ZVN0cmluZyA9IGF3YWl0IGZpbGVzeXN0ZW0ucmVhZEZpbGVTeW5jKHRlbXBsYXRlUGF0aCwgJ3V0Zi04JylcbiAgLy8gU2hhcmVkIGFyZ3VtZW50cyBiZXR3ZWVuIGFsbCB0ZW1wbGF0ZXMgYmVpbmcgcmVuZGVyZWRcbiAgY29uc3QgdGVtcGxhdGVBcmd1bWVudCA9IHtcbiAgICB0ZW1wbGF0ZUNvbnRyb2xsZXI6IHRoaXMsXG4gICAgY29udGV4dDogdGhpcy5wb3J0QXBwSW5zdGFuY2UuY29udGV4dCxcbiAgICBBcHBsaWNhdGlvbixcbiAgICBhcmd1bWVudDoge30sXG4gIH1cbiAgbGV0IHJlbmRlcmVkQ29udGVudCA9IHVuZGVyc2NvcmUudGVtcGxhdGUodGVtcGxhdGVTdHJpbmcpKFxuICAgIE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIHRlbXBsYXRlQXJndW1lbnQsIC8vIHVzZSB0ZW1wbGF0ZUFyZ3VtZW50IGluIGN1cnJlbnQgdGVtcGxhdGVcbiAgICAgIHsgdmlldywgdGVtcGxhdGVBcmd1bWVudCB9LCAvLyBwYXNzIHRlbXBsYXRlQXJndW1lbnQgdG8gbmVzdGVkIHRlbXBsYXRlc1xuICAgICksXG4gIClcbiAgcmV0dXJuIHJlbmRlcmVkQ29udGVudFxufVxuXG5mdW5jdGlvbiByZW5kZXJlZENvbnRlbnRTdHJpbmcodmlld05hbWUsIHZpZXdPYmplY3QpIHtcbiAgLy8gbG9vcCB0aHJvdWdodCB0aGUgc3RyaW5ncyBhcnJheSB0byBjb21iaW5lIHRoZW0gYW5kIHByaW50IHN0cmluZyBjb2RlIHRvIHRoZSBmaWxlLlxuICBpZiAodmlld09iamVjdFt2aWV3TmFtZV0gJiYgQXJyYXkuaXNBcnJheSh2aWV3T2JqZWN0W3ZpZXdOYW1lXSkpIHtcbiAgICByZXR1cm4gdmlld09iamVjdFt2aWV3TmFtZV0uam9pbignJykgLy8gam9pbnMgYWxsIGFycmF5IGNvbXBvbmVudHMgaW50byBvbmUgc3RyaW5nLlxuICB9XG59XG5cbmxldCB0cmF2ZXJzZVBvcnQgPSBhc3luYyBmdW5jdGlvbiBhZ2dyZWdhdGVJbnRvVGVtcGxhdGVPYmplY3QoKSB7XG4gIGxldCB2aWV3ID0ge31cbiAgaWYgKHRoaXMuaW5zZXJ0aW9uUG9pbnQpIHtcbiAgICBmb3IgKGxldCBpbnNlcnRpb25Qb2ludCBvZiB0aGlzLmluc2VydGlvblBvaW50KSB7XG4gICAgICBsZXQgY2hpbGRyZW4gPSBhd2FpdCB0aGlzLmZpbHRlckFuZE9yZGVyQ2hpbGRyZW4oeyBpbnNlcnRpb25Qb2ludEtleTogaW5zZXJ0aW9uUG9pbnQua2V5IH0pXG4gICAgICBsZXQgc3Vic2VxdWVudCA9IGF3YWl0IHRoaXMuaW5pdGlhbGl6ZUluc2VydGlvblBvaW50KHsgaW5zZXJ0aW9uUG9pbnQsIGNoaWxkcmVuIH0pXG4gICAgICBpZiAoIShpbnNlcnRpb25Qb2ludC5uYW1lIGluIHZpZXcpKSB2aWV3W2luc2VydGlvblBvaW50Lm5hbWVdID0gW11cbiAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KHZpZXdbaW5zZXJ0aW9uUG9pbnQubmFtZV0sIHN1YnNlcXVlbnQpXG4gICAgfVxuICB9XG4gIHJldHVybiB2aWV3XG59XG5cbi8qXG4gXG5UT0RPOiBhcyB0aGVyZWB6IGlzIGFuIEFQSSBTY2hlbWEsIGEgZGF0YWJhc2Ugc2NoZW1hIGNhbiBtYWtlIGNvbnRlbnQgZXh0cmVtZWx5IGR5bmFtaWMuIC1EYXRhYmFzZSBzY2hlbWEgaXMgZGlmZmVyZW50IGZyb20gQVBJIFNjaGVtYS4gICAgICAgICBcblxuXG4gICBfX18gIF9fX3wgfF9fICAgX19fIF8gX18gX19fICAgX18gXyBcbiAgLyBfX3wvIF9ffCAnXyBcXCAvIF8gXFwgJ18gYCBfIFxcIC8gX2AgfFxuICBcXF9fIFxcIChfX3wgfCB8IHwgIF9fLyB8IHwgfCB8IHwgKF98IHxcbiAgfF9fXy9cXF9fX3xffCB8X3xcXF9fX3xffCB8X3wgfF98XFxfXyxffFxuIEFQSSBTY2hlbWFcbiAgKFdoaWxlIHRoZSBkYXRhYmFzZSBtb2RlbHMgYXJlIHNlcGFyYXRlIGluIHRoZWlyIG93biBmdW5jdGlvbnMgb3IgY291bGQgYmUgZXhwb3NlZCB0aHJvdWdoIGEgY2xhc3MgbW9kdWxlKVxuXG4gIC0gUmVzb2x2ZXIgZnVuY3Rpb24gPSBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBkYXRhLlxuICAtIERhdGEgbG9hZGVyID0gbW9kdWxlIHRoYXQgYWdncmVnYXRlcyBkdXBsaWNhdGUgY2FsbHMuIFNvbHZpbmcgdGhlIG4rMSBwcm9ibGVtLCB3aGVyZSBlYWNoIHF1ZXJ5IGhhcyBhIHN1YnNlcXVlbnQgcXVlcnksIGxpbmVhciBncmFwaC4gVG8gbm9kZWpzIGl0IHVzZXMgbmV4dFRpY2sgZnVuY3Rpb24gdG8gYW5hbHlzZSB0aGUgcHJvbWlzZXMgYmVmb3JlIHRoZWlyIGV4ZWN1dGlvbiBhbmQgcHJldmVudCBtdWx0aXBsZSByb3VuZCB0cmlwcyB0byB0aGUgc2VydmVyIGZvciB0aGUgc2FtZSBkYXRhLlxuICAtIE1hcHBpbmcgLSB0aHJvdWdoIHJvc29sdmVyIGZ1bmN0aW9ucy5cbiAgLSBTY2hlbWEgPSBpcyB0aGUgc3RydWN0dXJlICYgcmVsYXRpb25zaGlwcyBvZiB0aGUgYXBpIGRhdGEuIGkuZS4gZGVmaW5lcyBob3cgYSBjbGllbnQgY2FuIGZldGNoIGFuZCB1cGRhdGUgZGF0YS5cbiAgICAgIGVhY2ggc2NoZW1hIGhhcyBhcGkgZW50cnlwb2ludHMuIEVhY2ggZmllbGQgY29ycmVzcG9uZHMgdG8gYSByZXNvbHZlciBmdW5jdGlvbi5cbiAgRGF0YSBmZXRjaGluZyBjb21wbGV4aXR5IGFuZCBkYXRhIHN0cnVjdHVyaW5nIGlzIGhhbmRsZWQgYnkgc2VydmVyIHNpZGUgcmF0aGVyIHRoYW4gY2xpZW50LlxuXG4gIDMgdHlwZXMgb2YgcG9zc2libGUgYXBpIGFjdGlvbnM6IFxuICAtIFF1ZXJ5XG4gIC0gTXV0YXRpb25cbiAgLSBTdWJzY3JpcHRpb24gLSBjcmVhdGVzIGEgc3RlYWR5IGNvbm5lY3Rpb24gd2l0aCB0aGUgc2VydmVyLlxuXG4gIEZldGNoaW5nIGFwcHJvYWNoZXM6IFxuICDigKIgSW1wZXJhdGl2ZSBmZXRjaGluZzogXG4gICAgICAtIGNvbnN0cnVjdHMgJiBzZW5kcyBIVFRQIHJlcXVlc3QsIGUuZy4gdXNpbmcganMgZmV0Y2guXG4gICAgICAtIHJlY2VpdmUgJiBwYXJzZSBzZXJ2ZXIgcmVzcG9uc2UuXG4gICAgICAtIHN0b3JlIGRhdGEgbG9jYWxseSwgZS5nLiBpbiBtZW1vcnkgb3IgcGVyc2lzdGVudC4gXG4gICAgICAtIGRpc3BsYXkgVUkuXG4gIOKAoiBEZWNsYXJhdGl2ZSBmZXRjaGluZyBlLmcuIHVzaW5nIEdyYXBoUUwgY2xpZW50czogXG4gICAgICAtIERlc2NyaWJlIGRhdGEgcmVxdWlyZW1lbnRzLlxuICAgICAgLSBEaXNwbGF5IGluZm9ybWF0aW9uIGluIHRoZSBVSS5cblxuICBSZXF1ZXN0OiBcbiAge1xuICAgICAgYWN0aW9uOiBxdWVyeSxcbiAgICAgIGVudHJ5cG9pbnQ6IHtcbiAgICAgICAgICBrZXk6IFwiQXJ0aWNsZVwiXG4gICAgICB9LFxuICAgICAgZnVuY3Rpb246IHtcbiAgICAgICAgICBuYW1lOiBcInNpbmdsZVwiLFxuICAgICAgICAgIGFyZ3M6IHtcbiAgICAgICAgICAgICAga2V5OiBcImFydGljbGUxXCJcbiAgICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZmllbGQ6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgIGtleW5hbWU6IFwidGl0bGVcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgICBrZXluYW1lOiBcInBhcmFncmFwaFwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgIGtleW5hbWU6IFwiYXV0aG9yc1wiXG4gICAgICAgICAgfSxcbiAgICAgIF1cbiAgfVxuXG4gIFJlc3BvbnNlIDpcbiAge1xuICAgICAgZGF0YToge1xuICAgICAgICAgIHRpdGxlOiBcIi4uLlwiLFxuICAgICAgICAgIHBhcmFncmFwaDogJy4uLicsXG4gICAgICAgICAgYXV0aG9yOiB7XG4gICAgICAgICAgICAgIG5hbWU6ICcuLi4nLFxuICAgICAgICAgICAgICBhZ2U6IDIwXG4gICAgICAgICAgfVxuICAgICAgfVxuICB9XG5cblxuICBOZXN0ZWQgVW5pdCBleGVjdXRpb24gc3RlcHM6ICBcbuKAoiBcbiovXG5cbmxldCBzY2hlbWEgPSAoKSA9PiB7XG4gIC8qKlxuICAgKiBJbXBsZW1lbnRhdGlvbiB0eXBlIGFnZ3JlZ2F0ZUludG9Db250ZW50QXJyYXlcbiAgICovXG4gIC8qIGV4bXBsZSByZXF1ZXN0IGJvZHk6IFxue1xuICAgIFwiZmllbGROYW1lXCI6IFwiYXJ0aWNsZVwiLFxuICAgIFwiZmllbGRcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgICBcImZpZWxkTmFtZVwiOiBcInRpdGxlXCIsXG4gICAgICAgICAgICBcImZpZWxkXCI6IFtdXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIFwiZmllbGROYW1lXCI6IFwicGFyYWdyYXBoXCIsXG4gICAgICAgICAgICBcImZpZWxkXCI6IFtdXG4gICAgICAgIH1cbiAgICBdLFxuICAgIFwic2NoZW1hTW9kZVwiOiBcIm5vblN0cmljdFwiLCAvLyBhbGxvdyBlbXB0eSBkYXRhc2V0cyBmb3Igc3BlY2lmaWVkIGZpZWxkcyBpbiB0aGUgbmVzdGVkIHVuaXQgc2NoZW1hLlxuICAgIFwiZXh0cmFmaWVsZFwiOiB0cnVlIC8vIGluY2x1ZGVzIGZpZWxkcyB0aGF0IGFyZSBub3QgZXh0cmFjdGVkIHVzaW5nIHRoZSBzY2hlbWEuXG59ICovXG4gIC8vIGNvbnN0IHsgYWRkLCBleGVjdXRlLCBjb25kaXRpb25hbCwgZXhlY3V0aW9uTGV2ZWwgfSA9IHJlcXVpcmUoJ0BkZXBlbmRlbmN5L2NvbW1vblBhdHRlcm4vc291cmNlL2RlY29yYXRvclV0aWxpdHkuanMnKVxuICBmdW5jdGlvbiBzY2hlbWEoeyB0aGlzQXJnIH0pIHtcbiAgICAvLyBmdW5jdGlvbiB3cmFwcGVyIHRvIHNldCB0aGlzQXJnIG9uIGltcGxlbWVudGFpb24gb2JqZWN0IGZ1bmN0aW9ucy5cblxuICAgIGxldCBzZWxmID0ge1xuICAgICAgQGV4ZWN1dGlvbkxldmVsKClcbiAgICAgIGFzeW5jIGluaXRpYWxpemVOZXN0ZWRVbml0KHsgbmVzdGVkVW5pdEtleSwgYWRkaXRpb25hbENoaWxkTmVzdGVkVW5pdCA9IFtdLCBwYXRoUG9pbnRlcktleSA9IG51bGwsIHBhcmVudCA9IHRoaXMsIGFyZ3VtZW50ID0ge30gfSkge1xuICAgICAgICAvLyBFbnRyeXBvaW50IEluc3RhbmNlXG4gICAgICAgIC8vIGV4dHJhY3QgcmVxdWVzdCBkYXRhIGFjdGlvbiBhcmd1bWVudHMuIGFyZ3VtZW50cyBmb3IgYSBxdWVyeS9tdXRhdGlvbi9zdWJzY3JpcHRpb24uXG4gICAgICAgIGlmICh0aGlzLmV4ZWN1dGlvbkxldmVsID09ICd0b3BMZXZlbCcpIHtcbiAgICAgICAgICBuZXN0ZWRVbml0SW5zdGFuY2UucmVxdWVzdE9wdGlvbiA9IHRoaXMucG9ydEFwcEluc3RhbmNlLmNvbnRleHQucmVxdWVzdC5ib2R5XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gY2hpbGQvbmVzdGVkXG4gICAgICAgICAgbGV0IGZpZWxkQXJyYXkgPSBwYXJlbnQucmVxdWVzdE9wdGlvbi5maWVsZCAvLyBvYmplY3QgYXJyYXlcbiAgICAgICAgICBpZiAoKGZpZWxkQXJyYXkgJiYgZmllbGRBcnJheS5sZW5ndGggPT0gMCkgfHwgIWZpZWxkQXJyYXkpIHtcbiAgICAgICAgICAgIG5lc3RlZFVuaXRJbnN0YW5jZS5yZXF1ZXN0T3B0aW9uID0ge30gLy8gY29udGludWUgdG8gcmVzb2x2ZSBkYXRhc2V0IGFuZCBhbGwgc3Vic2VxdWVudCBOZXN0ZWR1bml0cyBvZiBuZXN0ZWQgZGF0YXNldCBpbiBjYXNlIGFyZSBvYmplY3RzLlxuICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGRBcnJheSkge1xuICAgICAgICAgICAgbmVzdGVkVW5pdEluc3RhbmNlLnJlcXVlc3RPcHRpb24gPSBmaWVsZEFycmF5LmZpbmQoZmllbGQgPT4gZmllbGQuZmllbGROYW1lID09IHVuaXRJbnN0YW5jZS5maWVsZE5hbWUpIC8vIHdoZXJlIGZpZWxkTmFtZXMgbWF0Y2hcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjaGVjayBpZiBmaWVsZG5hbWUgZXhpc3RzIGluIHRoZSByZXF1ZXN0IG9wdGlvbiwgaWYgbm90IHNraXAgbmVzdGVkIHVuaXQuXG4gICAgICAgIGlmICghbmVzdGVkVW5pdEluc3RhbmNlLnJlcXVlc3RPcHRpb24pIHJldHVybiAvLyBmaWVsZE5hbWUgd2FzIG5vdCBzcGVjaWZpZWQgaW4gdGhlIHBhcmVudCBuZXN0ZWRVbml0LCB0aGVyZWZvcmUgc2tpcCBpdHMgZXhlY3V0aW9uXG4gICAgICAgIG5lc3RlZFVuaXRJbnN0YW5jZS5kYXRhc2V0ID0gYXdhaXQgdW5pdEluc3RhbmNlLnJlc29sdmVEYXRhc2V0KHsgcGFyZW50UmVzdWx0OiBhcmd1bWVudC5kYXRhc2V0IHx8IHBhcmVudC5kYXRhc2V0IH0pXG4gICAgICAgIC8vIFRPRE86IEZpeCByZXF1ZXN0T3B0aW9uIC0gaS5lLiBhYm92ZSBpdCBpcyB1c2VkIHRvIHBhc3MgXCJmaWVsZFwiIG9wdGlvbiBvbmx5LlxuICAgICAgICBpZiAodGhpcy5wb3J0QXBwSW5zdGFuY2UuY29udGV4dC5yZXF1ZXN0LmJvZHkuc2NoZW1hTW9kZSA9PSAnbm9uU3RyaWN0Jykge1xuICAgICAgICAgIC8vIERvbid0IGVuZm9yY2Ugc3RyaWN0IHNjaGVtYSwgaS5lLiBhbGwgbmVzdGVkIGNoaWxkcmVuIHNob3VsZCBleGlzdC5cbiAgICAgICAgICAvLyBpZihuZXN0ZWRVbml0SW5zdGFuY2UuZGF0YXNldCkgbmVzdGVkVW5pdEluc3RhbmNlLmRhdGFzZXQgPSBudWxsIC8vIFRPRE86IHRocm93cyBlcnJvciBhcyBuZXh0IGl0IGlzIGJlaW5nIHVzZWQuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXNzZXJ0Lm5vdEVxdWFsKG5lc3RlZFVuaXRJbnN0YW5jZS5kYXRhc2V0LCB1bmRlZmluZWQsIGDigKIgcmV0dXJuZWQgZGF0YXNldCBjYW5ub3QgYmUgdW5kZWZpbmVkIGZvciBmaWVsZE5hbWU6ICR7dW5pdEluc3RhbmNlLmZpZWxkTmFtZX0uYClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNoZWNrIHR5cGUgb2YgZGF0YXNldFxuICAgICAgICBsZXQgZGF0YXNldEhhbmRsaW5nXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KG5lc3RlZFVuaXRJbnN0YW5jZS5kYXRhc2V0KSAmJiBuZXN0ZWRVbml0SW5zdGFuY2UuY2hpbGRyZW4gJiYgbmVzdGVkVW5pdEluc3RhbmNlLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAvLyBhcnJheVxuICAgICAgICAgIGRhdGFzZXRIYW5kbGluZyA9ICdzZXF1ZW5jZSdcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgbmVzdGVkVW5pdEluc3RhbmNlLmRhdGFzZXQgPT0gJ29iamVjdCcgJiYgbmVzdGVkVW5pdEluc3RhbmNlLmNoaWxkcmVuICYmIG5lc3RlZFVuaXRJbnN0YW5jZS5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgLy8gb2JqZWN0XG4gICAgICAgICAgZGF0YXNldEhhbmRsaW5nID0gJ25lc3RlZCdcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBub24tbmVzdGVkIHZhbHVlXG4gICAgICAgICAgZGF0YXNldEhhbmRsaW5nID0gJ25vbk5lc3RlZCdcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGhhbmRsZSBhcnJheSwgb2JqZWN0LCBvciBub24tbmVzdGVkIHZhbHVlXG4gICAgICAgIGxldCBvYmplY3QgPSB7fSAvLyBmb3JtYXR0ZWQgb2JqZWN0IHdpdGggcmVxdWVzdGVkIGZpZWxkc1xuICAgICAgICBzd2l0Y2ggKGRhdGFzZXRIYW5kbGluZykge1xuICAgICAgICAgIGNhc2UgJ3NlcXVlbmNlJzpcbiAgICAgICAgICAgIGxldCBwcm9taXNlQXJyYXkgPSBuZXN0ZWRVbml0SW5zdGFuY2UuZGF0YXNldC5tYXAoZG9jdW1lbnQgPT4ge1xuICAgICAgICAgICAgICBsZXQgYXJndW1lbnQgPSB7fVxuICAgICAgICAgICAgICBhcmd1bWVudFsnZGF0YXNldCddID0gZG9jdW1lbnRcbiAgICAgICAgICAgICAgcmV0dXJuIG5lc3RlZFVuaXRJbnN0YW5jZS5sb29wSW5zZXJ0aW9uUG9pbnQoeyB0eXBlOiAnYWdncmVnYXRlSW50b0NvbnRlbnRBcnJheScsIGFyZ3VtZW50IH0pXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgbGV0IHN1YnNlcXVlbnREYXRhc2V0QXJyYXkgPSBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlQXJyYXkpXG4gICAgICAgICAgICBvYmplY3RbdW5pdEluc3RhbmNlLmZpZWxkTmFtZV0gPSBzdWJzZXF1ZW50RGF0YXNldEFycmF5Lm1hcCgoc3Vic2VxdWVudERhdGFzZXQsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLmZvcm1hdERhdGFzZXRPZk5lc3RlZFR5cGUoe1xuICAgICAgICAgICAgICAgIHN1YnNlcXVlbnREYXRhc2V0LFxuICAgICAgICAgICAgICAgIGRhdGFzZXQ6IG5lc3RlZFVuaXRJbnN0YW5jZS5kYXRhc2V0W2luZGV4XSxcbiAgICAgICAgICAgICAgICBvcHRpb246IHtcbiAgICAgICAgICAgICAgICAgIGV4dHJhZmllbGQ6IG5lc3RlZFVuaXRJbnN0YW5jZS5yZXF1ZXN0T3B0aW9uLmV4dHJhZmllbGQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSAnbmVzdGVkJzogLy8gaWYgZmllbGQgdHJlYXRlZCBhcyBhbiBvYmplY3Qgd2l0aCBuZXN0ZWQgZmllbGRzXG4gICAgICAgICAgICBsZXQgc3Vic2VxdWVudERhdGFzZXQgPSBhd2FpdCBuZXN0ZWRVbml0SW5zdGFuY2UubG9vcEluc2VydGlvblBvaW50KHsgdHlwZTogJ2FnZ3JlZ2F0ZUludG9Db250ZW50QXJyYXknIH0pXG4gICAgICAgICAgICBvYmplY3RbdW5pdEluc3RhbmNlLmZpZWxkTmFtZV0gPSB0aGlzLmZvcm1hdERhdGFzZXRPZk5lc3RlZFR5cGUoe1xuICAgICAgICAgICAgICBzdWJzZXF1ZW50RGF0YXNldCxcbiAgICAgICAgICAgICAgZGF0YXNldDogbmVzdGVkVW5pdEluc3RhbmNlLmRhdGFzZXQsXG4gICAgICAgICAgICAgIG9wdGlvbjoge1xuICAgICAgICAgICAgICAgIGV4dHJhZmllbGQ6IG5lc3RlZFVuaXRJbnN0YW5jZS5yZXF1ZXN0T3B0aW9uLmV4dHJhZmllbGQsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgY2FzZSAnbm9uTmVzdGVkJzpcbiAgICAgICAgICAgIC8vIGxvb3Bpbmcgb3ZlciBuZXN0ZWQgdW5pdHMgY2FuIG1hbmlwdWxhdGUgdGhlIGRhdGEgaW4gYSBkaWZmZXJlbnQgd2F5IHRoYW4gcmVndWxhciBhZ2dyZWdhdGlvbiBpbnRvIGFuIGFycmF5LlxuICAgICAgICAgICAgb2JqZWN0W3VuaXRJbnN0YW5jZS5maWVsZE5hbWVdID0gbmVzdGVkVW5pdEluc3RhbmNlLmRhdGFzZXRcblxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRlYWwgd2l0aCByZXF1ZXN0ZWQgYWxsIGZpZWxkcyB3aXRob3V0IHRoZSBmaWVsZCBvcHRpb24gd2hlcmUgZXhlY3V0aW9uIG9mIHN1Ym5lc3RlZHVuaXRzIGlzIHJlcXVpcmVkIHRvIG1hbmlwdWxhdGUgdGhlIGRhdGEuXG5cbiAgICAgICAgcmV0dXJuIG9iamVjdFxuICAgICAgfSxcblxuICAgICAgZm9ybWF0RGF0YXNldE9mTmVzdGVkVHlwZSh7IHN1YnNlcXVlbnREYXRhc2V0LCBkYXRhc2V0LCBvcHRpb24gfSkge1xuICAgICAgICBsZXQgb2JqZWN0ID0ge31cbiAgICAgICAgc3Vic2VxdWVudERhdGFzZXQuZm9yRWFjaChmaWVsZCA9PiB7XG4gICAgICAgICAgb2JqZWN0ID0gT2JqZWN0LmFzc2lnbihvYmplY3QsIGZpZWxkKVxuICAgICAgICB9KVxuICAgICAgICBpZiAob3B0aW9uLmV4dHJhZmllbGQpIHtcbiAgICAgICAgICAvLyBleHRyYWZpZWxkIG9wdGlvblxuICAgICAgICAgIG9iamVjdCA9IE9iamVjdC5hc3NpZ24oZGF0YXNldCwgb2JqZWN0KSAvLyBvdmVycmlkZSBzdWJzZXF1ZW50IGZpZWxkcyBhbmQga2VlcCB1bnRyYWNrZWQgZmllbGRzLlxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvYmplY3RcbiAgICAgIH0sXG4gICAgfVxuXG4gICAgT2JqZWN0LmtleXMoc2VsZikuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHNlbGZba2V5XSA9IHNlbGZba2V5XS5iaW5kKHRoaXNBcmcpXG4gICAgfSwge30pXG4gICAgcmV0dXJuIHNlbGZcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIHJlc29sdmVEYXRhc2V0KHtcbiAgICBwYXJlbnRSZXN1bHQgPSBudWxsLFxuICAgIC8vIHRoaXMuYXJncyAtIG5lc3RlZFVuaXQgYXJncyBmaWVsZC5cbiAgfSkge1xuICAgIC8vIFsyXSByZXF1aXJlICYgY2hlY2sgY29uZGl0aW9uXG4gICAgbGV0IGRhdGFzZXRcbiAgICBjb25zdCBhbGdvcml0aG0gPSB0aGlzLmZpbGUuYWxnb3JpdGhtIC8vIHJlc29sdmVyIGZvciBkYXRhc2V0XG4gICAgc3dpdGNoIChcbiAgICAgIGFsZ29yaXRobS50eXBlIC8vIGluIG9yZGVyIHRvIGNob29zZSBob3cgdG8gaGFuZGxlIHRoZSBhbGdvcml0aG0gKGFzIGEgbW9kdWxlID8gYSBmaWxlIHRvIGJlIGltcG9ydGVkID8uLi4pXG4gICAgKSB7XG4gICAgICBjYXNlICdmaWxlJzpcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgbW9kdWxlID0gcmVxdWlyZShhbGdvcml0aG0ucGF0aCkuZGVmYXVsdFxuICAgICAgICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAnZnVuY3Rpb24nKSBtb2R1bGUgPSBtb2R1bGUuZGVmYXVsdCAvLyBjYXNlIGVzNiBtb2R1bGUgbG9hZGVkIHdpdGggcmVxdWlyZSBmdW5jdGlvbiAod2lsbCBsb2FkIGl0IGFzIGFuIG9iamVjdClcbiAgICAgICAgICBsZXQgcmVzb2x2ZXIgPSBtb2R1bGUoKSAvKmluaXRpYWwgZXhlY3V0ZSBmb3Igc2V0dGluZyBwYXJhbWV0ZXIgY29udGV4dC4qL1xuICAgICAgICAgIGxldCByZXNvbHZlckFyZ3VtZW50ID0gT2JqZWN0LmFzc2lnbiguLi5bdGhpcy5hcmdzLCBhbGdvcml0aG0uYXJndW1lbnRdLmZpbHRlcihCb29sZWFuKSkgLy8gcmVtb3ZlIHVuZGVmaW5lZC9udWxsL2ZhbHNlIG9iamVjdHMgYmVmb3JlIG1lcmdpbmcuXG4gICAgICAgICAgZGF0YXNldCA9IGF3YWl0IHJlc29sdmVyKHtcbiAgICAgICAgICAgIHBvcnRDbGFzc0luc3RhbmNlOiB0aGlzLnBvcnRBcHBJbnN0YW5jZSwgLy8gY29udGFpbnMgYWxzbyBwb3J0Q2xhc3NJbnN0YW5jZS5jb250ZXh0IG9mIHRoZSByZXF1ZXN0LlxuICAgICAgICAgICAgYXJnczogcmVzb2x2ZXJBcmd1bWVudCxcbiAgICAgICAgICAgIHBhcmVudFJlc3VsdCwgLy8gcGFyZW50IGRhdGFzZXQgcmVzdWx0LlxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YXNldFxuICB9XG59XG4iXX0=