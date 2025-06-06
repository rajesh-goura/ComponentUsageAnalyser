import { globSync } from 'fast-glob';
import path from 'path';
import { Component, TrackerMaps, createTrackerMaps } from './types';
import { collectComponents } from './component-collector';
import { trackComponentUsages } from './usage-tracker';
import { trackImports } from './import-tracker';
import colors from 'yoctocolors';

export function scanComponents(rootPath: string, projectRoot: string): Component[] {
  const absoluteRootPath = path.resolve(rootPath);
  const files = globSync([
    `${absoluteRootPath}/**/*.{jsx,tsx}`,
    '!**/node_modules/**',
    '!**/*.d.ts'
  ]);

  const components: Component[] = [];
  const trackerMaps = createTrackerMaps();

  // First pass: collect components
  for (const file of files) {
    try {
      const fileComponents = collectComponents(file).map(comp => ({
        ...comp,
        file: path.relative(projectRoot, comp.file),
        usageCount: 0,
        isUsed: false
      }));
      components.push(...fileComponents);
    } catch (error) {
      console.warn(colors.red(`Error parsing ${file}: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  // Second pass: track usages
  for (const file of files) {
    try {
      trackComponentUsages(file, trackerMaps);
      trackImports(file, trackerMaps);
    } catch (error) {
      console.warn(colors.red(`Error parsing ${file}: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  // Mark components as used
  for (const comp of components) {
    const usageLocations = trackerMaps.componentUsages.get(comp.name) || new Set();
    const importLocations = trackerMaps.importedComponents.get(comp.name) || new Set();

    comp.usageCount = usageLocations.size + importLocations.size;
    comp.isUsed = comp.usageCount > 0;

    if (comp.isUsed) {
      comp.usedIn = Array.from(new Set([
        ...Array.from(usageLocations),
        ...Array.from(importLocations)
      ])).map(loc => path.relative(projectRoot, loc));
    }
  }

  return components;
}