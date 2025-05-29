import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { readFileSync } from 'fs';
import { TrackerMaps } from './types';

export function trackComponentUsages(file: string, trackerMaps: TrackerMaps) {
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
    // Component usages in JSX
    JSXIdentifier(path) {
      if (path.node.name.match(/^[A-Z][a-zA-Z0-9]*$/)) {
        if (!trackerMaps.componentUsages.has(path.node.name)) {
          trackerMaps.componentUsages.set(path.node.name, new Set());
        }
        trackerMaps.componentUsages.get(path.node.name)?.add(file);
      }
    },

    // React Navigation patterns
    MemberExpression(path) {
      if (
        path.node.property.type === 'Identifier' &&
        path.node.property.name === 'component' &&
        path.parentPath.isObjectProperty() &&
        path.parentPath.node.value.type === 'Identifier'
      ) {
        const componentName = path.parentPath.node.value.name;
        if (!trackerMaps.componentUsages.has(componentName)) {
          trackerMaps.componentUsages.set(componentName, new Set());
        }
        trackerMaps.componentUsages.get(componentName)?.add(file);
      }
    },

    // HOC patterns
    CallExpression(path) {
      const callee = path.node.callee;
      const isHOC = (
        (callee.type === 'Identifier' && callee.name.match(/^(with|connect)[A-Z]/)) ||
        (callee.type === 'MemberExpression' && 
          callee.property.type === 'Identifier' &&
          callee.property.name === 'connect')
      );

      if (isHOC && path.node.arguments.length > 0) {
        const arg = path.node.arguments[0];
        if (arg.type === 'Identifier') {
          const componentName = arg.name;
          if (!trackerMaps.componentUsages.has(componentName)) {
            trackerMaps.componentUsages.set(componentName, new Set());
          }
          trackerMaps.componentUsages.get(componentName)?.add(file);
        }
      }
    }
  });
}