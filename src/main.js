var fs = require('fs');
var z = require('./parser-util');
var parser = require('../lib/parser');

try {
    var container = z.parseFile(process.argv[2]);

    if (process.argv[3]) {
        var decl = container.get(process.argv[3]);

        decl.resolve({
            who: 'Officer Krupke',
            what: 'Gee'
        });
    } else {
        console.log("TODO: render help");
    }

} catch(e) {
    if (e instanceof parser.SyntaxError) {
        console.log(z.renderSyntaxError(e));
    } else {
        throw e;
    }
}
