import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { readFileSync } from 'fs';
import { Component } from '../types/types';



// Function to collect components from a given file
export function collectComponents(file: string): Component[] {
  const components: Component[] = [];
  const content = readFileSync(file, 'utf-8');
  const ast = parse(content, {
    sourceType: 'module',
    plugins: [
      'jsx',
      'typescript',
      'decorators-legacy',
      'classProperties'
    ]
  });

  traverse(ast, {
    // Component definitions
    FunctionDeclaration(path) {
      if (path.node.id?.name.match(/^[A-Z]/)) {
        components.push({
          name: path.node.id.name,
          file,
          isUsed: false,
          usageCount: 0 // Initialize usage count
        });
      }
    },

    VariableDeclarator(path) {
      if (
        path.node.id.type === 'Identifier' &&
        path.node.id.name.match(/^[A-Z]/) &&
        (path.node.init?.type === 'ArrowFunctionExpression' ||
          path.node.init?.type === 'FunctionExpression')
      ) {
        components.push({
          name: path.node.id.name,
          file,
          isUsed: false,
          usageCount: 0 // Initialize usage count
        });
      }
    },

    ClassDeclaration(path) {
      if (path.node.id?.name.match(/^[A-Z]/)) {
        components.push({
          name: path.node.id.name,
          file,
          isUsed: false,
          usageCount: 0 // Initialize usage count
        });
      }
    }
  });

  return components;
}