"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.returnDataItemKey = returnDataItemKey;exports.timeout = timeout;exports.executeShellscriptFile = executeShellscriptFile;exports.executeScriptSpawn = executeScriptSpawn;exports.switchCase = switchCase;exports.immediatelyExecuteMiddleware = void 0;var _applyDecoratedDescriptor2 = _interopRequireDefault(require("@babel/runtime/helpers/applyDecoratedDescriptor"));var _path = _interopRequireDefault(require("path"));
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















const executeFunctionReference = async function ({ stageNode, processNode, graphInstance, nextProcessData }, { additionalParameter, traverseCallContext }) {
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
};













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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NvdXJjZS90cmF2ZXJzYWxJbXBsZW1lbnRhdGlvbi9wcm9jZXNzRGF0YS5qcyJdLCJuYW1lcyI6WyJyZXR1cm5EYXRhSXRlbUtleSIsInN0YWdlTm9kZSIsInByb2Nlc3NOb2RlIiwiZ3JhcGhJbnN0YW5jZSIsIm5leHRQcm9jZXNzRGF0YSIsImFkZGl0aW9uYWxQYXJhbWV0ZXIiLCJ0cmF2ZXJzZUNhbGxDb250ZXh0IiwicHJvcGVydGllcyIsIm5hbWUiLCJ0aW1lb3V0IiwidGltZXJEZWxheSIsIkVycm9yIiwiZGVsYXkiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInNldFRpbWVvdXQiLCJleGVjdXRlRnVuY3Rpb25SZWZlcmVuY2UiLCJjb250ZXh0UHJvcGVydHlOYW1lIiwicmVmZXJlbmNlQ29udGV4dCIsImNvbnRleHQiLCJyZXNvdXJjZSIsInJlc291cmNlQXJyYXkiLCJkYXRhYmFzZVdyYXBwZXIiLCJnZXRSZXNvdXJjZSIsImNvbmNyZXRlRGF0YWJhc2UiLCJkYXRhYmFzZSIsIm5vZGVJRCIsImlkZW50aXR5IiwibGVuZ3RoIiwic291cmNlIiwibGFiZWxzIiwiaW5jbHVkZXMiLCJzY2hlbWVSZWZlcmVuY2UiLCJub2RlTGFiZWwiLCJmdW5jdGlvbiIsImZ1bmN0aW9uTmFtZSIsImZ1bmN0aW9uQ2FsbGJhY2siLCJub2RlIiwiZXJyb3IiLCJjb25zb2xlIiwicHJvY2VzcyIsImV4aXQiLCJleGVjdXRlU2hlbGxzY3JpcHRGaWxlIiwibWVzc2FnZSIsInNjcmlwdFJlZmVyZW5jZUtleSIsInJlZmVyZW5jZUtleSIsImtleSIsImxvZyIsInNjcmlwdFBhdGgiLCJjd2QiLCJwYXRoIiwiZGlybmFtZSIsInNoZWxsIiwic3RkaW8iLCJleGVjdXRlU2NyaXB0U3Bhd24iLCJjaGlsZFByb2Nlc3MiLCJjb21tYW5kIiwiYXJndW1lbnQiLCJqb2luIiwib3B0aW9uIiwiSlNPTiIsInN0cmluZ2lmeSIsInN0YXR1cyIsInN3aXRjaENhc2UiLCJjYXNlQXJyYXkiLCJkZWZhdWx0IiwiZGVmYXVsdFJlbGF0aW9uc2hpcCIsImdldFN3aXRjaEVsZW1lbnQiLCJ2YWx1ZSIsImdldFRhcmdldFZhbHVlIiwiY29tcGFyaXNvblZhbHVlIiwiY2hvc2VuTm9kZSIsImNhc2VSZWxhdGlvbnNoaXAiLCJmaWx0ZXIiLCJjb25uZWN0aW9uIiwiZXhwZWN0ZWQiLCJkZXN0aW5hdGlvbiIsImltbWVkaWF0ZWx5RXhlY3V0ZU1pZGRsZXdhcmUiLCJuZXh0RnVuY3Rpb24iLCJtaWRkbGV3YXJlUGFyYW1ldGVyIiwibWlkZGxld2FyZSIsIm5leHQiLCJpbml0aWFsaXplTmVzdGVkVW5pdCIsIm5lc3RlZFVuaXRLZXkiLCJhZGRpdGlvbmFsQ2hpbGROZXN0ZWRVbml0IiwicGF0aFBvaW50ZXJLZXkiLCJ2aWV3IiwibmVzdGVkVW5pdEluc3RhbmNlIiwibG9vcEluc2VydGlvblBvaW50IiwidHlwZSIsInBvcnRBcHBJbnN0YW5jZSIsImNvbmZpZyIsImNsaWVudFNpZGVQYXRoIiwidGVtcGxhdGVQYXRoIiwidW5pdEluc3RhbmNlIiwiZmlsZSIsImZpbGVQYXRoIiwicmVuZGVyZWRDb250ZW50IiwicHJvY2Vzc0RhdGFJbXBsZW1lbnRhdGlvbiIsInVuZGVyc2NvcmVSZW5kZXJpbmciLCJwcm9jZXNzUmVuZGVyZWRDb250ZW50IiwidGVtcGxhdGVTdHJpbmciLCJmaWxlc3lzdGVtIiwicmVhZEZpbGVTeW5jIiwidGVtcGxhdGVBcmd1bWVudCIsInRlbXBsYXRlQ29udHJvbGxlciIsIkFwcGxpY2F0aW9uIiwidW5kZXJzY29yZSIsInRlbXBsYXRlIiwiT2JqZWN0IiwiYXNzaWduIiwicmVuZGVyZWRDb250ZW50U3RyaW5nIiwidmlld05hbWUiLCJ2aWV3T2JqZWN0IiwiQXJyYXkiLCJpc0FycmF5IiwidHJhdmVyc2VQb3J0IiwiYWdncmVnYXRlSW50b1RlbXBsYXRlT2JqZWN0IiwiaW5zZXJ0aW9uUG9pbnQiLCJjaGlsZHJlbiIsImZpbHRlckFuZE9yZGVyQ2hpbGRyZW4iLCJpbnNlcnRpb25Qb2ludEtleSIsInN1YnNlcXVlbnQiLCJpbml0aWFsaXplSW5zZXJ0aW9uUG9pbnQiLCJwcm90b3R5cGUiLCJwdXNoIiwiYXBwbHkiLCJzY2hlbWEiLCJ0aGlzQXJnIiwic2VsZiIsImV4ZWN1dGlvbkxldmVsIiwicGFyZW50IiwicmVxdWVzdE9wdGlvbiIsInJlcXVlc3QiLCJib2R5IiwiZmllbGRBcnJheSIsImZpZWxkIiwiZmluZCIsImZpZWxkTmFtZSIsImRhdGFzZXQiLCJyZXNvbHZlRGF0YXNldCIsInBhcmVudFJlc3VsdCIsInNjaGVtYU1vZGUiLCJhc3NlcnQiLCJub3RFcXVhbCIsInVuZGVmaW5lZCIsImRhdGFzZXRIYW5kbGluZyIsIm9iamVjdCIsInByb21pc2VBcnJheSIsIm1hcCIsImRvY3VtZW50Iiwic3Vic2VxdWVudERhdGFzZXRBcnJheSIsImFsbCIsInN1YnNlcXVlbnREYXRhc2V0IiwiaW5kZXgiLCJmb3JtYXREYXRhc2V0T2ZOZXN0ZWRUeXBlIiwiZXh0cmFmaWVsZCIsImZvckVhY2giLCJrZXlzIiwiYmluZCIsImFsZ29yaXRobSIsIm1vZHVsZSIsInJlcXVpcmUiLCJyZXNvbHZlciIsInJlc29sdmVyQXJndW1lbnQiLCJhcmdzIiwiQm9vbGVhbiIsInBvcnRDbGFzc0luc3RhbmNlIl0sIm1hcHBpbmdzIjoia2hCQUFBO0FBQ0E7QUFDQTs7QUFFTyxlQUFlQSxpQkFBZixDQUFpQyxFQUFFQyxTQUFGLEVBQWFDLFdBQWIsRUFBMEJDLGFBQTFCLEVBQXlDQyxlQUF6QyxFQUFqQyxFQUE2RixFQUFFQyxtQkFBRixFQUF1QkMsbUJBQXZCLEVBQTdGLEVBQTJJO0FBQ2hKLCtCQUFJSixXQUFXLENBQUNLLFVBQWhCLDBEQUFJLHNCQUF3QkMsSUFBNUIsRUFBa0MsT0FBUSxHQUFELDBCQUFHTixXQUFXLENBQUNLLFVBQWYsMkRBQUcsdUJBQXdCQyxJQUFLLEVBQXZDO0FBQ25DOzs7QUFHTSxlQUFlQyxPQUFmLENBQXVCLEVBQUVSLFNBQUYsRUFB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Y0FBSXdFLE1BQU0sR0FBR0MsT0FBTyxDQUFDRixTQUFTLENBQUM5RyxJQUFYLENBQVAsQ0FBd0JlLE9BQXJDO0FBQ0EsY0FBSSxPQUFPZ0csTUFBUCxLQUFrQixVQUF0QixFQUFrQ0EsTUFBTSxHQUFHQSxNQUFNLENBQUNoRyxPQUFoQjtBQUNsQyxjQUFJa0csUUFBUSxHQUFHRixNQUFNLEVBQXJCO0FBQ0EsY0FBSUcsZ0JBQWdCLEdBQUd2RCxNQUFNLENBQUNDLE1BQVAsQ0FBYyxHQUFHLENBQUMsS0FBS3VELElBQU4sRUFBWUwsU0FBUyxDQUFDdkcsUUFBdEIsRUFBZ0NnQixNQUFoQyxDQUF1QzZGLE9BQXZDLENBQWpCLENBQXZCO0FBQ0EzQixVQUFBQSxPQUFPLEdBQUcsTUFBTXdCLFFBQVEsQ0FBQztBQUN2QkksWUFBQUEsaUJBQWlCLEVBQUUsS0FBSzdFLGVBREQ7QUFFdkIyRSxZQUFBQSxJQUFJLEVBQUVELGdCQUZpQjtBQUd2QnZCLFlBQUFBLFlBSHVCLEVBQUQsQ0FBeEI7O0FBS0Q7QUFDRCxjQWhCSjs7O0FBbUJBLFdBQU9GLE9BQVA7QUFDRDtBQUNGLENBN0pEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0J1xuaW1wb3J0IHsgZXhlYywgZXhlY1N5bmMsIHNwYXduLCBzcGF3blN5bmMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJ1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmV0dXJuRGF0YUl0ZW1LZXkoeyBzdGFnZU5vZGUsIHByb2Nlc3NOb2RlLCBncmFwaEluc3RhbmNlLCBuZXh0UHJvY2Vzc0RhdGEgfSwgeyBhZGRpdGlvbmFsUGFyYW1ldGVyLCB0cmF2ZXJzZUNhbGxDb250ZXh0IH0pIHtcbiAgaWYgKHByb2Nlc3NOb2RlLnByb3BlcnRpZXM/Lm5hbWUpIHJldHVybiBgJHtwcm9jZXNzTm9kZS5wcm9wZXJ0aWVzPy5uYW1lfWBcbn1cblxuLy8gaW1wbGVtZW50YXRpb24gZGVsYXlzIHByb21pc2VzIGZvciB0ZXN0aW5nIGBpdGVyYXRlQ29ubmVjdGlvbmAgb2YgcHJvbWlzZXMgZS5nLiBgYWxsUHJvbWlzZWAsIGByYWNlRmlyc3RQcm9taXNlYCwgZXRjLlxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRpbWVvdXQoeyBzdGFnZU5vZGUsIHByb2Nlc3NOb2RlLCBncmFwaEluc3RhbmNlLCBuZXh0UHJvY2Vzc0RhdGEgfSwgeyBhZGRpdGlvbmFsUGFyYW1ldGVyLCB0cmF2ZXJzZUNhbGxDb250ZXh0IH0pIHtcbiAgaWYgKHR5cGVvZiBwcm9jZXNzTm9kZS5wcm9wZXJ0aWVzPy50aW1lckRlbGF5ICE9ICdudW1iZXInKSB0aHJvdyBuZXcgRXJyb3IoJ+KAoiBEYXRhSXRlbSBtdXN0IGhhdmUgYSBkZWxheSB2YWx1ZS4nKVxuICBsZXQgZGVsYXkgPSBwcm9jZXNzTm9kZS5wcm9wZXJ0aWVzPy50aW1lckRlbGF5XG4gIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgLy8gY29uc29sZS5sb2coYCR7ZGVsYXl9bXMgcGFzc2VkIGZvciBrZXkgJHtwcm9jZXNzTm9kZS5rZXl9LmApIC8vIGRlYnVnXG4gICAgICByZXNvbHZlKHByb2Nlc3NOb2RlLnByb3BlcnRpZXM/Lm5hbWUpXG4gICAgfSwgZGVsYXkpLFxuICApXG59XG5cbi8qKlxuICogUmVsaWVzIG9uIGZ1bmN0aW9uIHJlZmVyZW5jZSBjb25jZXB0IC0gd2hlcmUgYSBmdW5jdGlvbiBpcyBjYWxsZWQgZnJvbSB0aGUgZ3JhcGggdXNpbmcgYSBub2RlIHByb3BlcnR5IHRoYXQgaG9sZHMgaXQncyBuYW1lLCBhbmQgYSBjb250ZXh0IG9iamVjdCBwYXNzZWQgdG8gdGhlIGdyYXBoIHRyYXZlcnNlciwgaG9sZGluZyB0aGUgZnVuY3Rpb25zIG1hcC5cbiAqIGBwcm9jZXNzRGF0YWAgaW1wbGVtZW50YXRpb24gb2YgYGdyYXBoVHJhdmVyc2FsYCBtb2R1bGVcbiAqIGV4ZWN1dGUgZnVuY3Rpb25zIHRocm91Z2ggYSBzdHJpbmcgcmVmZXJlbmNlIGZyb20gdGhlIGdyYXBoIGRhdGFiYXNlIHRoYXQgbWF0Y2ggdGhlIGtleSBvZiB0aGUgYXBwbGljYXRpb24gcmVmZXJlbmNlIGNvbnRleHQgb2JqZWN0XG4gKiBOb3RlOiBjcmVhdGluZyBhIHNpbWlsYXIgaW1wbGVtZW50YXRpb24gdGhhdCB3b3VsZCByZXR1cm4gb25seSB0aGUgZnVuY3Rpb25zIGlzIG5vIGRpZmZlcmVudCB0aGFuIHJldHVybm5pbmcgdGhlIG5hbWVzIG9mIHRoZSBmdW5jdGlvbiwgYW5kIHRoZW4gdXNlIHRoZSBncmFwaCByZXN1bHQgYXJyYXkgb3V0c2lkZSB0aGUgdHJhdmVyc2FsIHRvIHJldHJpZXZlIHRoZSBmdW5jdGlvbiByZWZlcmVuY2VzIGZyb20gYW4gb2JqZWN0LlxuXG5Vc2VkIGZvcjpcbiAgLSB1c2VkIGZvciBleGVjdXRpbmcgdGFza3MgYW5kIGNoZWNrcy9jb25kaXRpb25zXG4gIC0gTWlkZGxld2FyZTpcbiAgICBBcHByb2FjaGVzIGZvciBtaWRkbGV3YXJlIGFnZ3JlZ2F0aW9uOiBcbiAgICAtIENyZWF0ZXMgbWlkZGxld2FyZSBhcnJheSBmcm9tIGdyYXBoLSAgVGhlIGdyYXBoIHRyYXZlcnNhbCBAcmV0dXJuIHtBcnJheSBvZiBPYmplY3RzfSB3aGVyZSBlYWNoIG9iamVjdCBjb250YWlucyBpbnN0cnVjdGlvbiBzZXR0aW5ncyB0byBiZSB1c2VkIHRocm91Z2ggYW4gaW1wbGVtZW50aW5nIG1vZHVsZSB0byBhZGQgdG8gYSBjaGFpbiBvZiBtaWRkbGV3YXJlcy4gXG4gICAgLSByZXR1cm4gbWlkZGxld2FyZSByZWZlcmVuY2UgbmFtZXMsIGFuZCB0aGVuIG1hdGNoaW5nIHRoZSBuYW1lcyB0byBmdW5jdGlvbiBvdXRzaWRlIHRoZSB0cmF2ZXJzYWwuXG4gICAgLSBFeGVjdXRpbmcgZ2VuZXJhdG9yIGZ1bmN0aW9ucyB3aXRoIG5vZGUgYXJndW1lbnRzIHRoYXQgcHJvZHVjZSBtaWRkbGV3YXJlIGZ1bmN0aW9ucy5cbiAqL1xuY29uc3QgZXhlY3V0ZUZ1bmN0aW9uUmVmZXJlbmNlID0gYXN5bmMgZnVuY3Rpb24oeyBzdGFnZU5vZGUsIHByb2Nlc3NOb2RlLCBncmFwaEluc3RhbmNlLCBuZXh0UHJvY2Vzc0RhdGEgfSwgeyBhZGRpdGlvbmFsUGFyYW1ldGVyLCB0cmF2ZXJzZUNhbGxDb250ZXh0IH0pIHtcbiAgbGV0IGNvbnRleHRQcm9wZXJ0eU5hbWUgPSAnZnVuY3Rpb25SZWZlcmVuY2VDb250ZXh0JywgLy8gVE9ETzogYWZ0ZXIgbWlncmF0aW5nIHRvIG93biByZXBvc2l0b3J5LCB1c2UgU3ltYm9scyBpbnN0ZWFkIG9mIHN0cmluZyBrZXlzIGFuZCBleHBvcnQgdGhlbSBmb3IgY2xpZW50IHVzYWdlLlxuICAgIHJlZmVyZW5jZUNvbnRleHQgPSBncmFwaEluc3RhbmNlLmNvbnRleHRbY29udGV4dFByb3BlcnR5TmFtZV1cbiAgYXNzZXJ0KHJlZmVyZW5jZUNvbnRleHQsIGDigKIgQ29udGV4dCBcIiR7Y29udGV4dFByb3BlcnR5TmFtZX1cIiB2YXJpYWJsZSBpcyByZXF1aXJlZCB0byByZWZlcmVuY2UgZnVuY3Rpb25zIGZyb20gZ3JhcGggZGF0YWJhc2Ugc3RyaW5ncy5gKVxuXG4gIGxldCByZXNvdXJjZVxuICBjb25zdCB7IHJlc291cmNlQXJyYXkgfSA9IGF3YWl0IGdyYXBoSW5zdGFuY2UuZGF0YWJhc2VXcmFwcGVyLmdldFJlc291cmNlKHsgY29uY3JldGVEYXRhYmFzZTogZ3JhcGhJbnN0YW5jZS5kYXRhYmFzZSwgbm9kZUlEOiBwcm9jZXNzTm9kZS5pZGVudGl0eSB9KVxuICBpZiAocmVzb3VyY2VBcnJheS5sZW5ndGggPiAxKSB0aHJvdyBuZXcgRXJyb3IoYOKAoiBNdWx0aXBsZSByZXNvdXJjZSByZWxhdGlvbnNoaXBzIGFyZSBub3Qgc3VwcG9ydGVkIGZvciBQcm9jZXNzIG5vZGUuYClcbiAgZWxzZSBpZiAocmVzb3VyY2VBcnJheS5sZW5ndGggPT0gMCkgcmV0dXJuXG4gIGVsc2UgcmVzb3VyY2UgPSByZXNvdXJjZUFycmF5WzBdXG5cbiAgYXNzZXJ0KHJlc291cmNlLnNvdXJjZS5sYWJlbHMuaW5jbHVkZXMoZ3JhcGhJbnN0YW5jZS5zY2hlbWVSZWZlcmVuY2Uubm9kZUxhYmVsLmZ1bmN0aW9uKSwgYOKAoiBVbnN1cHBvcnRlZCBOb2RlIHR5cGUgZm9yIHJlc291cmNlIGNvbm5lY3Rpb24uYClcbiAgbGV0IGZ1bmN0aW9uTmFtZSA9IHJlc291cmNlLnNvdXJjZS5wcm9wZXJ0aWVzLmZ1bmN0aW9uTmFtZSB8fCB0aHJvdyBuZXcgRXJyb3IoYOKAoiBmdW5jdGlvbiByZXNvdXJjZSBtdXN0IGhhdmUgYSBcImZ1bmN0aW9uTmFtZVwiIC0gJHtyZXNvdXJjZS5zb3VyY2UucHJvcGVydGllcy5mdW5jdGlvbk5hbWV9YClcbiAgbGV0IGZ1bmN0aW9uQ2FsbGJhY2sgPSByZWZlcmVuY2VDb250ZXh0W2Z1bmN0aW9uTmFtZV0gfHwgdGhyb3cgbmV3IEVycm9yKGDigKIgcmVmZXJlbmNlIGZ1bmN0aW9uIG5hbWUgZG9lc24ndCBleGlzdC5gKVxuICB0cnkge1xuICAgIHJldHVybiBhd2FpdCBmdW5jdGlvbkNhbGxiYWNrKHsgbm9kZTogcHJvY2Vzc05vZGUsIGNvbnRleHQ6IGdyYXBoSW5zdGFuY2UuY29udGV4dCwgdHJhdmVyc2VDYWxsQ29udGV4dCB9KVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpICYmIHByb2Nlc3MuZXhpdCgpXG4gIH1cbn1cblxuLypcbiBcbiAgIF9fX18gICAgICAgICAgICBfICAgICAgIF8gICAgIF9fX19fICAgICAgICAgICAgICAgICAgICAgXyAgIF8gICAgICAgICAgICAgXG4gIC8gX19ffCAgX19fIF8gX18oXylfIF9fIHwgfF8gIHwgX19fX3xfICBfX19fXyAgX19fIF8gICBffCB8XyhfKSBfX18gIF8gX18gIFxuICBcXF9fXyBcXCAvIF9ffCAnX198IHwgJ18gXFx8IF9ffCB8ICBffCBcXCBcXC8gLyBfIFxcLyBfX3wgfCB8IHwgX198IHwvIF8gXFx8ICdfIFxcIFxuICAgX19fKSB8IChfX3wgfCAgfCB8IHxfKSB8IHxfICB8IHxfX18gPiAgPCAgX18vIChfX3wgfF98IHwgfF98IHwgKF8pIHwgfCB8IHxcbiAgfF9fX18vIFxcX19ffF98ICB8X3wgLl9fLyBcXF9ffCB8X19fX18vXy9cXF9cXF9fX3xcXF9fX3xcXF9fLF98XFxfX3xffFxcX19fL3xffCB8X3xcbiAgICAgICAgICAgICAgICAgICAgfF98ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gUmVsaWVzIG9uIGZ1bmN0aW9uIHJlZmVyZW5jZSBjb25jZXB0LlxuKi9cblxuLy8gRXhlY3V0ZSB0YXNrIHNjcmlwdCBpbiB0aGUgc2FtZSBwcm9jZXNzIChub2RlanMgY2hpbGRwcm9jZXNzLmV4ZWNTeW5jKSB1c2luZyBhIHJlZmVyZW5jZSBzY3JpcHRQYXRoIHByb3BlcnR5LlxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4ZWN1dGVTaGVsbHNjcmlwdEZpbGUoeyBzdGFnZU5vZGUsIHByb2Nlc3NOb2RlLCBncmFwaEluc3RhbmNlLCBuZXh0UHJvY2Vzc0RhdGEgfSwgeyBhZGRpdGlvbmFsUGFyYW1ldGVyLCB0cmF2ZXJzZUNhbGxDb250ZXh0IH0pIHtcbiAgbGV0IG1lc3NhZ2UgPSBgIF9fX19fICAgICAgICAgICAgICAgICAgICAgICAgICBfICAgICAgICBcbiAgfCBfX19ffF9fICBfXyBfX18gICBfX18gIF8gICBfIHwgfF8gIF9fXyBcbiAgfCAgX3wgIFxcXFwgXFxcXC8gLy8gXyBcXFxcIC8gX198fCB8IHwgfHwgX198LyBfIFxcXFxcbiAgfCB8X19fICA+ICA8fCAgX18vfCAoX18gfCB8X3wgfHwgfF98ICBfXy8gICAgXG4gIHxfX19fX3wvXy9cXFxcX1xcXFxcXFxcX19ffCBcXFxcX19ffCBcXFxcX18sX3wgXFxcXF9ffFxcXFxfX198YFxuICBsZXQgY29udGV4dFByb3BlcnR5TmFtZSA9ICdmaWxlQ29udGV4dCcsXG4gICAgcmVmZXJlbmNlQ29udGV4dCA9IGdyYXBoSW5zdGFuY2UuY29udGV4dFtjb250ZXh0UHJvcGVydHlOYW1lXVxuICBhc3NlcnQocmVmZXJlbmNlQ29udGV4dCwgYOKAoiBDb250ZXh0IFwiJHtjb250ZXh0UHJvcGVydHlOYW1lfVwiIHZhcmlhYmxlIGlzIHJlcXVpcmVkIHRvIHJlZmVyZW5jZSBmdW5jdGlvbnMgZnJvbSBncmFwaCBkYXRhYmFzZSBzdHJpbmdzLmApXG5cbiAgbGV0IHJlc291cmNlXG4gIGNvbnN0IHsgcmVzb3VyY2VBcnJheSB9ID0gYXdhaXQgZ3JhcGhJbnN0YW5jZS5kYXRhYmFzZVdyYXBwZXIuZ2V0UmVzb3VyY2UoeyBjb25jcmV0ZURhdGFiYXNlOiBncmFwaEluc3RhbmNlLmRhdGFiYXNlLCBub2RlSUQ6IHByb2Nlc3NOb2RlLmlkZW50aXR5IH0pXG4gIGlmIChyZXNvdXJjZUFycmF5Lmxlbmd0aCA+IDEpIHRocm93IG5ldyBFcnJvcihg4oCiIE11bHRpcGxlIHJlc291cmNlIHJlbGF0aW9uc2hpcHMgYXJlIG5vdCBzdXBwb3J0ZWQgZm9yIFByb2Nlc3Mgbm9kZS5gKVxuICBlbHNlIGlmIChyZXNvdXJjZUFycmF5Lmxlbmd0aCA9PSAwKSByZXR1cm5cbiAgZWxzZSByZXNvdXJjZSA9IHJlc291cmNlQXJyYXlbMF1cbiAgbGV0IHNjcmlwdFJlZmVyZW5jZUtleSA9IHJlc291cmNlLnNvdXJjZS5wcm9wZXJ0aWVzLnJlZmVyZW5jZUtleVxuICBhc3NlcnQoc2NyaXB0UmVmZXJlbmNlS2V5LCBg4oCiIHJlc291cmNlIEZpbGUgbm9kZSAod2l0aCBrZXk6ICR7cmVzb3VyY2Uuc291cmNlLnByb3BlcnRpZXMua2V5fSkgbXVzdCBoYXZlIFwicmVmZXJlbmNlS2V5XCIgcHJvcGVydHkuYClcblxuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UpXG4gICAgbGV0IHNjcmlwdFBhdGggPSByZWZlcmVuY2VDb250ZXh0W3NjcmlwdFJlZmVyZW5jZUtleV1cbiAgICBhc3NlcnQoc2NyaXB0UGF0aCwgYOKAoiByZWZlcmVuY2VLZXkgb2YgRmlsZSBub2RlIChyZWZlcmVuY2VLZXkgPSAke3NjcmlwdFJlZmVyZW5jZUtleX0pIHdhcyBub3QgZm91bmQgaW4gdGhlIGdyYXBoSW5zdGFuY2UgY29udGV4dDogJHtyZWZlcmVuY2VDb250ZXh0fSBgKVxuICAgIGNvbnNvbGUubG9nKGBcXHgxYls0NW0lc1xceDFiWzBtYCwgYHNoZWxsc2NyaXB0IHBhdGg6ICR7c2NyaXB0UGF0aH1gKVxuICAgIGV4ZWNTeW5jKGBzaCAke3NjcmlwdFBhdGh9YCwgeyBjd2Q6IHBhdGguZGlybmFtZShzY3JpcHRQYXRoKSwgc2hlbGw6IHRydWUsIHN0ZGlvOiBbJ2luaGVyaXQnLCAnaW5oZXJpdCcsICdpbmhlcml0J10gfSlcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB0aHJvdyBlcnJvclxuICAgIHByb2Nlc3MuZXhpdCgxKVxuICB9XG4gIC8vIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCA1MDApKSAvLyB3YWl0IHggc2Vjb25kcyBiZWZvcmUgbmV4dCBzY3JpcHQgZXhlY3V0aW9uIC8vIGltcG9ydGFudCB0byBwcmV2ZW50ICd1bmFibGUgdG8gcmUtb3BlbiBzdGRpbicgZXJyb3IgYmV0d2VlbiBzaGVsbHMuXG4gIHJldHVybiBudWxsXG59XG5cbi8qKlxuICBSdW4gY2hpbGRwcm9jZXNzIHN5bmNobm9sb3VzIHNwYXduIGNvbW1hbmQ6IFxuICBSZXF1aXJlZCBwcm9wZXJ0aWVzIG9uIHByb2Nlc3Mgbm9kZTogXG4gIEBwYXJhbSB7U3RyaW5nfSBjb21tYW5kXG4gIEBwYXJhbSB7U3RyaW5nW119IGFyZ3VtZW50XG4gIEBwYXJhbSB7SnNvbiBzdHJpbmdpZmllcyBzdHJpbmd9IG9wdGlvblxuKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleGVjdXRlU2NyaXB0U3Bhd24oeyBzdGFnZU5vZGUsIHByb2Nlc3NOb2RlLCBncmFwaEluc3RhbmNlLCBuZXh0UHJvY2Vzc0RhdGEgfSwgeyBhZGRpdGlvbmFsUGFyYW1ldGVyLCB0cmF2ZXJzZUNhbGxDb250ZXh0IH0pIHtcbiAgbGV0IGNoaWxkUHJvY2Vzc1xuICB0cnkge1xuICAgIGxldCBjb21tYW5kID0gcHJvY2Vzc05vZGUucHJvcGVydGllcy5jb21tYW5kLFxuICAgICAgYXJndW1lbnQgPSBwcm9jZXNzTm9kZS5wcm9wZXJ0aWVzLmFyZ3VtZW50LmpvaW4oJyAnKSxcbiAgICAgIG9wdGlvbiA9IEpTT04uc3RyaW5naWZ5KHByb2Nlc3NOb2RlLnByb3BlcnRpZXMub3B0aW9uKVxuICAgIGNvbnNvbGUubG9nKGBcXHgxYls0NW0lc1xceDFiWzBtYCwgYCR7Y29tbWFuZH0gJHthcmd1bWVudH1gKVxuICAgIGNoaWxkUHJvY2VzcyA9IHNwYXduU3luYyhjb21tYW5kLCBhcmd1bWVudCwgb3B0aW9uKVxuICAgIGlmIChjaGlsZFByb2Nlc3Muc3RhdHVzID4gMCkgdGhyb3cgY2hpbGRQcm9jZXNzLmVycm9yXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcHJvY2Vzcy5leGl0KGNoaWxkUHJvY2Vzcy5zdGF0dXMpXG4gIH1cbn1cblxuLypcbiAgICBfX19fICAgICAgICAgICAgICAgIF8gXyBfICAgXyAgICAgICAgICAgICBcbiAgIC8gX19ffF9fXyAgXyBfXyAgIF9ffCAoXykgfF8oXykgX19fICBfIF9fICBcbiAgfCB8ICAgLyBfIFxcfCAnXyBcXCAvIF9gIHwgfCBfX3wgfC8gXyBcXHwgJ18gXFwgXG4gIHwgfF9ffCAoXykgfCB8IHwgfCAoX3wgfCB8IHxffCB8IChfKSB8IHwgfCB8XG4gICBcXF9fX19cXF9fXy98X3wgfF98XFxfXyxffF98XFxfX3xffFxcX19fL3xffCB8X3xcbiovXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzd2l0Y2hDYXNlKHsgc3RhZ2VOb2RlLCBwcm9jZXNzTm9kZSwgZ3JhcGhJbnN0YW5jZSwgbmV4dFByb2Nlc3NEYXRhIH0sIHsgYWRkaXRpb25hbFBhcmFtZXRlciwgdHJhdmVyc2VDYWxsQ29udGV4dCB9KSB7XG4gIGNvbnN0IHsgY2FzZUFycmF5LCBkZWZhdWx0OiBkZWZhdWx0UmVsYXRpb25zaGlwIH0gPSBhd2FpdCBncmFwaEluc3RhbmNlLmRhdGFiYXNlV3JhcHBlci5nZXRTd2l0Y2hFbGVtZW50KHsgY29uY3JldGVEYXRhYmFzZTogZ3JhcGhJbnN0YW5jZS5kYXRhYmFzZSwgbm9kZUlEOiBwcm9jZXNzTm9kZS5pZGVudGl0eSB9KVxuICBjb25zdCB2YWx1ZSA9IGF3YWl0IGdyYXBoSW5zdGFuY2UuZGF0YWJhc2VXcmFwcGVyLmdldFRhcmdldFZhbHVlKHsgY29uY3JldGVEYXRhYmFzZTogZ3JhcGhJbnN0YW5jZS5kYXRhYmFzZSwgbm9kZUlEOiBwcm9jZXNzTm9kZS5pZGVudGl0eSB9KVxuXG4gIC8qIHJ1biBjb25kaXRpb24gY2hlY2sgYWdhaW5zdCBjb21wYXJpc29uIHZhbHVlLiBIaWVyYXJjaHkgb2YgY29tcGFyaXNvbiB2YWx1ZSBjYWxjdWxhdGlvbjogXG4gICAgMS4gVkFMVUUgcmVsYXRpb25zaGlwIGRhdGEuXG4gICAgMi4gTkVYVCBzdGFnZXMgcmVzdWx0IFxuICAqL1xuICBsZXQgY29tcGFyaXNvblZhbHVlXG4gIGlmICh2YWx1ZSkgY29tcGFyaXNvblZhbHVlID0gdmFsdWVcbiAgZWxzZSBjb21wYXJpc29uVmFsdWUgPSBuZXh0UHJvY2Vzc0RhdGFcblxuICAvLyBTd2l0Y2ggY2FzZXM6IHJldHVybiBldmFsdWF0aW9uIGNvbmZpZ3VyYXRpb25cbiAgbGV0IGNob3Nlbk5vZGVcbiAgaWYgKGNhc2VBcnJheSkge1xuICAgIC8vIGNvbXBhcmUgZXhwZWN0ZWQgdmFsdWUgd2l0aCByZXN1bHRcbiAgICBsZXQgY2FzZVJlbGF0aW9uc2hpcCA9IGNhc2VBcnJheS5maWx0ZXIoY2FzZVJlbGF0aW9uc2hpcCA9PiBjYXNlUmVsYXRpb25zaGlwLmNvbm5lY3Rpb24ucHJvcGVydGllcz8uZXhwZWN0ZWQgPT0gY29tcGFyaXNvblZhbHVlKVswXVxuICAgIGNob3Nlbk5vZGUgPSBjYXNlUmVsYXRpb25zaGlwPy5kZXN0aW5hdGlvblxuICB9XG4gIGNob3Nlbk5vZGUgfHw9IGRlZmF1bHRSZWxhdGlvbnNoaXA/LmRlc3RpbmF0aW9uXG5cbiAgcmV0dXJuIGNob3Nlbk5vZGUgfHwgbnVsbFxufVxuXG4vKlxuICAgX18gIF9fIF8gICAgIF8gICAgIF8gXyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gIHwgIFxcLyAgKF8pIF9ffCB8IF9ffCB8IHwgX19fX18gICAgICBfX19fIF8gXyBfXyBfX18gXG4gIHwgfFxcL3wgfCB8LyBfYCB8LyBfYCB8IHwvIF8gXFwgXFwgL1xcIC8gLyBfYCB8ICdfXy8gXyBcXFxuICB8IHwgIHwgfCB8IChffCB8IChffCB8IHwgIF9fL1xcIFYgIFYgLyAoX3wgfCB8IHwgIF9fL1xuICB8X3wgIHxffF98XFxfXyxffFxcX18sX3xffFxcX19ffCBcXF8vXFxfLyBcXF9fLF98X3wgIFxcX19ffFxuICBJbW1lZGlhdGVseSBleGVjdXRlIG1pZGRsZXdhcmVcbiAgTm90ZTogQ2hlY2sgZ3JhcGhJbnRlcmNlcHRpb24gbWV0aG9kIFwiaGFuZGxlTWlkZGxld2FyZU5leHRDYWxsXCJcbiovXG5leHBvcnQgY29uc3QgaW1tZWRpYXRlbHlFeGVjdXRlTWlkZGxld2FyZSA9IGFzeW5jICh7IHN0YWdlTm9kZSwgcHJvY2Vzc05vZGUsIGdyYXBoSW5zdGFuY2UsIG5leHRQcm9jZXNzRGF0YSB9LCB7IGFkZGl0aW9uYWxQYXJhbWV0ZXIsIHRyYXZlcnNlQ2FsbENvbnRleHQgfSkgPT4ge1xuICBjb25zdCB7IG5leHRGdW5jdGlvbiB9ID0gYWRkaXRpb25hbFBhcmFtZXRlclxuICBsZXQgY29udGV4dFByb3BlcnR5TmFtZSA9ICdmdW5jdGlvblJlZmVyZW5jZUNvbnRleHQnLFxuICAgIHJlZmVyZW5jZUNvbnRleHQgPSBncmFwaEluc3RhbmNlLmNvbnRleHRbY29udGV4dFByb3BlcnR5TmFtZV1cbiAgYXNzZXJ0KHJlZmVyZW5jZUNvbnRleHQsIGDigKIgQ29udGV4dCBcIiR7Y29udGV4dFByb3BlcnR5TmFtZX1cIiB2YXJpYWJsZSBpcyByZXF1aXJlZCB0byByZWZlcmVuY2UgZnVuY3Rpb25zIGZyb20gZ3JhcGggZGF0YWJhc2Ugc3RyaW5ncy5gKVxuICBhc3NlcnQoZ3JhcGhJbnN0YW5jZS5taWRkbGV3YXJlUGFyYW1ldGVyPy5jb250ZXh0LCBg4oCiIE1pZGRsZXdhcmUgZ3JhcGggdHJhdmVyc2FsIHJlbGllcyBvbiBncmFwaEluc3RhbmNlLm1pZGRsZXdhcmVQYXJhbWV0ZXIuY29udGV4dGApXG5cbiAgbGV0IHJlc291cmNlXG4gIGNvbnN0IHsgcmVzb3VyY2VBcnJheSB9ID0gYXdhaXQgZ3JhcGhJbnN0YW5jZS5kYXRhYmFzZVdyYXBwZXIuZ2V0UmVzb3VyY2UoeyBjb25jcmV0ZURhdGFiYXNlOiBncmFwaEluc3RhbmNlLmRhdGFiYXNlLCBub2RlSUQ6IHByb2Nlc3NOb2RlLmlkZW50aXR5IH0pXG4gIGlmIChyZXNvdXJjZUFycmF5Lmxlbmd0aCA+IDEpIHRocm93IG5ldyBFcnJvcihg4oCiIE11bHRpcGxlIHJlc291cmNlIHJlbGF0aW9uc2hpcHMgYXJlIG5vdCBzdXBwb3J0ZWQgZm9yIFByb2Nlc3Mgbm9kZS5gKVxuICBlbHNlIGlmIChyZXNvdXJjZUFycmF5Lmxlbmd0aCA9PSAwKSByZXR1cm5cbiAgZWxzZSByZXNvdXJjZSA9IHJlc291cmNlQXJyYXlbMF1cblxuICBhc3NlcnQocmVzb3VyY2Uuc291cmNlLmxhYmVscy5pbmNsdWRlcyhncmFwaEluc3RhbmNlLnNjaGVtZVJlZmVyZW5jZS5ub2RlTGFiZWwuZnVuY3Rpb24pLCBg4oCiIFVuc3VwcG9ydGVkIE5vZGUgdHlwZSBmb3IgcmVzb3VyY2UgY29ubmVjdGlvbi5gKVxuICBsZXQgZnVuY3Rpb25OYW1lID0gcmVzb3VyY2Uuc291cmNlLnByb3BlcnRpZXMuZnVuY3Rpb25OYW1lIHx8IHRocm93IG5ldyBFcnJvcihg4oCiIGZ1bmN0aW9uIHJlc291cmNlIG11c3QgaGF2ZSBhIFwiZnVuY3Rpb25OYW1lXCIgLSAke3Jlc291cmNlLnNvdXJjZS5wcm9wZXJ0aWVzLmZ1bmN0aW9uTmFtZX1gKVxuICAvLyBhIGZ1bmN0aW9uIHRoYXQgY29tcGxpZXMgd2l0aCBncmFwaFRyYXZlcnNhbCBwcm9jZXNzRGF0YSBpbXBsZW1lbnRhdGlvbi5cbiAgbGV0IGZ1bmN0aW9uQ2FsbGJhY2sgPSByZWZlcmVuY2VDb250ZXh0W2Z1bmN0aW9uTmFtZV0gfHwgdGhyb3cgbmV3IEVycm9yKGDigKIgcmVmZXJlbmNlIGZ1bmN0aW9uIG5hbWUgZG9lc24ndCBleGlzdC5gKVxuICB0cnkge1xuICAgIGxldCBtaWRkbGV3YXJlID0gYXdhaXQgZnVuY3Rpb25DYWxsYmFjayh7IG5vZGU6IHByb2Nlc3NOb2RlIH0pIC8vIGV4cHJlY3RlZCB0byByZXR1cm4gYSBLb2EgbWlkZGxld2FyZSBjb21wbHlpbmcgZnVuY3Rpb24uXG4gICAgbGV0IGNvbnRleHQgPSBncmFwaEluc3RhbmNlLm1pZGRsZXdhcmVQYXJhbWV0ZXIuY29udGV4dCxcbiAgICAgIG5leHQgPSBuZXh0RnVuY3Rpb25cbiAgICBhd2FpdCBtaWRkbGV3YXJlKGNvbnRleHQsIG5leHQpIC8vIGV4ZWN1dGUgbWlkZGxld2FyZVxuICAgIHJldHVybiBtaWRkbGV3YXJlIC8vIGFsbG93IHRvIGFnZ3JlZ2F0ZSBtaWRkbGV3YXJlIGZ1bmN0aW9uIGZvciBkZWJ1Z2dpbmcgcHVycG9zZXMuXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihlcnJvcikgJiYgcHJvY2Vzcy5leGl0KClcbiAgfVxufVxuXG4vKlxuICAgX19fXyAgX19fX18gX19fXyAgX19fXyAgX19fX18gX19fXyAgICBfICBfX19fXyBfX19fXyBfX19fICBcbiAgfCAgXyBcXHwgX19fX3wgIF8gXFx8ICBfIFxcfCBfX19fLyBfX198ICAvIFxcfF8gICBffCBfX19ffCAgXyBcXCBcbiAgfCB8IHwgfCAgX3wgfCB8XykgfCB8XykgfCAgX3x8IHwgICAgIC8gXyBcXCB8IHwgfCAgX3wgfCB8IHwgfFxuICB8IHxffCB8IHxfX198ICBfXy98ICBfIDx8IHxfX3wgfF9fXyAvIF9fXyBcXHwgfCB8IHxfX198IHxffCB8XG4gIHxfX19fL3xfX19fX3xffCAgIHxffCBcXF9cXF9fX19fXFxfX19fL18vICAgXFxfXFxffCB8X19fX198X19fXy8gXG4gIFJlcXVpcmVzIHJlZmFjdG9yaW5nIGFuZCBtaWdyYXRpb24gXG4qL1xuLypcbiAgIF9fX19fICAgICAgICAgICAgICAgICAgICBfICAgICAgIF8gICAgICAgXG4gIHxfICAgX3xfXyBfIF9fIF9fXyAgXyBfXyB8IHwgX18gX3wgfF8gX19fIFxuICAgIHwgfC8gXyBcXCAnXyBgIF8gXFx8ICdfIFxcfCB8LyBfYCB8IF9fLyBfIFxcXG4gICAgfCB8ICBfXy8gfCB8IHwgfCB8IHxfKSB8IHwgKF98IHwgfHwgIF9fL1xuICAgIHxffFxcX19ffF98IHxffCB8X3wgLl9fL3xffFxcX18sX3xcXF9fXFxfX198XG4gICAgICAgICAgICAgICAgICAgICB8X3wgICAgICAgICAgICAgICAgICAgIFxuKi9cblxuLyoqXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSBTdHJpbmcgb2YgcmVuZGVyZWQgSFRNTCBkb2N1bWVudCBjb250ZW50LlxuICovXG5hc3luYyBmdW5jdGlvbiBpbml0aWFsaXplTmVzdGVkVW5pdCh7IG5lc3RlZFVuaXRLZXksIGFkZGl0aW9uYWxDaGlsZE5lc3RlZFVuaXQgPSBbXSwgcGF0aFBvaW50ZXJLZXkgPSBudWxsIH0pIHtcbiAgLy8gdmlld3MgYXJndW1lbnQgdGhhdCB3aWxsIGJlIGluaXRpYWxsaXplZCBpbnNpZGUgdGVtcGxhdGVzOlxuICAvLyBsb29wIHRocm91Z2ggdGVtcGxhdGUgYW5kIGNyZWF0ZSByZW5kZXJlZCB2aWV3IGNvbnRlbnQuXG4gIGxldCB2aWV3ID0gYXdhaXQgbmVzdGVkVW5pdEluc3RhbmNlLmxvb3BJbnNlcnRpb25Qb2ludCh7IHR5cGU6ICdhZ2dyZWdhdGVJbnRvVGVtcGxhdGVPYmplY3QnIH0pXG5cbiAgYXNzZXJ0KHRoaXMucG9ydEFwcEluc3RhbmNlLmNvbmZpZy5jbGllbnRTaWRlUGF0aCwgXCLigKIgY2xpZW50U2lkZVBhdGggY2Fubm90IGJlIHVuZGVmaW5lZC4gaS5lLiBwcmV2aW91cyBtaWRkbGV3YXJlcyBzaG91bGQndmUgc2V0IGl0XCIpXG4gIGxldCB0ZW1wbGF0ZVBhdGggPSBwYXRoLmpvaW4odGhpcy5wb3J0QXBwSW5zdGFuY2UuY29uZmlnLmNsaWVudFNpZGVQYXRoLCB1bml0SW5zdGFuY2UuZmlsZS5maWxlUGF0aClcbiAgbGV0IHJlbmRlcmVkQ29udGVudFxuICBzd2l0Y2ggKHVuaXRJbnN0YW5jZS5wcm9jZXNzRGF0YUltcGxlbWVudGF0aW9uKSB7XG4gICAgZGVmYXVsdDpcbiAgICBjYXNlICd1bmRlcnNjb3JlUmVuZGVyaW5nJzpcbiAgICAgIHJlbmRlcmVkQ29udGVudCA9IGF3YWl0IHRoaXMudW5kZXJzY29yZVJlbmRlcmluZyh7IHRlbXBsYXRlUGF0aCwgdmlldyB9KVxuICAgICAgYnJlYWtcbiAgfVxuXG4gIHN3aXRjaCAodW5pdEluc3RhbmNlLnByb2Nlc3NSZW5kZXJlZENvbnRlbnQpIHtcbiAgICBjYXNlICd3cmFwSnNUYWcnOlxuICAgICAgcmVuZGVyZWRDb250ZW50ID0gYDxzY3JpcHQgdHlwZT1cIm1vZHVsZVwiIGFzeW5jPiR7cmVuZGVyZWRDb250ZW50fTwvc2NyaXB0PmBcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDogLy8gc2tpcFxuICB9XG5cbiAgcmV0dXJuIHJlbmRlcmVkQ29udGVudFxufVxuXG5hc3luYyBmdW5jdGlvbiB1bmRlcnNjb3JlUmVuZGVyaW5nKHsgdGVtcGxhdGVQYXRoLCB2aWV3IH0pIHtcbiAgLy8gTG9hZCB0ZW1wbGF0ZSBmaWxlLlxuICBsZXQgdGVtcGxhdGVTdHJpbmcgPSBhd2FpdCBmaWxlc3lzdGVtLnJlYWRGaWxlU3luYyh0ZW1wbGF0ZVBhdGgsICd1dGYtOCcpXG4gIC8vIFNoYXJlZCBhcmd1bWVudHMgYmV0d2VlbiBhbGwgdGVtcGxhdGVzIGJlaW5nIHJlbmRlcmVkXG4gIGNvbnN0IHRlbXBsYXRlQXJndW1lbnQgPSB7XG4gICAgdGVtcGxhdGVDb250cm9sbGVyOiB0aGlzLFxuICAgIGNvbnRleHQ6IHRoaXMucG9ydEFwcEluc3RhbmNlLmNvbnRleHQsXG4gICAgQXBwbGljYXRpb24sXG4gICAgYXJndW1lbnQ6IHt9LFxuICB9XG4gIGxldCByZW5kZXJlZENvbnRlbnQgPSB1bmRlcnNjb3JlLnRlbXBsYXRlKHRlbXBsYXRlU3RyaW5nKShcbiAgICBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB0ZW1wbGF0ZUFyZ3VtZW50LCAvLyB1c2UgdGVtcGxhdGVBcmd1bWVudCBpbiBjdXJyZW50IHRlbXBsYXRlXG4gICAgICB7IHZpZXcsIHRlbXBsYXRlQXJndW1lbnQgfSwgLy8gcGFzcyB0ZW1wbGF0ZUFyZ3VtZW50IHRvIG5lc3RlZCB0ZW1wbGF0ZXNcbiAgICApLFxuICApXG4gIHJldHVybiByZW5kZXJlZENvbnRlbnRcbn1cblxuZnVuY3Rpb24gcmVuZGVyZWRDb250ZW50U3RyaW5nKHZpZXdOYW1lLCB2aWV3T2JqZWN0KSB7XG4gIC8vIGxvb3AgdGhyb3VnaHQgdGhlIHN0cmluZ3MgYXJyYXkgdG8gY29tYmluZSB0aGVtIGFuZCBwcmludCBzdHJpbmcgY29kZSB0byB0aGUgZmlsZS5cbiAgaWYgKHZpZXdPYmplY3Rbdmlld05hbWVdICYmIEFycmF5LmlzQXJyYXkodmlld09iamVjdFt2aWV3TmFtZV0pKSB7XG4gICAgcmV0dXJuIHZpZXdPYmplY3Rbdmlld05hbWVdLmpvaW4oJycpIC8vIGpvaW5zIGFsbCBhcnJheSBjb21wb25lbnRzIGludG8gb25lIHN0cmluZy5cbiAgfVxufVxuXG5sZXQgdHJhdmVyc2VQb3J0ID0gYXN5bmMgZnVuY3Rpb24gYWdncmVnYXRlSW50b1RlbXBsYXRlT2JqZWN0KCkge1xuICBsZXQgdmlldyA9IHt9XG4gIGlmICh0aGlzLmluc2VydGlvblBvaW50KSB7XG4gICAgZm9yIChsZXQgaW5zZXJ0aW9uUG9pbnQgb2YgdGhpcy5pbnNlcnRpb25Qb2ludCkge1xuICAgICAgbGV0IGNoaWxkcmVuID0gYXdhaXQgdGhpcy5maWx0ZXJBbmRPcmRlckNoaWxkcmVuKHsgaW5zZXJ0aW9uUG9pbnRLZXk6IGluc2VydGlvblBvaW50LmtleSB9KVxuICAgICAgbGV0IHN1YnNlcXVlbnQgPSBhd2FpdCB0aGlzLmluaXRpYWxpemVJbnNlcnRpb25Qb2ludCh7IGluc2VydGlvblBvaW50LCBjaGlsZHJlbiB9KVxuICAgICAgaWYgKCEoaW5zZXJ0aW9uUG9pbnQubmFtZSBpbiB2aWV3KSkgdmlld1tpbnNlcnRpb25Qb2ludC5uYW1lXSA9IFtdXG4gICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSh2aWV3W2luc2VydGlvblBvaW50Lm5hbWVdLCBzdWJzZXF1ZW50KVxuICAgIH1cbiAgfVxuICByZXR1cm4gdmlld1xufVxuXG4vKlxuIFxuVE9ETzogYXMgdGhlcmVgeiBpcyBhbiBBUEkgU2NoZW1hLCBhIGRhdGFiYXNlIHNjaGVtYSBjYW4gbWFrZSBjb250ZW50IGV4dHJlbWVseSBkeW5hbWljLiAtRGF0YWJhc2Ugc2NoZW1hIGlzIGRpZmZlcmVudCBmcm9tIEFQSSBTY2hlbWEuICAgICAgICAgXG5cblxuICAgX19fICBfX198IHxfXyAgIF9fXyBfIF9fIF9fXyAgIF9fIF8gXG4gIC8gX198LyBfX3wgJ18gXFwgLyBfIFxcICdfIGAgXyBcXCAvIF9gIHxcbiAgXFxfXyBcXCAoX198IHwgfCB8ICBfXy8gfCB8IHwgfCB8IChffCB8XG4gIHxfX18vXFxfX198X3wgfF98XFxfX198X3wgfF98IHxffFxcX18sX3xcbiBBUEkgU2NoZW1hXG4gIChXaGlsZSB0aGUgZGF0YWJhc2UgbW9kZWxzIGFyZSBzZXBhcmF0ZSBpbiB0aGVpciBvd24gZnVuY3Rpb25zIG9yIGNvdWxkIGJlIGV4cG9zZWQgdGhyb3VnaCBhIGNsYXNzIG1vZHVsZSlcblxuICAtIFJlc29sdmVyIGZ1bmN0aW9uID0gYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgZGF0YS5cbiAgLSBEYXRhIGxvYWRlciA9IG1vZHVsZSB0aGF0IGFnZ3JlZ2F0ZXMgZHVwbGljYXRlIGNhbGxzLiBTb2x2aW5nIHRoZSBuKzEgcHJvYmxlbSwgd2hlcmUgZWFjaCBxdWVyeSBoYXMgYSBzdWJzZXF1ZW50IHF1ZXJ5LCBsaW5lYXIgZ3JhcGguIFRvIG5vZGVqcyBpdCB1c2VzIG5leHRUaWNrIGZ1bmN0aW9uIHRvIGFuYWx5c2UgdGhlIHByb21pc2VzIGJlZm9yZSB0aGVpciBleGVjdXRpb24gYW5kIHByZXZlbnQgbXVsdGlwbGUgcm91bmQgdHJpcHMgdG8gdGhlIHNlcnZlciBmb3IgdGhlIHNhbWUgZGF0YS5cbiAgLSBNYXBwaW5nIC0gdGhyb3VnaCByb3NvbHZlciBmdW5jdGlvbnMuXG4gIC0gU2NoZW1hID0gaXMgdGhlIHN0cnVjdHVyZSAmIHJlbGF0aW9uc2hpcHMgb2YgdGhlIGFwaSBkYXRhLiBpLmUuIGRlZmluZXMgaG93IGEgY2xpZW50IGNhbiBmZXRjaCBhbmQgdXBkYXRlIGRhdGEuXG4gICAgICBlYWNoIHNjaGVtYSBoYXMgYXBpIGVudHJ5cG9pbnRzLiBFYWNoIGZpZWxkIGNvcnJlc3BvbmRzIHRvIGEgcmVzb2x2ZXIgZnVuY3Rpb24uXG4gIERhdGEgZmV0Y2hpbmcgY29tcGxleGl0eSBhbmQgZGF0YSBzdHJ1Y3R1cmluZyBpcyBoYW5kbGVkIGJ5IHNlcnZlciBzaWRlIHJhdGhlciB0aGFuIGNsaWVudC5cblxuICAzIHR5cGVzIG9mIHBvc3NpYmxlIGFwaSBhY3Rpb25zOiBcbiAgLSBRdWVyeVxuICAtIE11dGF0aW9uXG4gIC0gU3Vic2NyaXB0aW9uIC0gY3JlYXRlcyBhIHN0ZWFkeSBjb25uZWN0aW9uIHdpdGggdGhlIHNlcnZlci5cblxuICBGZXRjaGluZyBhcHByb2FjaGVzOiBcbiAg4oCiIEltcGVyYXRpdmUgZmV0Y2hpbmc6IFxuICAgICAgLSBjb25zdHJ1Y3RzICYgc2VuZHMgSFRUUCByZXF1ZXN0LCBlLmcuIHVzaW5nIGpzIGZldGNoLlxuICAgICAgLSByZWNlaXZlICYgcGFyc2Ugc2VydmVyIHJlc3BvbnNlLlxuICAgICAgLSBzdG9yZSBkYXRhIGxvY2FsbHksIGUuZy4gaW4gbWVtb3J5IG9yIHBlcnNpc3RlbnQuIFxuICAgICAgLSBkaXNwbGF5IFVJLlxuICDigKIgRGVjbGFyYXRpdmUgZmV0Y2hpbmcgZS5nLiB1c2luZyBHcmFwaFFMIGNsaWVudHM6IFxuICAgICAgLSBEZXNjcmliZSBkYXRhIHJlcXVpcmVtZW50cy5cbiAgICAgIC0gRGlzcGxheSBpbmZvcm1hdGlvbiBpbiB0aGUgVUkuXG5cbiAgUmVxdWVzdDogXG4gIHtcbiAgICAgIGFjdGlvbjogcXVlcnksXG4gICAgICBlbnRyeXBvaW50OiB7XG4gICAgICAgICAga2V5OiBcIkFydGljbGVcIlxuICAgICAgfSxcbiAgICAgIGZ1bmN0aW9uOiB7XG4gICAgICAgICAgbmFtZTogXCJzaW5nbGVcIixcbiAgICAgICAgICBhcmdzOiB7XG4gICAgICAgICAgICAgIGtleTogXCJhcnRpY2xlMVwiXG4gICAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGZpZWxkOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgICBrZXluYW1lOiBcInRpdGxlXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAga2V5bmFtZTogXCJwYXJhZ3JhcGhcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgICBrZXluYW1lOiBcImF1dGhvcnNcIlxuICAgICAgICAgIH0sXG4gICAgICBdXG4gIH1cblxuICBSZXNwb25zZSA6XG4gIHtcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgICB0aXRsZTogXCIuLi5cIixcbiAgICAgICAgICBwYXJhZ3JhcGg6ICcuLi4nLFxuICAgICAgICAgIGF1dGhvcjoge1xuICAgICAgICAgICAgICBuYW1lOiAnLi4uJyxcbiAgICAgICAgICAgICAgYWdlOiAyMFxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgfVxuXG5cbiAgTmVzdGVkIFVuaXQgZXhlY3V0aW9uIHN0ZXBzOiAgXG7igKIgXG4qL1xuXG5sZXQgc2NoZW1hID0gKCkgPT4ge1xuICAvKipcbiAgICogSW1wbGVtZW50YXRpb24gdHlwZSBhZ2dyZWdhdGVJbnRvQ29udGVudEFycmF5XG4gICAqL1xuICAvKiBleG1wbGUgcmVxdWVzdCBib2R5OiBcbntcbiAgICBcImZpZWxkTmFtZVwiOiBcImFydGljbGVcIixcbiAgICBcImZpZWxkXCI6IFtcbiAgICAgICAge1xuICAgICAgICAgICAgXCJmaWVsZE5hbWVcIjogXCJ0aXRsZVwiLFxuICAgICAgICAgICAgXCJmaWVsZFwiOiBbXVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBcImZpZWxkTmFtZVwiOiBcInBhcmFncmFwaFwiLFxuICAgICAgICAgICAgXCJmaWVsZFwiOiBbXVxuICAgICAgICB9XG4gICAgXSxcbiAgICBcInNjaGVtYU1vZGVcIjogXCJub25TdHJpY3RcIiwgLy8gYWxsb3cgZW1wdHkgZGF0YXNldHMgZm9yIHNwZWNpZmllZCBmaWVsZHMgaW4gdGhlIG5lc3RlZCB1bml0IHNjaGVtYS5cbiAgICBcImV4dHJhZmllbGRcIjogdHJ1ZSAvLyBpbmNsdWRlcyBmaWVsZHMgdGhhdCBhcmUgbm90IGV4dHJhY3RlZCB1c2luZyB0aGUgc2NoZW1hLlxufSAqL1xuICAvLyBjb25zdCB7IGFkZCwgZXhlY3V0ZSwgY29uZGl0aW9uYWwsIGV4ZWN1dGlvbkxldmVsIH0gPSByZXF1aXJlKCdAZGVwZW5kZW5jeS9jb21tb25QYXR0ZXJuL3NvdXJjZS9kZWNvcmF0b3JVdGlsaXR5LmpzJylcbiAgZnVuY3Rpb24gc2NoZW1hKHsgdGhpc0FyZyB9KSB7XG4gICAgLy8gZnVuY3Rpb24gd3JhcHBlciB0byBzZXQgdGhpc0FyZyBvbiBpbXBsZW1lbnRhaW9uIG9iamVjdCBmdW5jdGlvbnMuXG5cbiAgICBsZXQgc2VsZiA9IHtcbiAgICAgIEBleGVjdXRpb25MZXZlbCgpXG4gICAgICBhc3luYyBpbml0aWFsaXplTmVzdGVkVW5pdCh7IG5lc3RlZFVuaXRLZXksIGFkZGl0aW9uYWxDaGlsZE5lc3RlZFVuaXQgPSBbXSwgcGF0aFBvaW50ZXJLZXkgPSBudWxsLCBwYXJlbnQgPSB0aGlzLCBhcmd1bWVudCA9IHt9IH0pIHtcbiAgICAgICAgLy8gRW50cnlwb2ludCBJbnN0YW5jZVxuICAgICAgICAvLyBleHRyYWN0IHJlcXVlc3QgZGF0YSBhY3Rpb24gYXJndW1lbnRzLiBhcmd1bWVudHMgZm9yIGEgcXVlcnkvbXV0YXRpb24vc3Vic2NyaXB0aW9uLlxuICAgICAgICBpZiAodGhpcy5leGVjdXRpb25MZXZlbCA9PSAndG9wTGV2ZWwnKSB7XG4gICAgICAgICAgbmVzdGVkVW5pdEluc3RhbmNlLnJlcXVlc3RPcHRpb24gPSB0aGlzLnBvcnRBcHBJbnN0YW5jZS5jb250ZXh0LnJlcXVlc3QuYm9keVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGNoaWxkL25lc3RlZFxuICAgICAgICAgIGxldCBmaWVsZEFycmF5ID0gcGFyZW50LnJlcXVlc3RPcHRpb24uZmllbGQgLy8gb2JqZWN0IGFycmF5XG4gICAgICAgICAgaWYgKChmaWVsZEFycmF5ICYmIGZpZWxkQXJyYXkubGVuZ3RoID09IDApIHx8ICFmaWVsZEFycmF5KSB7XG4gICAgICAgICAgICBuZXN0ZWRVbml0SW5zdGFuY2UucmVxdWVzdE9wdGlvbiA9IHt9IC8vIGNvbnRpbnVlIHRvIHJlc29sdmUgZGF0YXNldCBhbmQgYWxsIHN1YnNlcXVlbnQgTmVzdGVkdW5pdHMgb2YgbmVzdGVkIGRhdGFzZXQgaW4gY2FzZSBhcmUgb2JqZWN0cy5cbiAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkQXJyYXkpIHtcbiAgICAgICAgICAgIG5lc3RlZFVuaXRJbnN0YW5jZS5yZXF1ZXN0T3B0aW9uID0gZmllbGRBcnJheS5maW5kKGZpZWxkID0+IGZpZWxkLmZpZWxkTmFtZSA9PSB1bml0SW5zdGFuY2UuZmllbGROYW1lKSAvLyB3aGVyZSBmaWVsZE5hbWVzIG1hdGNoXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gY2hlY2sgaWYgZmllbGRuYW1lIGV4aXN0cyBpbiB0aGUgcmVxdWVzdCBvcHRpb24sIGlmIG5vdCBza2lwIG5lc3RlZCB1bml0LlxuICAgICAgICBpZiAoIW5lc3RlZFVuaXRJbnN0YW5jZS5yZXF1ZXN0T3B0aW9uKSByZXR1cm4gLy8gZmllbGROYW1lIHdhcyBub3Qgc3BlY2lmaWVkIGluIHRoZSBwYXJlbnQgbmVzdGVkVW5pdCwgdGhlcmVmb3JlIHNraXAgaXRzIGV4ZWN1dGlvblxuICAgICAgICBuZXN0ZWRVbml0SW5zdGFuY2UuZGF0YXNldCA9IGF3YWl0IHVuaXRJbnN0YW5jZS5yZXNvbHZlRGF0YXNldCh7IHBhcmVudFJlc3VsdDogYXJndW1lbnQuZGF0YXNldCB8fCBwYXJlbnQuZGF0YXNldCB9KVxuICAgICAgICAvLyBUT0RPOiBGaXggcmVxdWVzdE9wdGlvbiAtIGkuZS4gYWJvdmUgaXQgaXMgdXNlZCB0byBwYXNzIFwiZmllbGRcIiBvcHRpb24gb25seS5cbiAgICAgICAgaWYgKHRoaXMucG9ydEFwcEluc3RhbmNlLmNvbnRleHQucmVxdWVzdC5ib2R5LnNjaGVtYU1vZGUgPT0gJ25vblN0cmljdCcpIHtcbiAgICAgICAgICAvLyBEb24ndCBlbmZvcmNlIHN0cmljdCBzY2hlbWEsIGkuZS4gYWxsIG5lc3RlZCBjaGlsZHJlbiBzaG91bGQgZXhpc3QuXG4gICAgICAgICAgLy8gaWYobmVzdGVkVW5pdEluc3RhbmNlLmRhdGFzZXQpIG5lc3RlZFVuaXRJbnN0YW5jZS5kYXRhc2V0ID0gbnVsbCAvLyBUT0RPOiB0aHJvd3MgZXJyb3IgYXMgbmV4dCBpdCBpcyBiZWluZyB1c2VkLlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFzc2VydC5ub3RFcXVhbChuZXN0ZWRVbml0SW5zdGFuY2UuZGF0YXNldCwgdW5kZWZpbmVkLCBg4oCiIHJldHVybmVkIGRhdGFzZXQgY2Fubm90IGJlIHVuZGVmaW5lZCBmb3IgZmllbGROYW1lOiAke3VuaXRJbnN0YW5jZS5maWVsZE5hbWV9LmApXG4gICAgICAgIH1cblxuICAgICAgICAvLyBjaGVjayB0eXBlIG9mIGRhdGFzZXRcbiAgICAgICAgbGV0IGRhdGFzZXRIYW5kbGluZ1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShuZXN0ZWRVbml0SW5zdGFuY2UuZGF0YXNldCkgJiYgbmVzdGVkVW5pdEluc3RhbmNlLmNoaWxkcmVuICYmIG5lc3RlZFVuaXRJbnN0YW5jZS5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgLy8gYXJyYXlcbiAgICAgICAgICBkYXRhc2V0SGFuZGxpbmcgPSAnc2VxdWVuY2UnXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG5lc3RlZFVuaXRJbnN0YW5jZS5kYXRhc2V0ID09ICdvYmplY3QnICYmIG5lc3RlZFVuaXRJbnN0YW5jZS5jaGlsZHJlbiAmJiBuZXN0ZWRVbml0SW5zdGFuY2UuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgIC8vIG9iamVjdFxuICAgICAgICAgIGRhdGFzZXRIYW5kbGluZyA9ICduZXN0ZWQnXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gbm9uLW5lc3RlZCB2YWx1ZVxuICAgICAgICAgIGRhdGFzZXRIYW5kbGluZyA9ICdub25OZXN0ZWQnXG4gICAgICAgIH1cblxuICAgICAgICAvLyBoYW5kbGUgYXJyYXksIG9iamVjdCwgb3Igbm9uLW5lc3RlZCB2YWx1ZVxuICAgICAgICBsZXQgb2JqZWN0ID0ge30gLy8gZm9ybWF0dGVkIG9iamVjdCB3aXRoIHJlcXVlc3RlZCBmaWVsZHNcbiAgICAgICAgc3dpdGNoIChkYXRhc2V0SGFuZGxpbmcpIHtcbiAgICAgICAgICBjYXNlICdzZXF1ZW5jZSc6XG4gICAgICAgICAgICBsZXQgcHJvbWlzZUFycmF5ID0gbmVzdGVkVW5pdEluc3RhbmNlLmRhdGFzZXQubWFwKGRvY3VtZW50ID0+IHtcbiAgICAgICAgICAgICAgbGV0IGFyZ3VtZW50ID0ge31cbiAgICAgICAgICAgICAgYXJndW1lbnRbJ2RhdGFzZXQnXSA9IGRvY3VtZW50XG4gICAgICAgICAgICAgIHJldHVybiBuZXN0ZWRVbml0SW5zdGFuY2UubG9vcEluc2VydGlvblBvaW50KHsgdHlwZTogJ2FnZ3JlZ2F0ZUludG9Db250ZW50QXJyYXknLCBhcmd1bWVudCB9KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIGxldCBzdWJzZXF1ZW50RGF0YXNldEFycmF5ID0gYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZUFycmF5KVxuICAgICAgICAgICAgb2JqZWN0W3VuaXRJbnN0YW5jZS5maWVsZE5hbWVdID0gc3Vic2VxdWVudERhdGFzZXRBcnJheS5tYXAoKHN1YnNlcXVlbnREYXRhc2V0LCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5mb3JtYXREYXRhc2V0T2ZOZXN0ZWRUeXBlKHtcbiAgICAgICAgICAgICAgICBzdWJzZXF1ZW50RGF0YXNldCxcbiAgICAgICAgICAgICAgICBkYXRhc2V0OiBuZXN0ZWRVbml0SW5zdGFuY2UuZGF0YXNldFtpbmRleF0sXG4gICAgICAgICAgICAgICAgb3B0aW9uOiB7XG4gICAgICAgICAgICAgICAgICBleHRyYWZpZWxkOiBuZXN0ZWRVbml0SW5zdGFuY2UucmVxdWVzdE9wdGlvbi5leHRyYWZpZWxkLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgJ25lc3RlZCc6IC8vIGlmIGZpZWxkIHRyZWF0ZWQgYXMgYW4gb2JqZWN0IHdpdGggbmVzdGVkIGZpZWxkc1xuICAgICAgICAgICAgbGV0IHN1YnNlcXVlbnREYXRhc2V0ID0gYXdhaXQgbmVzdGVkVW5pdEluc3RhbmNlLmxvb3BJbnNlcnRpb25Qb2ludCh7IHR5cGU6ICdhZ2dyZWdhdGVJbnRvQ29udGVudEFycmF5JyB9KVxuICAgICAgICAgICAgb2JqZWN0W3VuaXRJbnN0YW5jZS5maWVsZE5hbWVdID0gdGhpcy5mb3JtYXREYXRhc2V0T2ZOZXN0ZWRUeXBlKHtcbiAgICAgICAgICAgICAgc3Vic2VxdWVudERhdGFzZXQsXG4gICAgICAgICAgICAgIGRhdGFzZXQ6IG5lc3RlZFVuaXRJbnN0YW5jZS5kYXRhc2V0LFxuICAgICAgICAgICAgICBvcHRpb246IHtcbiAgICAgICAgICAgICAgICBleHRyYWZpZWxkOiBuZXN0ZWRVbml0SW5zdGFuY2UucmVxdWVzdE9wdGlvbi5leHRyYWZpZWxkLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGNhc2UgJ25vbk5lc3RlZCc6XG4gICAgICAgICAgICAvLyBsb29waW5nIG92ZXIgbmVzdGVkIHVuaXRzIGNhbiBtYW5pcHVsYXRlIHRoZSBkYXRhIGluIGEgZGlmZmVyZW50IHdheSB0aGFuIHJlZ3VsYXIgYWdncmVnYXRpb24gaW50byBhbiBhcnJheS5cbiAgICAgICAgICAgIG9iamVjdFt1bml0SW5zdGFuY2UuZmllbGROYW1lXSA9IG5lc3RlZFVuaXRJbnN0YW5jZS5kYXRhc2V0XG5cbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cblxuICAgICAgICAvLyBkZWFsIHdpdGggcmVxdWVzdGVkIGFsbCBmaWVsZHMgd2l0aG91dCB0aGUgZmllbGQgb3B0aW9uIHdoZXJlIGV4ZWN1dGlvbiBvZiBzdWJuZXN0ZWR1bml0cyBpcyByZXF1aXJlZCB0byBtYW5pcHVsYXRlIHRoZSBkYXRhLlxuXG4gICAgICAgIHJldHVybiBvYmplY3RcbiAgICAgIH0sXG5cbiAgICAgIGZvcm1hdERhdGFzZXRPZk5lc3RlZFR5cGUoeyBzdWJzZXF1ZW50RGF0YXNldCwgZGF0YXNldCwgb3B0aW9uIH0pIHtcbiAgICAgICAgbGV0IG9iamVjdCA9IHt9XG4gICAgICAgIHN1YnNlcXVlbnREYXRhc2V0LmZvckVhY2goZmllbGQgPT4ge1xuICAgICAgICAgIG9iamVjdCA9IE9iamVjdC5hc3NpZ24ob2JqZWN0LCBmaWVsZClcbiAgICAgICAgfSlcbiAgICAgICAgaWYgKG9wdGlvbi5leHRyYWZpZWxkKSB7XG4gICAgICAgICAgLy8gZXh0cmFmaWVsZCBvcHRpb25cbiAgICAgICAgICBvYmplY3QgPSBPYmplY3QuYXNzaWduKGRhdGFzZXQsIG9iamVjdCkgLy8gb3ZlcnJpZGUgc3Vic2VxdWVudCBmaWVsZHMgYW5kIGtlZXAgdW50cmFja2VkIGZpZWxkcy5cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb2JqZWN0XG4gICAgICB9LFxuICAgIH1cblxuICAgIE9iamVjdC5rZXlzKHNlbGYpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICBzZWxmW2tleV0gPSBzZWxmW2tleV0uYmluZCh0aGlzQXJnKVxuICAgIH0sIHt9KVxuICAgIHJldHVybiBzZWxmXG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiByZXNvbHZlRGF0YXNldCh7XG4gICAgcGFyZW50UmVzdWx0ID0gbnVsbCxcbiAgICAvLyB0aGlzLmFyZ3MgLSBuZXN0ZWRVbml0IGFyZ3MgZmllbGQuXG4gIH0pIHtcbiAgICAvLyBbMl0gcmVxdWlyZSAmIGNoZWNrIGNvbmRpdGlvblxuICAgIGxldCBkYXRhc2V0XG4gICAgY29uc3QgYWxnb3JpdGhtID0gdGhpcy5maWxlLmFsZ29yaXRobSAvLyByZXNvbHZlciBmb3IgZGF0YXNldFxuICAgIHN3aXRjaCAoXG4gICAgICBhbGdvcml0aG0udHlwZSAvLyBpbiBvcmRlciB0byBjaG9vc2UgaG93IHRvIGhhbmRsZSB0aGUgYWxnb3JpdGhtIChhcyBhIG1vZHVsZSA/IGEgZmlsZSB0byBiZSBpbXBvcnRlZCA/Li4uKVxuICAgICkge1xuICAgICAgY2FzZSAnZmlsZSc6XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB7XG4gICAgICAgICAgbGV0IG1vZHVsZSA9IHJlcXVpcmUoYWxnb3JpdGhtLnBhdGgpLmRlZmF1bHRcbiAgICAgICAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ2Z1bmN0aW9uJykgbW9kdWxlID0gbW9kdWxlLmRlZmF1bHQgLy8gY2FzZSBlczYgbW9kdWxlIGxvYWRlZCB3aXRoIHJlcXVpcmUgZnVuY3Rpb24gKHdpbGwgbG9hZCBpdCBhcyBhbiBvYmplY3QpXG4gICAgICAgICAgbGV0IHJlc29sdmVyID0gbW9kdWxlKCkgLyppbml0aWFsIGV4ZWN1dGUgZm9yIHNldHRpbmcgcGFyYW1ldGVyIGNvbnRleHQuKi9cbiAgICAgICAgICBsZXQgcmVzb2x2ZXJBcmd1bWVudCA9IE9iamVjdC5hc3NpZ24oLi4uW3RoaXMuYXJncywgYWxnb3JpdGhtLmFyZ3VtZW50XS5maWx0ZXIoQm9vbGVhbikpIC8vIHJlbW92ZSB1bmRlZmluZWQvbnVsbC9mYWxzZSBvYmplY3RzIGJlZm9yZSBtZXJnaW5nLlxuICAgICAgICAgIGRhdGFzZXQgPSBhd2FpdCByZXNvbHZlcih7XG4gICAgICAgICAgICBwb3J0Q2xhc3NJbnN0YW5jZTogdGhpcy5wb3J0QXBwSW5zdGFuY2UsIC8vIGNvbnRhaW5zIGFsc28gcG9ydENsYXNzSW5zdGFuY2UuY29udGV4dCBvZiB0aGUgcmVxdWVzdC5cbiAgICAgICAgICAgIGFyZ3M6IHJlc29sdmVyQXJndW1lbnQsXG4gICAgICAgICAgICBwYXJlbnRSZXN1bHQsIC8vIHBhcmVudCBkYXRhc2V0IHJlc3VsdC5cbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGFzZXRcbiAgfVxufVxuIl19