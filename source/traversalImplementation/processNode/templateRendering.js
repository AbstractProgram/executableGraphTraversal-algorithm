import path from 'path'
import assert from 'assert'
import underscore from 'underscore'
import filesystem from 'fs'

/**
  Each template subgraph represents a document, which is a collection os templates and configs rendered together.
 * @return {String} String of rendered HTML document content.
 Underscore templating options - https://2ality.com/2012/06/underscore-templates.html

  1. traverse nested
  2. aggregate into nested arrays (by insertion position keys).
  3. render current node template with insetion position content.
  4. continue processing execution chain (post-processor of result concept)

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


  1. Resolve resource File => filePath
  2. underscore.template(<filePath>)
  3. render template with nested nodes results.
  4. post processing (execution chain concept)
 */
export async function templateRenderingWithInseritonPosition({ stageNode, processNode, graph = this, nextProcessData }, { additionalParameter, traverseCallContext }) {
  assert(graph.context.templateParameter, `• Template/Document graph traversal relies on context.templateParameter on the graph context instance`)
  let argument = graph.context.templateParameter

  let resource = await graph.traverserInstruction.resourceResolution.resolveResource({ targetNode: processNode, graph, contextPropertyName: 'fileContext' })

  let filePath
  // @param TraverserState <Object> - Passing a single traverser state, allows for easier changes/refactoring to be made.
  if (typeof resource == 'function') filePath = await resource({ node: processNode, graph })
  else filePath = resource
  let fileContent = await filesystem.readFileSync(filePath, 'utf-8')

  let parsedTemplate = underscore.template(fileContent)

  const insertionAlgorithm = contentList => (/*parameterPassedFromWithinTemplateJSParts*/) => contentList.join('') // TODO: allow for insertion points to pass parameters that affect the inserted values.

  // reduce array for every nested object:
  let insert = {} // insert
  for (let key in nextProcessData /** Object of arrays */) insert[key] = insertionAlgorithm(nextProcessData[key] /*Array of contents relating to port groupKey*/)

  let renderedDocument = parsedTemplate({ insert, argument })
  return renderedDocument
}
