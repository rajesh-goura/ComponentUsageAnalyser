#!/usr/bin/env node

/**
 * CUA Tool - Component Usage Analyzer CLI
 *
 * A CLI utility for scanning React/React Native codebases
 * to analyze component usage or list relevant source files.
 * version 1.0.0
 **/

import { Command } from "commander"
const figlet = require("figlet");
import path from "path";
import { scanComponents } from "../scanner";

// Initializing CLI tool
const program = new Command();

// Displaying the tool name in ASCII art
console.log(figlet.textSync("CUA Tool"));

// Setting up command line options
program
  .version("1.0.0")
  .description("CLI tool for React/React Native component usage analysis")
  .option("-a, --analyze <path>", "Scans a React/React Native codebase for component usage")
  .option("-g, --getFiles <path>", "Scans a React/React Native codebase for relevant source files")
  .parse(process.argv);

// Accessing the parsed options
const options = program.opts();

// Handling the 'getFiles' option
if (options.analyze) {
  const components = scanComponents(options.analyze);
  if (components.length === 0) {
    console.log('No components found in the specified path.');
  } else {
    console.log('\nFound components:');
    components.forEach(comp => {
      console.log(`- ${comp.name} (${comp.file})`);
    });
  }
}
