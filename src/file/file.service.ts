// Imports
import * as fs from 'fs';
import { join } from 'path';
import * as path from 'path';
import * as fg from 'fast-glob';
import { spawn } from 'child_process';
import { Injectable } from '@nestjs/common';
import { extractCodeChunksFromFile } from './file.extractor';

interface FileNode {
  full_pathname: string;
  children: FileNode[];
}

@Injectable()
export class FileService {
  constructor() {}

  async readProjectFiles(reqData) {
    const project_name = reqData.project_name;
    const files = await fg(['**/*.{ts,tsx,js,jsx,md,json}'], {
      cwd: `code_base/nextjs/${project_name}`,
      ignore: ['node_modules/**', '.next/**', '.git/**', 'package-lock.json'],
      absolute: true,
    });

    const projectAbsolutePath = join(
      __dirname,
      '..',
      '..',
      'code_base',
      'nextjs',
    );

    const fileContents = await Promise.all(
      files.map(async (filepath) => ({
        filetype: path.extname(filepath),
        filepath: filepath.replace(
          `${projectAbsolutePath}/${project_name}/`,
          '',
        ),
        content: await fs.promises.readFile(filepath, 'utf-8'),
      })),
    );

    if (reqData.needChunk === true) {
      const chunk_list = [];

      for (const file of files) {
        const chunks = await extractCodeChunksFromFile(file); // AST-based semantic chunking
        for (const chunk of chunks) {
          chunk_list.push({
            content: chunk.code,
            metadata: {
              name: chunk.name,
              kind: chunk.kind,
              filepath: chunk.filepath,
              startLine: chunk.startLine,
              endLine: chunk.endLine,
              project: reqData.project_name,
            },
          });
        }
      }

      return chunk_list;
    }

    return fileContents;
  }

  chunkText(content: string, maxChars = 1500): string[] {
    const lines = content.split('\n');
    const chunks: string[] = [];
    let chunk: string[] = [];

    for (const line of lines) {
      chunk.push(line);
      if (chunk.join('\n').length >= maxChars) {
        chunks.push(chunk.join('\n'));
        chunk = [];
      }
    }

    if (chunk.length > 0) chunks.push(chunk.join('\n'));
    return chunks;
  }

  async createNextJs(reqData) {
    const projectName = reqData.projectName;
    const projectAbsolutePath = join(__dirname, '..', '..');
    const folderPath = `${projectAbsolutePath}/code_base/nextjs/`;

    this.runNextJsScript(folderPath, projectName);
    return {};
  }

  async dictJson(reqData): Promise<any> {
    const folder_path = reqData.folder_path;
    if (!folder_path) {
      return { error: 'folder_path is missing' };
    }

    const projectAbsolutePath = path.join(__dirname, '..', '..');
    const dictPath = path.join(
      projectAbsolutePath,
      'code_base',
      'nextjs',
      folder_path,
    );

    if (!fs.existsSync(dictPath)) {
      return { error: 'Path does not exist' };
    }

    const buildTree = (dirPath: string) => {
      const name = path.basename(dirPath);
      const stat = fs.statSync(dirPath);

      if (stat.isFile()) {
        return { name, type: 'file' };
      }

      // Ignore node_modules directory
      if (name === 'node_modules' || name == '.next' || name == '.git') {
        return null;
      }

      const children = fs
        .readdirSync(dirPath)
        .map((child) => buildTree(path.join(dirPath, child)))
        .filter(Boolean); // Remove nulls

      return { name, type: 'folder', children };
    };

    try {
      const tree = buildTree(dictPath);
      return { data: tree };
    } catch (err) {
      console.error(err);
      return { error: 'Failed to read directory' };
    }
  }

  async fullCodeJson(
    target_path: string,
  ): Promise<Record<string, string> | { error: string }> {
    const projectAbsolutePath = path.join(__dirname, '..', '..');
    const baseDir = path.join(
      projectAbsolutePath,
      'code_base',
      'nextjs',
      target_path,
    );

    if (!fs.existsSync(baseDir)) {
      return { error: 'Path does not exist' };
    }

    const result: Record<string, string> = {};

    // Folders to exclude
    const excludeDirs = new Set(['node_modules', 'dist', '.next', '.git']);

    const readFilesRecursively = async (
      dir: string,
      relativePrefix = '',
    ): Promise<void> => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (excludeDirs.has(entry.name)) {
          continue;
        }

        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(relativePrefix, entry.name);

        if (entry.isDirectory()) {
          await readFilesRecursively(fullPath, relativePath);
        } else {
          const fileContent = await fs.promises.readFile(fullPath, 'utf-8');
          result[relativePath] = fileContent;
        }
      }
    };

    await readFilesRecursively(baseDir);

    return result;
  }

  async fullCodeWithContentJson(
    target_path: string,
  ): Promise<Record<string, string> | { error: string }> {
    const projectAbsolutePath = path.join(__dirname, '..', '..');
    const baseDir = path.join(
      projectAbsolutePath,
      'code_base',
      'nextjs',
      target_path,
    );

    if (!fs.existsSync(baseDir)) {
      return { error: 'Path does not exist' };
    }

    const result: Record<string, string> = {};

    // Directories to exclude
    const excludeDirs = new Set(['node_modules', 'dist', '.next', '.git']);

    const readFilesRecursively = async (
      dir: string,
      baseDir: string,
    ): Promise<void> => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (excludeDirs.has(entry.name)) continue;

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await readFilesRecursively(fullPath, baseDir);
        } else {
          const fileContent = await fs.promises.readFile(fullPath, 'utf-8');
          result[fullPath.replace(`${baseDir}/`, '')] = fileContent;
        }
      }
    };

    await readFilesRecursively(baseDir, baseDir);

    return result;
  }

  async filesToContent(files: string[], folder_path: string) {
    const finalizedData = {};
    for (let index = 0; index < files.length; index++) {
      const projectAbsolutePath = join(__dirname, '..', '..');
      const filePath = path.join(
        projectAbsolutePath,
        'code_base',
        'nextjs',
        folder_path,
        files[index],
      );

      // Create the file with empty content if it doesn't exist
      if (!fs.existsSync(filePath)) {
        // Ensure directory exists before writing the file
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, '', 'utf-8');
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      finalizedData[files[index]] = fileContent;
    }

    return finalizedData;
  }

  async updateFileContents(files: any, folder_path: string) {
    for (const key in files) {
      const projectAbsolutePath = join(__dirname, '..', '..');
      const filePath = path.join(
        projectAbsolutePath,
        'code_base',
        'nextjs',
        folder_path,
        key,
      );
      await fs.promises.writeFile(filePath, files[key], 'utf8');
    }
  }

  runNextJsScript(folderPath: string, name: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const script = 'bash';
      const args = ['scripts/create_nextjs.sh', folderPath, name];

      const child = spawn(script, args);

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
        console.log(`stdout: ${data}`);
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error(`stderr: ${data}`);
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(`Script exited with code ${code}: ${errorOutput}`);
        }
      });
    });
  }

  async scanDirectory(rootPath: string): Promise<FileNode[]> {
    const exceptions: string[] = ['dist', '.git', 'node_modules'];

    const getChildren = (dirPath: string): FileNode[] => {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      return entries
        .filter((entry) => !exceptions.includes(entry.name))
        .map((entry) => {
          const fullPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            return {
              full_pathname: fullPath.replace(`${rootPath}/`, ''),
              children: getChildren(fullPath),
            };
          } else {
            return {
              full_pathname: fullPath.replace(`${rootPath}/`, ''),
              children: [],
            };
          }
        });
    };

    return getChildren(rootPath);
  }
}
