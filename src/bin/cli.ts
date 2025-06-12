#!/usr/bin/env node

/**
 * CUA Tool - Component Usage Analyzer CLI
 *
 * A CLI utility for scanning React/React Native codebases
 * to analyze component usage or list relevant source files.
 * version 1.0.0
 **/

import { Command } from "commander";
import colors from "yoctocolors";
import inquirer from "inquirer";
const figlet = require("figlet");

import path from "path";

import { scanComponents } from "../core/scanner";
import { deleteFiles } from "../utils/deleteFiles";
import { displayAnalysisResults } from "../output/displayAnalysis";
import { generateGraphScreenshot } from "../utils/GenerateGraphScreenShot";
import { writeMarkdownReport } from "../output/writeMarkdown";

import { getProjectRoot, getRelativePath } from "../utils/pathResolver";
import { visualizeComponents } from "../output/visualizer";
import ora from "ora";

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

async function runCLI() {
  // if path not provided, using current working directory
  const scanPath =
    typeof (options.analyze || options.deleteUnused || options.generateReport || options.visualize) === "string"
      ? options.analyze || options.deleteUnused || options.generateReport || options.visualize
      : process.cwd();

  // Resolving the absolute path of the scan directory
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
      // Step 1: Visualize components
      const spinner1 = ora("Generating visualiser...").start();
      await visualizeComponents(components);
      spinner1.succeed(`✅ visualiser generated, opening in browser...`);
      
      const spinner2 = ora("Generating reports...").start();
      // Step 2: Generate screenshot of dependency graph
      await generateGraphScreenshot();
      spinner2.succeed(`almost there...`);
      
      // Step 3: Generate markdown report + PDF
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
    // Step 1: Create visualisations
      const spinner1 = ora("Generating visualiser...").start();
      await visualizeComponents(components);
      spinner1.succeed(`✅ visualiser generated, opening in browser...`);
      
      const spinner2 = ora("Generating reports...").start();
      // Step 2: Generate screenshot of dependency graph
      await generateGraphScreenshot();
      spinner2.succeed(`almost there...`);
  
      // Step 3: Generate markdown report + PDF
      writeMarkdownReport(components);
  }

  // if command is visualize, an html visualization is generated
  if (options.visualize) {
    const components = scanComponents(absoluteScanPath, projectRoot);
    const vSpinner = ora("Generating visualiser...").start();
    await visualizeComponents(components);
    vSpinner.succeed(`✅ visualiser generated, opening in browser...`);
    return;
  }
}
// errors handled
runCLI().catch((error) => {
  console.error(colors.bgRed('Error:'), error);
  process.exit(1);
});