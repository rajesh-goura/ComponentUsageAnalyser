import { globSync } from 'fast-glob';
import path from 'path';
import colors from 'yoctocolors';

import { trackComponentUsages } from './usage-tracker';
import { trackImports } from './import-tracker';
import { collectComponents } from './component-collector';

import { Component, TrackerMaps, createTrackerMaps } from '../types/types';

/// Scans a React/React Native codebase for components and their usage
export function scanComponents(rootPath: string, projectRoot: string) {
  const absoluteRootPath = path.resolve(rootPath);
  const files = globSync([
    `${absoluteRootPath}/**/*.{jsx,tsx}`,
    '!**/node_modules/**',
    '!**/*.d.ts'
  ]);

  const components: Component[] = [];
  const trackerMaps: TrackerMaps = createTrackerMaps();

  // First pass: collect all components
  files.forEach((file) => {
    try {
      const fileComponents = collectComponents(file).map(comp => ({
        ...comp,
        file: path.relative(projectRoot, comp.file),
        usageCount: 0 // Initialize usage count
      }));
      components.push(...fileComponents);
    } catch (error) {
      console.warn(colors.red(`Error parsing ${file}: ${error instanceof Error ? error.message : String(error)}`));
    }
  });

  // Second pass: track usages and imports
  files.forEach((file) => {
    try {
      trackComponentUsages(file, trackerMaps);
      trackImports(file, trackerMaps);
    } catch (error) {
      console.warn(colors.red(`Error parsing ${file}: ${error instanceof Error ? error.message : String(error)}`));
    }
  });

  // Mark components as used and track usage locations
  components.forEach(comp => {
    const usageLocations = trackerMaps.componentUsages.get(comp.name) || new Set();
    const importLocations = trackerMaps.importedComponents.get(comp.name) || new Set();

    // Calculate total usage count
    comp.usageCount = usageLocations.size + importLocations.size;
    
    // Only mark as used if actually used or imported
    comp.isUsed = comp.usageCount > 0;
    
    // Add usage information if available
    if (comp.isUsed) {
      comp.usedIn = [
        ...usageLocations,
        ...importLocations
      ]
      .map(location => path.relative(projectRoot, location))
      .filter((value, index, self) => 
        self.indexOf(value) === index
      );
    }
  });

  return components;
}