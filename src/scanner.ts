import { globSync } from 'fast-glob';
import path from 'path';
import { Component, TrackerMaps, createTrackerMaps } from './types';
import { collectComponents } from './component-collector';
import { trackComponentUsages } from './usage-tracker';
import { trackImports } from './import-tracker';

export function scanComponents(rootPath: string) {
  const files = globSync([
    `${rootPath}/**/*.{jsx,tsx}`,
    '!**/node_modules/**',
    '!**/*.d.ts'
  ]);

  const components: Component[] = [];
  const trackerMaps = createTrackerMaps();

  // First pass: collect all components
  files.forEach((file) => {
    try {
      const fileComponents = collectComponents(file);
      components.push(...fileComponents);
    } catch (error) {
      console.warn(`Error parsing ${file}:`, error instanceof Error ? error.message : String(error));
    }
  });

  // Second pass: track usages and imports
  files.forEach((file) => {
    try {
      trackComponentUsages(file, trackerMaps);
      trackImports(file, trackerMaps);
    } catch (error) {
      console.warn(`Error parsing ${file}:`, error instanceof Error ? error.message : String(error));
    }
  });

  // Mark components as used and track usage locations
  components.forEach(comp => {
    const fileName = path.basename(comp.file, path.extname(comp.file));
    const usageLocations = trackerMaps.componentUsages.get(comp.name) || new Set();
    const importLocations = trackerMaps.importedComponents.get(comp.name) || new Set();

    // Only mark as used if:
    // 1. Actually used in JSX/HOC/Navigation, or
    // 2. Imported explicitly (and not just defined)
    comp.isUsed = usageLocations.size > 0 || importLocations.size > 0;
    
    // Add usage information if available
    if (comp.isUsed) {
      comp.usedIn = [
        ...usageLocations,
        ...importLocations
      ].filter((value, index, self) => 
        self.indexOf(value) === index
      );
    }
  });

  return components;
}