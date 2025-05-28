import { globSync } from 'fast-glob';
import { readFileSync } from 'fs';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

export function scanComponents(path: string) {
  // 1. Find all React files
  const files = globSync([
    `${path}/**/*.{js,jsx,ts,tsx}`,
    '!**/node_modules/**'
  ]);

  // 2. Parse each file and extract components
  const components: { name: string; file: string }[] = [];
  
  files.forEach((file) => {
    const content = readFileSync(file, 'utf-8');
    const ast = parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });

    traverse(ast, {
      // Detect function components
      FunctionDeclaration(path) {
        if (path.node.id?.name.match(/^[A-Z]/)) {
          components.push({
            name: path.node.id.name,
            file: file
          });
        }
      },
      // Detect arrow function components
      VariableDeclarator(path) {
        if (
          path.node.id.type === 'Identifier' &&
          path.node.id.name.match(/^[A-Z]/) &&
          path.node.init?.type === 'ArrowFunctionExpression'
        ) {
          components.push({
            name: path.node.id.name,
            file: file
          });
        }
      }
    });
  });

  return components;
}