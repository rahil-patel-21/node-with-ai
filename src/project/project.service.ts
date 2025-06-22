// Imports
import * as fs from 'fs';
import * as path from 'path';
import {
  CREATE_NEST_JS_PROJECT_PROMPT,
  CREATE_PYTHON_FAST_API_PROJECT_PROMPT,
  NEXT_JS_SUMMARIZE_CODE_CONTENT,
} from 'src/constants/strings';
import { Injectable } from '@nestjs/common';
import { LLMService } from 'src/llm/llm.service';
import { FileService } from 'src/file/file.service';
import { SocketGateway } from 'src/socket/socket.service';
import { Document } from './../database/models/document.model';
import { RAGService } from 'src/rag/rag.service';

@Injectable()
export class ProjectService {
  constructor(
    private readonly llm: LLMService,
    private readonly rag: RAGService,
    private readonly socket: SocketGateway,
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

  async embedd(reqData) {
    const chunk_list = await this.fileService.readProjectFiles(reqData);
    const batchSize = 50;

    for (let i = 0; i < chunk_list.length; i += batchSize) {
      const batchChunks = chunk_list.slice(i, i + batchSize);
      const texts = batchChunks.map((chunk) => chunk.content);

      try {
        const embeddings = await this.llm.generateEmbeddings(texts);

        for (let j = 0; j < embeddings.length; j++) {
          const content = batchChunks[j].content.replace(/'/g, "''"); // Escape single quotes
          const metadata = JSON.stringify(
            this.cleanMetadata(batchChunks[j].metadata),
          ).replace(/'/g, "''");
          const embeddingArray = `[${embeddings[j].join(',')}]`; // Postgres vector format

          const rawQuery = `INSERT INTO documents (content, embedding, metadata)
          VALUES ('${content}', '${embeddingArray}'::vector, '${metadata}'::jsonb)`;

          await Document.sequelize.query(rawQuery);
        }

        // Optional: save embeddings to DB here
      } catch (error) {
        console.error(`❌ Failed embedding batch ${i}-${i + batchSize - 1}`);
      }
    }

    return { message: 'Embedding complete' };
  }

  cleanMetadata(obj: Record<string, any>) {
    const clean: Record<string, any> = {};

    for (const key in obj) {
      const value = obj[key];
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        value === null
      ) {
        clean[key] = value;
      }
    }

    return clean;
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

    const rag_response = await this.rag.searchAndAnswer(prompt);
    return { rag_response };

    this.socket.emitToSession('404', 'code_changes', {
      success: true,
      type: 'chat',
      content: 'Thinking ...',
    });

    // Load existing cache (if available)
    let cache = {};
    try {
      const cacheContent = await new Promise<string>((resolve, reject) => {
        fs.readFile('caching.json', 'utf-8', (err, data) => {
          if (err) return reject(err);
          resolve(data);
        });
      });
      cache = JSON.parse(cacheContent);
    } catch (err) {
      console.warn('Cache not found or unreadable, starting fresh.');
    }

    this.socket.emitToSession('404', 'code_changes', {
      success: true,
      type: 'animation',
      loading: 20,
      content: 'Checking for affected code files and directories',
    });

    const input_prompt = `Project Structure (With Summary of each file) - ${JSON.stringify(cache)}

    Instruction - Reply only in strict JSON Key name should be "files" (Array of accurate file names). No explanation. 
    Ask for minimal required files to proceed with the changes.
    Check component folder as well to map the dependency and relations
    Do not try to confirm anything from my side you can take decisions directly

    User Prompt - ${prompt}`;

    const response = await this.llm.completion({
      prompt: input_prompt,
      llm_selection: 3,
    });
    console.log({ response });
    if (response.files) {
      this.socket.emitToSession('404', 'code_changes', {
        success: true,
        type: 'animation',
        loading: 50,
        content: `Total ${response.files.length} file changes are there`,
      });

      const codeContent = await this.fileService.filesToContent(
        response.files,
        folder_path,
      );
      const input_prompt = `Based on provided file and code please make necessary changes in the code (Make necessary changes only do not break code) if any file has empty content which means file is new and empty you need to write the code in that (If required)
      
      Instruction - If there is no changes in file then do not return that file name and code content, Share response in strict json only Key names should be file name and value is code content

      Code Content - ${JSON.stringify(codeContent)}

      User Prompt - ${prompt}`;

      const code_response = await this.llm.completion({
        prompt: input_prompt,
        llm_selection: 1,
      });

      this.socket.emitToSession('404', 'code_changes', {
        success: true,
        type: 'animation',
        loading: 70,
        content: `Making file changes ...`,
      });

      await this.fileService.updateFileContents(code_response, folder_path);

      const target_files = [];
      for (const key in code_response) {
        target_files.push(key);
      }
      await this.summarizeDict({
        target_path: folder_path,
        target_files,
        llm_model: reqData.llm_model,
      });

      this.socket.emitToSession('404', 'code_changes', {
        success: true,
        type: 'animation',
        loading: 90,
        content: `Deploying the changes to vercel ...`,
      });

      this.socket.emitToSession('404', 'code_changes', {
        success: true,
        type: 'animation',
        loading: 100,
        content: `Successfully Deployed !`,
      });

      return {};
    }

    return { error: 'Error while detecting file changes ...' };
  }

  async codeBase(reqData) {
    const project_id = reqData.project_id;
    if (!project_id) {
      return { error: 'project_id is missing' };
    }

    const data = await this.fileService.fullCodeJson(project_id);

    return { success: true, data };
  }

  async summarizeDict(reqData) {
    const target_path = reqData.target_path;
    if (!target_path) {
      return { error_msg: 'Parameter target_path is missing' };
    }
    const llm_selection = reqData.llm_model;
    if (!llm_selection) {
      return { error_msg: 'Parameter llm_model is missing' };
    }
    const target_files = reqData.target_files ?? [];
    console.log({ target_files });

    const raw_content =
      await this.fileService.fullCodeWithContentJson(target_path);

    // Load existing cache (if available)
    let cache = {};
    try {
      const cacheContent = await new Promise<string>((resolve, reject) => {
        fs.readFile('caching.json', 'utf-8', (err, data) => {
          if (err) return reject(err);
          resolve(data);
        });
      });
      cache = JSON.parse(cacheContent);
    } catch (err) {
      console.warn('Cache not found or unreadable, starting fresh.');
    }

    const finalized_data = {};

    let index = 0;
    for (const key in raw_content) {
      // Sync new file changes
      if (target_files.length > 0) {
        if (!target_files.includes(key)) {
          continue;
        }
        console.log({ key });
      }

      try {
        if (cache[key] && target_files.length == 0) {
          finalized_data[key] = cache[key];
          continue;
        }

        const code_content = raw_content[key];
        let prompt = NEXT_JS_SUMMARIZE_CODE_CONTENT.replace(
          '##CODE_FILE_CONTENT##',
          code_content,
        );
        prompt = prompt.replace('#FILE_PATH##', key);

        const llm_response = await this.llm.completion({
          prompt,
          llm_selection,
        });
        finalized_data[key] = llm_response;
        cache[key] = llm_response;
        index++;

        // Save updated cache
        try {
          await new Promise<void>((resolve, reject) => {
            fs.writeFile(
              'caching.json',
              JSON.stringify(cache, null, 2),
              'utf-8',
              (err) => {
                if (err) return reject(err);
                resolve();
              },
            );
          });
        } catch (err) {
          console.error('Failed to write cache:', err.message);
        }
      } catch (error) {}
    }

    return { data: finalized_data };
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
