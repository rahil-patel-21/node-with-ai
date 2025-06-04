// Imports
import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { LLMService } from 'src/llm/llm.service';
import {
  CREATE_NEST_JS_PROJECT_PROMPT,
  CREATE_PYTHON_FAST_API_PROJECT_PROMPT,
} from 'src/constants/strings';
import { FileService } from 'src/file/file.service';

@Injectable()
export class ProjectService {
  constructor(
    private readonly llm: LLMService,
    private readonly fileService: FileService,
  ) {}

  async create(reqData) {
    const backend = reqData.backend;
    if (!['NestJs', 'FastApi'].includes(backend)) {
      return { error: 'Invalid backend value' };
    }

    const id = reqData.id;
    if (!id) return { error: 'Missing id' };

    const sessionId = '123';
    const prompt =
      backend == 'NestJs'
        ? CREATE_NEST_JS_PROJECT_PROMPT
        : CREATE_PYTHON_FAST_API_PROJECT_PROMPT;
    const response = await this.llm.completion({ prompt, sessionId });

    const rootPath = path.join('code_base', id);
    this.ensureDirectoryExists(rootPath);

    await this.buildStructureRecursively(response, rootPath, prompt);

    return { response };
  }

  async promptToFiles(reqData) {
    const prompt = reqData.prompt;
    const folder_path = reqData.folder_path;
    if (!prompt) {
      return { error: 'prompt' };
    }
    if (!folder_path) {
      return { error: 'folder_path' };
    }

    let dictJson = await this.fileService.dictJson({ folder_path });
    dictJson = dictJson.data;

    const input_prompt = `Project Structure - ${JSON.stringify(dictJson)}

    Instruction - Reply only in JSON Key name should be "files" (Array of accurate file names). No explanation. Ask for minimal required files to proceed with the changes. 

    User Prompt - ${prompt}`;

    const response = await this.llm.completion({ prompt: input_prompt });
    if (response.files) {
      const codeContent = await this.fileService.filesToContent(
        response.files,
        folder_path,
      );
      const input_prompt = `Based on provided file and code please make necessary changes in the code (Make necessary changes only do not break code) if any file has empty content which means file is new and empty you need to write the code in that (If required)
      
      Instruction - If there is no changes in file then do not return that file name and code content, Share response in strict json only Key names should be file name and value is code content

      Code Content - ${JSON.stringify(codeContent)}

      User Prompt - ${prompt}`;

      const code_response = await this.llm.completion({ prompt: input_prompt });

      await this.fileService.updateFileContents(code_response, folder_path);

      return {};
    }

    return { error: 'Error while detecting file changes ...' };
  }

  // Ensure a directory exists or create it
  private ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // Recursively create folders and empty files
  private async buildStructureRecursively(
    obj: any,
    basePath: string,
    prompt: string,
  ) {
    for (const key in obj) {
      const item = obj[key];
      const fullPath = path.join(basePath, item.full_pathname);

      if (item.children && Object.keys(item.children).length > 0) {
        // It's a folder
        this.ensureDirectoryExists(fullPath);
        await this.buildStructureRecursively(item.children, basePath, prompt);
      } else {
        // It's a file
        if (!fs.existsSync(fullPath)) {
          fs.writeFileSync(fullPath, ''); // Create an empty file
          const response = await this.llm.completion({
            prompt: `Prompt - ${prompt} 
            Based on the above prompt i have created the code structure
            share me code content for below file ${item.full_pathname}
            
            Note - Do not explain anything just share the code content just in string or text format which i directly can copy and paste in the file and works properly.
            
            Share response in json only and key should be "code_content"`,
          });
          if (response.code_content) {
            fs.writeFileSync(fullPath, response.code_content);
          } else {
            const sanitized_response = this.llm.sanitizeJsonResponse(response);
            if (sanitized_response) {
              fs.writeFileSync(fullPath, sanitized_response);
              console.log('Wrote with sanitize', fullPath);
            } else console.log('Bad response');
          }
        }
      }
    }
  }
}
