#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const scanner_1 = require("../scanner");
const program = new commander_1.Command();
program
    .name('component-analyser')
    .description('Analyze React component usage')
    .version('1.0.0');
program
    .command('scan <path>')
    .description('Scan a directory for React components')
    .action((path) => {
    console.log(`Scanning ${path}...`);
    const components = (0, scanner_1.scanComponents)(path);
    console.log(components);
});
program.parse(process.argv);
