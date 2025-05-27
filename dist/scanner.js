"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanComponents = scanComponents;
const fast_glob_1 = require("fast-glob");
const fs_1 = require("fs");
const parser_1 = require("@babel/parser");
const traverse_1 = __importDefault(require("@babel/traverse"));
function scanComponents(path) {
    // 1. Find all React files
    const files = (0, fast_glob_1.globSync)([
        `${path}/**/*.{js,jsx,ts,tsx}`,
        '!**/node_modules/**'
    ]);
    // 2. Parse each file and extract components
    const components = [];
    files.forEach((file) => {
        const content = (0, fs_1.readFileSync)(file, 'utf-8');
        const ast = (0, parser_1.parse)(content, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript']
        });
        (0, traverse_1.default)(ast, {
            // Detect function components
            FunctionDeclaration(path) {
                if (path.node.id?.name.match(/^[A-Z]/)) {
                    components.push({
                        name: path.node.id.name,
                        file: file
                    });
                }
            },
            // Detect arrow function components
            VariableDeclarator(path) {
                if (path.node.id.type === 'Identifier' &&
                    path.node.id.name.match(/^[A-Z]/) &&
                    path.node.init?.type === 'ArrowFunctionExpression') {
                    components.push({
                        name: path.node.id.name,
                        file: file
                    });
                }
            }
        });
    });
    return components;
}
