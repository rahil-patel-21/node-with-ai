import * as ts from 'typescript';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface CodeChunk {
  name: string;
  kind:
    | 'function'
    | 'class'
    | 'component'
    | 'interface'
    | 'type'
    | 'enum'
    | 'variable';
  code: string;
  filepath: string;
  startLine: number;
  endLine: number;
}

export async function extractCodeChunksFromFile(
  filePath: string,
): Promise<CodeChunk[]> {
  const fileContent = await fs.readFile(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.ESNext,
    true,
  );
  const chunks: CodeChunk[] = [];
  const filepath = path.relative(process.cwd(), filePath);

  function visit(node: ts.Node) {
    const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(
      node.getStart(),
    );
    const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(
      node.getEnd(),
    );
    const code = node.getFullText(sourceFile).trim();

    // Function declarations
    if (ts.isFunctionDeclaration(node) && node.name) {
      chunks.push({
        name: node.name.getText(),
        kind: 'function',
        code,
        filepath,
        startLine: startLine + 1,
        endLine: endLine + 1,
      });
    }

    // Class declarations
    else if (ts.isClassDeclaration(node) && node.name) {
      chunks.push({
        name: node.name.getText(),
        kind: 'class',
        code,
        filepath,
        startLine: startLine + 1,
        endLine: endLine + 1,
      });
    }

    // Interface declarations
    else if (ts.isInterfaceDeclaration(node)) {
      chunks.push({
        name: node.name.getText(),
        kind: 'interface',
        code,
        filepath,
        startLine: startLine + 1,
        endLine: endLine + 1,
      });
    }

    // Type aliases
    else if (ts.isTypeAliasDeclaration(node)) {
      chunks.push({
        name: node.name.getText(),
        kind: 'type',
        code,
        filepath,
        startLine: startLine + 1,
        endLine: endLine + 1,
      });
    }

    // Enums
    else if (ts.isEnumDeclaration(node)) {
      chunks.push({
        name: node.name.getText(),
        kind: 'enum',
        code,
        filepath,
        startLine: startLine + 1,
        endLine: endLine + 1,
      });
    }

    // Exported variable declarations (e.g., const Component = ...)
    else if (
      ts.isVariableStatement(node) &&
      node.declarationList.declarations.length > 0
    ) {
      for (const declaration of node.declarationList.declarations) {
        const name = declaration.name.getText(sourceFile);
        const initializer = declaration.initializer;

        if (
          ts.isArrowFunction(initializer) ||
          ts.isFunctionExpression(initializer)
        ) {
          const isComponent = /^[A-Z]/.test(name); // PascalCase = likely React
          chunks.push({
            name,
            kind: isComponent ? 'component' : 'function',
            code,
            filepath,
            startLine: startLine + 1,
            endLine: endLine + 1,
          });
        } else if (
          ts.isObjectLiteralExpression(initializer) ||
          ts.isArrayLiteralExpression(initializer)
        ) {
          chunks.push({
            name,
            kind: 'variable',
            code,
            filepath,
            startLine: startLine + 1,
            endLine: endLine + 1,
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return chunks;
}
