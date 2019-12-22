import path from 'path'
import assert from 'assert'
import { exec, execSync, spawn, spawnSync } from 'child_process'

// Execute task script in the same process (nodejs childprocess.execSync) using a reference scriptPath property. -  Relies on function reference concept.
export async function executeShellscriptFile({ stageNode, processNode, graph = this, nextProcessData }, { additionalParameter, traverseCallContext }) {
  let message = ` _____                          _        
  | ____|__  __ ___   ___  _   _ | |_  ___ 
  |  _|  \\ \\/ // _ \\ / __|| | | || __|/ _ \\
  | |___  >  <|  __/| (__ | |_| || |_|  __/    
  |_____|/_/\\_\\\\___| \\___| \\__,_| \\__|\\___|`

  let scriptPath = await graph.traverserInstruction.resourceResolution.resolveResource({ targetNode: processNode, graph, contextPropertyName: 'fileContext' })

  try {
    console.log(message)
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
