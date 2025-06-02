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
// Function to display component analysis results
function displayAnalysisResults(components) {
    if (components.length === 0) {
        console.log(yoctocolors_1.default.bgYellow('No components found in the specified path.'));
        return;
    }
    const usedComponents = components.filter(c => c.isUsed);
    const unusedComponents = components.filter(c => !c.isUsed);
    console.log(yoctocolors_1.default.bgBlue('\nFound components:'));
    components.forEach(comp => {
        const usageInfo = comp.isUsed
            ? `[USED ${comp.usageCount} time${comp.usageCount !== 1 ? 's' : ''}]`
            : '[UNUSED]';
        console.log(yoctocolors_1.default.green(`- ${comp.name} (${comp.file}) ${usageInfo}`));
        if (comp.isUsed && comp.usedIn?.length) {
            console.log(yoctocolors_1.default.cyan(`  ↳ Used in: ${comp.usedIn.length} file${comp.usedIn.length !== 1 ? 's' : ''}`));
        }
    });
    console.log(yoctocolors_1.default.bgBlue('\nSummary:'));
    console.log(yoctocolors_1.default.blue(`- Total components: ${components.length}`));
    console.log(yoctocolors_1.default.green(`- Used components: ${usedComponents.length}`));
    console.log(yoctocolors_1.default.red(`- Unused components: ${unusedComponents.length}`));
    // Show top 5 most used components
    const topUsed = [...usedComponents]
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5);
    if (topUsed.length > 0) {
        console.log(yoctocolors_1.default.bgMagenta('\nTop Used Components:'));
        topUsed.forEach((comp, index) => {
            console.log(yoctocolors_1.default.magenta(`${index + 1}. ${comp.name}: ${comp.usageCount} usage${comp.usageCount !== 1 ? 's' : ''}`));
            if (comp.usedIn?.length) {
                console.log(yoctocolors_1.default.gray(`  ↳ Used in: ${comp.usedIn.join(', ')}`));
            }
        });
    }
    if (unusedComponents.length > 0) {
        console.log(yoctocolors_1.default.bgRed('\nUnused components:'));
        unusedComponents.forEach(comp => {
            console.log(yoctocolors_1.default.red(`- ${comp.name} (${comp.file})`));
        });
    }
    return unusedComponents;
}
// Function to handle unused file deletion
async function handleUnusedFileDeletion(unusedComponents) {
    if (unusedComponents.length === 0) {
        console.log(yoctocolors_1.default.bgYellow('\nNo unused components to delete.'));
        return;
    }
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
    if (answers.confirmDelete) {
        if (answers.showDetails) {
            console.log(yoctocolors_1.default.bgYellow('\nUnused Components to be deleted:'));
            unusedComponents.forEach(comp => {
                console.log(yoctocolors_1.default.yellow(`- ${comp.name} (${comp.file})`));
            });
        }
        const confirmFinal = await inquirer_1.default.prompt([
            {
                type: "confirm",
                name: "finalConfirm",
                message: `Are you sure you want to delete ${unusedComponents.length} unused component files?`,
                default: false
            }
        ]);
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
        displayAnalysisResults(components);
    }
    else if (options.deleteUnused) {
        const components = (0, scanner_1.scanComponents)(options.deleteUnused);
        const unusedComponents = displayAnalysisResults(components);
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
