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
import ora from "ora";
import { performance } from "perf_hooks";

import { scanComponents, displayPerformanceStats } from "../core/scanner";
import { deleteFiles } from "../utils/deleteFiles";
import { displayAnalysisResults } from "../output/displayAnalysis";
import { generateGraphScreenshot } from "../utils/GenerateGraphScreenShot";
import { writeMarkdownReport } from "../output/writeMarkdown";
import { getProjectRoot, getRelativePath } from "../utils/pathResolver";
import { visualizeComponents } from "../output/visualizer";

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
  .option("-p, --performance", "Show detailed performance metrics")
  .parse(process.argv);

// Accessing the parsed options
const options = program.opts();

async function generateReportFiles(components: any[], showPerformance: boolean = false) {
  const spinner1 = ora("Generating visualizer...").start();
  await visualizeComponents(components);
  spinner1.succeed(`✅ Visualizer generated, opening in browser...`);
  
  const spinner2 = ora("Generating reports...").start();
  await generateGraphScreenshot();
  
  writeMarkdownReport(components);
  spinner2.succeed(`✅ Reports generated successfully`);
  
  if (showPerformance) {
    console.log(colors.blue("\nReport generation completed"));
  }
}

async function runCLI() {
  // if path not provided, using current working directory
  const scanPath =
    typeof (options.analyze || options.deleteUnused || options.generateReport || options.visualize) === "string"
      ? options.analyze || options.deleteUnused || options.generateReport || options.visualize
      : process.cwd();

  // Resolving the absolute path of the scan directory
  const absoluteScanPath = path.resolve(scanPath);
  const projectRoot = getProjectRoot(absoluteScanPath);

  // Scan components with loading indicator
  const scanSpinner = ora("Scanning components...").start();
  const scanStart = performance.now();
  const { components, stats } = scanComponents(absoluteScanPath, projectRoot);
  const scanTime = performance.now() - scanStart;
  scanSpinner.succeed(`✅ Found ${components.length} components (${stats.usedComponents} used)`);

  if (options.performance) {
    displayPerformanceStats(stats);
  } else {
    console.log(colors.gray(`Scan completed in ${scanTime.toFixed(2)}ms`));
  }

  // Analyze mode: Display usage and write reports
  if (options.analyze) {
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
      await generateReportFiles(components, options.performance);
    }
    return;
  }

  // Delete unused components mode
  if (options.deleteUnused) {
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
      const deleteSpinner = ora("Deleting unused files...").start();
      const deletedFiles = deleteFiles(unusedFiles);
      deleteSpinner.succeed(`✅ Deleted ${deletedFiles.length} files`);
      
      if (deletedFiles.length > 0) {
        console.log(colors.bgRed(`\nDeleted files:`));
        deletedFiles.forEach((file) => {
          const comp = unusedComponents.find(c => c.file === file);
          if (comp) {
            console.log(colors.red(`- ${comp.name} (${getRelativePath(comp.file, projectRoot)})`));
          } else {
            console.log(colors.red(`- ${getRelativePath(file, projectRoot)}`));
          }
        });
        console.log(colors.bgGray("\nPlease run/re-run the analysis to generate updated report."));
      }
    } else {
      console.log(colors.bgGray("Skipped file deletion."));
    }
  }
  // Generate report mode
  else if (options.generateReport) {
    await generateReportFiles(components, options.performance);
  }

  // Visualization mode
  if (options.visualize) {
    const vSpinner = ora("Generating visualizer...").start();
    await visualizeComponents(components);
    vSpinner.succeed(`✅ Visualizer generated, opening in browser...`);
  }
}

// Error handling
runCLI().catch((error) => {
  console.error(colors.bgRed('Error:'), error);
  process.exit(1);
});
