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
const path_1 = __importDefault(require("path"));
// Initializing CLI tool
const program = new commander_1.Command();
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
    const resolvedPath = path_1.default.resolve(__dirname, options.analyze);
    console.log(`Analyzing codebase at: ${resolvedPath}`);
}
