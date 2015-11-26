import fs from 'fs';
import * as z from './parser-util.js'
import parser from './parser.js';

var container = z.parseFile(process.argv[2]);

if (process.argv[3]) {
    var closure = container.get(process.argv[3]);
    closure.resolve(container.context)();
} else {
    console.log("TODO: render help");
}
