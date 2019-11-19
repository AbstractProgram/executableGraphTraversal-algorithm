"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.returnDataItemKey = returnDataItemKey;exports.timeout = timeout;exports.executeFunctionReference = executeFunctionReference;exports.executeShellscriptFile = executeShellscriptFile;exports.executeScriptSpawn = executeScriptSpawn;exports.switchCase = switchCase;exports.immediatelyExecuteMiddleware = void 0;var _applyDecoratedDescriptor2 = _interopRequireDefault(require("@babel/runtime/helpers/applyDecoratedDescriptor"));var _path = _interopRequireDefault(require("path"));
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












async function switchCase({ stageNode, processNode, graphInstance, nextProcessData }, { additionalParameter, traverseCallContext }) {
  const { caseArray, default: defaultRelationship } = await graphInstance.databaseWrapper.getSwitchElement({ concreteDatabase: graphInstance.database, nodeID: processNode.identity });
  const value = await graphInstance.databaseWrapper.getTargetValue({ concreteDatabase: graphInstance.database, nodeID: processNode.identity });





  let comparisonValue;
  if (value) comparisonValue = value;else
  comparisonValue = nextProcessData;


  let chosenNode;
  if (caseArray) {

    let caseRelationship = caseArray.filter(caseRelationship => {var _caseRelationship$con;return ((_caseRelationship$con = caseRelationship.connection.properties) === null || _caseRelationship$con === void 0 ? void 0 : _caseRelationship$con.expected) == comparisonValue;})[0];
    chosenNode = caseRelationship === null || caseRelationship === void 0 ? void 0 : caseRelationship.destination;
  }
  chosenNode || (chosenNode = defaultRelationship === null || defaultRelationship === void 0 ? void 0 : defaultRelationship.destination);

  return chosenNode || null;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NvdXJjZS90cmF2ZXJzYWxJbXBsZW1lbnRhdGlvbi9wcm9jZXNzTm9kZS5qcyJdLCJuYW1lcyI6WyJyZXR1cm5EYXRhSXRlbUtleSIsInN0YWdlTm9kZSIsInByb2Nlc3NOb2RlIiwiZ3JhcGhJbnN0YW5jZSIsIm5leHRQcm9jZXNzRGF0YSIsImFkZGl0aW9uYWxQYXJhbWV0ZXIiLCJ0cmF2ZXJzZUNhbGxDb250ZXh0IiwicHJvcGVydGllcyIsIm5hbWUiLCJ0aW1lb3V0IiwidGltZXJEZWxheSIsIkVycm9yIiwiZGVsYXkiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInNldFRpbWVvdXQiLCJleGVjdXRlRnVuY3Rpb25SZWZlcmVuY2UiLCJjb250ZXh0UHJvcGVydHlOYW1lIiwicmVmZXJlbmNlQ29udGV4dCIsImNvbnRleHQiLCJyZXNvdXJjZSIsInJlc291cmNlQXJyYXkiLCJkYXRhYmFzZVdyYXBwZXIiLCJnZXRSZXNvdXJjZSIsImNvbmNyZXRlRGF0YWJhc2UiLCJkYXRhYmFzZSIsIm5vZGVJRCIsImlkZW50aXR5IiwibGVuZ3RoIiwic291cmNlIiwibGFiZWxzIiwiaW5jbHVkZXMiLCJzY2hlbWVSZWZlcmVuY2UiLCJub2RlTGFiZWwiLCJmdW5jdGlvbiIsImZ1bmN0aW9uTmFtZSIsImZ1bmN0aW9uQ2FsbGJhY2siLCJub2RlIiwiZXJyb3IiLCJjb25zb2xlIiwicHJvY2VzcyIsImV4aXQiLCJleGVjdXRlU2hlbGxzY3JpcHRGaWxlIiwibWVzc2FnZSIsInNjcmlwdFJlZmVyZW5jZUtleSIsInJlZmVyZW5jZUtleSIsImtleSIsImxvZyIsInNjcmlwdFBhdGgiLCJjd2QiLCJwYXRoIiwiZGlybmFtZSIsInNoZWxsIiwic3RkaW8iLCJleGVjdXRlU2NyaXB0U3Bhd24iLCJjaGlsZFByb2Nlc3MiLCJjb21tYW5kIiwiYXJndW1lbnQiLCJqb2luIiwib3B0aW9uIiwiSlNPTiIsInN0cmluZ2lmeSIsInN0YXR1cyIsInN3aXRjaENhc2UiLCJjYXNlQXJyYXkiLCJkZWZhdWx0IiwiZGVmYXVsdFJlbGF0aW9uc2hpcCIsImdldFN3aXRjaEVsZW1lbnQiLCJ2YWx1ZSIsImdldFRhcmdldFZhbHVlIiwiY29tcGFyaXNvblZhbHVlIiwiY2hvc2VuTm9kZSIsImNhc2VSZWxhdGlvbnNoaXAiLCJmaWx0ZXIiLCJjb25uZWN0aW9uIiwiZXhwZWN0ZWQiLCJkZXN0aW5hdGlvbiIsImltbWVkaWF0ZWx5RXhlY3V0ZU1pZGRsZXdhcmUiLCJuZXh0RnVuY3Rpb24iLCJtaWRkbGV3YXJlUGFyYW1ldGVyIiwibWlkZGxld2FyZSIsIm5leHQiLCJpbml0aWFsaXplTmVzdGVkVW5pdCIsIm5lc3RlZFVuaXRLZXkiLCJhZGRpdGlvbmFsQ2hpbGROZXN0ZWRVbml0IiwicGF0aFBvaW50ZXJLZXkiLCJ2aWV3IiwibmVzdGVkVW5pdEluc3RhbmNlIiwibG9vcEluc2VydGlvblBvaW50IiwidHlwZSIsInBvcnRBcHBJbnN0YW5jZSIsImNvbmZpZyIsImNsaWVudFNpZGVQYXRoIiwidGVtcGxhdGVQYXRoIiwidW5pdEluc3RhbmNlIiwiZmlsZSIsImZpbGVQYXRoIiwicmVuZGVyZWRDb250ZW50IiwicHJvY2Vzc0RhdGFJbXBsZW1lbnRhdGlvbiIsInVuZGVyc2NvcmVSZW5kZXJpbmciLCJwcm9jZXNzUmVuZGVyZWRDb250ZW50IiwidGVtcGxhdGVTdHJpbmciLCJmaWxlc3lzdGVtIiwicmVhZEZpbGVTeW5jIiwidGVtcGxhdGVBcmd1bWVudCIsInRlbXBsYXRlQ29udHJvbGxlciIsIkFwcGxpY2F0aW9uIiwidW5kZXJzY29yZSIsInRlbXBsYXRlIiwiT2JqZWN0IiwiYXNzaWduIiwicmVuZGVyZWRDb250ZW50U3RyaW5nIiwidmlld05hbWUiLCJ2aWV3T2JqZWN0IiwiQXJyYXkiLCJpc0FycmF5IiwidHJhdmVyc2VQb3J0IiwiYWdncmVnYXRlSW50b1RlbXBsYXRlT2JqZWN0IiwiaW5zZXJ0aW9uUG9pbnQiLCJjaGlsZHJlbiIsImZpbHRlckFuZE9yZGVyQ2hpbGRyZW4iLCJpbnNlcnRpb25Qb2ludEtleSIsInN1YnNlcXVlbnQiLCJpbml0aWFsaXplSW5zZXJ0aW9uUG9pbnQiLCJwcm90b3R5cGUiLCJwdXNoIiwiYXBwbHkiLCJzY2hlbWEiLCJ0aGlzQXJnIiwic2VsZiIsImV4ZWN1dGlvbkxldmVsIiwicGFyZW50IiwicmVxdWVzdE9wdGlvbiIsInJlcXVlc3QiLCJib2R5IiwiZmllbGRBcnJheSIsImZpZWxkIiwiZmluZCIsImZpZWxkTmFtZSIsImRhdGFzZXQiLCJyZXNvbHZlRGF0YXNldCIsInBhcmVudFJlc3VsdCIsInNjaGVtYU1vZGUiLCJhc3NlcnQiLCJub3RFcXVhbCIsInVuZGVmaW5lZCIsImRhdGFzZXRIYW5kbGluZyIsIm9iamVjdCIsInByb21pc2VBcnJheSIsIm1hcCIsImRvY3VtZW50Iiwic3Vic2VxdWVudERhdGFzZXRBcnJheSIsImFsbCIsInN1YnNlcXVlbnREYXRhc2V0IiwiaW5kZXgiLCJmb3JtYXREYXRhc2V0T2ZOZXN0ZWRUeXBlIiwiZXh0cmFmaWVsZCIsImZvckVhY2giLCJrZXlzIiwiYmluZCIsImFsZ29yaXRobSIsIm1vZHVsZSIsInJlcXVpcmUiLCJyZXNvbHZlciIsInJlc29sdmVyQXJndW1lbnQiLCJhcmdzIiwiQm9vbGVhbiIsInBvcnRDbGFzc0luc3RhbmNlIl0sIm1hcHBpbmdzIjoiOGtCQUFBO0FBQ0E7QUFDQTs7QUFFTyxlQUFlQSxpQkFBZixDQUFpQyxFQUFFQyxTQUFGLEVBQWFDLFdBQWIsRUFBMEJDLGFBQTFCLEVBQXlDQyxlQUF6QyxFQUFqQyxFQUE2RixFQUFFQyxtQkFBRixFQUF1QkMsbUJBQXZCLEVBQTdGLEVBQTJJO0FBQ2hKLCtCQUFJSixXQUFXLENBQUNLLFVBQWhCLDBEQUFJLHNCQUF3QkMsSUFBNUIsRUFBa0MsT0FBUSxHQUFELDBCQUFHTixXQUFXLENBQUNLLFVBQWYsMkRBQUcsdUJBQXdCQyxJQUFLLEVBQXZDO0FBQ25DOzs7QUFHTSxlQUFlQyxPQUFmLENBQXVCLEVBQUVSLFNBQUYsRUFB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QU0sR0FBR0MsT0FBTyxDQUFDRixTQUFTLENBQUM5RyxJQUFYLENBQVAsQ0FBd0JlLE9BQXJDO0FBQ0EsY0FBSSxPQUFPZ0csTUFBUCxLQUFrQixVQUF0QixFQUFrQ0EsTUFBTSxHQUFHQSxNQUFNLENBQUNoRyxPQUFoQjtBQUNsQyxjQUFJa0csUUFBUSxHQUFHRixNQUFNLEVBQXJCO0FBQ0EsY0FBSUcsZ0JBQWdCLEdBQUd2RCxNQUFNLENBQUNDLE1BQVAsQ0FBYyxHQUFHLENBQUMsS0FBS3VELElBQU4sRUFBWUwsU0FBUyxDQUFDdkcsUUFBdEIsRUFBZ0NnQixNQUFoQyxDQUF1QzZGLE9BQXZDLENBQWpCLENBQXZCO0FBQ0EzQixVQUFBQSxPQUFPLEdBQUcsTUFBTXdCLFFBQVEsQ0FBQztBQUN2QkksWUFBQUEsaUJBQWlCLEVBQUUsS0FBSzdFLGVBREQ7QUFFdkIyRSxZQUFBQSxJQUFJLEVBQUVELGdCQUZpQjtBQUd2QnZCLFlBQUFBLFlBSHVCLEVBQUQsQ0FBeEI7O0FBS0Q7QUFDRCxjQWhCSjs7O0FBbUJBLFdBQU9GLE9BQVA7QUFDRDtBQUNGLENBN0pEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0J1xuaW1wb3J0IHsgZXhlYywgZXhlY1N5bmMsIHNwYXduLCBzcGF3blN5bmMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJ1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmV0dXJuRGF0YUl0ZW1LZXkoeyBzdGFnZU5vZGUsIHByb2Nlc3NOb2RlLCBncmFwaEluc3RhbmNlLCBuZXh0UHJvY2Vzc0RhdGEgfSwgeyBhZGRpdGlvbmFsUGFyYW1ldGVyLCB0cmF2ZXJzZUNhbGxDb250ZXh0IH0pIHtcbiAgaWYgKHByb2Nlc3NOb2RlLnByb3BlcnRpZXM/Lm5hbWUpIHJldHVybiBgJHtwcm9jZXNzTm9kZS5wcm9wZXJ0aWVzPy5uYW1lfWBcbn1cblxuLy8gaW1wbGVtZW50YXRpb24gZGVsYXlzIHByb21pc2VzIGZvciB0ZXN0aW5nIGBpdGVyYXRlQ29ubmVjdGlvbmAgb2YgcHJvbWlzZXMgZS5nLiBgYWxsUHJvbWlzZWAsIGByYWNlRmlyc3RQcm9taXNlYCwgZXRjLlxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRpbWVvdXQoeyBzdGFnZU5vZGUsIHByb2Nlc3NOb2RlLCBncmFwaEluc3RhbmNlLCBuZXh0UHJvY2Vzc0RhdGEgfSwgeyBhZGRpdGlvbmFsUGFyYW1ldGVyLCB0cmF2ZXJzZUNhbGxDb250ZXh0IH0pIHtcbiAgaWYgKHR5cGVvZiBwcm9jZXNzTm9kZS5wcm9wZXJ0aWVzPy50aW1lckRlbGF5ICE9ICdudW1iZXInKSB0aHJvdyBuZXcgRXJyb3IoJ+KAoiBEYXRhSXRlbSBtdXN0IGhhdmUgYSBkZWxheSB2YWx1ZS4nKVxuICBsZXQgZGVsYXkgPSBwcm9jZXNzTm9kZS5wcm9wZXJ0aWVzPy50aW1lckRlbGF5XG4gIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgLy8gY29uc29sZS5sb2coYCR7ZGVsYXl9bXMgcGFzc2VkIGZvciBrZXkgJHtwcm9jZXNzTm9kZS5rZXl9LmApIC8vIGRlYnVnXG4gICAgICByZXNvbHZlKHByb2Nlc3NOb2RlLnByb3BlcnRpZXM/Lm5hbWUpXG4gICAgfSwgZGVsYXkpLFxuICApXG59XG5cbi8qKlxuICogUmVsaWVzIG9uIGZ1bmN0aW9uIHJlZmVyZW5jZSBjb25jZXB0IC0gd2hlcmUgYSBmdW5jdGlvbiBpcyBjYWxsZWQgZnJvbSB0aGUgZ3JhcGggdXNpbmcgYSBub2RlIHByb3BlcnR5IHRoYXQgaG9sZHMgaXQncyBuYW1lLCBhbmQgYSBjb250ZXh0IG9iamVjdCBwYXNzZWQgdG8gdGhlIGdyYXBoIHRyYXZlcnNlciwgaG9sZGluZyB0aGUgZnVuY3Rpb25zIG1hcC5cbiAqIGBwcm9jZXNzRGF0YWAgaW1wbGVtZW50YXRpb24gb2YgYGdyYXBoVHJhdmVyc2FsYCBtb2R1bGVcbiAqIGV4ZWN1dGUgZnVuY3Rpb25zIHRocm91Z2ggYSBzdHJpbmcgcmVmZXJlbmNlIGZyb20gdGhlIGdyYXBoIGRhdGFiYXNlIHRoYXQgbWF0Y2ggdGhlIGtleSBvZiB0aGUgYXBwbGljYXRpb24gcmVmZXJlbmNlIGNvbnRleHQgb2JqZWN0XG4gKiBOb3RlOiBjcmVhdGluZyBhIHNpbWlsYXIgaW1wbGVtZW50YXRpb24gdGhhdCB3b3VsZCByZXR1cm4gb25seSB0aGUgZnVuY3Rpb25zIGlzIG5vIGRpZmZlcmVudCB0aGFuIHJldHVybm5pbmcgdGhlIG5hbWVzIG9mIHRoZSBmdW5jdGlvbiwgYW5kIHRoZW4gdXNlIHRoZSBncmFwaCByZXN1bHQgYXJyYXkgb3V0c2lkZSB0aGUgdHJhdmVyc2FsIHRvIHJldHJpZXZlIHRoZSBmdW5jdGlvbiByZWZlcmVuY2VzIGZyb20gYW4gb2JqZWN0LlxuXG5Vc2VkIGZvcjpcbiAgLSB1c2VkIGZvciBleGVjdXRpbmcgdGFza3MgYW5kIGNoZWNrcy9jb25kaXRpb25zXG4gIC0gTWlkZGxld2FyZTpcbiAgICBBcHByb2FjaGVzIGZvciBtaWRkbGV3YXJlIGFnZ3JlZ2F0aW9uOiBcbiAgICAtIENyZWF0ZXMgbWlkZGxld2FyZSBhcnJheSBmcm9tIGdyYXBoLSAgVGhlIGdyYXBoIHRyYXZlcnNhbCBAcmV0dXJuIHtBcnJheSBvZiBPYmplY3RzfSB3aGVyZSBlYWNoIG9iamVjdCBjb250YWlucyBpbnN0cnVjdGlvbiBzZXR0aW5ncyB0byBiZSB1c2VkIHRocm91Z2ggYW4gaW1wbGVtZW50aW5nIG1vZHVsZSB0byBhZGQgdG8gYSBjaGFpbiBvZiBtaWRkbGV3YXJlcy4gXG4gICAgLSByZXR1cm4gbWlkZGxld2FyZSByZWZlcmVuY2UgbmFtZXMsIGFuZCB0aGVuIG1hdGNoaW5nIHRoZSBuYW1lcyB0byBmdW5jdGlvbiBvdXRzaWRlIHRoZSB0cmF2ZXJzYWwuXG4gICAgLSBFeGVjdXRpbmcgZ2VuZXJhdG9yIGZ1bmN0aW9ucyB3aXRoIG5vZGUgYXJndW1lbnRzIHRoYXQgcHJvZHVjZSBtaWRkbGV3YXJlIGZ1bmN0aW9ucy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4ZWN1dGVGdW5jdGlvblJlZmVyZW5jZSh7IHN0YWdlTm9kZSwgcHJvY2Vzc05vZGUsIGdyYXBoSW5zdGFuY2UsIG5leHRQcm9jZXNzRGF0YSB9LCB7IGFkZGl0aW9uYWxQYXJhbWV0ZXIsIHRyYXZlcnNlQ2FsbENvbnRleHQgfSkge1xuICBsZXQgY29udGV4dFByb3BlcnR5TmFtZSA9ICdmdW5jdGlvblJlZmVyZW5jZUNvbnRleHQnLCAvLyBUT0RPOiBhZnRlciBtaWdyYXRpbmcgdG8gb3duIHJlcG9zaXRvcnksIHVzZSBTeW1ib2xzIGluc3RlYWQgb2Ygc3RyaW5nIGtleXMgYW5kIGV4cG9ydCB0aGVtIGZvciBjbGllbnQgdXNhZ2UuXG4gICAgcmVmZXJlbmNlQ29udGV4dCA9IGdyYXBoSW5zdGFuY2UuY29udGV4dFtjb250ZXh0UHJvcGVydHlOYW1lXVxuICBhc3NlcnQocmVmZXJlbmNlQ29udGV4dCwgYOKAoiBDb250ZXh0IFwiJHtjb250ZXh0UHJvcGVydHlOYW1lfVwiIHZhcmlhYmxlIGlzIHJlcXVpcmVkIHRvIHJlZmVyZW5jZSBmdW5jdGlvbnMgZnJvbSBncmFwaCBkYXRhYmFzZSBzdHJpbmdzLmApXG5cbiAgbGV0IHJlc291cmNlXG4gIGNvbnN0IHsgcmVzb3VyY2VBcnJheSB9ID0gYXdhaXQgZ3JhcGhJbnN0YW5jZS5kYXRhYmFzZVdyYXBwZXIuZ2V0UmVzb3VyY2UoeyBjb25jcmV0ZURhdGFiYXNlOiBncmFwaEluc3RhbmNlLmRhdGFiYXNlLCBub2RlSUQ6IHByb2Nlc3NOb2RlLmlkZW50aXR5IH0pXG4gIGlmIChyZXNvdXJjZUFycmF5Lmxlbmd0aCA+IDEpIHRocm93IG5ldyBFcnJvcihg4oCiIE11bHRpcGxlIHJlc291cmNlIHJlbGF0aW9uc2hpcHMgYXJlIG5vdCBzdXBwb3J0ZWQgZm9yIFByb2Nlc3Mgbm9kZS5gKVxuICBlbHNlIGlmIChyZXNvdXJjZUFycmF5Lmxlbmd0aCA9PSAwKSByZXR1cm5cbiAgZWxzZSByZXNvdXJjZSA9IHJlc291cmNlQXJyYXlbMF1cblxuICBhc3NlcnQocmVzb3VyY2Uuc291cmNlLmxhYmVscy5pbmNsdWRlcyhncmFwaEluc3RhbmNlLnNjaGVtZVJlZmVyZW5jZS5ub2RlTGFiZWwuZnVuY3Rpb24pLCBg4oCiIFVuc3VwcG9ydGVkIE5vZGUgdHlwZSBmb3IgcmVzb3VyY2UgY29ubmVjdGlvbi5gKVxuICBsZXQgZnVuY3Rpb25OYW1lID0gcmVzb3VyY2Uuc291cmNlLnByb3BlcnRpZXMuZnVuY3Rpb25OYW1lIHx8IHRocm93IG5ldyBFcnJvcihg4oCiIGZ1bmN0aW9uIHJlc291cmNlIG11c3QgaGF2ZSBhIFwiZnVuY3Rpb25OYW1lXCIgLSAke3Jlc291cmNlLnNvdXJjZS5wcm9wZXJ0aWVzLmZ1bmN0aW9uTmFtZX1gKVxuICBsZXQgZnVuY3Rpb25DYWxsYmFjayA9IHJlZmVyZW5jZUNvbnRleHRbZnVuY3Rpb25OYW1lXSB8fCB0aHJvdyBuZXcgRXJyb3IoYOKAoiByZWZlcmVuY2UgZnVuY3Rpb24gbmFtZSBkb2Vzbid0IGV4aXN0LmApXG4gIHRyeSB7XG4gICAgcmV0dXJuIGF3YWl0IGZ1bmN0aW9uQ2FsbGJhY2soeyBub2RlOiBwcm9jZXNzTm9kZSwgY29udGV4dDogZ3JhcGhJbnN0YW5jZS5jb250ZXh0LCB0cmF2ZXJzZUNhbGxDb250ZXh0IH0pXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihlcnJvcikgJiYgcHJvY2Vzcy5leGl0KClcbiAgfVxufVxuXG4vKlxuIFxuICAgX19fXyAgICAgICAgICAgIF8gICAgICAgXyAgICAgX19fX18gICAgICAgICAgICAgICAgICAgICBfICAgXyAgICAgICAgICAgICBcbiAgLyBfX198ICBfX18gXyBfXyhfKV8gX18gfCB8XyAgfCBfX19ffF8gIF9fX19fICBfX18gXyAgIF98IHxfKF8pIF9fXyAgXyBfXyAgXG4gIFxcX19fIFxcIC8gX198ICdfX3wgfCAnXyBcXHwgX198IHwgIF98IFxcIFxcLyAvIF8gXFwvIF9ffCB8IHwgfCBfX3wgfC8gXyBcXHwgJ18gXFwgXG4gICBfX18pIHwgKF9ffCB8ICB8IHwgfF8pIHwgfF8gIHwgfF9fXyA+ICA8ICBfXy8gKF9ffCB8X3wgfCB8X3wgfCAoXykgfCB8IHwgfFxuICB8X19fXy8gXFxfX198X3wgIHxffCAuX18vIFxcX198IHxfX19fXy9fL1xcX1xcX19ffFxcX19ffFxcX18sX3xcXF9ffF98XFxfX18vfF98IHxffFxuICAgICAgICAgICAgICAgICAgICB8X3wgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiBSZWxpZXMgb24gZnVuY3Rpb24gcmVmZXJlbmNlIGNvbmNlcHQuXG4qL1xuXG4vLyBFeGVjdXRlIHRhc2sgc2NyaXB0IGluIHRoZSBzYW1lIHByb2Nlc3MgKG5vZGVqcyBjaGlsZHByb2Nlc3MuZXhlY1N5bmMpIHVzaW5nIGEgcmVmZXJlbmNlIHNjcmlwdFBhdGggcHJvcGVydHkuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhlY3V0ZVNoZWxsc2NyaXB0RmlsZSh7IHN0YWdlTm9kZSwgcHJvY2Vzc05vZGUsIGdyYXBoSW5zdGFuY2UsIG5leHRQcm9jZXNzRGF0YSB9LCB7IGFkZGl0aW9uYWxQYXJhbWV0ZXIsIHRyYXZlcnNlQ2FsbENvbnRleHQgfSkge1xuICBsZXQgbWVzc2FnZSA9IGAgX19fX18gICAgICAgICAgICAgICAgICAgICAgICAgIF8gICAgICAgIFxuICB8IF9fX198X18gIF9fIF9fXyAgIF9fXyAgXyAgIF8gfCB8XyAgX19fIFxuICB8ICBffCAgXFxcXCBcXFxcLyAvLyBfIFxcXFwgLyBfX3x8IHwgfCB8fCBfX3wvIF8gXFxcXFxuICB8IHxfX18gID4gIDx8ICBfXy98IChfXyB8IHxffCB8fCB8X3wgIF9fLyAgICBcbiAgfF9fX19ffC9fL1xcXFxfXFxcXFxcXFxfX198IFxcXFxfX198IFxcXFxfXyxffCBcXFxcX198XFxcXF9fX3xgXG4gIGxldCBjb250ZXh0UHJvcGVydHlOYW1lID0gJ2ZpbGVDb250ZXh0JyxcbiAgICByZWZlcmVuY2VDb250ZXh0ID0gZ3JhcGhJbnN0YW5jZS5jb250ZXh0W2NvbnRleHRQcm9wZXJ0eU5hbWVdXG4gIGFzc2VydChyZWZlcmVuY2VDb250ZXh0LCBg4oCiIENvbnRleHQgXCIke2NvbnRleHRQcm9wZXJ0eU5hbWV9XCIgdmFyaWFibGUgaXMgcmVxdWlyZWQgdG8gcmVmZXJlbmNlIGZ1bmN0aW9ucyBmcm9tIGdyYXBoIGRhdGFiYXNlIHN0cmluZ3MuYClcblxuICBsZXQgcmVzb3VyY2VcbiAgY29uc3QgeyByZXNvdXJjZUFycmF5IH0gPSBhd2FpdCBncmFwaEluc3RhbmNlLmRhdGFiYXNlV3JhcHBlci5nZXRSZXNvdXJjZSh7IGNvbmNyZXRlRGF0YWJhc2U6IGdyYXBoSW5zdGFuY2UuZGF0YWJhc2UsIG5vZGVJRDogcHJvY2Vzc05vZGUuaWRlbnRpdHkgfSlcbiAgaWYgKHJlc291cmNlQXJyYXkubGVuZ3RoID4gMSkgdGhyb3cgbmV3IEVycm9yKGDigKIgTXVsdGlwbGUgcmVzb3VyY2UgcmVsYXRpb25zaGlwcyBhcmUgbm90IHN1cHBvcnRlZCBmb3IgUHJvY2VzcyBub2RlLmApXG4gIGVsc2UgaWYgKHJlc291cmNlQXJyYXkubGVuZ3RoID09IDApIHJldHVyblxuICBlbHNlIHJlc291cmNlID0gcmVzb3VyY2VBcnJheVswXVxuICBsZXQgc2NyaXB0UmVmZXJlbmNlS2V5ID0gcmVzb3VyY2Uuc291cmNlLnByb3BlcnRpZXMucmVmZXJlbmNlS2V5XG4gIGFzc2VydChzY3JpcHRSZWZlcmVuY2VLZXksIGDigKIgcmVzb3VyY2UgRmlsZSBub2RlICh3aXRoIGtleTogJHtyZXNvdXJjZS5zb3VyY2UucHJvcGVydGllcy5rZXl9KSBtdXN0IGhhdmUgXCJyZWZlcmVuY2VLZXlcIiBwcm9wZXJ0eS5gKVxuXG4gIHRyeSB7XG4gICAgY29uc29sZS5sb2cobWVzc2FnZSlcbiAgICBsZXQgc2NyaXB0UGF0aCA9IHJlZmVyZW5jZUNvbnRleHRbc2NyaXB0UmVmZXJlbmNlS2V5XVxuICAgIGFzc2VydChzY3JpcHRQYXRoLCBg4oCiIHJlZmVyZW5jZUtleSBvZiBGaWxlIG5vZGUgKHJlZmVyZW5jZUtleSA9ICR7c2NyaXB0UmVmZXJlbmNlS2V5fSkgd2FzIG5vdCBmb3VuZCBpbiB0aGUgZ3JhcGhJbnN0YW5jZSBjb250ZXh0OiAke3JlZmVyZW5jZUNvbnRleHR9IGApXG4gICAgY29uc29sZS5sb2coYFxceDFiWzQ1bSVzXFx4MWJbMG1gLCBgc2hlbGxzY3JpcHQgcGF0aDogJHtzY3JpcHRQYXRofWApXG4gICAgZXhlY1N5bmMoYHNoICR7c2NyaXB0UGF0aH1gLCB7IGN3ZDogcGF0aC5kaXJuYW1lKHNjcmlwdFBhdGgpLCBzaGVsbDogdHJ1ZSwgc3RkaW86IFsnaW5oZXJpdCcsICdpbmhlcml0JywgJ2luaGVyaXQnXSB9KVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHRocm93IGVycm9yXG4gICAgcHJvY2Vzcy5leGl0KDEpXG4gIH1cbiAgLy8gYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwMCkpIC8vIHdhaXQgeCBzZWNvbmRzIGJlZm9yZSBuZXh0IHNjcmlwdCBleGVjdXRpb24gLy8gaW1wb3J0YW50IHRvIHByZXZlbnQgJ3VuYWJsZSB0byByZS1vcGVuIHN0ZGluJyBlcnJvciBiZXR3ZWVuIHNoZWxscy5cbiAgcmV0dXJuIG51bGxcbn1cblxuLyoqXG4gIFJ1biBjaGlsZHByb2Nlc3Mgc3luY2hub2xvdXMgc3Bhd24gY29tbWFuZDogXG4gIFJlcXVpcmVkIHByb3BlcnRpZXMgb24gcHJvY2VzcyBub2RlOiBcbiAgQHBhcmFtIHtTdHJpbmd9IGNvbW1hbmRcbiAgQHBhcmFtIHtTdHJpbmdbXX0gYXJndW1lbnRcbiAgQHBhcmFtIHtKc29uIHN0cmluZ2lmaWVzIHN0cmluZ30gb3B0aW9uXG4qL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4ZWN1dGVTY3JpcHRTcGF3bih7IHN0YWdlTm9kZSwgcHJvY2Vzc05vZGUsIGdyYXBoSW5zdGFuY2UsIG5leHRQcm9jZXNzRGF0YSB9LCB7IGFkZGl0aW9uYWxQYXJhbWV0ZXIsIHRyYXZlcnNlQ2FsbENvbnRleHQgfSkge1xuICBsZXQgY2hpbGRQcm9jZXNzXG4gIHRyeSB7XG4gICAgbGV0IGNvbW1hbmQgPSBwcm9jZXNzTm9kZS5wcm9wZXJ0aWVzLmNvbW1hbmQsXG4gICAgICBhcmd1bWVudCA9IHByb2Nlc3NOb2RlLnByb3BlcnRpZXMuYXJndW1lbnQuam9pbignICcpLFxuICAgICAgb3B0aW9uID0gSlNPTi5zdHJpbmdpZnkocHJvY2Vzc05vZGUucHJvcGVydGllcy5vcHRpb24pXG4gICAgY29uc29sZS5sb2coYFxceDFiWzQ1bSVzXFx4MWJbMG1gLCBgJHtjb21tYW5kfSAke2FyZ3VtZW50fWApXG4gICAgY2hpbGRQcm9jZXNzID0gc3Bhd25TeW5jKGNvbW1hbmQsIGFyZ3VtZW50LCBvcHRpb24pXG4gICAgaWYgKGNoaWxkUHJvY2Vzcy5zdGF0dXMgPiAwKSB0aHJvdyBjaGlsZFByb2Nlc3MuZXJyb3JcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBwcm9jZXNzLmV4aXQoY2hpbGRQcm9jZXNzLnN0YXR1cylcbiAgfVxufVxuXG4vKlxuICAgIF9fX18gICAgICAgICAgICAgICAgXyBfIF8gICBfICAgICAgICAgICAgIFxuICAgLyBfX198X19fICBfIF9fICAgX198IChfKSB8XyhfKSBfX18gIF8gX18gIFxuICB8IHwgICAvIF8gXFx8ICdfIFxcIC8gX2AgfCB8IF9ffCB8LyBfIFxcfCAnXyBcXCBcbiAgfCB8X198IChfKSB8IHwgfCB8IChffCB8IHwgfF98IHwgKF8pIHwgfCB8IHxcbiAgIFxcX19fX1xcX19fL3xffCB8X3xcXF9fLF98X3xcXF9ffF98XFxfX18vfF98IHxffFxuICAgU2VsZWN0aXZlIC8gQ29uZGl0aW9uYWxcbiovXG4vKipcbiAqIEByZXR1cm4ge05vZGUgT2JqZWN0fSAtIGEgbm9kZSBvYmplY3QgY29udGFpbmluZyBkYXRhLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3dpdGNoQ2FzZSh7IHN0YWdlTm9kZSwgcHJvY2Vzc05vZGUsIGdyYXBoSW5zdGFuY2UsIG5leHRQcm9jZXNzRGF0YSB9LCB7IGFkZGl0aW9uYWxQYXJhbWV0ZXIsIHRyYXZlcnNlQ2FsbENvbnRleHQgfSkge1xuICBjb25zdCB7IGNhc2VBcnJheSwgZGVmYXVsdDogZGVmYXVsdFJlbGF0aW9uc2hpcCB9ID0gYXdhaXQgZ3JhcGhJbnN0YW5jZS5kYXRhYmFzZVdyYXBwZXIuZ2V0U3dpdGNoRWxlbWVudCh7IGNvbmNyZXRlRGF0YWJhc2U6IGdyYXBoSW5zdGFuY2UuZGF0YWJhc2UsIG5vZGVJRDogcHJvY2Vzc05vZGUuaWRlbnRpdHkgfSlcbiAgY29uc3QgdmFsdWUgPSBhd2FpdCBncmFwaEluc3RhbmNlLmRhdGFiYXNlV3JhcHBlci5nZXRUYXJnZXRWYWx1ZSh7IGNvbmNyZXRlRGF0YWJhc2U6IGdyYXBoSW5zdGFuY2UuZGF0YWJhc2UsIG5vZGVJRDogcHJvY2Vzc05vZGUuaWRlbnRpdHkgfSlcblxuICAvKiBydW4gY29uZGl0aW9uIGNoZWNrIGFnYWluc3QgY29tcGFyaXNvbiB2YWx1ZS4gSGllcmFyY2h5IG9mIGNvbXBhcmlzb24gdmFsdWUgY2FsY3VsYXRpb246IFxuICAgIDEuIFZBTFVFIHJlbGF0aW9uc2hpcCBkYXRhLlxuICAgIDIuIE5FWFQgc3RhZ2VzIHJlc3VsdCBcbiAgKi9cbiAgbGV0IGNvbXBhcmlzb25WYWx1ZVxuICBpZiAodmFsdWUpIGNvbXBhcmlzb25WYWx1ZSA9IHZhbHVlXG4gIGVsc2UgY29tcGFyaXNvblZhbHVlID0gbmV4dFByb2Nlc3NEYXRhXG5cbiAgLy8gU3dpdGNoIGNhc2VzOiByZXR1cm4gZXZhbHVhdGlvbiBjb25maWd1cmF0aW9uXG4gIGxldCBjaG9zZW5Ob2RlXG4gIGlmIChjYXNlQXJyYXkpIHtcbiAgICAvLyBjb21wYXJlIGV4cGVjdGVkIHZhbHVlIHdpdGggcmVzdWx0XG4gICAgbGV0IGNhc2VSZWxhdGlvbnNoaXAgPSBjYXNlQXJyYXkuZmlsdGVyKGNhc2VSZWxhdGlvbnNoaXAgPT4gY2FzZVJlbGF0aW9uc2hpcC5jb25uZWN0aW9uLnByb3BlcnRpZXM/LmV4cGVjdGVkID09IGNvbXBhcmlzb25WYWx1ZSlbMF1cbiAgICBjaG9zZW5Ob2RlID0gY2FzZVJlbGF0aW9uc2hpcD8uZGVzdGluYXRpb25cbiAgfVxuICBjaG9zZW5Ob2RlIHx8PSBkZWZhdWx0UmVsYXRpb25zaGlwPy5kZXN0aW5hdGlvblxuXG4gIHJldHVybiBjaG9zZW5Ob2RlIHx8IG51bGxcbn1cblxuLypcbiAgIF9fICBfXyBfICAgICBfICAgICBfIF8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICB8ICBcXC8gIChfKSBfX3wgfCBfX3wgfCB8IF9fX19fICAgICAgX19fXyBfIF8gX18gX19fIFxuICB8IHxcXC98IHwgfC8gX2AgfC8gX2AgfCB8LyBfIFxcIFxcIC9cXCAvIC8gX2AgfCAnX18vIF8gXFxcbiAgfCB8ICB8IHwgfCAoX3wgfCAoX3wgfCB8ICBfXy9cXCBWICBWIC8gKF98IHwgfCB8ICBfXy9cbiAgfF98ICB8X3xffFxcX18sX3xcXF9fLF98X3xcXF9fX3wgXFxfL1xcXy8gXFxfXyxffF98ICBcXF9fX3xcbiAgSW1tZWRpYXRlbHkgZXhlY3V0ZSBtaWRkbGV3YXJlXG4gIE5vdGU6IENoZWNrIGdyYXBoSW50ZXJjZXB0aW9uIG1ldGhvZCBcImhhbmRsZU1pZGRsZXdhcmVOZXh0Q2FsbFwiXG4qL1xuZXhwb3J0IGNvbnN0IGltbWVkaWF0ZWx5RXhlY3V0ZU1pZGRsZXdhcmUgPSBhc3luYyAoeyBzdGFnZU5vZGUsIHByb2Nlc3NOb2RlLCBncmFwaEluc3RhbmNlLCBuZXh0UHJvY2Vzc0RhdGEgfSwgeyBhZGRpdGlvbmFsUGFyYW1ldGVyLCB0cmF2ZXJzZUNhbGxDb250ZXh0IH0pID0+IHtcbiAgY29uc3QgeyBuZXh0RnVuY3Rpb24gfSA9IGFkZGl0aW9uYWxQYXJhbWV0ZXJcbiAgbGV0IGNvbnRleHRQcm9wZXJ0eU5hbWUgPSAnZnVuY3Rpb25SZWZlcmVuY2VDb250ZXh0JyxcbiAgICByZWZlcmVuY2VDb250ZXh0ID0gZ3JhcGhJbnN0YW5jZS5jb250ZXh0W2NvbnRleHRQcm9wZXJ0eU5hbWVdXG4gIGFzc2VydChyZWZlcmVuY2VDb250ZXh0LCBg4oCiIENvbnRleHQgXCIke2NvbnRleHRQcm9wZXJ0eU5hbWV9XCIgdmFyaWFibGUgaXMgcmVxdWlyZWQgdG8gcmVmZXJlbmNlIGZ1bmN0aW9ucyBmcm9tIGdyYXBoIGRhdGFiYXNlIHN0cmluZ3MuYClcbiAgYXNzZXJ0KGdyYXBoSW5zdGFuY2UubWlkZGxld2FyZVBhcmFtZXRlcj8uY29udGV4dCwgYOKAoiBNaWRkbGV3YXJlIGdyYXBoIHRyYXZlcnNhbCByZWxpZXMgb24gZ3JhcGhJbnN0YW5jZS5taWRkbGV3YXJlUGFyYW1ldGVyLmNvbnRleHRgKVxuXG4gIGxldCByZXNvdXJjZVxuICBjb25zdCB7IHJlc291cmNlQXJyYXkgfSA9IGF3YWl0IGdyYXBoSW5zdGFuY2UuZGF0YWJhc2VXcmFwcGVyLmdldFJlc291cmNlKHsgY29uY3JldGVEYXRhYmFzZTogZ3JhcGhJbnN0YW5jZS5kYXRhYmFzZSwgbm9kZUlEOiBwcm9jZXNzTm9kZS5pZGVudGl0eSB9KVxuICBpZiAocmVzb3VyY2VBcnJheS5sZW5ndGggPiAxKSB0aHJvdyBuZXcgRXJyb3IoYOKAoiBNdWx0aXBsZSByZXNvdXJjZSByZWxhdGlvbnNoaXBzIGFyZSBub3Qgc3VwcG9ydGVkIGZvciBQcm9jZXNzIG5vZGUuYClcbiAgZWxzZSBpZiAocmVzb3VyY2VBcnJheS5sZW5ndGggPT0gMCkgcmV0dXJuXG4gIGVsc2UgcmVzb3VyY2UgPSByZXNvdXJjZUFycmF5WzBdXG5cbiAgYXNzZXJ0KHJlc291cmNlLnNvdXJjZS5sYWJlbHMuaW5jbHVkZXMoZ3JhcGhJbnN0YW5jZS5zY2hlbWVSZWZlcmVuY2Uubm9kZUxhYmVsLmZ1bmN0aW9uKSwgYOKAoiBVbnN1cHBvcnRlZCBOb2RlIHR5cGUgZm9yIHJlc291cmNlIGNvbm5lY3Rpb24uYClcbiAgbGV0IGZ1bmN0aW9uTmFtZSA9IHJlc291cmNlLnNvdXJjZS5wcm9wZXJ0aWVzLmZ1bmN0aW9uTmFtZSB8fCB0aHJvdyBuZXcgRXJyb3IoYOKAoiBmdW5jdGlvbiByZXNvdXJjZSBtdXN0IGhhdmUgYSBcImZ1bmN0aW9uTmFtZVwiIC0gJHtyZXNvdXJjZS5zb3VyY2UucHJvcGVydGllcy5mdW5jdGlvbk5hbWV9YClcbiAgLy8gYSBmdW5jdGlvbiB0aGF0IGNvbXBsaWVzIHdpdGggZ3JhcGhUcmF2ZXJzYWwgcHJvY2Vzc0RhdGEgaW1wbGVtZW50YXRpb24uXG4gIGxldCBmdW5jdGlvbkNhbGxiYWNrID0gcmVmZXJlbmNlQ29udGV4dFtmdW5jdGlvbk5hbWVdIHx8IHRocm93IG5ldyBFcnJvcihg4oCiIHJlZmVyZW5jZSBmdW5jdGlvbiBuYW1lIGRvZXNuJ3QgZXhpc3QuYClcbiAgdHJ5IHtcbiAgICBsZXQgbWlkZGxld2FyZSA9IGF3YWl0IGZ1bmN0aW9uQ2FsbGJhY2soeyBub2RlOiBwcm9jZXNzTm9kZSB9KSAvLyBleHByZWN0ZWQgdG8gcmV0dXJuIGEgS29hIG1pZGRsZXdhcmUgY29tcGx5aW5nIGZ1bmN0aW9uLlxuICAgIGxldCBjb250ZXh0ID0gZ3JhcGhJbnN0YW5jZS5taWRkbGV3YXJlUGFyYW1ldGVyLmNvbnRleHQsXG4gICAgICBuZXh0ID0gbmV4dEZ1bmN0aW9uXG4gICAgYXdhaXQgbWlkZGxld2FyZShjb250ZXh0LCBuZXh0KSAvLyBleGVjdXRlIG1pZGRsZXdhcmVcbiAgICByZXR1cm4gbWlkZGxld2FyZSAvLyBhbGxvdyB0byBhZ2dyZWdhdGUgbWlkZGxld2FyZSBmdW5jdGlvbiBmb3IgZGVidWdnaW5nIHB1cnBvc2VzLlxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpICYmIHByb2Nlc3MuZXhpdCgpXG4gIH1cbn1cblxuLypcbiAgIF9fX18gIF9fX19fIF9fX18gIF9fX18gIF9fX19fIF9fX18gICAgXyAgX19fX18gX19fX18gX19fXyAgXG4gIHwgIF8gXFx8IF9fX198ICBfIFxcfCAgXyBcXHwgX19fXy8gX19ffCAgLyBcXHxfICAgX3wgX19fX3wgIF8gXFwgXG4gIHwgfCB8IHwgIF98IHwgfF8pIHwgfF8pIHwgIF98fCB8ICAgICAvIF8gXFwgfCB8IHwgIF98IHwgfCB8IHxcbiAgfCB8X3wgfCB8X19ffCAgX18vfCAgXyA8fCB8X198IHxfX18gLyBfX18gXFx8IHwgfCB8X19ffCB8X3wgfFxuICB8X19fXy98X19fX198X3wgICB8X3wgXFxfXFxfX19fX1xcX19fXy9fLyAgIFxcX1xcX3wgfF9fX19ffF9fX18vIFxuICBSZXF1aXJlcyByZWZhY3RvcmluZyBhbmQgbWlncmF0aW9uIFxuKi9cbi8qXG4gICBfX19fXyAgICAgICAgICAgICAgICAgICAgXyAgICAgICBfICAgICAgIFxuICB8XyAgIF98X18gXyBfXyBfX18gIF8gX18gfCB8IF9fIF98IHxfIF9fXyBcbiAgICB8IHwvIF8gXFwgJ18gYCBfIFxcfCAnXyBcXHwgfC8gX2AgfCBfXy8gXyBcXFxuICAgIHwgfCAgX18vIHwgfCB8IHwgfCB8XykgfCB8IChffCB8IHx8ICBfXy9cbiAgICB8X3xcXF9fX3xffCB8X3wgfF98IC5fXy98X3xcXF9fLF98XFxfX1xcX19ffFxuICAgICAgICAgICAgICAgICAgICAgfF98ICAgICAgICAgICAgICAgICAgICBcbiovXG5cbi8qKlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gU3RyaW5nIG9mIHJlbmRlcmVkIEhUTUwgZG9jdW1lbnQgY29udGVudC5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gaW5pdGlhbGl6ZU5lc3RlZFVuaXQoeyBuZXN0ZWRVbml0S2V5LCBhZGRpdGlvbmFsQ2hpbGROZXN0ZWRVbml0ID0gW10sIHBhdGhQb2ludGVyS2V5ID0gbnVsbCB9KSB7XG4gIC8vIHZpZXdzIGFyZ3VtZW50IHRoYXQgd2lsbCBiZSBpbml0aWFsbGl6ZWQgaW5zaWRlIHRlbXBsYXRlczpcbiAgLy8gbG9vcCB0aHJvdWdoIHRlbXBsYXRlIGFuZCBjcmVhdGUgcmVuZGVyZWQgdmlldyBjb250ZW50LlxuICBsZXQgdmlldyA9IGF3YWl0IG5lc3RlZFVuaXRJbnN0YW5jZS5sb29wSW5zZXJ0aW9uUG9pbnQoeyB0eXBlOiAnYWdncmVnYXRlSW50b1RlbXBsYXRlT2JqZWN0JyB9KVxuXG4gIGFzc2VydCh0aGlzLnBvcnRBcHBJbnN0YW5jZS5jb25maWcuY2xpZW50U2lkZVBhdGgsIFwi4oCiIGNsaWVudFNpZGVQYXRoIGNhbm5vdCBiZSB1bmRlZmluZWQuIGkuZS4gcHJldmlvdXMgbWlkZGxld2FyZXMgc2hvdWxkJ3ZlIHNldCBpdFwiKVxuICBsZXQgdGVtcGxhdGVQYXRoID0gcGF0aC5qb2luKHRoaXMucG9ydEFwcEluc3RhbmNlLmNvbmZpZy5jbGllbnRTaWRlUGF0aCwgdW5pdEluc3RhbmNlLmZpbGUuZmlsZVBhdGgpXG4gIGxldCByZW5kZXJlZENvbnRlbnRcbiAgc3dpdGNoICh1bml0SW5zdGFuY2UucHJvY2Vzc0RhdGFJbXBsZW1lbnRhdGlvbikge1xuICAgIGRlZmF1bHQ6XG4gICAgY2FzZSAndW5kZXJzY29yZVJlbmRlcmluZyc6XG4gICAgICByZW5kZXJlZENvbnRlbnQgPSBhd2FpdCB0aGlzLnVuZGVyc2NvcmVSZW5kZXJpbmcoeyB0ZW1wbGF0ZVBhdGgsIHZpZXcgfSlcbiAgICAgIGJyZWFrXG4gIH1cblxuICBzd2l0Y2ggKHVuaXRJbnN0YW5jZS5wcm9jZXNzUmVuZGVyZWRDb250ZW50KSB7XG4gICAgY2FzZSAnd3JhcEpzVGFnJzpcbiAgICAgIHJlbmRlcmVkQ29udGVudCA9IGA8c2NyaXB0IHR5cGU9XCJtb2R1bGVcIiBhc3luYz4ke3JlbmRlcmVkQ29udGVudH08L3NjcmlwdD5gXG4gICAgICBicmVha1xuICAgIGRlZmF1bHQ6IC8vIHNraXBcbiAgfVxuXG4gIHJldHVybiByZW5kZXJlZENvbnRlbnRcbn1cblxuYXN5bmMgZnVuY3Rpb24gdW5kZXJzY29yZVJlbmRlcmluZyh7IHRlbXBsYXRlUGF0aCwgdmlldyB9KSB7XG4gIC8vIExvYWQgdGVtcGxhdGUgZmlsZS5cbiAgbGV0IHRlbXBsYXRlU3RyaW5nID0gYXdhaXQgZmlsZXN5c3RlbS5yZWFkRmlsZVN5bmModGVtcGxhdGVQYXRoLCAndXRmLTgnKVxuICAvLyBTaGFyZWQgYXJndW1lbnRzIGJldHdlZW4gYWxsIHRlbXBsYXRlcyBiZWluZyByZW5kZXJlZFxuICBjb25zdCB0ZW1wbGF0ZUFyZ3VtZW50ID0ge1xuICAgIHRlbXBsYXRlQ29udHJvbGxlcjogdGhpcyxcbiAgICBjb250ZXh0OiB0aGlzLnBvcnRBcHBJbnN0YW5jZS5jb250ZXh0LFxuICAgIEFwcGxpY2F0aW9uLFxuICAgIGFyZ3VtZW50OiB7fSxcbiAgfVxuICBsZXQgcmVuZGVyZWRDb250ZW50ID0gdW5kZXJzY29yZS50ZW1wbGF0ZSh0ZW1wbGF0ZVN0cmluZykoXG4gICAgT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAgdGVtcGxhdGVBcmd1bWVudCwgLy8gdXNlIHRlbXBsYXRlQXJndW1lbnQgaW4gY3VycmVudCB0ZW1wbGF0ZVxuICAgICAgeyB2aWV3LCB0ZW1wbGF0ZUFyZ3VtZW50IH0sIC8vIHBhc3MgdGVtcGxhdGVBcmd1bWVudCB0byBuZXN0ZWQgdGVtcGxhdGVzXG4gICAgKSxcbiAgKVxuICByZXR1cm4gcmVuZGVyZWRDb250ZW50XG59XG5cbmZ1bmN0aW9uIHJlbmRlcmVkQ29udGVudFN0cmluZyh2aWV3TmFtZSwgdmlld09iamVjdCkge1xuICAvLyBsb29wIHRocm91Z2h0IHRoZSBzdHJpbmdzIGFycmF5IHRvIGNvbWJpbmUgdGhlbSBhbmQgcHJpbnQgc3RyaW5nIGNvZGUgdG8gdGhlIGZpbGUuXG4gIGlmICh2aWV3T2JqZWN0W3ZpZXdOYW1lXSAmJiBBcnJheS5pc0FycmF5KHZpZXdPYmplY3Rbdmlld05hbWVdKSkge1xuICAgIHJldHVybiB2aWV3T2JqZWN0W3ZpZXdOYW1lXS5qb2luKCcnKSAvLyBqb2lucyBhbGwgYXJyYXkgY29tcG9uZW50cyBpbnRvIG9uZSBzdHJpbmcuXG4gIH1cbn1cblxubGV0IHRyYXZlcnNlUG9ydCA9IGFzeW5jIGZ1bmN0aW9uIGFnZ3JlZ2F0ZUludG9UZW1wbGF0ZU9iamVjdCgpIHtcbiAgbGV0IHZpZXcgPSB7fVxuICBpZiAodGhpcy5pbnNlcnRpb25Qb2ludCkge1xuICAgIGZvciAobGV0IGluc2VydGlvblBvaW50IG9mIHRoaXMuaW5zZXJ0aW9uUG9pbnQpIHtcbiAgICAgIGxldCBjaGlsZHJlbiA9IGF3YWl0IHRoaXMuZmlsdGVyQW5kT3JkZXJDaGlsZHJlbih7IGluc2VydGlvblBvaW50S2V5OiBpbnNlcnRpb25Qb2ludC5rZXkgfSlcbiAgICAgIGxldCBzdWJzZXF1ZW50ID0gYXdhaXQgdGhpcy5pbml0aWFsaXplSW5zZXJ0aW9uUG9pbnQoeyBpbnNlcnRpb25Qb2ludCwgY2hpbGRyZW4gfSlcbiAgICAgIGlmICghKGluc2VydGlvblBvaW50Lm5hbWUgaW4gdmlldykpIHZpZXdbaW5zZXJ0aW9uUG9pbnQubmFtZV0gPSBbXVxuICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkodmlld1tpbnNlcnRpb25Qb2ludC5uYW1lXSwgc3Vic2VxdWVudClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZpZXdcbn1cblxuLypcbiBcblRPRE86IGFzIHRoZXJlYHogaXMgYW4gQVBJIFNjaGVtYSwgYSBkYXRhYmFzZSBzY2hlbWEgY2FuIG1ha2UgY29udGVudCBleHRyZW1lbHkgZHluYW1pYy4gLURhdGFiYXNlIHNjaGVtYSBpcyBkaWZmZXJlbnQgZnJvbSBBUEkgU2NoZW1hLiAgICAgICAgIFxuXG5cbiAgIF9fXyAgX19ffCB8X18gICBfX18gXyBfXyBfX18gICBfXyBfIFxuICAvIF9ffC8gX198ICdfIFxcIC8gXyBcXCAnXyBgIF8gXFwgLyBfYCB8XG4gIFxcX18gXFwgKF9ffCB8IHwgfCAgX18vIHwgfCB8IHwgfCAoX3wgfFxuICB8X19fL1xcX19ffF98IHxffFxcX19ffF98IHxffCB8X3xcXF9fLF98XG4gQVBJIFNjaGVtYVxuICAoV2hpbGUgdGhlIGRhdGFiYXNlIG1vZGVscyBhcmUgc2VwYXJhdGUgaW4gdGhlaXIgb3duIGZ1bmN0aW9ucyBvciBjb3VsZCBiZSBleHBvc2VkIHRocm91Z2ggYSBjbGFzcyBtb2R1bGUpXG5cbiAgLSBSZXNvbHZlciBmdW5jdGlvbiA9IGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGRhdGEuXG4gIC0gRGF0YSBsb2FkZXIgPSBtb2R1bGUgdGhhdCBhZ2dyZWdhdGVzIGR1cGxpY2F0ZSBjYWxscy4gU29sdmluZyB0aGUgbisxIHByb2JsZW0sIHdoZXJlIGVhY2ggcXVlcnkgaGFzIGEgc3Vic2VxdWVudCBxdWVyeSwgbGluZWFyIGdyYXBoLiBUbyBub2RlanMgaXQgdXNlcyBuZXh0VGljayBmdW5jdGlvbiB0byBhbmFseXNlIHRoZSBwcm9taXNlcyBiZWZvcmUgdGhlaXIgZXhlY3V0aW9uIGFuZCBwcmV2ZW50IG11bHRpcGxlIHJvdW5kIHRyaXBzIHRvIHRoZSBzZXJ2ZXIgZm9yIHRoZSBzYW1lIGRhdGEuXG4gIC0gTWFwcGluZyAtIHRocm91Z2ggcm9zb2x2ZXIgZnVuY3Rpb25zLlxuICAtIFNjaGVtYSA9IGlzIHRoZSBzdHJ1Y3R1cmUgJiByZWxhdGlvbnNoaXBzIG9mIHRoZSBhcGkgZGF0YS4gaS5lLiBkZWZpbmVzIGhvdyBhIGNsaWVudCBjYW4gZmV0Y2ggYW5kIHVwZGF0ZSBkYXRhLlxuICAgICAgZWFjaCBzY2hlbWEgaGFzIGFwaSBlbnRyeXBvaW50cy4gRWFjaCBmaWVsZCBjb3JyZXNwb25kcyB0byBhIHJlc29sdmVyIGZ1bmN0aW9uLlxuICBEYXRhIGZldGNoaW5nIGNvbXBsZXhpdHkgYW5kIGRhdGEgc3RydWN0dXJpbmcgaXMgaGFuZGxlZCBieSBzZXJ2ZXIgc2lkZSByYXRoZXIgdGhhbiBjbGllbnQuXG5cbiAgMyB0eXBlcyBvZiBwb3NzaWJsZSBhcGkgYWN0aW9uczogXG4gIC0gUXVlcnlcbiAgLSBNdXRhdGlvblxuICAtIFN1YnNjcmlwdGlvbiAtIGNyZWF0ZXMgYSBzdGVhZHkgY29ubmVjdGlvbiB3aXRoIHRoZSBzZXJ2ZXIuXG5cbiAgRmV0Y2hpbmcgYXBwcm9hY2hlczogXG4gIOKAoiBJbXBlcmF0aXZlIGZldGNoaW5nOiBcbiAgICAgIC0gY29uc3RydWN0cyAmIHNlbmRzIEhUVFAgcmVxdWVzdCwgZS5nLiB1c2luZyBqcyBmZXRjaC5cbiAgICAgIC0gcmVjZWl2ZSAmIHBhcnNlIHNlcnZlciByZXNwb25zZS5cbiAgICAgIC0gc3RvcmUgZGF0YSBsb2NhbGx5LCBlLmcuIGluIG1lbW9yeSBvciBwZXJzaXN0ZW50LiBcbiAgICAgIC0gZGlzcGxheSBVSS5cbiAg4oCiIERlY2xhcmF0aXZlIGZldGNoaW5nIGUuZy4gdXNpbmcgR3JhcGhRTCBjbGllbnRzOiBcbiAgICAgIC0gRGVzY3JpYmUgZGF0YSByZXF1aXJlbWVudHMuXG4gICAgICAtIERpc3BsYXkgaW5mb3JtYXRpb24gaW4gdGhlIFVJLlxuXG4gIFJlcXVlc3Q6IFxuICB7XG4gICAgICBhY3Rpb246IHF1ZXJ5LFxuICAgICAgZW50cnlwb2ludDoge1xuICAgICAgICAgIGtleTogXCJBcnRpY2xlXCJcbiAgICAgIH0sXG4gICAgICBmdW5jdGlvbjoge1xuICAgICAgICAgIG5hbWU6IFwic2luZ2xlXCIsXG4gICAgICAgICAgYXJnczoge1xuICAgICAgICAgICAgICBrZXk6IFwiYXJ0aWNsZTFcIlxuICAgICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBmaWVsZDogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgICAga2V5bmFtZTogXCJ0aXRsZVwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgIGtleW5hbWU6IFwicGFyYWdyYXBoXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAga2V5bmFtZTogXCJhdXRob3JzXCJcbiAgICAgICAgICB9LFxuICAgICAgXVxuICB9XG5cbiAgUmVzcG9uc2UgOlxuICB7XG4gICAgICBkYXRhOiB7XG4gICAgICAgICAgdGl0bGU6IFwiLi4uXCIsXG4gICAgICAgICAgcGFyYWdyYXBoOiAnLi4uJyxcbiAgICAgICAgICBhdXRob3I6IHtcbiAgICAgICAgICAgICAgbmFtZTogJy4uLicsXG4gICAgICAgICAgICAgIGFnZTogMjBcbiAgICAgICAgICB9XG4gICAgICB9XG4gIH1cblxuXG4gIE5lc3RlZCBVbml0IGV4ZWN1dGlvbiBzdGVwczogIFxu4oCiIFxuKi9cblxubGV0IHNjaGVtYSA9ICgpID0+IHtcbiAgLyoqXG4gICAqIEltcGxlbWVudGF0aW9uIHR5cGUgYWdncmVnYXRlSW50b0NvbnRlbnRBcnJheVxuICAgKi9cbiAgLyogZXhtcGxlIHJlcXVlc3QgYm9keTogXG57XG4gICAgXCJmaWVsZE5hbWVcIjogXCJhcnRpY2xlXCIsXG4gICAgXCJmaWVsZFwiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIFwiZmllbGROYW1lXCI6IFwidGl0bGVcIixcbiAgICAgICAgICAgIFwiZmllbGRcIjogW11cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgXCJmaWVsZE5hbWVcIjogXCJwYXJhZ3JhcGhcIixcbiAgICAgICAgICAgIFwiZmllbGRcIjogW11cbiAgICAgICAgfVxuICAgIF0sXG4gICAgXCJzY2hlbWFNb2RlXCI6IFwibm9uU3RyaWN0XCIsIC8vIGFsbG93IGVtcHR5IGRhdGFzZXRzIGZvciBzcGVjaWZpZWQgZmllbGRzIGluIHRoZSBuZXN0ZWQgdW5pdCBzY2hlbWEuXG4gICAgXCJleHRyYWZpZWxkXCI6IHRydWUgLy8gaW5jbHVkZXMgZmllbGRzIHRoYXQgYXJlIG5vdCBleHRyYWN0ZWQgdXNpbmcgdGhlIHNjaGVtYS5cbn0gKi9cbiAgLy8gY29uc3QgeyBhZGQsIGV4ZWN1dGUsIGNvbmRpdGlvbmFsLCBleGVjdXRpb25MZXZlbCB9ID0gcmVxdWlyZSgnQGRlcGVuZGVuY3kvY29tbW9uUGF0dGVybi9zb3VyY2UvZGVjb3JhdG9yVXRpbGl0eS5qcycpXG4gIGZ1bmN0aW9uIHNjaGVtYSh7IHRoaXNBcmcgfSkge1xuICAgIC8vIGZ1bmN0aW9uIHdyYXBwZXIgdG8gc2V0IHRoaXNBcmcgb24gaW1wbGVtZW50YWlvbiBvYmplY3QgZnVuY3Rpb25zLlxuXG4gICAgbGV0IHNlbGYgPSB7XG4gICAgICBAZXhlY3V0aW9uTGV2ZWwoKVxuICAgICAgYXN5bmMgaW5pdGlhbGl6ZU5lc3RlZFVuaXQoeyBuZXN0ZWRVbml0S2V5LCBhZGRpdGlvbmFsQ2hpbGROZXN0ZWRVbml0ID0gW10sIHBhdGhQb2ludGVyS2V5ID0gbnVsbCwgcGFyZW50ID0gdGhpcywgYXJndW1lbnQgPSB7fSB9KSB7XG4gICAgICAgIC8vIEVudHJ5cG9pbnQgSW5zdGFuY2VcbiAgICAgICAgLy8gZXh0cmFjdCByZXF1ZXN0IGRhdGEgYWN0aW9uIGFyZ3VtZW50cy4gYXJndW1lbnRzIGZvciBhIHF1ZXJ5L211dGF0aW9uL3N1YnNjcmlwdGlvbi5cbiAgICAgICAgaWYgKHRoaXMuZXhlY3V0aW9uTGV2ZWwgPT0gJ3RvcExldmVsJykge1xuICAgICAgICAgIG5lc3RlZFVuaXRJbnN0YW5jZS5yZXF1ZXN0T3B0aW9uID0gdGhpcy5wb3J0QXBwSW5zdGFuY2UuY29udGV4dC5yZXF1ZXN0LmJvZHlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBjaGlsZC9uZXN0ZWRcbiAgICAgICAgICBsZXQgZmllbGRBcnJheSA9IHBhcmVudC5yZXF1ZXN0T3B0aW9uLmZpZWxkIC8vIG9iamVjdCBhcnJheVxuICAgICAgICAgIGlmICgoZmllbGRBcnJheSAmJiBmaWVsZEFycmF5Lmxlbmd0aCA9PSAwKSB8fCAhZmllbGRBcnJheSkge1xuICAgICAgICAgICAgbmVzdGVkVW5pdEluc3RhbmNlLnJlcXVlc3RPcHRpb24gPSB7fSAvLyBjb250aW51ZSB0byByZXNvbHZlIGRhdGFzZXQgYW5kIGFsbCBzdWJzZXF1ZW50IE5lc3RlZHVuaXRzIG9mIG5lc3RlZCBkYXRhc2V0IGluIGNhc2UgYXJlIG9iamVjdHMuXG4gICAgICAgICAgfSBlbHNlIGlmIChmaWVsZEFycmF5KSB7XG4gICAgICAgICAgICBuZXN0ZWRVbml0SW5zdGFuY2UucmVxdWVzdE9wdGlvbiA9IGZpZWxkQXJyYXkuZmluZChmaWVsZCA9PiBmaWVsZC5maWVsZE5hbWUgPT0gdW5pdEluc3RhbmNlLmZpZWxkTmFtZSkgLy8gd2hlcmUgZmllbGROYW1lcyBtYXRjaFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNoZWNrIGlmIGZpZWxkbmFtZSBleGlzdHMgaW4gdGhlIHJlcXVlc3Qgb3B0aW9uLCBpZiBub3Qgc2tpcCBuZXN0ZWQgdW5pdC5cbiAgICAgICAgaWYgKCFuZXN0ZWRVbml0SW5zdGFuY2UucmVxdWVzdE9wdGlvbikgcmV0dXJuIC8vIGZpZWxkTmFtZSB3YXMgbm90IHNwZWNpZmllZCBpbiB0aGUgcGFyZW50IG5lc3RlZFVuaXQsIHRoZXJlZm9yZSBza2lwIGl0cyBleGVjdXRpb25cbiAgICAgICAgbmVzdGVkVW5pdEluc3RhbmNlLmRhdGFzZXQgPSBhd2FpdCB1bml0SW5zdGFuY2UucmVzb2x2ZURhdGFzZXQoeyBwYXJlbnRSZXN1bHQ6IGFyZ3VtZW50LmRhdGFzZXQgfHwgcGFyZW50LmRhdGFzZXQgfSlcbiAgICAgICAgLy8gVE9ETzogRml4IHJlcXVlc3RPcHRpb24gLSBpLmUuIGFib3ZlIGl0IGlzIHVzZWQgdG8gcGFzcyBcImZpZWxkXCIgb3B0aW9uIG9ubHkuXG4gICAgICAgIGlmICh0aGlzLnBvcnRBcHBJbnN0YW5jZS5jb250ZXh0LnJlcXVlc3QuYm9keS5zY2hlbWFNb2RlID09ICdub25TdHJpY3QnKSB7XG4gICAgICAgICAgLy8gRG9uJ3QgZW5mb3JjZSBzdHJpY3Qgc2NoZW1hLCBpLmUuIGFsbCBuZXN0ZWQgY2hpbGRyZW4gc2hvdWxkIGV4aXN0LlxuICAgICAgICAgIC8vIGlmKG5lc3RlZFVuaXRJbnN0YW5jZS5kYXRhc2V0KSBuZXN0ZWRVbml0SW5zdGFuY2UuZGF0YXNldCA9IG51bGwgLy8gVE9ETzogdGhyb3dzIGVycm9yIGFzIG5leHQgaXQgaXMgYmVpbmcgdXNlZC5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhc3NlcnQubm90RXF1YWwobmVzdGVkVW5pdEluc3RhbmNlLmRhdGFzZXQsIHVuZGVmaW5lZCwgYOKAoiByZXR1cm5lZCBkYXRhc2V0IGNhbm5vdCBiZSB1bmRlZmluZWQgZm9yIGZpZWxkTmFtZTogJHt1bml0SW5zdGFuY2UuZmllbGROYW1lfS5gKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gY2hlY2sgdHlwZSBvZiBkYXRhc2V0XG4gICAgICAgIGxldCBkYXRhc2V0SGFuZGxpbmdcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkobmVzdGVkVW5pdEluc3RhbmNlLmRhdGFzZXQpICYmIG5lc3RlZFVuaXRJbnN0YW5jZS5jaGlsZHJlbiAmJiBuZXN0ZWRVbml0SW5zdGFuY2UuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgIC8vIGFycmF5XG4gICAgICAgICAgZGF0YXNldEhhbmRsaW5nID0gJ3NlcXVlbmNlJ1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBuZXN0ZWRVbml0SW5zdGFuY2UuZGF0YXNldCA9PSAnb2JqZWN0JyAmJiBuZXN0ZWRVbml0SW5zdGFuY2UuY2hpbGRyZW4gJiYgbmVzdGVkVW5pdEluc3RhbmNlLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAvLyBvYmplY3RcbiAgICAgICAgICBkYXRhc2V0SGFuZGxpbmcgPSAnbmVzdGVkJ1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIG5vbi1uZXN0ZWQgdmFsdWVcbiAgICAgICAgICBkYXRhc2V0SGFuZGxpbmcgPSAnbm9uTmVzdGVkJ1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaGFuZGxlIGFycmF5LCBvYmplY3QsIG9yIG5vbi1uZXN0ZWQgdmFsdWVcbiAgICAgICAgbGV0IG9iamVjdCA9IHt9IC8vIGZvcm1hdHRlZCBvYmplY3Qgd2l0aCByZXF1ZXN0ZWQgZmllbGRzXG4gICAgICAgIHN3aXRjaCAoZGF0YXNldEhhbmRsaW5nKSB7XG4gICAgICAgICAgY2FzZSAnc2VxdWVuY2UnOlxuICAgICAgICAgICAgbGV0IHByb21pc2VBcnJheSA9IG5lc3RlZFVuaXRJbnN0YW5jZS5kYXRhc2V0Lm1hcChkb2N1bWVudCA9PiB7XG4gICAgICAgICAgICAgIGxldCBhcmd1bWVudCA9IHt9XG4gICAgICAgICAgICAgIGFyZ3VtZW50WydkYXRhc2V0J10gPSBkb2N1bWVudFxuICAgICAgICAgICAgICByZXR1cm4gbmVzdGVkVW5pdEluc3RhbmNlLmxvb3BJbnNlcnRpb25Qb2ludCh7IHR5cGU6ICdhZ2dyZWdhdGVJbnRvQ29udGVudEFycmF5JywgYXJndW1lbnQgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBsZXQgc3Vic2VxdWVudERhdGFzZXRBcnJheSA9IGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VBcnJheSlcbiAgICAgICAgICAgIG9iamVjdFt1bml0SW5zdGFuY2UuZmllbGROYW1lXSA9IHN1YnNlcXVlbnREYXRhc2V0QXJyYXkubWFwKChzdWJzZXF1ZW50RGF0YXNldCwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZm9ybWF0RGF0YXNldE9mTmVzdGVkVHlwZSh7XG4gICAgICAgICAgICAgICAgc3Vic2VxdWVudERhdGFzZXQsXG4gICAgICAgICAgICAgICAgZGF0YXNldDogbmVzdGVkVW5pdEluc3RhbmNlLmRhdGFzZXRbaW5kZXhdLFxuICAgICAgICAgICAgICAgIG9wdGlvbjoge1xuICAgICAgICAgICAgICAgICAgZXh0cmFmaWVsZDogbmVzdGVkVW5pdEluc3RhbmNlLnJlcXVlc3RPcHRpb24uZXh0cmFmaWVsZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlICduZXN0ZWQnOiAvLyBpZiBmaWVsZCB0cmVhdGVkIGFzIGFuIG9iamVjdCB3aXRoIG5lc3RlZCBmaWVsZHNcbiAgICAgICAgICAgIGxldCBzdWJzZXF1ZW50RGF0YXNldCA9IGF3YWl0IG5lc3RlZFVuaXRJbnN0YW5jZS5sb29wSW5zZXJ0aW9uUG9pbnQoeyB0eXBlOiAnYWdncmVnYXRlSW50b0NvbnRlbnRBcnJheScgfSlcbiAgICAgICAgICAgIG9iamVjdFt1bml0SW5zdGFuY2UuZmllbGROYW1lXSA9IHRoaXMuZm9ybWF0RGF0YXNldE9mTmVzdGVkVHlwZSh7XG4gICAgICAgICAgICAgIHN1YnNlcXVlbnREYXRhc2V0LFxuICAgICAgICAgICAgICBkYXRhc2V0OiBuZXN0ZWRVbml0SW5zdGFuY2UuZGF0YXNldCxcbiAgICAgICAgICAgICAgb3B0aW9uOiB7XG4gICAgICAgICAgICAgICAgZXh0cmFmaWVsZDogbmVzdGVkVW5pdEluc3RhbmNlLnJlcXVlc3RPcHRpb24uZXh0cmFmaWVsZCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBjYXNlICdub25OZXN0ZWQnOlxuICAgICAgICAgICAgLy8gbG9vcGluZyBvdmVyIG5lc3RlZCB1bml0cyBjYW4gbWFuaXB1bGF0ZSB0aGUgZGF0YSBpbiBhIGRpZmZlcmVudCB3YXkgdGhhbiByZWd1bGFyIGFnZ3JlZ2F0aW9uIGludG8gYW4gYXJyYXkuXG4gICAgICAgICAgICBvYmplY3RbdW5pdEluc3RhbmNlLmZpZWxkTmFtZV0gPSBuZXN0ZWRVbml0SW5zdGFuY2UuZGF0YXNldFxuXG4gICAgICAgICAgICBicmVha1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZGVhbCB3aXRoIHJlcXVlc3RlZCBhbGwgZmllbGRzIHdpdGhvdXQgdGhlIGZpZWxkIG9wdGlvbiB3aGVyZSBleGVjdXRpb24gb2Ygc3VibmVzdGVkdW5pdHMgaXMgcmVxdWlyZWQgdG8gbWFuaXB1bGF0ZSB0aGUgZGF0YS5cblxuICAgICAgICByZXR1cm4gb2JqZWN0XG4gICAgICB9LFxuXG4gICAgICBmb3JtYXREYXRhc2V0T2ZOZXN0ZWRUeXBlKHsgc3Vic2VxdWVudERhdGFzZXQsIGRhdGFzZXQsIG9wdGlvbiB9KSB7XG4gICAgICAgIGxldCBvYmplY3QgPSB7fVxuICAgICAgICBzdWJzZXF1ZW50RGF0YXNldC5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgICAgICBvYmplY3QgPSBPYmplY3QuYXNzaWduKG9iamVjdCwgZmllbGQpXG4gICAgICAgIH0pXG4gICAgICAgIGlmIChvcHRpb24uZXh0cmFmaWVsZCkge1xuICAgICAgICAgIC8vIGV4dHJhZmllbGQgb3B0aW9uXG4gICAgICAgICAgb2JqZWN0ID0gT2JqZWN0LmFzc2lnbihkYXRhc2V0LCBvYmplY3QpIC8vIG92ZXJyaWRlIHN1YnNlcXVlbnQgZmllbGRzIGFuZCBrZWVwIHVudHJhY2tlZCBmaWVsZHMuXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9iamVjdFxuICAgICAgfSxcbiAgICB9XG5cbiAgICBPYmplY3Qua2V5cyhzZWxmKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgc2VsZltrZXldID0gc2VsZltrZXldLmJpbmQodGhpc0FyZylcbiAgICB9LCB7fSlcbiAgICByZXR1cm4gc2VsZlxuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZURhdGFzZXQoe1xuICAgIHBhcmVudFJlc3VsdCA9IG51bGwsXG4gICAgLy8gdGhpcy5hcmdzIC0gbmVzdGVkVW5pdCBhcmdzIGZpZWxkLlxuICB9KSB7XG4gICAgLy8gWzJdIHJlcXVpcmUgJiBjaGVjayBjb25kaXRpb25cbiAgICBsZXQgZGF0YXNldFxuICAgIGNvbnN0IGFsZ29yaXRobSA9IHRoaXMuZmlsZS5hbGdvcml0aG0gLy8gcmVzb2x2ZXIgZm9yIGRhdGFzZXRcbiAgICBzd2l0Y2ggKFxuICAgICAgYWxnb3JpdGhtLnR5cGUgLy8gaW4gb3JkZXIgdG8gY2hvb3NlIGhvdyB0byBoYW5kbGUgdGhlIGFsZ29yaXRobSAoYXMgYSBtb2R1bGUgPyBhIGZpbGUgdG8gYmUgaW1wb3J0ZWQgPy4uLilcbiAgICApIHtcbiAgICAgIGNhc2UgJ2ZpbGUnOlxuICAgICAgZGVmYXVsdDpcbiAgICAgICAge1xuICAgICAgICAgIGxldCBtb2R1bGUgPSByZXF1aXJlKGFsZ29yaXRobS5wYXRoKS5kZWZhdWx0XG4gICAgICAgICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICdmdW5jdGlvbicpIG1vZHVsZSA9IG1vZHVsZS5kZWZhdWx0IC8vIGNhc2UgZXM2IG1vZHVsZSBsb2FkZWQgd2l0aCByZXF1aXJlIGZ1bmN0aW9uICh3aWxsIGxvYWQgaXQgYXMgYW4gb2JqZWN0KVxuICAgICAgICAgIGxldCByZXNvbHZlciA9IG1vZHVsZSgpIC8qaW5pdGlhbCBleGVjdXRlIGZvciBzZXR0aW5nIHBhcmFtZXRlciBjb250ZXh0LiovXG4gICAgICAgICAgbGV0IHJlc29sdmVyQXJndW1lbnQgPSBPYmplY3QuYXNzaWduKC4uLlt0aGlzLmFyZ3MsIGFsZ29yaXRobS5hcmd1bWVudF0uZmlsdGVyKEJvb2xlYW4pKSAvLyByZW1vdmUgdW5kZWZpbmVkL251bGwvZmFsc2Ugb2JqZWN0cyBiZWZvcmUgbWVyZ2luZy5cbiAgICAgICAgICBkYXRhc2V0ID0gYXdhaXQgcmVzb2x2ZXIoe1xuICAgICAgICAgICAgcG9ydENsYXNzSW5zdGFuY2U6IHRoaXMucG9ydEFwcEluc3RhbmNlLCAvLyBjb250YWlucyBhbHNvIHBvcnRDbGFzc0luc3RhbmNlLmNvbnRleHQgb2YgdGhlIHJlcXVlc3QuXG4gICAgICAgICAgICBhcmdzOiByZXNvbHZlckFyZ3VtZW50LFxuICAgICAgICAgICAgcGFyZW50UmVzdWx0LCAvLyBwYXJlbnQgZGF0YXNldCByZXN1bHQuXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgICBicmVha1xuICAgIH1cblxuICAgIHJldHVybiBkYXRhc2V0XG4gIH1cbn1cbiJdfQ==