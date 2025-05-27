#!/usr/bin/env node

import { Command } from 'commander';
import { scanComponents } from '../scanner';

const program = new Command();

program
  .name('component-analyser')
  .description('Analyze React component usage')
  .version('1.0.0');

program
  .command('scan <path>')
  .description('Scan a directory for React components')
  .action((path) => {
    console.log(`Scanning ${path}...`);
    const components = scanComponents(path);
    console.log(components);
  });

program.parse(process.argv);