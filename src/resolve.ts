import { exec } from 'child_process';
import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 } from 'uuid';
import { Catalog, Profile } from './types.js';
import inquirer from 'inquirer';
import { executeOscalCliCommand, installOscalCli, installOscalExecutor, isOscalExecutorInstalled } from './env.js';
import { detectOscalDocumentType,  OscalExecutorOptions } from './utils.js';

const execAsync = promisify(exec);
export type OscalResolveOptions = {
  outputFormat: 'json'|'yaml'|'xml'|'yml',
} 

export async function resolveProfile(
  document: Profile,
): Promise<Catalog|undefined> {  

  const tempFile = path.join(process.cwd(), `oscal-cli-tmp-input-${v4()}.json`);
  const tempOutput = path.join(process.cwd(), `oscal-cli-tmp-output-${v4()}.json`);

  try {
    writeFileSync(tempFile, JSON.stringify(document));
    
    const args = ["--to=JSON", tempFile, tempOutput, '--show-stack-trace'];
    await executeOscalCliCommand("resolve-profile", args);
    
    const result = JSON.parse(readFileSync(tempOutput, 'utf-8'));
    return result as Catalog;
  } catch (error) {
    console.error("Error resolving profile:", error);
    return undefined;
  } finally {
    // Clean up temporary files
    try {
      if (tempFile) {
        unlinkSync(tempFile);
      }
      if (tempOutput) {
        unlinkSync(tempOutput);
      }
    } catch (cleanupError) {
      console.error("Error cleaning up temporary files:", cleanupError);
    }
  }
}

export async function resolveProfileDocument(
  filePath: string,options:OscalResolveOptions={outputFormat:'xml'},executor:OscalExecutorOptions='oscal-server'): Promise<Catalog|undefined> {
  const tempOutput = path.join(process.cwd(), `oscal-cli-tmp-output-${v4()}.json`);
  try {
    const args = ["--to=JSON", filePath, tempOutput, '--show-stack-trace'];
    await executeOscalCliCommand("resolve-profile", args);
    
    const result = JSON.parse(readFileSync(tempOutput, 'utf-8'));
    return result as Catalog;
  } catch (error) {
    console.error("Error resolving profile from file:", error);
    return undefined;
  } finally {
    try {
      if (tempOutput) {
        unlinkSync(tempOutput);
      }
    } catch (cleanupError) {
      console.error("Error cleaning up temporary output file:", cleanupError);
    }
  }
}

export async function resolveProfileServerFromFile(
  filePath: string,executor:OscalExecutorOptions='oscal-cli'

): Promise<Catalog|undefined> {
  let oscalExecutorInstalled = await isOscalExecutorInstalled(executor);

  if (!oscalExecutorInstalled) {
    try {
      await installOscalExecutor(executor);
      oscalExecutorInstalled = true;
    } catch (error) {
      console.error("Error installing CLI:", error);
      return undefined;
    }
  }

  const tempOutput = path.join(process.cwd(), `oscal-cli-tmp-output-${v4()}.json`);

  try {
    const args = ["--to=JSON", filePath, tempOutput, '--show-stack-trace'];
    await executeOscalCliCommand("resolve-profile", args);
    
    const result = JSON.parse(readFileSync(tempOutput, 'utf-8'));
    return result as Catalog;
  } catch (error) {
    console.error("Error resolving profile from file:", error);
    return undefined;
  } finally {
    try {
      if (tempOutput) {
        unlinkSync(tempOutput);
      }
    } catch (cleanupError) {
      console.error("Error cleaning up temporary output file:", cleanupError);
    }
  }
}

export const resolveProfileCommand=async (fileArg,options: { file?: string; output?: string }) => {
  let { file, output } = options;
  file = fileArg ||file
  if (!file) {
    const answer = await inquirer.prompt<{ file: string }>([{
      type: 'input',
      name: 'file',
      message: 'Enter the path to the OSCAL profile document:',
      validate: (input: string) => input.trim() !== '' ? true : 'This field is required'
    }]);
    file = answer.file;
  }

  if (!output) {
    const answer = await inquirer.prompt<{ output: string }>([{
      type: 'input',
      name: 'output',
      message: 'Enter the path for the resolved output file:',
      validate: (input: string) => input.trim() !== '' ? true : 'This field is required'
    }]);
    output = answer.output;
  }

  console.log('Resolving OSCAL profile:', file);

  try {
    const [_, fileType] = await detectOscalDocumentType(file);

    // Determine output file type
    const outputFileType = path.extname(output).toLowerCase().slice(1);
    const validOutputTypes = ['json', 'xml', 'yaml'];
    const outputType = validOutputTypes.includes(outputFileType) ? outputFileType : fileType;

    const args = ["--to=" + outputType, file, output, "--overwrite","--show-stack-trace"];
    const [result, errors] = await executeOscalCliCommand("resolve-profile", args);

    if (errors) {
      console.error('Errors during profile resolution:', errors);
    } else {
      console.log('Profile successfully resolved. Output saved to:', output);
      console.log(result);
    }
  } catch (error) {
    console.error('Error resolving OSCAL profile:', error);
    process.exit(1);
  }
}