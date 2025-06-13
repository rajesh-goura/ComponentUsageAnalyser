import { globSync } from 'fast-glob';
import path from 'path';
import colors from 'yoctocolors';
import { performance } from 'perf_hooks';

import { trackComponentUsages } from './usage-tracker';
import { trackImports } from './import-tracker';
import { collectComponents } from './component-collector';
import { Component, TrackerMaps, createTrackerMaps } from '../types/types';

interface ScanResult {
  components: Component[];
  stats: {
    globTime: any;
    processTime: any;
    totalFiles: number;
    totalComponents: number;
    usedComponents: number;
    unusedComponents: number;
    scanTime: number;
    parseTime: number;
    analysisTime: number;
  };
}

/// Scans a React/React Native codebase for components and their usage
export function scanComponents(rootPath: string, projectRoot: string): ScanResult {
  const startTime = performance.now();
  const absoluteRootPath = path.resolve(rootPath);
  
  // Track individual phases
  let parseStart: number;
  let analysisStart: number;
  
  // Get files with timing
  const globStart = performance.now();
  const files = globSync([
    `${absoluteRootPath}/**/*.{jsx,tsx}`,
    '!**/node_modules/**',
    '!**/*.d.ts'
  ], {
    stats: false, // Disable stats for faster globbing
    absolute: true, // Get absolute paths directly
    ignore: ['**/node_modules/**'] // More efficient ignore
  });
  const globTime = performance.now() - globStart;

  const components: Component[] = [];
  const trackerMaps: TrackerMaps = createTrackerMaps();

  // First pass: collect all components (parallel processing)
  parseStart = performance.now();
  const parseResults = files.map(file => {
    try {
      return {
        file,
        components: collectComponents(file)
      };
    } catch (error) {
      console.warn(colors.red(`Error parsing ${file}: ${error instanceof Error ? error.message : String(error)}`));
      return { file, components: [] };
    }
  });
  
  // Flatten and process components
  parseResults.forEach(({ file, components: fileComponents }) => {
    components.push(...fileComponents.map(comp => ({
      ...comp,
      file: path.relative(projectRoot, file),
      usageCount: 0,
      isUsed: false,
      usedIn: []
    })));
  });
  const parseTime = performance.now() - parseStart;

  // Second pass: track usages and imports (parallel processing)
  analysisStart = performance.now();
  files.forEach(file => {
    try {
      // Process both tracking functions in the same file pass
      const usages = trackComponentUsages(file, trackerMaps);
      const imports = trackImports(file, trackerMaps);
      
      // If you need to do something with usages/imports here
    } catch (error) {
      console.warn(colors.red(`Error analyzing ${file}: ${error instanceof Error ? error.message : String(error)}`));
    }
  });
  const analysisTime = performance.now() - analysisStart;

  // Process component usage data
  const processStart = performance.now();
  components.forEach(comp => {
    const usageLocations = trackerMaps.componentUsages.get(comp.name) || new Set();
    const importLocations = trackerMaps.importedComponents.get(comp.name) || new Set();

    comp.usageCount = usageLocations.size + importLocations.size;
    comp.isUsed = comp.usageCount > 0;
    
    if (comp.isUsed) {
      comp.usedIn = Array.from(new Set([
        ...Array.from(usageLocations),
        ...Array.from(importLocations)
      ])).map(location => path.relative(projectRoot, location));
    }
  });
  const processTime = performance.now() - processStart;

  const totalTime = performance.now() - startTime;

  return {
    components,
    stats: {
      totalFiles: files.length,
      totalComponents: components.length,
      usedComponents: components.filter(c => c.isUsed).length,
      unusedComponents: components.filter(c => !c.isUsed).length,
      scanTime: totalTime,
      parseTime,
      analysisTime,
      globTime,
      processTime
    }
  };
}

// Utility function to display performance results
export function displayPerformanceStats(stats: ScanResult['stats']) {
  console.log(colors.bold('\nScan Performance Metrics:'));
  console.log(colors.blue('----------------------------------------'));
  console.log(`Total files processed: ${colors.green(stats.totalFiles.toString())}`);
  console.log(`Total components found: ${colors.green(stats.totalComponents.toString())}`);
  console.log(`Used components: ${colors.green(stats.usedComponents.toString())}`);
  console.log(`Unused components: ${colors.green(stats.unusedComponents.toString())}`);
  console.log(colors.blue('----------------------------------------'));
  console.log(`File globbing time: ${colors.yellow(stats.globTime.toFixed(2))}ms`);
  console.log(`Component parsing time: ${colors.yellow(stats.parseTime.toFixed(2))}ms`);
  console.log(`Usage analysis time: ${colors.yellow(stats.analysisTime.toFixed(2))}ms`);
  console.log(`Data processing time: ${colors.yellow(stats.processTime.toFixed(2))}ms`);
  console.log(colors.bold(`Total scan time: ${colors.green(stats.scanTime.toFixed(2))}ms`));
  console.log(colors.blue('----------------------------------------'));
}
