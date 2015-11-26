import fs from 'fs';
import * as z from './parser-util.js'
import parser from './parser.js';
import minimist from 'minimist'

var argv = minimist(process.argv.slice(2));

var container = z.parseFile(argv['_'][0]);

if (typeof argv['explain'] !== 'undefined' && argv['explain']) {
    container.set('SHELL', '/dev/stdout');
}

if (process.argv[3]) {
    var closure = container.getContext().require(argv['_'][1]);
    try {
        closure.resolve(container.context).apply(null, argv['_'].slice(2));
    } catch (e) {
        console.log(e.message);
        console.log("Trace:");
        e.stacktrace.forEach((e) => console.log(z.renderDebugInfo(e)));
    }
} else {
    console.log("TODO: render help");
}
