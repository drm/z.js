var fs = require('fs');
var z = require('./parser-util');
var parser = require('../lib/parser');

var container = z.parseFile(process.argv[2]);

if (process.argv[3]) {
    container.resolve(process.argv[3]);
} else {
    console.log("TODO: render help");
}
