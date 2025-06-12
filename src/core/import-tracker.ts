import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { readFileSync } from 'fs';
import { TrackerMaps } from '../types/types';

export function trackImports(file: string, trackerMaps: TrackerMaps) {
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
    // Import tracking
    ImportDeclaration(path) {
      const importPath = path.node.source.value;
      if (typeof importPath !== 'string') return;

      path.node.specifiers.forEach(spec => {
        if (spec.type === 'ImportDefaultSpecifier' || 
            spec.type === 'ImportSpecifier') {
          const componentName = spec.local.name;
          if (!trackerMaps.importedComponents.has(componentName)) {
            trackerMaps.importedComponents.set(componentName, new Set());
          }
          trackerMaps.importedComponents.get(componentName)?.add(file);
        }
      });
    }
  });
}