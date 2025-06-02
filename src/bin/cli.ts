#!/usr/bin/env node

/**
 * CUA Tool - Component Usage Analyzer CLI
 *
 * A CLI utility for scanning React/React Native codebases
 * to analyze component usage or list relevant source files.
 * version 1.0.0
 **/

import { Command } from "commander";
const figlet = require("figlet");
import { scanComponents } from "../scanner";
import colors from "yoctocolors";
import inquirer from "inquirer";
import { deleteFiles } from "../deleteFiles";
import { writeMarkdownReport } from "../writeMarkdown";
import { displayAnalysisResults } from "../displayAnalysis";

// Initializing CLI tool
const program = new Command();

// Displaying the tool name in ASCII art
console.log(figlet.textSync("CUA Tool"));

// Setting up command line options
program
  .version("1.0.0")
  .description("CLI tool for React/React Native component usage analysis")
  .option("-a, --analyze [path]", "Scans a React/React Native codebase for component usage")
  .option("-g, --getFiles <path>", "Scans a React/React Native codebase for relevant source files")
  .option("-d, --deleteUnused <path>", "Scan and delete unused component files")
  .parse(process.argv);

// Accessing the parsed options
const options = program.opts();

// Function to handle unused file deletion
async function handleUnusedFileDeletion(unusedComponents: any[]) {
  if (unusedComponents.length === 0) {
    console.log(colors.bgYellow('\nNo unused components to delete.'));
    return;
  }

  // Prompt user for confirmation before deletion
  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmDelete",
      message: "Do you want to delete these unused component files?",
      default: false,
    },
    {
      type: "confirm",
      name: "showDetails",
      message: "Show details of unused components before deletion?",
      default: true,
      when: (answers) => answers.confirmDelete
    }
  ]);

  // If user confirms deletion, show details if requested
  if (answers.confirmDelete) {
    if (answers.showDetails) {
      console.log(colors.bgYellow('\nUnused Components to be deleted:'));
      unusedComponents.forEach(comp => {
        console.log(colors.yellow(`- ${comp.name} (${comp.file})`));
      });
    }
    
    // Confirm final deletion
    const confirmFinal = await inquirer.prompt([
      {
        type: "confirm",
        name: "finalConfirm",
        message: `Are you sure you want to delete ${unusedComponents.length} unused component files?`,
        default: false
      }
    ]);
// If user confirms final deletion, proceed with deletion
    if (confirmFinal.finalConfirm) {
      const unusedFiles = unusedComponents.map((comp) => comp.file);
      deleteFiles(unusedFiles);
    } else {
      console.log(colors.bgGray("Deletion cancelled."));
    }
  } else {
    console.log(colors.bgGray("Skipped file deletion."));
  }
}

// Main async function to run the CLI
async function runCLI() {
  if (options.analyze) {
    const scanPath = typeof options.analyze === "string" ? options.analyze : process.cwd();
    const components = scanComponents(scanPath);
    displayAnalysisResults(components);
    writeMarkdownReport(components);
  }
  // If the user wants to get files, we will scan and display them
 else if (options.deleteUnused) {
    const components = scanComponents(options.deleteUnused);
    const unusedComponents = displayAnalysisResults(components);
    if (unusedComponents) {
      await handleUnusedFileDeletion(unusedComponents);
    }
  }
}

// Execute the CLI
runCLI().catch((error) => {
  console.error(colors.bgRed('Error:'), error);
  process.exit(1);
});