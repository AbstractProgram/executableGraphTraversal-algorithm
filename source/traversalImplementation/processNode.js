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
    return await functionCallback({ node: processNode, context: graphInstance.context, traverseCallContext });
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










const immediatelyExecuteMiddleware = async ({ stageNode, processNode, graphInstance, nextProcessData }, { additionalParameter, traverseCallContext }) => {var _graphInstance$middle;
  const { nextFunction } = additionalParameter;
  let contextPropertyName = 'functionReferenceContext',
  referenceContext = graphInstance.context[contextPropertyName];
  (0, _assert.default)(referenceContext, `• Context "${contextPropertyName}" variable is required to reference functions from graph database strings.`);
  (0, _assert.default)((_graphInstance$middle = graphInstance.middlewareParameter) === null || _graphInstance$middle === void 0 ? void 0 : _graphInstance$middle.context, `• Middleware graph traversal relies on graphInstance.middlewareParameter.context`);

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
    let context = graphInstance.middlewareParameter.context,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NvdXJjZS90cmF2ZXJzYWxJbXBsZW1lbnRhdGlvbi9wcm9jZXNzTm9kZS5qcyJdLCJuYW1lcyI6WyJyZXR1cm5EYXRhSXRlbUtleSIsInN0YWdlTm9kZSIsInByb2Nlc3NOb2RlIiwiZ3JhcGhJbnN0YW5jZSIsIm5leHRQcm9jZXNzRGF0YSIsImFkZGl0aW9uYWxQYXJhbWV0ZXIiLCJ0cmF2ZXJzZUNhbGxDb250ZXh0IiwicHJvcGVydGllcyIsIm5hbWUiLCJ0aW1lb3V0IiwidGltZXJEZWxheSIsIkVycm9yIiwiZGVsYXkiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInNldFRpbWVvdXQiLCJleGVjdXRlRnVuY3Rpb25SZWZlcmVuY2UiLCJjb250ZXh0UHJvcGVydHlOYW1lIiwicmVmZXJlbmNlQ29udGV4dCIsImNvbnRleHQiLCJyZXNvdXJjZSIsInJlc291cmNlQXJyYXkiLCJkYXRhYmFzZVdyYXBwZXIiLCJnZXRSZXNvdXJjZSIsImNvbmNyZXRlRGF0YWJhc2UiLCJkYXRhYmFzZSIsIm5vZGVJRCIsImlkZW50aXR5IiwibGVuZ3RoIiwic291cmNlIiwibGFiZWxzIiwiaW5jbHVkZXMiLCJzY2hlbWVSZWZlcmVuY2UiLCJub2RlTGFiZWwiLCJmdW5jdGlvbiIsImZ1bmN0aW9uTmFtZSIsImZ1bmN0aW9uQ2FsbGJhY2siLCJub2RlIiwiZXJyb3IiLCJjb25zb2xlIiwicHJvY2VzcyIsImV4aXQiLCJleGVjdXRlU2hlbGxzY3JpcHRGaWxlIiwibWVzc2FnZSIsInNjcmlwdFJlZmVyZW5jZUtleSIsInJlZmVyZW5jZUtleSIsImtleSIsImxvZyIsInNjcmlwdFBhdGgiLCJjd2QiLCJwYXRoIiwiZGlybmFtZSIsInNoZWxsIiwic3RkaW8iLCJleGVjdXRlU2NyaXB0U3Bhd24iLCJjaGlsZFByb2Nlc3MiLCJjb21tYW5kIiwiYXJndW1lbnQiLCJqb2luIiwib3B0aW9uIiwiSlNPTiIsInN0cmluZ2lmeSIsInN0YXR1cyIsImltbWVkaWF0ZWx5RXhlY3V0ZU1pZGRsZXdhcmUiLCJuZXh0RnVuY3Rpb24iLCJtaWRkbGV3YXJlUGFyYW1ldGVyIiwibWlkZGxld2FyZSIsIm5leHQiLCJpbml0aWFsaXplTmVzdGVkVW5pdCIsIm5lc3RlZFVuaXRLZXkiLCJhZGRpdGlvbmFsQ2hpbGROZXN0ZWRVbml0IiwicGF0aFBvaW50ZXJLZXkiLCJ2aWV3IiwibmVzdGVkVW5pdEluc3RhbmNlIiwibG9vcEluc2VydGlvblBvaW50IiwidHlwZSIsInBvcnRBcHBJbnN0YW5jZSIsImNvbmZpZyIsImNsaWVudFNpZGVQYXRoIiwidGVtcGxhdGVQYXRoIiwidW5pdEluc3RhbmNlIiwiZmlsZSIsImZpbGVQYXRoIiwicmVuZGVyZWRDb250ZW50IiwicHJvY2Vzc0RhdGFJbXBsZW1lbnRhdGlvbiIsInVuZGVyc2NvcmVSZW5kZXJpbmciLCJwcm9jZXNzUmVuZGVyZWRDb250ZW50IiwidGVtcGxhdGVTdHJpbmciLCJmaWxlc3lzdGVtIiwicmVhZEZpbGVTeW5jIiwidGVtcGxhdGVBcmd1bWVudCIsInRlbXBsYXRlQ29udHJvbGxlciIsIkFwcGxpY2F0aW9uIiwidW5kZXJzY29yZSIsInRlbXBsYXRlIiwiT2JqZWN0IiwiYXNzaWduIiwicmVuZGVyZWRDb250ZW50U3RyaW5nIiwidmlld05hbWUiLCJ2aWV3T2JqZWN0IiwiQXJyYXkiLCJpc0FycmF5IiwidHJhdmVyc2VQb3J0IiwiYWdncmVnYXRlSW50b1RlbXBsYXRlT2JqZWN0IiwiaW5zZXJ0aW9uUG9pbnQiLCJjaGlsZHJlbiIsImZpbHRlckFuZE9yZGVyQ2hpbGRyZW4iLCJpbnNlcnRpb25Qb2ludEtleSIsInN1YnNlcXVlbnQiLCJpbml0aWFsaXplSW5zZXJ0aW9uUG9pbnQiLCJwcm90b3R5cGUiLCJwdXNoIiwiYXBwbHkiLCJzY2hlbWEiLCJ0aGlzQXJnIiwic2VsZiIsImV4ZWN1dGlvbkxldmVsIiwicGFyZW50IiwicmVxdWVzdE9wdGlvbiIsInJlcXVlc3QiLCJib2R5IiwiZmllbGRBcnJheSIsImZpZWxkIiwiZmluZCIsImZpZWxkTmFtZSIsImRhdGFzZXQiLCJyZXNvbHZlRGF0YXNldCIsInBhcmVudFJlc3VsdCIsInNjaGVtYU1vZGUiLCJhc3NlcnQiLCJub3RFcXVhbCIsInVuZGVmaW5lZCIsImRhdGFzZXRIYW5kbGluZyIsIm9iamVjdCIsInByb21pc2VBcnJheSIsIm1hcCIsImRvY3VtZW50Iiwic3Vic2VxdWVudERhdGFzZXRBcnJheSIsImFsbCIsInN1YnNlcXVlbnREYXRhc2V0IiwiaW5kZXgiLCJmb3JtYXREYXRhc2V0T2ZOZXN0ZWRUeXBlIiwiZXh0cmFmaWVsZCIsImZvckVhY2giLCJrZXlzIiwiYmluZCIsImFsZ29yaXRobSIsIm1vZHVsZSIsInJlcXVpcmUiLCJkZWZhdWx0IiwicmVzb2x2ZXIiLCJyZXNvbHZlckFyZ3VtZW50IiwiYXJncyIsImZpbHRlciIsIkJvb2xlYW4iLCJwb3J0Q2xhc3NJbnN0YW5jZSJdLCJtYXBwaW5ncyI6IjhpQkFBQTtBQUNBO0FBQ0E7O0FBRU8sZUFBZUEsaUJBQWYsQ0FBaUMsRUFBRUMsU0FBRixFQUFhQyxXQUFiLEVBQTBCQyxhQUExQixFQUF5Q0MsZUFBekMsRUFBakMsRUFBNkYsRUFBRUMsbUJBQUYsRUFBdUJDLG1CQUF2QixFQUE3RixFQUEySTtBQUNoSiwrQkFBSUosV0FBVyxDQUFDSyxVQUFoQiwwREFBSSxzQkFBd0JDLElBQTVCLEVBQWtDLE9BQVEsR0FBRCwwQkFBR04sV0FBVyxDQUFDSyxVQUFmLDJEQUFHLHVCQUF3QkMsSUFBSyxFQUF2QztBQUNuQzs7O0FBR00sZUFBZUMsT0FBZixDQUF1QixFQUFFUixTQUFGLEVBQWFDLFdBQWIsRUFBMEJDLGFBQTFCLEVBQXlDQyxlQUF6QyxFQUF2QixFQUFtRixFQUFFQyxtQkFBRixFQUF1QkMsbUJBQXZCLEVBQW5GLEVBQWlJO0FBQ3RJLE1BQUksa0NBQU9KLFdBQVcsQ0FBQ0ssVUFBbkIsMkRBQU8sdUJBQXdCRyxVQUEvQixLQUE2QyxRQUFqRCxFQUEyRCxNQUFNLElBQUlDLEtBQUosQ0FBVSxx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WU4sU0FBUyxDQUFDekYsUUFBdEIsRUFBZ0NnRyxNQUFoQyxDQUF1Q0MsT0FBdkMsQ0FBakIsQ0FBdkI7QUFDQTdCLFVBQUFBLE9BQU8sR0FBRyxNQUFNeUIsUUFBUSxDQUFDO0FBQ3ZCSyxZQUFBQSxpQkFBaUIsRUFBRSxLQUFLL0UsZUFERDtBQUV2QjRFLFlBQUFBLElBQUksRUFBRUQsZ0JBRmlCO0FBR3ZCeEIsWUFBQUEsWUFIdUIsRUFBRCxDQUF4Qjs7QUFLRDtBQUNELGNBaEJKOzs7QUFtQkEsV0FBT0YsT0FBUDtBQUNEO0FBQ0YsQ0E3SkQiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnXG5pbXBvcnQgeyBleGVjLCBleGVjU3luYywgc3Bhd24sIHNwYXduU3luYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXR1cm5EYXRhSXRlbUtleSh7IHN0YWdlTm9kZSwgcHJvY2Vzc05vZGUsIGdyYXBoSW5zdGFuY2UsIG5leHRQcm9jZXNzRGF0YSB9LCB7IGFkZGl0aW9uYWxQYXJhbWV0ZXIsIHRyYXZlcnNlQ2FsbENvbnRleHQgfSkge1xuICBpZiAocHJvY2Vzc05vZGUucHJvcGVydGllcz8ubmFtZSkgcmV0dXJuIGAke3Byb2Nlc3NOb2RlLnByb3BlcnRpZXM/Lm5hbWV9YFxufVxuXG4vLyBpbXBsZW1lbnRhdGlvbiBkZWxheXMgcHJvbWlzZXMgZm9yIHRlc3RpbmcgYGl0ZXJhdGVDb25uZWN0aW9uYCBvZiBwcm9taXNlcyBlLmcuIGBhbGxQcm9taXNlYCwgYHJhY2VGaXJzdFByb21pc2VgLCBldGMuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGltZW91dCh7IHN0YWdlTm9kZSwgcHJvY2Vzc05vZGUsIGdyYXBoSW5zdGFuY2UsIG5leHRQcm9jZXNzRGF0YSB9LCB7IGFkZGl0aW9uYWxQYXJhbWV0ZXIsIHRyYXZlcnNlQ2FsbENvbnRleHQgfSkge1xuICBpZiAodHlwZW9mIHByb2Nlc3NOb2RlLnByb3BlcnRpZXM/LnRpbWVyRGVsYXkgIT0gJ251bWJlcicpIHRocm93IG5ldyBFcnJvcign4oCiIERhdGFJdGVtIG11c3QgaGF2ZSBhIGRlbGF5IHZhbHVlLicpXG4gIGxldCBkZWxheSA9IHByb2Nlc3NOb2RlLnByb3BlcnRpZXM/LnRpbWVyRGVsYXlcbiAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAvLyBjb25zb2xlLmxvZyhgJHtkZWxheX1tcyBwYXNzZWQgZm9yIGtleSAke3Byb2Nlc3NOb2RlLmtleX0uYCkgLy8gZGVidWdcbiAgICAgIHJlc29sdmUocHJvY2Vzc05vZGUucHJvcGVydGllcz8ubmFtZSlcbiAgICB9LCBkZWxheSksXG4gIClcbn1cblxuLyoqXG4gKiBSZWxpZXMgb24gZnVuY3Rpb24gcmVmZXJlbmNlIGNvbmNlcHQgLSB3aGVyZSBhIGZ1bmN0aW9uIGlzIGNhbGxlZCBmcm9tIHRoZSBncmFwaCB1c2luZyBhIG5vZGUgcHJvcGVydHkgdGhhdCBob2xkcyBpdCdzIG5hbWUsIGFuZCBhIGNvbnRleHQgb2JqZWN0IHBhc3NlZCB0byB0aGUgZ3JhcGggdHJhdmVyc2VyLCBob2xkaW5nIHRoZSBmdW5jdGlvbnMgbWFwLlxuICogYHByb2Nlc3NEYXRhYCBpbXBsZW1lbnRhdGlvbiBvZiBgZ3JhcGhUcmF2ZXJzYWxgIG1vZHVsZVxuICogZXhlY3V0ZSBmdW5jdGlvbnMgdGhyb3VnaCBhIHN0cmluZyByZWZlcmVuY2UgZnJvbSB0aGUgZ3JhcGggZGF0YWJhc2UgdGhhdCBtYXRjaCB0aGUga2V5IG9mIHRoZSBhcHBsaWNhdGlvbiByZWZlcmVuY2UgY29udGV4dCBvYmplY3RcbiAqIE5vdGU6IGNyZWF0aW5nIGEgc2ltaWxhciBpbXBsZW1lbnRhdGlvbiB0aGF0IHdvdWxkIHJldHVybiBvbmx5IHRoZSBmdW5jdGlvbnMgaXMgbm8gZGlmZmVyZW50IHRoYW4gcmV0dXJubmluZyB0aGUgbmFtZXMgb2YgdGhlIGZ1bmN0aW9uLCBhbmQgdGhlbiB1c2UgdGhlIGdyYXBoIHJlc3VsdCBhcnJheSBvdXRzaWRlIHRoZSB0cmF2ZXJzYWwgdG8gcmV0cmlldmUgdGhlIGZ1bmN0aW9uIHJlZmVyZW5jZXMgZnJvbSBhbiBvYmplY3QuXG5cblVzZWQgZm9yOlxuICAtIHVzZWQgZm9yIGV4ZWN1dGluZyB0YXNrcyBhbmQgY2hlY2tzL2NvbmRpdGlvbnNcbiAgLSBNaWRkbGV3YXJlOlxuICAgIEFwcHJvYWNoZXMgZm9yIG1pZGRsZXdhcmUgYWdncmVnYXRpb246IFxuICAgIC0gQ3JlYXRlcyBtaWRkbGV3YXJlIGFycmF5IGZyb20gZ3JhcGgtICBUaGUgZ3JhcGggdHJhdmVyc2FsIEByZXR1cm4ge0FycmF5IG9mIE9iamVjdHN9IHdoZXJlIGVhY2ggb2JqZWN0IGNvbnRhaW5zIGluc3RydWN0aW9uIHNldHRpbmdzIHRvIGJlIHVzZWQgdGhyb3VnaCBhbiBpbXBsZW1lbnRpbmcgbW9kdWxlIHRvIGFkZCB0byBhIGNoYWluIG9mIG1pZGRsZXdhcmVzLiBcbiAgICAtIHJldHVybiBtaWRkbGV3YXJlIHJlZmVyZW5jZSBuYW1lcywgYW5kIHRoZW4gbWF0Y2hpbmcgdGhlIG5hbWVzIHRvIGZ1bmN0aW9uIG91dHNpZGUgdGhlIHRyYXZlcnNhbC5cbiAgICAtIEV4ZWN1dGluZyBnZW5lcmF0b3IgZnVuY3Rpb25zIHdpdGggbm9kZSBhcmd1bWVudHMgdGhhdCBwcm9kdWNlIG1pZGRsZXdhcmUgZnVuY3Rpb25zLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhlY3V0ZUZ1bmN0aW9uUmVmZXJlbmNlKHsgc3RhZ2VOb2RlLCBwcm9jZXNzTm9kZSwgZ3JhcGhJbnN0YW5jZSwgbmV4dFByb2Nlc3NEYXRhIH0sIHsgYWRkaXRpb25hbFBhcmFtZXRlciwgdHJhdmVyc2VDYWxsQ29udGV4dCB9KSB7XG4gIGxldCBjb250ZXh0UHJvcGVydHlOYW1lID0gJ2Z1bmN0aW9uUmVmZXJlbmNlQ29udGV4dCcsIC8vIFRPRE86IGFmdGVyIG1pZ3JhdGluZyB0byBvd24gcmVwb3NpdG9yeSwgdXNlIFN5bWJvbHMgaW5zdGVhZCBvZiBzdHJpbmcga2V5cyBhbmQgZXhwb3J0IHRoZW0gZm9yIGNsaWVudCB1c2FnZS5cbiAgICByZWZlcmVuY2VDb250ZXh0ID0gZ3JhcGhJbnN0YW5jZS5jb250ZXh0W2NvbnRleHRQcm9wZXJ0eU5hbWVdXG4gIGFzc2VydChyZWZlcmVuY2VDb250ZXh0LCBg4oCiIENvbnRleHQgXCIke2NvbnRleHRQcm9wZXJ0eU5hbWV9XCIgdmFyaWFibGUgaXMgcmVxdWlyZWQgdG8gcmVmZXJlbmNlIGZ1bmN0aW9ucyBmcm9tIGdyYXBoIGRhdGFiYXNlIHN0cmluZ3MuYClcblxuICBsZXQgcmVzb3VyY2VcbiAgY29uc3QgeyByZXNvdXJjZUFycmF5IH0gPSBhd2FpdCBncmFwaEluc3RhbmNlLmRhdGFiYXNlV3JhcHBlci5nZXRSZXNvdXJjZSh7IGNvbmNyZXRlRGF0YWJhc2U6IGdyYXBoSW5zdGFuY2UuZGF0YWJhc2UsIG5vZGVJRDogcHJvY2Vzc05vZGUuaWRlbnRpdHkgfSlcbiAgaWYgKHJlc291cmNlQXJyYXkubGVuZ3RoID4gMSkgdGhyb3cgbmV3IEVycm9yKGDigKIgTXVsdGlwbGUgcmVzb3VyY2UgcmVsYXRpb25zaGlwcyBhcmUgbm90IHN1cHBvcnRlZCBmb3IgUHJvY2VzcyBub2RlLmApXG4gIGVsc2UgaWYgKHJlc291cmNlQXJyYXkubGVuZ3RoID09IDApIHJldHVyblxuICBlbHNlIHJlc291cmNlID0gcmVzb3VyY2VBcnJheVswXVxuXG4gIGFzc2VydChyZXNvdXJjZS5zb3VyY2UubGFiZWxzLmluY2x1ZGVzKGdyYXBoSW5zdGFuY2Uuc2NoZW1lUmVmZXJlbmNlLm5vZGVMYWJlbC5mdW5jdGlvbiksIGDigKIgVW5zdXBwb3J0ZWQgTm9kZSB0eXBlIGZvciByZXNvdXJjZSBjb25uZWN0aW9uLmApXG4gIGxldCBmdW5jdGlvbk5hbWUgPSByZXNvdXJjZS5zb3VyY2UucHJvcGVydGllcy5mdW5jdGlvbk5hbWUgfHwgdGhyb3cgbmV3IEVycm9yKGDigKIgZnVuY3Rpb24gcmVzb3VyY2UgbXVzdCBoYXZlIGEgXCJmdW5jdGlvbk5hbWVcIiAtICR7cmVzb3VyY2Uuc291cmNlLnByb3BlcnRpZXMuZnVuY3Rpb25OYW1lfWApXG4gIGxldCBmdW5jdGlvbkNhbGxiYWNrID0gcmVmZXJlbmNlQ29udGV4dFtmdW5jdGlvbk5hbWVdIHx8IHRocm93IG5ldyBFcnJvcihg4oCiIHJlZmVyZW5jZSBmdW5jdGlvbiBuYW1lIGRvZXNuJ3QgZXhpc3QuYClcbiAgdHJ5IHtcbiAgICByZXR1cm4gYXdhaXQgZnVuY3Rpb25DYWxsYmFjayh7IG5vZGU6IHByb2Nlc3NOb2RlLCBjb250ZXh0OiBncmFwaEluc3RhbmNlLmNvbnRleHQsIHRyYXZlcnNlQ2FsbENvbnRleHQgfSlcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycm9yKSAmJiBwcm9jZXNzLmV4aXQoKVxuICB9XG59XG5cbi8qXG4gXG4gICBfX19fICAgICAgICAgICAgXyAgICAgICBfICAgICBfX19fXyAgICAgICAgICAgICAgICAgICAgIF8gICBfICAgICAgICAgICAgIFxuICAvIF9fX3wgIF9fXyBfIF9fKF8pXyBfXyB8IHxfICB8IF9fX198XyAgX19fX18gIF9fXyBfICAgX3wgfF8oXykgX19fICBfIF9fICBcbiAgXFxfX18gXFwgLyBfX3wgJ19ffCB8ICdfIFxcfCBfX3wgfCAgX3wgXFwgXFwvIC8gXyBcXC8gX198IHwgfCB8IF9ffCB8LyBfIFxcfCAnXyBcXCBcbiAgIF9fXykgfCAoX198IHwgIHwgfCB8XykgfCB8XyAgfCB8X19fID4gIDwgIF9fLyAoX198IHxffCB8IHxffCB8IChfKSB8IHwgfCB8XG4gIHxfX19fLyBcXF9fX3xffCAgfF98IC5fXy8gXFxfX3wgfF9fX19fL18vXFxfXFxfX198XFxfX198XFxfXyxffFxcX198X3xcXF9fXy98X3wgfF98XG4gICAgICAgICAgICAgICAgICAgIHxffCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuIFJlbGllcyBvbiBmdW5jdGlvbiByZWZlcmVuY2UgY29uY2VwdC5cbiovXG5cbi8vIEV4ZWN1dGUgdGFzayBzY3JpcHQgaW4gdGhlIHNhbWUgcHJvY2VzcyAobm9kZWpzIGNoaWxkcHJvY2Vzcy5leGVjU3luYykgdXNpbmcgYSByZWZlcmVuY2Ugc2NyaXB0UGF0aCBwcm9wZXJ0eS5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleGVjdXRlU2hlbGxzY3JpcHRGaWxlKHsgc3RhZ2VOb2RlLCBwcm9jZXNzTm9kZSwgZ3JhcGhJbnN0YW5jZSwgbmV4dFByb2Nlc3NEYXRhIH0sIHsgYWRkaXRpb25hbFBhcmFtZXRlciwgdHJhdmVyc2VDYWxsQ29udGV4dCB9KSB7XG4gIGxldCBtZXNzYWdlID0gYCBfX19fXyAgICAgICAgICAgICAgICAgICAgICAgICAgXyAgICAgICAgXG4gIHwgX19fX3xfXyAgX18gX19fICAgX19fICBfICAgXyB8IHxfICBfX18gXG4gIHwgIF98ICBcXFxcIFxcXFwvIC8vIF8gXFxcXCAvIF9ffHwgfCB8IHx8IF9ffC8gXyBcXFxcXG4gIHwgfF9fXyAgPiAgPHwgIF9fL3wgKF9fIHwgfF98IHx8IHxffCAgX18vICAgIFxuICB8X19fX198L18vXFxcXF9cXFxcXFxcXF9fX3wgXFxcXF9fX3wgXFxcXF9fLF98IFxcXFxfX3xcXFxcX19ffGBcbiAgbGV0IGNvbnRleHRQcm9wZXJ0eU5hbWUgPSAnZmlsZUNvbnRleHQnLFxuICAgIHJlZmVyZW5jZUNvbnRleHQgPSBncmFwaEluc3RhbmNlLmNvbnRleHRbY29udGV4dFByb3BlcnR5TmFtZV1cbiAgYXNzZXJ0KHJlZmVyZW5jZUNvbnRleHQsIGDigKIgQ29udGV4dCBcIiR7Y29udGV4dFByb3BlcnR5TmFtZX1cIiB2YXJpYWJsZSBpcyByZXF1aXJlZCB0byByZWZlcmVuY2UgZnVuY3Rpb25zIGZyb20gZ3JhcGggZGF0YWJhc2Ugc3RyaW5ncy5gKVxuXG4gIGxldCByZXNvdXJjZVxuICBjb25zdCB7IHJlc291cmNlQXJyYXkgfSA9IGF3YWl0IGdyYXBoSW5zdGFuY2UuZGF0YWJhc2VXcmFwcGVyLmdldFJlc291cmNlKHsgY29uY3JldGVEYXRhYmFzZTogZ3JhcGhJbnN0YW5jZS5kYXRhYmFzZSwgbm9kZUlEOiBwcm9jZXNzTm9kZS5pZGVudGl0eSB9KVxuICBpZiAocmVzb3VyY2VBcnJheS5sZW5ndGggPiAxKSB0aHJvdyBuZXcgRXJyb3IoYOKAoiBNdWx0aXBsZSByZXNvdXJjZSByZWxhdGlvbnNoaXBzIGFyZSBub3Qgc3VwcG9ydGVkIGZvciBQcm9jZXNzIG5vZGUuYClcbiAgZWxzZSBpZiAocmVzb3VyY2VBcnJheS5sZW5ndGggPT0gMCkgcmV0dXJuXG4gIGVsc2UgcmVzb3VyY2UgPSByZXNvdXJjZUFycmF5WzBdXG4gIGxldCBzY3JpcHRSZWZlcmVuY2VLZXkgPSByZXNvdXJjZS5zb3VyY2UucHJvcGVydGllcy5yZWZlcmVuY2VLZXlcbiAgYXNzZXJ0KHNjcmlwdFJlZmVyZW5jZUtleSwgYOKAoiByZXNvdXJjZSBGaWxlIG5vZGUgKHdpdGgga2V5OiAke3Jlc291cmNlLnNvdXJjZS5wcm9wZXJ0aWVzLmtleX0pIG11c3QgaGF2ZSBcInJlZmVyZW5jZUtleVwiIHByb3BlcnR5LmApXG5cbiAgdHJ5IHtcbiAgICBjb25zb2xlLmxvZyhtZXNzYWdlKVxuICAgIGxldCBzY3JpcHRQYXRoID0gcmVmZXJlbmNlQ29udGV4dFtzY3JpcHRSZWZlcmVuY2VLZXldXG4gICAgYXNzZXJ0KHNjcmlwdFBhdGgsIGDigKIgcmVmZXJlbmNlS2V5IG9mIEZpbGUgbm9kZSAocmVmZXJlbmNlS2V5ID0gJHtzY3JpcHRSZWZlcmVuY2VLZXl9KSB3YXMgbm90IGZvdW5kIGluIHRoZSBncmFwaEluc3RhbmNlIGNvbnRleHQ6ICR7cmVmZXJlbmNlQ29udGV4dH0gYClcbiAgICBjb25zb2xlLmxvZyhgXFx4MWJbNDVtJXNcXHgxYlswbWAsIGBzaGVsbHNjcmlwdCBwYXRoOiAke3NjcmlwdFBhdGh9YClcbiAgICBleGVjU3luYyhgc2ggJHtzY3JpcHRQYXRofWAsIHsgY3dkOiBwYXRoLmRpcm5hbWUoc2NyaXB0UGF0aCksIHNoZWxsOiB0cnVlLCBzdGRpbzogWydpbmhlcml0JywgJ2luaGVyaXQnLCAnaW5oZXJpdCddIH0pXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgdGhyb3cgZXJyb3JcbiAgICBwcm9jZXNzLmV4aXQoMSlcbiAgfVxuICAvLyBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgNTAwKSkgLy8gd2FpdCB4IHNlY29uZHMgYmVmb3JlIG5leHQgc2NyaXB0IGV4ZWN1dGlvbiAvLyBpbXBvcnRhbnQgdG8gcHJldmVudCAndW5hYmxlIHRvIHJlLW9wZW4gc3RkaW4nIGVycm9yIGJldHdlZW4gc2hlbGxzLlxuICByZXR1cm4gbnVsbFxufVxuXG4vKipcbiAgUnVuIGNoaWxkcHJvY2VzcyBzeW5jaG5vbG91cyBzcGF3biBjb21tYW5kOiBcbiAgUmVxdWlyZWQgcHJvcGVydGllcyBvbiBwcm9jZXNzIG5vZGU6IFxuICBAcGFyYW0ge1N0cmluZ30gY29tbWFuZFxuICBAcGFyYW0ge1N0cmluZ1tdfSBhcmd1bWVudFxuICBAcGFyYW0ge0pzb24gc3RyaW5naWZpZXMgc3RyaW5nfSBvcHRpb25cbiovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhlY3V0ZVNjcmlwdFNwYXduKHsgc3RhZ2VOb2RlLCBwcm9jZXNzTm9kZSwgZ3JhcGhJbnN0YW5jZSwgbmV4dFByb2Nlc3NEYXRhIH0sIHsgYWRkaXRpb25hbFBhcmFtZXRlciwgdHJhdmVyc2VDYWxsQ29udGV4dCB9KSB7XG4gIGxldCBjaGlsZFByb2Nlc3NcbiAgdHJ5IHtcbiAgICBsZXQgY29tbWFuZCA9IHByb2Nlc3NOb2RlLnByb3BlcnRpZXMuY29tbWFuZCxcbiAgICAgIGFyZ3VtZW50ID0gcHJvY2Vzc05vZGUucHJvcGVydGllcy5hcmd1bWVudC5qb2luKCcgJyksXG4gICAgICBvcHRpb24gPSBKU09OLnN0cmluZ2lmeShwcm9jZXNzTm9kZS5wcm9wZXJ0aWVzLm9wdGlvbilcbiAgICBjb25zb2xlLmxvZyhgXFx4MWJbNDVtJXNcXHgxYlswbWAsIGAke2NvbW1hbmR9ICR7YXJndW1lbnR9YClcbiAgICBjaGlsZFByb2Nlc3MgPSBzcGF3blN5bmMoY29tbWFuZCwgYXJndW1lbnQsIG9wdGlvbilcbiAgICBpZiAoY2hpbGRQcm9jZXNzLnN0YXR1cyA+IDApIHRocm93IGNoaWxkUHJvY2Vzcy5lcnJvclxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHByb2Nlc3MuZXhpdChjaGlsZFByb2Nlc3Muc3RhdHVzKVxuICB9XG59XG5cbi8qXG4gICBfXyAgX18gXyAgICAgXyAgICAgXyBfICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgfCAgXFwvICAoXykgX198IHwgX198IHwgfCBfX19fXyAgICAgIF9fX18gXyBfIF9fIF9fXyBcbiAgfCB8XFwvfCB8IHwvIF9gIHwvIF9gIHwgfC8gXyBcXCBcXCAvXFwgLyAvIF9gIHwgJ19fLyBfIFxcXG4gIHwgfCAgfCB8IHwgKF98IHwgKF98IHwgfCAgX18vXFwgViAgViAvIChffCB8IHwgfCAgX18vXG4gIHxffCAgfF98X3xcXF9fLF98XFxfXyxffF98XFxfX198IFxcXy9cXF8vIFxcX18sX3xffCAgXFxfX198XG4gIEltbWVkaWF0ZWx5IGV4ZWN1dGUgbWlkZGxld2FyZVxuICBOb3RlOiBDaGVjayBncmFwaEludGVyY2VwdGlvbiBtZXRob2QgXCJoYW5kbGVNaWRkbGV3YXJlTmV4dENhbGxcIlxuKi9cbmV4cG9ydCBjb25zdCBpbW1lZGlhdGVseUV4ZWN1dGVNaWRkbGV3YXJlID0gYXN5bmMgKHsgc3RhZ2VOb2RlLCBwcm9jZXNzTm9kZSwgZ3JhcGhJbnN0YW5jZSwgbmV4dFByb2Nlc3NEYXRhIH0sIHsgYWRkaXRpb25hbFBhcmFtZXRlciwgdHJhdmVyc2VDYWxsQ29udGV4dCB9KSA9PiB7XG4gIGNvbnN0IHsgbmV4dEZ1bmN0aW9uIH0gPSBhZGRpdGlvbmFsUGFyYW1ldGVyXG4gIGxldCBjb250ZXh0UHJvcGVydHlOYW1lID0gJ2Z1bmN0aW9uUmVmZXJlbmNlQ29udGV4dCcsXG4gICAgcmVmZXJlbmNlQ29udGV4dCA9IGdyYXBoSW5zdGFuY2UuY29udGV4dFtjb250ZXh0UHJvcGVydHlOYW1lXVxuICBhc3NlcnQocmVmZXJlbmNlQ29udGV4dCwgYOKAoiBDb250ZXh0IFwiJHtjb250ZXh0UHJvcGVydHlOYW1lfVwiIHZhcmlhYmxlIGlzIHJlcXVpcmVkIHRvIHJlZmVyZW5jZSBmdW5jdGlvbnMgZnJvbSBncmFwaCBkYXRhYmFzZSBzdHJpbmdzLmApXG4gIGFzc2VydChncmFwaEluc3RhbmNlLm1pZGRsZXdhcmVQYXJhbWV0ZXI/LmNvbnRleHQsIGDigKIgTWlkZGxld2FyZSBncmFwaCB0cmF2ZXJzYWwgcmVsaWVzIG9uIGdyYXBoSW5zdGFuY2UubWlkZGxld2FyZVBhcmFtZXRlci5jb250ZXh0YClcblxuICBsZXQgcmVzb3VyY2VcbiAgY29uc3QgeyByZXNvdXJjZUFycmF5IH0gPSBhd2FpdCBncmFwaEluc3RhbmNlLmRhdGFiYXNlV3JhcHBlci5nZXRSZXNvdXJjZSh7IGNvbmNyZXRlRGF0YWJhc2U6IGdyYXBoSW5zdGFuY2UuZGF0YWJhc2UsIG5vZGVJRDogcHJvY2Vzc05vZGUuaWRlbnRpdHkgfSlcbiAgaWYgKHJlc291cmNlQXJyYXkubGVuZ3RoID4gMSkgdGhyb3cgbmV3IEVycm9yKGDigKIgTXVsdGlwbGUgcmVzb3VyY2UgcmVsYXRpb25zaGlwcyBhcmUgbm90IHN1cHBvcnRlZCBmb3IgUHJvY2VzcyBub2RlLmApXG4gIGVsc2UgaWYgKHJlc291cmNlQXJyYXkubGVuZ3RoID09IDApIHJldHVyblxuICBlbHNlIHJlc291cmNlID0gcmVzb3VyY2VBcnJheVswXVxuXG4gIGFzc2VydChyZXNvdXJjZS5zb3VyY2UubGFiZWxzLmluY2x1ZGVzKGdyYXBoSW5zdGFuY2Uuc2NoZW1lUmVmZXJlbmNlLm5vZGVMYWJlbC5mdW5jdGlvbiksIGDigKIgVW5zdXBwb3J0ZWQgTm9kZSB0eXBlIGZvciByZXNvdXJjZSBjb25uZWN0aW9uLmApXG4gIGxldCBmdW5jdGlvbk5hbWUgPSByZXNvdXJjZS5zb3VyY2UucHJvcGVydGllcy5mdW5jdGlvbk5hbWUgfHwgdGhyb3cgbmV3IEVycm9yKGDigKIgZnVuY3Rpb24gcmVzb3VyY2UgbXVzdCBoYXZlIGEgXCJmdW5jdGlvbk5hbWVcIiAtICR7cmVzb3VyY2Uuc291cmNlLnByb3BlcnRpZXMuZnVuY3Rpb25OYW1lfWApXG4gIC8vIGEgZnVuY3Rpb24gdGhhdCBjb21wbGllcyB3aXRoIGdyYXBoVHJhdmVyc2FsIHByb2Nlc3NEYXRhIGltcGxlbWVudGF0aW9uLlxuICBsZXQgZnVuY3Rpb25DYWxsYmFjayA9IHJlZmVyZW5jZUNvbnRleHRbZnVuY3Rpb25OYW1lXSB8fCB0aHJvdyBuZXcgRXJyb3IoYOKAoiByZWZlcmVuY2UgZnVuY3Rpb24gbmFtZSBkb2Vzbid0IGV4aXN0LmApXG4gIHRyeSB7XG4gICAgbGV0IG1pZGRsZXdhcmUgPSBhd2FpdCBmdW5jdGlvbkNhbGxiYWNrKHsgbm9kZTogcHJvY2Vzc05vZGUgfSkgLy8gZXhwcmVjdGVkIHRvIHJldHVybiBhIEtvYSBtaWRkbGV3YXJlIGNvbXBseWluZyBmdW5jdGlvbi5cbiAgICBsZXQgY29udGV4dCA9IGdyYXBoSW5zdGFuY2UubWlkZGxld2FyZVBhcmFtZXRlci5jb250ZXh0LFxuICAgICAgbmV4dCA9IG5leHRGdW5jdGlvblxuICAgIGF3YWl0IG1pZGRsZXdhcmUoY29udGV4dCwgbmV4dCkgLy8gZXhlY3V0ZSBtaWRkbGV3YXJlXG4gICAgcmV0dXJuIG1pZGRsZXdhcmUgLy8gYWxsb3cgdG8gYWdncmVnYXRlIG1pZGRsZXdhcmUgZnVuY3Rpb24gZm9yIGRlYnVnZ2luZyBwdXJwb3Nlcy5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycm9yKSAmJiBwcm9jZXNzLmV4aXQoKVxuICB9XG59XG5cbi8qXG4gICBfX19fICBfX19fXyBfX19fICBfX19fICBfX19fXyBfX19fICAgIF8gIF9fX19fIF9fX19fIF9fX18gIFxuICB8ICBfIFxcfCBfX19ffCAgXyBcXHwgIF8gXFx8IF9fX18vIF9fX3wgIC8gXFx8XyAgIF98IF9fX198ICBfIFxcIFxuICB8IHwgfCB8ICBffCB8IHxfKSB8IHxfKSB8ICBffHwgfCAgICAgLyBfIFxcIHwgfCB8ICBffCB8IHwgfCB8XG4gIHwgfF98IHwgfF9fX3wgIF9fL3wgIF8gPHwgfF9ffCB8X19fIC8gX19fIFxcfCB8IHwgfF9fX3wgfF98IHxcbiAgfF9fX18vfF9fX19ffF98ICAgfF98IFxcX1xcX19fX19cXF9fX18vXy8gICBcXF9cXF98IHxfX19fX3xfX19fLyBcbiAgUmVxdWlyZXMgcmVmYWN0b3JpbmcgYW5kIG1pZ3JhdGlvbiBcbiovXG4vKlxuICAgX19fX18gICAgICAgICAgICAgICAgICAgIF8gICAgICAgXyAgICAgICBcbiAgfF8gICBffF9fIF8gX18gX19fICBfIF9fIHwgfCBfXyBffCB8XyBfX18gXG4gICAgfCB8LyBfIFxcICdfIGAgXyBcXHwgJ18gXFx8IHwvIF9gIHwgX18vIF8gXFxcbiAgICB8IHwgIF9fLyB8IHwgfCB8IHwgfF8pIHwgfCAoX3wgfCB8fCAgX18vXG4gICAgfF98XFxfX198X3wgfF98IHxffCAuX18vfF98XFxfXyxffFxcX19cXF9fX3xcbiAgICAgICAgICAgICAgICAgICAgIHxffCAgICAgICAgICAgICAgICAgICAgXG4qL1xuXG4vKipcbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IFN0cmluZyBvZiByZW5kZXJlZCBIVE1MIGRvY3VtZW50IGNvbnRlbnQuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGluaXRpYWxpemVOZXN0ZWRVbml0KHsgbmVzdGVkVW5pdEtleSwgYWRkaXRpb25hbENoaWxkTmVzdGVkVW5pdCA9IFtdLCBwYXRoUG9pbnRlcktleSA9IG51bGwgfSkge1xuICAvLyB2aWV3cyBhcmd1bWVudCB0aGF0IHdpbGwgYmUgaW5pdGlhbGxpemVkIGluc2lkZSB0ZW1wbGF0ZXM6XG4gIC8vIGxvb3AgdGhyb3VnaCB0ZW1wbGF0ZSBhbmQgY3JlYXRlIHJlbmRlcmVkIHZpZXcgY29udGVudC5cbiAgbGV0IHZpZXcgPSBhd2FpdCBuZXN0ZWRVbml0SW5zdGFuY2UubG9vcEluc2VydGlvblBvaW50KHsgdHlwZTogJ2FnZ3JlZ2F0ZUludG9UZW1wbGF0ZU9iamVjdCcgfSlcblxuICBhc3NlcnQodGhpcy5wb3J0QXBwSW5zdGFuY2UuY29uZmlnLmNsaWVudFNpZGVQYXRoLCBcIuKAoiBjbGllbnRTaWRlUGF0aCBjYW5ub3QgYmUgdW5kZWZpbmVkLiBpLmUuIHByZXZpb3VzIG1pZGRsZXdhcmVzIHNob3VsZCd2ZSBzZXQgaXRcIilcbiAgbGV0IHRlbXBsYXRlUGF0aCA9IHBhdGguam9pbih0aGlzLnBvcnRBcHBJbnN0YW5jZS5jb25maWcuY2xpZW50U2lkZVBhdGgsIHVuaXRJbnN0YW5jZS5maWxlLmZpbGVQYXRoKVxuICBsZXQgcmVuZGVyZWRDb250ZW50XG4gIHN3aXRjaCAodW5pdEluc3RhbmNlLnByb2Nlc3NEYXRhSW1wbGVtZW50YXRpb24pIHtcbiAgICBkZWZhdWx0OlxuICAgIGNhc2UgJ3VuZGVyc2NvcmVSZW5kZXJpbmcnOlxuICAgICAgcmVuZGVyZWRDb250ZW50ID0gYXdhaXQgdGhpcy51bmRlcnNjb3JlUmVuZGVyaW5nKHsgdGVtcGxhdGVQYXRoLCB2aWV3IH0pXG4gICAgICBicmVha1xuICB9XG5cbiAgc3dpdGNoICh1bml0SW5zdGFuY2UucHJvY2Vzc1JlbmRlcmVkQ29udGVudCkge1xuICAgIGNhc2UgJ3dyYXBKc1RhZyc6XG4gICAgICByZW5kZXJlZENvbnRlbnQgPSBgPHNjcmlwdCB0eXBlPVwibW9kdWxlXCIgYXN5bmM+JHtyZW5kZXJlZENvbnRlbnR9PC9zY3JpcHQ+YFxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OiAvLyBza2lwXG4gIH1cblxuICByZXR1cm4gcmVuZGVyZWRDb250ZW50XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHVuZGVyc2NvcmVSZW5kZXJpbmcoeyB0ZW1wbGF0ZVBhdGgsIHZpZXcgfSkge1xuICAvLyBMb2FkIHRlbXBsYXRlIGZpbGUuXG4gIGxldCB0ZW1wbGF0ZVN0cmluZyA9IGF3YWl0IGZpbGVzeXN0ZW0ucmVhZEZpbGVTeW5jKHRlbXBsYXRlUGF0aCwgJ3V0Zi04JylcbiAgLy8gU2hhcmVkIGFyZ3VtZW50cyBiZXR3ZWVuIGFsbCB0ZW1wbGF0ZXMgYmVpbmcgcmVuZGVyZWRcbiAgY29uc3QgdGVtcGxhdGVBcmd1bWVudCA9IHtcbiAgICB0ZW1wbGF0ZUNvbnRyb2xsZXI6IHRoaXMsXG4gICAgY29udGV4dDogdGhpcy5wb3J0QXBwSW5zdGFuY2UuY29udGV4dCxcbiAgICBBcHBsaWNhdGlvbixcbiAgICBhcmd1bWVudDoge30sXG4gIH1cbiAgbGV0IHJlbmRlcmVkQ29udGVudCA9IHVuZGVyc2NvcmUudGVtcGxhdGUodGVtcGxhdGVTdHJpbmcpKFxuICAgIE9iamVjdC5hc3NpZ24oXG4gICAgICB7fSxcbiAgICAgIHRlbXBsYXRlQXJndW1lbnQsIC8vIHVzZSB0ZW1wbGF0ZUFyZ3VtZW50IGluIGN1cnJlbnQgdGVtcGxhdGVcbiAgICAgIHsgdmlldywgdGVtcGxhdGVBcmd1bWVudCB9LCAvLyBwYXNzIHRlbXBsYXRlQXJndW1lbnQgdG8gbmVzdGVkIHRlbXBsYXRlc1xuICAgICksXG4gIClcbiAgcmV0dXJuIHJlbmRlcmVkQ29udGVudFxufVxuXG5mdW5jdGlvbiByZW5kZXJlZENvbnRlbnRTdHJpbmcodmlld05hbWUsIHZpZXdPYmplY3QpIHtcbiAgLy8gbG9vcCB0aHJvdWdodCB0aGUgc3RyaW5ncyBhcnJheSB0byBjb21iaW5lIHRoZW0gYW5kIHByaW50IHN0cmluZyBjb2RlIHRvIHRoZSBmaWxlLlxuICBpZiAodmlld09iamVjdFt2aWV3TmFtZV0gJiYgQXJyYXkuaXNBcnJheSh2aWV3T2JqZWN0W3ZpZXdOYW1lXSkpIHtcbiAgICByZXR1cm4gdmlld09iamVjdFt2aWV3TmFtZV0uam9pbignJykgLy8gam9pbnMgYWxsIGFycmF5IGNvbXBvbmVudHMgaW50byBvbmUgc3RyaW5nLlxuICB9XG59XG5cbmxldCB0cmF2ZXJzZVBvcnQgPSBhc3luYyBmdW5jdGlvbiBhZ2dyZWdhdGVJbnRvVGVtcGxhdGVPYmplY3QoKSB7XG4gIGxldCB2aWV3ID0ge31cbiAgaWYgKHRoaXMuaW5zZXJ0aW9uUG9pbnQpIHtcbiAgICBmb3IgKGxldCBpbnNlcnRpb25Qb2ludCBvZiB0aGlzLmluc2VydGlvblBvaW50KSB7XG4gICAgICBsZXQgY2hpbGRyZW4gPSBhd2FpdCB0aGlzLmZpbHRlckFuZE9yZGVyQ2hpbGRyZW4oeyBpbnNlcnRpb25Qb2ludEtleTogaW5zZXJ0aW9uUG9pbnQua2V5IH0pXG4gICAgICBsZXQgc3Vic2VxdWVudCA9IGF3YWl0IHRoaXMuaW5pdGlhbGl6ZUluc2VydGlvblBvaW50KHsgaW5zZXJ0aW9uUG9pbnQsIGNoaWxkcmVuIH0pXG4gICAgICBpZiAoIShpbnNlcnRpb25Qb2ludC5uYW1lIGluIHZpZXcpKSB2aWV3W2luc2VydGlvblBvaW50Lm5hbWVdID0gW11cbiAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KHZpZXdbaW5zZXJ0aW9uUG9pbnQubmFtZV0sIHN1YnNlcXVlbnQpXG4gICAgfVxuICB9XG4gIHJldHVybiB2aWV3XG59XG5cbi8qXG4gXG5UT0RPOiBhcyB0aGVyZWB6IGlzIGFuIEFQSSBTY2hlbWEsIGEgZGF0YWJhc2Ugc2NoZW1hIGNhbiBtYWtlIGNvbnRlbnQgZXh0cmVtZWx5IGR5bmFtaWMuIC1EYXRhYmFzZSBzY2hlbWEgaXMgZGlmZmVyZW50IGZyb20gQVBJIFNjaGVtYS4gICAgICAgICBcblxuXG4gICBfX18gIF9fX3wgfF9fICAgX19fIF8gX18gX19fICAgX18gXyBcbiAgLyBfX3wvIF9ffCAnXyBcXCAvIF8gXFwgJ18gYCBfIFxcIC8gX2AgfFxuICBcXF9fIFxcIChfX3wgfCB8IHwgIF9fLyB8IHwgfCB8IHwgKF98IHxcbiAgfF9fXy9cXF9fX3xffCB8X3xcXF9fX3xffCB8X3wgfF98XFxfXyxffFxuIEFQSSBTY2hlbWFcbiAgKFdoaWxlIHRoZSBkYXRhYmFzZSBtb2RlbHMgYXJlIHNlcGFyYXRlIGluIHRoZWlyIG93biBmdW5jdGlvbnMgb3IgY291bGQgYmUgZXhwb3NlZCB0aHJvdWdoIGEgY2xhc3MgbW9kdWxlKVxuXG4gIC0gUmVzb2x2ZXIgZnVuY3Rpb24gPSBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBkYXRhLlxuICAtIERhdGEgbG9hZGVyID0gbW9kdWxlIHRoYXQgYWdncmVnYXRlcyBkdXBsaWNhdGUgY2FsbHMuIFNvbHZpbmcgdGhlIG4rMSBwcm9ibGVtLCB3aGVyZSBlYWNoIHF1ZXJ5IGhhcyBhIHN1YnNlcXVlbnQgcXVlcnksIGxpbmVhciBncmFwaC4gVG8gbm9kZWpzIGl0IHVzZXMgbmV4dFRpY2sgZnVuY3Rpb24gdG8gYW5hbHlzZSB0aGUgcHJvbWlzZXMgYmVmb3JlIHRoZWlyIGV4ZWN1dGlvbiBhbmQgcHJldmVudCBtdWx0aXBsZSByb3VuZCB0cmlwcyB0byB0aGUgc2VydmVyIGZvciB0aGUgc2FtZSBkYXRhLlxuICAtIE1hcHBpbmcgLSB0aHJvdWdoIHJvc29sdmVyIGZ1bmN0aW9ucy5cbiAgLSBTY2hlbWEgPSBpcyB0aGUgc3RydWN0dXJlICYgcmVsYXRpb25zaGlwcyBvZiB0aGUgYXBpIGRhdGEuIGkuZS4gZGVmaW5lcyBob3cgYSBjbGllbnQgY2FuIGZldGNoIGFuZCB1cGRhdGUgZGF0YS5cbiAgICAgIGVhY2ggc2NoZW1hIGhhcyBhcGkgZW50cnlwb2ludHMuIEVhY2ggZmllbGQgY29ycmVzcG9uZHMgdG8gYSByZXNvbHZlciBmdW5jdGlvbi5cbiAgRGF0YSBmZXRjaGluZyBjb21wbGV4aXR5IGFuZCBkYXRhIHN0cnVjdHVyaW5nIGlzIGhhbmRsZWQgYnkgc2VydmVyIHNpZGUgcmF0aGVyIHRoYW4gY2xpZW50LlxuXG4gIDMgdHlwZXMgb2YgcG9zc2libGUgYXBpIGFjdGlvbnM6IFxuICAtIFF1ZXJ5XG4gIC0gTXV0YXRpb25cbiAgLSBTdWJzY3JpcHRpb24gLSBjcmVhdGVzIGEgc3RlYWR5IGNvbm5lY3Rpb24gd2l0aCB0aGUgc2VydmVyLlxuXG4gIEZldGNoaW5nIGFwcHJvYWNoZXM6IFxuICDigKIgSW1wZXJhdGl2ZSBmZXRjaGluZzogXG4gICAgICAtIGNvbnN0cnVjdHMgJiBzZW5kcyBIVFRQIHJlcXVlc3QsIGUuZy4gdXNpbmcganMgZmV0Y2guXG4gICAgICAtIHJlY2VpdmUgJiBwYXJzZSBzZXJ2ZXIgcmVzcG9uc2UuXG4gICAgICAtIHN0b3JlIGRhdGEgbG9jYWxseSwgZS5nLiBpbiBtZW1vcnkgb3IgcGVyc2lzdGVudC4gXG4gICAgICAtIGRpc3BsYXkgVUkuXG4gIOKAoiBEZWNsYXJhdGl2ZSBmZXRjaGluZyBlLmcuIHVzaW5nIEdyYXBoUUwgY2xpZW50czogXG4gICAgICAtIERlc2NyaWJlIGRhdGEgcmVxdWlyZW1lbnRzLlxuICAgICAgLSBEaXNwbGF5IGluZm9ybWF0aW9uIGluIHRoZSBVSS5cblxuICBSZXF1ZXN0OiBcbiAge1xuICAgICAgYWN0aW9uOiBxdWVyeSxcbiAgICAgIGVudHJ5cG9pbnQ6IHtcbiAgICAgICAgICBrZXk6IFwiQXJ0aWNsZVwiXG4gICAgICB9LFxuICAgICAgZnVuY3Rpb246IHtcbiAgICAgICAgICBuYW1lOiBcInNpbmdsZVwiLFxuICAgICAgICAgIGFyZ3M6IHtcbiAgICAgICAgICAgICAga2V5OiBcImFydGljbGUxXCJcbiAgICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZmllbGQ6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgIGtleW5hbWU6IFwidGl0bGVcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgICBrZXluYW1lOiBcInBhcmFncmFwaFwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgIGtleW5hbWU6IFwiYXV0aG9yc1wiXG4gICAgICAgICAgfSxcbiAgICAgIF1cbiAgfVxuXG4gIFJlc3BvbnNlIDpcbiAge1xuICAgICAgZGF0YToge1xuICAgICAgICAgIHRpdGxlOiBcIi4uLlwiLFxuICAgICAgICAgIHBhcmFncmFwaDogJy4uLicsXG4gICAgICAgICAgYXV0aG9yOiB7XG4gICAgICAgICAgICAgIG5hbWU6ICcuLi4nLFxuICAgICAgICAgICAgICBhZ2U6IDIwXG4gICAgICAgICAgfVxuICAgICAgfVxuICB9XG5cblxuICBOZXN0ZWQgVW5pdCBleGVjdXRpb24gc3RlcHM6ICBcbuKAoiBcbiovXG5cbmxldCBzY2hlbWEgPSAoKSA9PiB7XG4gIC8qKlxuICAgKiBJbXBsZW1lbnRhdGlvbiB0eXBlIGFnZ3JlZ2F0ZUludG9Db250ZW50QXJyYXlcbiAgICovXG4gIC8qIGV4bXBsZSByZXF1ZXN0IGJvZHk6IFxue1xuICAgIFwiZmllbGROYW1lXCI6IFwiYXJ0aWNsZVwiLFxuICAgIFwiZmllbGRcIjogW1xuICAgICAgICB7XG4gICAgICAgICAgICBcImZpZWxkTmFtZVwiOiBcInRpdGxlXCIsXG4gICAgICAgICAgICBcImZpZWxkXCI6IFtdXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIFwiZmllbGROYW1lXCI6IFwicGFyYWdyYXBoXCIsXG4gICAgICAgICAgICBcImZpZWxkXCI6IFtdXG4gICAgICAgIH1cbiAgICBdLFxuICAgIFwic2NoZW1hTW9kZVwiOiBcIm5vblN0cmljdFwiLCAvLyBhbGxvdyBlbXB0eSBkYXRhc2V0cyBmb3Igc3BlY2lmaWVkIGZpZWxkcyBpbiB0aGUgbmVzdGVkIHVuaXQgc2NoZW1hLlxuICAgIFwiZXh0cmFmaWVsZFwiOiB0cnVlIC8vIGluY2x1ZGVzIGZpZWxkcyB0aGF0IGFyZSBub3QgZXh0cmFjdGVkIHVzaW5nIHRoZSBzY2hlbWEuXG59ICovXG4gIC8vIGNvbnN0IHsgYWRkLCBleGVjdXRlLCBjb25kaXRpb25hbCwgZXhlY3V0aW9uTGV2ZWwgfSA9IHJlcXVpcmUoJ0BkZXBlbmRlbmN5L2NvbW1vblBhdHRlcm4vc291cmNlL2RlY29yYXRvclV0aWxpdHkuanMnKVxuICBmdW5jdGlvbiBzY2hlbWEoeyB0aGlzQXJnIH0pIHtcbiAgICAvLyBmdW5jdGlvbiB3cmFwcGVyIHRvIHNldCB0aGlzQXJnIG9uIGltcGxlbWVudGFpb24gb2JqZWN0IGZ1bmN0aW9ucy5cblxuICAgIGxldCBzZWxmID0ge1xuICAgICAgQGV4ZWN1dGlvbkxldmVsKClcbiAgICAgIGFzeW5jIGluaXRpYWxpemVOZXN0ZWRVbml0KHsgbmVzdGVkVW5pdEtleSwgYWRkaXRpb25hbENoaWxkTmVzdGVkVW5pdCA9IFtdLCBwYXRoUG9pbnRlcktleSA9IG51bGwsIHBhcmVudCA9IHRoaXMsIGFyZ3VtZW50ID0ge30gfSkge1xuICAgICAgICAvLyBFbnRyeXBvaW50IEluc3RhbmNlXG4gICAgICAgIC8vIGV4dHJhY3QgcmVxdWVzdCBkYXRhIGFjdGlvbiBhcmd1bWVudHMuIGFyZ3VtZW50cyBmb3IgYSBxdWVyeS9tdXRhdGlvbi9zdWJzY3JpcHRpb24uXG4gICAgICAgIGlmICh0aGlzLmV4ZWN1dGlvbkxldmVsID09ICd0b3BMZXZlbCcpIHtcbiAgICAgICAgICBuZXN0ZWRVbml0SW5zdGFuY2UucmVxdWVzdE9wdGlvbiA9IHRoaXMucG9ydEFwcEluc3RhbmNlLmNvbnRleHQucmVxdWVzdC5ib2R5XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gY2hpbGQvbmVzdGVkXG4gICAgICAgICAgbGV0IGZpZWxkQXJyYXkgPSBwYXJlbnQucmVxdWVzdE9wdGlvbi5maWVsZCAvLyBvYmplY3QgYXJyYXlcbiAgICAgICAgICBpZiAoKGZpZWxkQXJyYXkgJiYgZmllbGRBcnJheS5sZW5ndGggPT0gMCkgfHwgIWZpZWxkQXJyYXkpIHtcbiAgICAgICAgICAgIG5lc3RlZFVuaXRJbnN0YW5jZS5yZXF1ZXN0T3B0aW9uID0ge30gLy8gY29udGludWUgdG8gcmVzb2x2ZSBkYXRhc2V0IGFuZCBhbGwgc3Vic2VxdWVudCBOZXN0ZWR1bml0cyBvZiBuZXN0ZWQgZGF0YXNldCBpbiBjYXNlIGFyZSBvYmplY3RzLlxuICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGRBcnJheSkge1xuICAgICAgICAgICAgbmVzdGVkVW5pdEluc3RhbmNlLnJlcXVlc3RPcHRpb24gPSBmaWVsZEFycmF5LmZpbmQoZmllbGQgPT4gZmllbGQuZmllbGROYW1lID09IHVuaXRJbnN0YW5jZS5maWVsZE5hbWUpIC8vIHdoZXJlIGZpZWxkTmFtZXMgbWF0Y2hcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjaGVjayBpZiBmaWVsZG5hbWUgZXhpc3RzIGluIHRoZSByZXF1ZXN0IG9wdGlvbiwgaWYgbm90IHNraXAgbmVzdGVkIHVuaXQuXG4gICAgICAgIGlmICghbmVzdGVkVW5pdEluc3RhbmNlLnJlcXVlc3RPcHRpb24pIHJldHVybiAvLyBmaWVsZE5hbWUgd2FzIG5vdCBzcGVjaWZpZWQgaW4gdGhlIHBhcmVudCBuZXN0ZWRVbml0LCB0aGVyZWZvcmUgc2tpcCBpdHMgZXhlY3V0aW9uXG4gICAgICAgIG5lc3RlZFVuaXRJbnN0YW5jZS5kYXRhc2V0ID0gYXdhaXQgdW5pdEluc3RhbmNlLnJlc29sdmVEYXRhc2V0KHsgcGFyZW50UmVzdWx0OiBhcmd1bWVudC5kYXRhc2V0IHx8IHBhcmVudC5kYXRhc2V0IH0pXG4gICAgICAgIC8vIFRPRE86IEZpeCByZXF1ZXN0T3B0aW9uIC0gaS5lLiBhYm92ZSBpdCBpcyB1c2VkIHRvIHBhc3MgXCJmaWVsZFwiIG9wdGlvbiBvbmx5LlxuICAgICAgICBpZiAodGhpcy5wb3J0QXBwSW5zdGFuY2UuY29udGV4dC5yZXF1ZXN0LmJvZHkuc2NoZW1hTW9kZSA9PSAnbm9uU3RyaWN0Jykge1xuICAgICAgICAgIC8vIERvbid0IGVuZm9yY2Ugc3RyaWN0IHNjaGVtYSwgaS5lLiBhbGwgbmVzdGVkIGNoaWxkcmVuIHNob3VsZCBleGlzdC5cbiAgICAgICAgICAvLyBpZihuZXN0ZWRVbml0SW5zdGFuY2UuZGF0YXNldCkgbmVzdGVkVW5pdEluc3RhbmNlLmRhdGFzZXQgPSBudWxsIC8vIFRPRE86IHRocm93cyBlcnJvciBhcyBuZXh0IGl0IGlzIGJlaW5nIHVzZWQuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXNzZXJ0Lm5vdEVxdWFsKG5lc3RlZFVuaXRJbnN0YW5jZS5kYXRhc2V0LCB1bmRlZmluZWQsIGDigKIgcmV0dXJuZWQgZGF0YXNldCBjYW5ub3QgYmUgdW5kZWZpbmVkIGZvciBmaWVsZE5hbWU6ICR7dW5pdEluc3RhbmNlLmZpZWxkTmFtZX0uYClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNoZWNrIHR5cGUgb2YgZGF0YXNldFxuICAgICAgICBsZXQgZGF0YXNldEhhbmRsaW5nXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KG5lc3RlZFVuaXRJbnN0YW5jZS5kYXRhc2V0KSAmJiBuZXN0ZWRVbml0SW5zdGFuY2UuY2hpbGRyZW4gJiYgbmVzdGVkVW5pdEluc3RhbmNlLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAvLyBhcnJheVxuICAgICAgICAgIGRhdGFzZXRIYW5kbGluZyA9ICdzZXF1ZW5jZSdcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgbmVzdGVkVW5pdEluc3RhbmNlLmRhdGFzZXQgPT0gJ29iamVjdCcgJiYgbmVzdGVkVW5pdEluc3RhbmNlLmNoaWxkcmVuICYmIG5lc3RlZFVuaXRJbnN0YW5jZS5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgLy8gb2JqZWN0XG4gICAgICAgICAgZGF0YXNldEhhbmRsaW5nID0gJ25lc3RlZCdcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBub24tbmVzdGVkIHZhbHVlXG4gICAgICAgICAgZGF0YXNldEhhbmRsaW5nID0gJ25vbk5lc3RlZCdcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGhhbmRsZSBhcnJheSwgb2JqZWN0LCBvciBub24tbmVzdGVkIHZhbHVlXG4gICAgICAgIGxldCBvYmplY3QgPSB7fSAvLyBmb3JtYXR0ZWQgb2JqZWN0IHdpdGggcmVxdWVzdGVkIGZpZWxkc1xuICAgICAgICBzd2l0Y2ggKGRhdGFzZXRIYW5kbGluZykge1xuICAgICAgICAgIGNhc2UgJ3NlcXVlbmNlJzpcbiAgICAgICAgICAgIGxldCBwcm9taXNlQXJyYXkgPSBuZXN0ZWRVbml0SW5zdGFuY2UuZGF0YXNldC5tYXAoZG9jdW1lbnQgPT4ge1xuICAgICAgICAgICAgICBsZXQgYXJndW1lbnQgPSB7fVxuICAgICAgICAgICAgICBhcmd1bWVudFsnZGF0YXNldCddID0gZG9jdW1lbnRcbiAgICAgICAgICAgICAgcmV0dXJuIG5lc3RlZFVuaXRJbnN0YW5jZS5sb29wSW5zZXJ0aW9uUG9pbnQoeyB0eXBlOiAnYWdncmVnYXRlSW50b0NvbnRlbnRBcnJheScsIGFyZ3VtZW50IH0pXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgbGV0IHN1YnNlcXVlbnREYXRhc2V0QXJyYXkgPSBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlQXJyYXkpXG4gICAgICAgICAgICBvYmplY3RbdW5pdEluc3RhbmNlLmZpZWxkTmFtZV0gPSBzdWJzZXF1ZW50RGF0YXNldEFycmF5Lm1hcCgoc3Vic2VxdWVudERhdGFzZXQsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLmZvcm1hdERhdGFzZXRPZk5lc3RlZFR5cGUoe1xuICAgICAgICAgICAgICAgIHN1YnNlcXVlbnREYXRhc2V0LFxuICAgICAgICAgICAgICAgIGRhdGFzZXQ6IG5lc3RlZFVuaXRJbnN0YW5jZS5kYXRhc2V0W2luZGV4XSxcbiAgICAgICAgICAgICAgICBvcHRpb246IHtcbiAgICAgICAgICAgICAgICAgIGV4dHJhZmllbGQ6IG5lc3RlZFVuaXRJbnN0YW5jZS5yZXF1ZXN0T3B0aW9uLmV4dHJhZmllbGQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSAnbmVzdGVkJzogLy8gaWYgZmllbGQgdHJlYXRlZCBhcyBhbiBvYmplY3Qgd2l0aCBuZXN0ZWQgZmllbGRzXG4gICAgICAgICAgICBsZXQgc3Vic2VxdWVudERhdGFzZXQgPSBhd2FpdCBuZXN0ZWRVbml0SW5zdGFuY2UubG9vcEluc2VydGlvblBvaW50KHsgdHlwZTogJ2FnZ3JlZ2F0ZUludG9Db250ZW50QXJyYXknIH0pXG4gICAgICAgICAgICBvYmplY3RbdW5pdEluc3RhbmNlLmZpZWxkTmFtZV0gPSB0aGlzLmZvcm1hdERhdGFzZXRPZk5lc3RlZFR5cGUoe1xuICAgICAgICAgICAgICBzdWJzZXF1ZW50RGF0YXNldCxcbiAgICAgICAgICAgICAgZGF0YXNldDogbmVzdGVkVW5pdEluc3RhbmNlLmRhdGFzZXQsXG4gICAgICAgICAgICAgIG9wdGlvbjoge1xuICAgICAgICAgICAgICAgIGV4dHJhZmllbGQ6IG5lc3RlZFVuaXRJbnN0YW5jZS5yZXF1ZXN0T3B0aW9uLmV4dHJhZmllbGQsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgY2FzZSAnbm9uTmVzdGVkJzpcbiAgICAgICAgICAgIC8vIGxvb3Bpbmcgb3ZlciBuZXN0ZWQgdW5pdHMgY2FuIG1hbmlwdWxhdGUgdGhlIGRhdGEgaW4gYSBkaWZmZXJlbnQgd2F5IHRoYW4gcmVndWxhciBhZ2dyZWdhdGlvbiBpbnRvIGFuIGFycmF5LlxuICAgICAgICAgICAgb2JqZWN0W3VuaXRJbnN0YW5jZS5maWVsZE5hbWVdID0gbmVzdGVkVW5pdEluc3RhbmNlLmRhdGFzZXRcblxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRlYWwgd2l0aCByZXF1ZXN0ZWQgYWxsIGZpZWxkcyB3aXRob3V0IHRoZSBmaWVsZCBvcHRpb24gd2hlcmUgZXhlY3V0aW9uIG9mIHN1Ym5lc3RlZHVuaXRzIGlzIHJlcXVpcmVkIHRvIG1hbmlwdWxhdGUgdGhlIGRhdGEuXG5cbiAgICAgICAgcmV0dXJuIG9iamVjdFxuICAgICAgfSxcblxuICAgICAgZm9ybWF0RGF0YXNldE9mTmVzdGVkVHlwZSh7IHN1YnNlcXVlbnREYXRhc2V0LCBkYXRhc2V0LCBvcHRpb24gfSkge1xuICAgICAgICBsZXQgb2JqZWN0ID0ge31cbiAgICAgICAgc3Vic2VxdWVudERhdGFzZXQuZm9yRWFjaChmaWVsZCA9PiB7XG4gICAgICAgICAgb2JqZWN0ID0gT2JqZWN0LmFzc2lnbihvYmplY3QsIGZpZWxkKVxuICAgICAgICB9KVxuICAgICAgICBpZiAob3B0aW9uLmV4dHJhZmllbGQpIHtcbiAgICAgICAgICAvLyBleHRyYWZpZWxkIG9wdGlvblxuICAgICAgICAgIG9iamVjdCA9IE9iamVjdC5hc3NpZ24oZGF0YXNldCwgb2JqZWN0KSAvLyBvdmVycmlkZSBzdWJzZXF1ZW50IGZpZWxkcyBhbmQga2VlcCB1bnRyYWNrZWQgZmllbGRzLlxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvYmplY3RcbiAgICAgIH0sXG4gICAgfVxuXG4gICAgT2JqZWN0LmtleXMoc2VsZikuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHNlbGZba2V5XSA9IHNlbGZba2V5XS5iaW5kKHRoaXNBcmcpXG4gICAgfSwge30pXG4gICAgcmV0dXJuIHNlbGZcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIHJlc29sdmVEYXRhc2V0KHtcbiAgICBwYXJlbnRSZXN1bHQgPSBudWxsLFxuICAgIC8vIHRoaXMuYXJncyAtIG5lc3RlZFVuaXQgYXJncyBmaWVsZC5cbiAgfSkge1xuICAgIC8vIFsyXSByZXF1aXJlICYgY2hlY2sgY29uZGl0aW9uXG4gICAgbGV0IGRhdGFzZXRcbiAgICBjb25zdCBhbGdvcml0aG0gPSB0aGlzLmZpbGUuYWxnb3JpdGhtIC8vIHJlc29sdmVyIGZvciBkYXRhc2V0XG4gICAgc3dpdGNoIChcbiAgICAgIGFsZ29yaXRobS50eXBlIC8vIGluIG9yZGVyIHRvIGNob29zZSBob3cgdG8gaGFuZGxlIHRoZSBhbGdvcml0aG0gKGFzIGEgbW9kdWxlID8gYSBmaWxlIHRvIGJlIGltcG9ydGVkID8uLi4pXG4gICAgKSB7XG4gICAgICBjYXNlICdmaWxlJzpcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgbW9kdWxlID0gcmVxdWlyZShhbGdvcml0aG0ucGF0aCkuZGVmYXVsdFxuICAgICAgICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAnZnVuY3Rpb24nKSBtb2R1bGUgPSBtb2R1bGUuZGVmYXVsdCAvLyBjYXNlIGVzNiBtb2R1bGUgbG9hZGVkIHdpdGggcmVxdWlyZSBmdW5jdGlvbiAod2lsbCBsb2FkIGl0IGFzIGFuIG9iamVjdClcbiAgICAgICAgICBsZXQgcmVzb2x2ZXIgPSBtb2R1bGUoKSAvKmluaXRpYWwgZXhlY3V0ZSBmb3Igc2V0dGluZyBwYXJhbWV0ZXIgY29udGV4dC4qL1xuICAgICAgICAgIGxldCByZXNvbHZlckFyZ3VtZW50ID0gT2JqZWN0LmFzc2lnbiguLi5bdGhpcy5hcmdzLCBhbGdvcml0aG0uYXJndW1lbnRdLmZpbHRlcihCb29sZWFuKSkgLy8gcmVtb3ZlIHVuZGVmaW5lZC9udWxsL2ZhbHNlIG9iamVjdHMgYmVmb3JlIG1lcmdpbmcuXG4gICAgICAgICAgZGF0YXNldCA9IGF3YWl0IHJlc29sdmVyKHtcbiAgICAgICAgICAgIHBvcnRDbGFzc0luc3RhbmNlOiB0aGlzLnBvcnRBcHBJbnN0YW5jZSwgLy8gY29udGFpbnMgYWxzbyBwb3J0Q2xhc3NJbnN0YW5jZS5jb250ZXh0IG9mIHRoZSByZXF1ZXN0LlxuICAgICAgICAgICAgYXJnczogcmVzb2x2ZXJBcmd1bWVudCxcbiAgICAgICAgICAgIHBhcmVudFJlc3VsdCwgLy8gcGFyZW50IGRhdGFzZXQgcmVzdWx0LlxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YXNldFxuICB9XG59XG4iXX0=