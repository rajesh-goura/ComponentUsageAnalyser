import { globSync } from 'fast-glob';
import { readFileSync } from 'fs';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

export function scanComponents(path: string) {
  // Find all React files
  const files = globSync([
    `${path}/**/*.{js,jsx,ts,tsx}`,
    '!**/node_modules/**'
  ]);

  // Parse each file and extract components
  const components: { name: string; file: string }[] = [];
  
  files.forEach((file) => {
    // Read the file content
    try {
      const content = readFileSync(file, 'utf-8');
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });
      // Traverse the AST to find components
      traverse(ast, {
        FunctionDeclaration(path) {
          if (path.node.id?.name.match(/^[A-Z]/)) {
            components.push({
              name: path.node.id.name,
              file: file
            });
          }
        },
        //arrow function
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
    } catch (error) {
      // Handle errors in reading or parsing the file
      if (error instanceof Error) {
        console.warn(`Failed to parse ${file}: ${error.message}`);
      } else {
        console.warn(`Failed to parse ${file}: ${String(error)}`);
      }
    }
  });
  return components;
}