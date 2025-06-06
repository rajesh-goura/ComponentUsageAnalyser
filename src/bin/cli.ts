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
import { visualizeComponents } from "../visualizer";
import path from "path";

// Initializing CLI tool
const program = new Command();

// Displaying the tool name in ASCII art
console.log(figlet.textSync("CUA Tool"));

// Setting up command line options
program
  .version("1.0.0")
  .description("CLI tool for React/React Native component usage analysis")
  .option("-a, --analyze [path]", "Scans a React/React Native codebase for component usage")
  .option("-d, --deleteUnused [path]", "Scan and delete unused component files")
  .option("-g, --generateReport [path]", "Generate report for component usage")
  .option("-v, --visualize [path]", "Generate component visualization")
  .parse(process.argv);

// Accessing the parsed options
const options = program.opts();

function getProjectRoot(scanPath: string): string {
  const absolutePath = path.resolve(scanPath);
  const coinPayIndex = absolutePath.indexOf('CoinPay');
  
  if (coinPayIndex !== -1) {
    return path.join(absolutePath.substring(0, coinPayIndex), 'CoinPay');
  }
  return absolutePath;
}

function getRelativePath(fullPath: string, projectRoot: string): string {
  const relativePath = path.relative(projectRoot, fullPath);
  return relativePath.startsWith('..') ? fullPath : `CoinPay/${relativePath}`;
}

async function runCLI() {
  const scanPath =
    typeof (options.analyze || options.deleteUnused || options.generateReport) === "string"
      ? options.analyze || options.deleteUnused || options.generateReport
      : process.cwd();

  const absoluteScanPath = path.resolve(scanPath);
  const projectRoot = getProjectRoot(absoluteScanPath);

  // Analyze mode: Display usage and write reports
  if (options.analyze) {
    const components = scanComponents(absoluteScanPath, projectRoot);
    displayAnalysisResults(components);

    const { generateReport } = await inquirer.prompt([
      {
        type: "confirm",
        name: "generateReport",
        message: "Do you want to generate the report for component usage?",
        default: false,
      },
    ]);
    if (generateReport) {
      writeMarkdownReport(components);
    }
    return;
  }

  // Delete unused components mode
  if (options.deleteUnused) {
    const components = scanComponents(absoluteScanPath, projectRoot);
    const unusedComponents = components.filter((c) => !c.isUsed);

    if (unusedComponents.length === 0) {
      console.log(colors.bgGreen("\n🎉 No unused components found."));
      return;
    }

    // extracting unused files
    const unusedFiles = unusedComponents.map((comp) => comp.file);

    // Display relative paths in confirmation message
    const relativeUnusedFiles = unusedFiles.map(file => 
      `- ${getRelativePath(file, projectRoot)}`
    ).join("\n");

    // Asking for delete confirmation
    const { confirmDelete } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmDelete",
        message: `Do you want to delete the following unused component files? \n\n${relativeUnusedFiles}\n`,
        default: false,
      },
    ]);

    if (confirmDelete) {
      const deletedFiles = deleteFiles(unusedFiles);
      if (deletedFiles.length > 0) {
        console.log(colors.bgRed(`\nDeleted ${deletedFiles.length} unused component file(s):`));
        deletedFiles.forEach((file) => {
          const comp = unusedComponents.find(c => c.file === file);
          if (comp) {
            console.log(colors.red(`- ${comp.name} (${getRelativePath(comp.file, projectRoot)})`));
          } else {
            console.log(colors.red(`- ${getRelativePath(file, projectRoot)}`));
          }
        });
        console.log(colors.bgGray("\n Please run/re-run the analysis generate updated report."));
      } else {
        console.log(colors.bgGray("\nNo files were deleted."));
      }
    } else {
      console.log(colors.bgGray("Skipped file deletion."));
    }
  }
  // if command is generateReport a report is generated
  else if (options.generateReport) {
    const components = scanComponents(absoluteScanPath, projectRoot);
    writeMarkdownReport(components);
  }
  if (options.visualize) {
    const components = scanComponents(absoluteScanPath, projectRoot);
    console.log(colors.blue("\nGenerating component visualization..."));
    await visualizeComponents(components);
    console.log(colors.green("\nVisualization generated and opened in your default browser."));
    return;
  }
}

runCLI().catch((error) => {
  console.error(colors.bgRed('Error:'), error);
  process.exit(1);
});