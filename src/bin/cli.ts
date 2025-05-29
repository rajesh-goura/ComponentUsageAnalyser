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
import { scanComponents } from "../scanner";
import colors from "yoctocolors";
import inquirer from "inquirer";
import { deleteFiles } from "../deleteFiles";

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
    const usedComponents = components.filter(c => c.isUsed);
    const unusedComponents = components.filter(c => !c.isUsed);

    console.log('\nFound components:');
    components.forEach(comp => {
      console.log(`- ${comp.name} (${comp.file}) ${comp.isUsed ? '[USED]' : '[UNUSED]'}`);
    });

    console.log('\nSummary:');
    console.log(`- Total components: ${components.length}`);
    console.log(`- Used components: ${usedComponents.length}`);
    console.log(`- Unused components: ${unusedComponents.length}`);

    if (unusedComponents.length > 0) {
      console.log('\nUnused components:');
      unusedComponents.forEach(comp => {
        console.log(`- ${comp.name} (${comp.file})`);
      });
          inquirer
        .prompt([
          {
            type: "confirm",
            name: "confirmDelete",
            message: "Do you want to delete these unused component files?",
            default: false,
          },
        ])
        .then((answers) => {
          if (answers.confirmDelete) {
            const unusedFiles = unusedComponents.map((comp) => comp.file);
            deleteFiles(unusedFiles);
          } else {
            console.log(colors.gray("Skipped file deletion."));
          }
        });

      
    }
  }
}
