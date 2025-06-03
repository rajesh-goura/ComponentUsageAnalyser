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
  .option("-d, --deleteUnused [path]", "Scan and delete unused component files")
  .option("-g, --generateReport [path]", "Generate report for component usage")
  .parse(process.argv);

// Accessing the parsed options
const options = program.opts();
async function runCLI() {
  const scanPath =
    typeof (options.analyze || options.deleteUnused) === "string"
      ? options.analyze || options.deleteUnused
      : process.cwd();

  // Analyze mode: Display usage and write reports
  if (options.analyze) {
    const components = scanComponents(scanPath);
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
  const scanPath = typeof options.deleteUnused === "string" ? options.deleteUnused : process.cwd();
    const components = scanComponents(scanPath);
    const unusedComponents = components.filter((c) => !c.isUsed);

    if (unusedComponents.length === 0) {
      console.log(colors.bgGreen("\n🎉 No unused components found."));
      return;
    }

    // extracting unused files
    const unusedFiles = unusedComponents.map((comp) => comp.file);

    // Asking for delete confirmation
    const { confirmDelete } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmDelete",
        message: `Do you want to delete the following unused component files? \n\n${unusedFiles.map((file) => `- ${file}`).join("\n")}\n`,
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
              console.log(colors.red(`- ${comp.name} (${comp.file})`));
            } else {
              console.log(colors.red(`- ${file}`));
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
  // if command is generateReport a report is gnerated
  else if( options.generateReport) {
    writeMarkdownReport(scanComponents(scanPath));
  }
} 

runCLI().catch((error) => {
  console.error(colors.bgRed('Error:'), error);
  process.exit(1);
});