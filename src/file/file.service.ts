// Imports
import * as fs from 'fs';
import { join } from 'path';
import * as path from 'path';
import { spawn } from 'child_process';
import { Injectable } from '@nestjs/common';

interface FileNode {
  full_pathname: string;
  children: FileNode[];
}

@Injectable()
export class FileService {
  constructor() {}

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
      if (name === 'node_modules' || name == '.next') {
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
