import path from 'path'
import assert from 'assert'

/**
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

  // TODO: deal with post rendering processing algorithms, when required.
  // TODO: deal with wrapping layouts e.g. layoutElement: 'webapp-layout-list'
 */
export const templateRenderingWithInseritonPosition = async ({ stageNode, processNode, graph = this, nextProcessData }, { additionalParameter, traverseCallContext }) => {
  let context = graph.context.middlewareParameter.context
  /**
    1. Resolve resource File => filePath
    2. underscore.template(<filePath>)
    3. render template with nested nodes results.
    4. post processing (execution chain concept)
  */
  let filePath = await graph.traverserInstruction.resourceResolution.resolveResource({ targetNode: processNode, graph, contextPropertyName: 'fileContext' })

  return filePath
}
