import { globSync } from 'fast-glob';
import path from 'path';
import colors from 'yoctocolors';
import { performance } from 'perf_hooks';

import { trackComponentUsages } from './usage-tracker';
import { trackImports } from './import-tracker';
import { collectComponents } from './component-collector';
import { Component, TrackerMaps, createTrackerMaps } from '../types/types';
import { markExpoRouterUsages } from './expoRouterHelpr';
import { trackExpoScreens } from './expoScreenDecl';


interface ScanResult {
  components: Component[];
  stats: {
    globTime: number;
    processTime: number;
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

  let parseStart: number;
  let analysisStart: number;

  const globStart = performance.now();
  const files = globSync([
    `${absoluteRootPath}/**/*.{jsx,tsx,js,ts}`,
    '!**/node_modules/**',
    '!**/*.d.ts',
    '!**/android/**',
    '!**/ios/**',
    '!**/build/**',
    '!**/dist/**',
    '!**/.next/**',
    '!**/.expo/**',
  ], {
    stats: false,
    absolute: true,
    ignore: [
      '**/node_modules/**',
      '**/android/**',
      '**/ios/**',
      '**/build/**',
      '**/dist/**',
      '**/.next/**',
      '**/.expo/**',
      '**/*.d.ts',
    ]
  });
  const globTime = performance.now() - globStart;

  const components: Component[] = [];
  const trackerMaps: TrackerMaps = createTrackerMaps();

  // First pass: collect all components
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

  parseResults.forEach(({ file, components: fileComponents }) => {
    components.push(...fileComponents.map(comp => ({
      ...comp,
      file: path.relative(projectRoot, file),
      usageCount: 0,
      isUsed: false,
      usedIn: []
    })));
  });

  // Mark implicit Expo Router components
  markExpoRouterUsages(components);

  const parseTime = performance.now() - parseStart;

  // Second pass: track usages and imports
  analysisStart = performance.now();
  files.forEach(file => {
    try {
      trackComponentUsages(file, trackerMaps);
      trackImports(file, trackerMaps);
      trackExpoScreens(file, components);
    } catch (error) {
      console.warn(colors.red(`Error analyzing ${file}: ${error instanceof Error ? error.message : String(error)}`));
    }
  });
  const analysisTime = performance.now() - analysisStart;

  // Process usage data
  const processStart = performance.now();
  components.forEach(comp => {
    const usageLocations = trackerMaps.componentUsages.get(comp.name) || new Set();
    const importLocations = trackerMaps.importedComponents.get(comp.name) || new Set();

    const newUsageCount = usageLocations.size + importLocations.size;
    comp.usageCount += newUsageCount;
    comp.isUsed = comp.usageCount > 0;

    const newUsedIn = Array.from(new Set([
      ...Array.from(usageLocations),
      ...Array.from(importLocations)
    ])).map(location => path.relative(projectRoot, location));

    comp.usedIn = Array.from(new Set([...(comp.usedIn || []), ...newUsedIn]));
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

// Display performance metrics
export function displayPerformanceStats(stats: ScanResult['stats']) {
  console.log(colors.bold('\nScan Summary:'));
  console.log(colors.blue('----------------------------------------'));
  console.log(`Total files processed: ${colors.green(stats.totalFiles.toString())}`);
  console.log(`Total components found: ${colors.green(stats.totalComponents.toString())}`);
  console.log(`Used components: ${colors.green(stats.usedComponents.toString())}`);
  console.log(`Unused components: ${colors.green(stats.unusedComponents.toString())}`);
  console.log(colors.bold('\nScan Performance Metrics:'));
  console.log(colors.blue('----------------------------------------'));
  console.log(`File globbing time: ${colors.yellow(stats.globTime.toFixed(2))}ms`);
  console.log(`Component parsing time: ${colors.yellow(stats.parseTime.toFixed(2))}ms`);
  console.log(`Usage analysis time: ${colors.yellow(stats.analysisTime.toFixed(2))}ms`);
  console.log(`Data processing time: ${colors.yellow(stats.processTime.toFixed(2))}ms`);
  console.log(colors.bold(`Total scan time: ${colors.green(stats.scanTime.toFixed(2))}ms`));
  console.log(colors.blue('----------------------------------------'));
}
