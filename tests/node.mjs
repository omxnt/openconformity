// What the tests take from the JavaScriptCore shell, provided for Node:
// readFile reads a file as text, print writes a line, and arguments holds
// what follows the script on the command line. Loaded by run.sh with
// --import where jsc is missing, before the test file runs.

import { readFileSync } from 'node:fs';

globalThis.readFile = (path) => readFileSync(path, 'utf8');
globalThis.print = (...parts) => console.log(...parts);
const after = process.argv.slice(2);
globalThis.arguments = after[0] === '--' ? after.slice(1) : after;
