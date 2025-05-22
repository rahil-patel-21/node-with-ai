// Imports
import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { LLMService } from 'src/llm/llm.service';
import {
  CREATE_NEST_JS_PROJECT_PROMPT,
  CREATE_PYTHON_FAST_API_PROJECT_PROMPT,
} from 'src/constants/strings';

@Injectable()
export class ProjectService {
  constructor(private readonly llm: LLMService) {}

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

    this.buildStructureRecursively(response, rootPath);

    return { response };
  }

  // Ensure a directory exists or create it
  private ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // Recursively create folders and empty files
  private buildStructureRecursively(obj: any, basePath: string) {
    for (const key in obj) {
      const item = obj[key];
      const fullPath = path.join(basePath, item.full_pathname);

      if (item.children && Object.keys(item.children).length > 0) {
        // It's a folder
        this.ensureDirectoryExists(fullPath);
        this.buildStructureRecursively(item.children, basePath);
      } else {
        // It's a file
        if (!fs.existsSync(fullPath)) {
          fs.writeFileSync(fullPath, ''); // Create an empty file
        }
      }
    }
  }
}
