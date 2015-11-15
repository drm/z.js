var assert = require('assert-diff');
var fs = require('fs');
var vm = require('vm');
var path = require('path');
var z = require('./lib/parser-util.js');
var parser = require('./lib/parser.js');

var files;
if (process.argv.length > 2) {
    files = process.argv.slice(2);
} else {
    files = fs.readdirSync('parser-tests');
}

files.forEach(function (fileName) {
    if (fileName.match(/\.z$/)) {
        console.log("Parsing " + fileName);
        var result = z.parseFile(path.join('parser-tests', fileName), {nodebug: true});
        var resultFile = fileName.replace(/\.z/, '.test.js');
        var test = path.join('parser-tests', resultFile);
        try {
            vm.runInContext(
                fs.readFileSync(test),
                vm.createContext({
                    assert: assert,
                    result: result,
                    z: z,
                    console: console
                })
            );
        } catch(e) {
            console.error("Error in test file " + resultFile);
            console.log(e.stack);
        }
        console.log("");
    }
});
