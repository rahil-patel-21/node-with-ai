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
