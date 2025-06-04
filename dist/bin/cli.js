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
const path_1 = __importDefault(require("path"));
// Initializing CLI tool
const program = new commander_1.Command();
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
function getProjectRoot(scanPath) {
    const absolutePath = path_1.default.resolve(scanPath);
    const coinPayIndex = absolutePath.indexOf('CoinPay');
    if (coinPayIndex !== -1) {
        return path_1.default.join(absolutePath.substring(0, coinPayIndex), 'CoinPay');
    }
    return absolutePath;
}
function getRelativePath(fullPath, projectRoot) {
    const relativePath = path_1.default.relative(projectRoot, fullPath);
    return relativePath.startsWith('..') ? fullPath : `CoinPay/${relativePath}`;
}
async function runCLI() {
    const scanPath = typeof (options.analyze || options.deleteUnused || options.generateReport) === "string"
        ? options.analyze || options.deleteUnused || options.generateReport
        : process.cwd();
    const absoluteScanPath = path_1.default.resolve(scanPath);
    const projectRoot = getProjectRoot(absoluteScanPath);
    // Analyze mode: Display usage and write reports
    if (options.analyze) {
        const components = (0, scanner_1.scanComponents)(absoluteScanPath, projectRoot);
        (0, displayAnalysis_1.displayAnalysisResults)(components);
        const { generateReport } = await inquirer_1.default.prompt([
            {
                type: "confirm",
                name: "generateReport",
                message: "Do you want to generate the report for component usage?",
                default: false,
            },
        ]);
        if (generateReport) {
            (0, writeMarkdown_1.writeMarkdownReport)(components);
        }
        return;
    }
    // Delete unused components mode
    if (options.deleteUnused) {
        const components = (0, scanner_1.scanComponents)(absoluteScanPath, projectRoot);
        const unusedComponents = components.filter((c) => !c.isUsed);
        if (unusedComponents.length === 0) {
            console.log(yoctocolors_1.default.bgGreen("\n🎉 No unused components found."));
            return;
        }
        // extracting unused files
        const unusedFiles = unusedComponents.map((comp) => comp.file);
        // Display relative paths in confirmation message
        const relativeUnusedFiles = unusedFiles.map(file => `- ${getRelativePath(file, projectRoot)}`).join("\n");
        // Asking for delete confirmation
        const { confirmDelete } = await inquirer_1.default.prompt([
            {
                type: "confirm",
                name: "confirmDelete",
                message: `Do you want to delete the following unused component files? \n\n${relativeUnusedFiles}\n`,
                default: false,
            },
        ]);
        if (confirmDelete) {
            const deletedFiles = (0, deleteFiles_1.deleteFiles)(unusedFiles);
            if (deletedFiles.length > 0) {
                console.log(yoctocolors_1.default.bgRed(`\nDeleted ${deletedFiles.length} unused component file(s):`));
                deletedFiles.forEach((file) => {
                    const comp = unusedComponents.find(c => c.file === file);
                    if (comp) {
                        console.log(yoctocolors_1.default.red(`- ${comp.name} (${getRelativePath(comp.file, projectRoot)})`));
                    }
                    else {
                        console.log(yoctocolors_1.default.red(`- ${getRelativePath(file, projectRoot)}`));
                    }
                });
                console.log(yoctocolors_1.default.bgGray("\n Please run/re-run the analysis generate updated report."));
            }
            else {
                console.log(yoctocolors_1.default.bgGray("\nNo files were deleted."));
            }
        }
        else {
            console.log(yoctocolors_1.default.bgGray("Skipped file deletion."));
        }
    }
    // if command is generateReport a report is generated
    else if (options.generateReport) {
        const components = (0, scanner_1.scanComponents)(absoluteScanPath, projectRoot);
        (0, writeMarkdown_1.writeMarkdownReport)(components);
    }
}
runCLI().catch((error) => {
    console.error(yoctocolors_1.default.bgRed('Error:'), error);
    process.exit(1);
});
