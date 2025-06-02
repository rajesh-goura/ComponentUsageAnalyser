#!/usr/bin/env node
"use strict";
/**
 * CUA Tool - Component Usage Analyzer CLI
 *
 * A CLI utility for scanning React/React Native codebases
 * to analyze component usage or list relevant source files.
 * version 1.0.0
 **/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const figlet = require("figlet");
const scanner_1 = require("../scanner");
const yoctocolors_1 = __importDefault(require("yoctocolors"));
const inquirer_1 = __importDefault(require("inquirer"));
const deleteFiles_1 = require("../deleteFiles");
const writeMarkdown_1 = require("../writeMarkdown");
const displayAnalysis_1 = require("../displayAnalysis");
// Initializing CLI tool
const program = new commander_1.Command();
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
async function handleUnusedFileDeletion(unusedComponents) {
    if (unusedComponents.length === 0) {
        console.log(yoctocolors_1.default.bgYellow('\nNo unused components to delete.'));
        return;
    }
    // Prompt user for confirmation before deletion
    const answers = await inquirer_1.default.prompt([
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
            console.log(yoctocolors_1.default.bgYellow('\nUnused Components to be deleted:'));
            unusedComponents.forEach(comp => {
                console.log(yoctocolors_1.default.yellow(`- ${comp.name} (${comp.file})`));
            });
        }
        // Confirm final deletion
        const confirmFinal = await inquirer_1.default.prompt([
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
            (0, deleteFiles_1.deleteFiles)(unusedFiles);
        }
        else {
            console.log(yoctocolors_1.default.bgGray("Deletion cancelled."));
        }
    }
    else {
        console.log(yoctocolors_1.default.bgGray("Skipped file deletion."));
    }
}
// Main async function to run the CLI
async function runCLI() {
    if (options.analyze) {
        const scanPath = typeof options.analyze === "string" ? options.analyze : process.cwd();
        const components = (0, scanner_1.scanComponents)(scanPath);
        (0, displayAnalysis_1.displayAnalysisResults)(components);
        (0, writeMarkdown_1.writeMarkdownReport)(components);
    }
    // If the user wants to get files, we will scan and display them
    else if (options.deleteUnused) {
        const components = (0, scanner_1.scanComponents)(options.deleteUnused);
        const unusedComponents = (0, displayAnalysis_1.displayAnalysisResults)(components);
        if (unusedComponents) {
            await handleUnusedFileDeletion(unusedComponents);
        }
    }
}
// Execute the CLI
runCLI().catch((error) => {
    console.error(yoctocolors_1.default.bgRed('Error:'), error);
    process.exit(1);
});
