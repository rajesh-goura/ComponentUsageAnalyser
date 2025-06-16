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
const yoctocolors_1 = __importDefault(require("yoctocolors"));
const inquirer_1 = __importDefault(require("inquirer"));
const figlet = require("figlet");
const path_1 = __importDefault(require("path"));
const ora_1 = __importDefault(require("ora"));
const perf_hooks_1 = require("perf_hooks");
const scanner_1 = require("../core/scanner");
const deleteFiles_1 = require("../utils/deleteFiles");
const displayAnalysis_1 = require("../output/displayAnalysis");
const pathResolver_1 = require("../utils/pathResolver");
const visualizer_1 = require("../output/visualizer");
const generateReports_1 = require("../utils/generateReports");
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
    .option("-v, --visualize [path]", "Generate component visualization")
    .parse(process.argv);
// Accessing the parsed options
const options = program.opts();
async function runCLI() {
    // if path not provided, using current working directory
    const scanPath = typeof (options.analyze || options.deleteUnused || options.generateReport || options.visualize) === "string"
        ? options.analyze || options.deleteUnused || options.generateReport || options.visualize
        : process.cwd();
    // Resolving the absolute path of the scan directory
    const absoluteScanPath = path_1.default.resolve(scanPath);
    const projectRoot = (0, pathResolver_1.getProjectRoot)(absoluteScanPath);
    const scanSpinner = (0, ora_1.default)("Scanning components...").start();
    const scanStart = perf_hooks_1.performance.now();
    const { components, stats } = (0, scanner_1.scanComponents)(absoluteScanPath, projectRoot);
    const scanTime = perf_hooks_1.performance.now() - scanStart;
    scanSpinner.succeed(`Found ${components.length} components (${stats.usedComponents} used)`);
    console.log(yoctocolors_1.default.gray(`Scan completed in ${scanTime.toFixed(2)}ms`));
    // Analyze mode: Display usage and write reports
    if (options.analyze) {
        (0, displayAnalysis_1.displayAnalysisResults)(components);
        // displaying performance stats after analysis
        (0, scanner_1.displayPerformanceStats)(stats);
        const { generateReport } = await inquirer_1.default.prompt([
            {
                type: "confirm",
                name: "generateReport",
                message: "Do you want to generate the report for component usage?",
                default: false,
            },
        ]);
        if (generateReport) {
            await (0, generateReports_1.generateReportFiles)(components);
        }
        return;
    }
    // Delete unused components mode
    if (options.deleteUnused) {
        const unusedComponents = components.filter((c) => !c.isUsed);
        if (unusedComponents.length === 0) {
            console.log(yoctocolors_1.default.green("\n No unused components found."));
            return;
        }
        // extracting unused files
        const unusedFiles = unusedComponents.map((comp) => comp.file);
        // Display relative paths in confirmation message
        const relativeUnusedFiles = unusedFiles.map(file => `- ${(0, pathResolver_1.getRelativePath)(file, projectRoot)}`).join("\n");
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
            const deleteSpinner = (0, ora_1.default)("Deleting unused files...").start();
            const deletedFiles = (0, deleteFiles_1.deleteFiles)(unusedFiles);
            deleteSpinner.succeed(`Deleted ${deletedFiles.length} files`);
            if (deletedFiles.length > 0) {
                console.log(yoctocolors_1.default.bgRed(`\nDeleted files:`));
                deletedFiles.forEach((file) => {
                    const comp = unusedComponents.find(c => c.file === file);
                    if (comp) {
                        console.log(yoctocolors_1.default.red(`- ${comp.name} (${(0, pathResolver_1.getRelativePath)(comp.file, projectRoot)})`));
                    }
                    else {
                        console.log(yoctocolors_1.default.red(`- ${(0, pathResolver_1.getRelativePath)(file, projectRoot)}`));
                    }
                });
                console.log(yoctocolors_1.default.bgGray("\nPlease run/re-run the analysis to generate updated report."));
            }
        }
        else {
            console.log(yoctocolors_1.default.bgGray("Skipped file deletion."));
        }
    }
    // Generate reports
    if (options.generateReport) {
        await (0, generateReports_1.generateReportFiles)(components);
    }
    // Generate visualisations
    if (options.visualize) {
        const vSpinner = (0, ora_1.default)("Generating visualizer...").start();
        await (0, visualizer_1.visualizeComponents)(components);
        vSpinner.succeed(`✅ Visualizer generated, opening in browser...`);
    }
}
// Error handling
runCLI().catch((error) => {
    console.error(yoctocolors_1.default.bgRed('Error:'), error);
    process.exit(1);
});
