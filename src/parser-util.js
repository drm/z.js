module.exports = (function() {
    var _ = require('lodash');

    var Definition = function (name, body) {
        this.name = name;
        this.expr = body;
    };

    Definition.prototype = {
        resolve: function(context) {
            return this.expr.resolve(context);
        }
    };

    var Declaration = function (name, args, body) {
        this.name = name;
        this.args = args;
        this.body = body;
    };

    Declaration.prototype = {
        getValue: function () {
            return this.body;
        },

        resolve: function (context) {
            context.enterScope(this.name);
            if (typeof this.body === 'string') {
                context.set(this.name, this.body);
            } else {
                this.args.forEach(function (a) {
                    a.resolve(context);
                });
                var ret = this.body.resolve(context);
            }
            context.exitScope(this.name);
        },

        normalize: function() {
            if (!this.body) {
                this.body = new Noop();
            } else if (typeof this.body !== 'string') {
                this.body.normalize();
            }
            return this;
        }
    };

    var Noop = function() {
    };
    Noop.prototype = {
        resolve: function() {
            return true;
        }
    };

    var BinOp = function (op, left, right) {
        this.op = op;
        this.left = left;
        this.right = right;
    };

    var UnOp = function (op, operand) {
        this.op = op;
        this.operand = operand;
    };

    var Arg = function (name, default_value) {
        this.name = name;
        this.default_value = default_value;
    };

    Arg.prototype = {
        resolve: function(context) {
            if (!context.exists(this.name)) {
                context.set(this.name, context.evaluate(this.default_value));
            }
        }
    }

    var Context = function() {
        this.scope = [];
        this.environment = {};
    };

    Context.prototype = {
        set: function(a, b) {
            this.environment[a] = b;
        },

        get: function(a) {
            return this.environment[a];
        },

        exists: function(a) {
            return typeof this.environment[a] !== 'undefined';
        },

        evaluate: function(expr) {
            switch (true) {
                case typeof expr === 'string':
                    return expr;
                case typeof expr === 'number':
                case typeof expr === 'boolean':
                    return '' + expr;
            }
            if (typeof expr.resolve === 'function') {
                return expr.resolve(this);
            }
            throw new Error("Unmatched type " + (typeof expr) + " (" + expr.constructor.name + ")");
        },

        enterScope: function(name) {
            this.scope.push(name);
        },

        exitScope: function(name) {
            var popped = this.scope.pop();
            if (popped !== name) {
                throw new ScopeError("Invalid scope shift, expected to exit scope '" + name + "' but got '" + popped + "'");
            }
        }
    };


    var Container = function (declarations) {
        this.context = new Context();
        if (typeof declarations === "undefined" ){
            declarations = [];
        }

        this.root = declarations;
    };

    Container.prototype = {
        get: function(n) {
            return this.context.get(n);
        },

        getContext: function() {
            return this.context;
        },

        resolve: function(v) {
            return this.get(v).resolve(this.getContext());
        },

        normalize: function() {
            var ctx = this.context;
            this.root.forEach(function(d) {
                d.normalize();
                ctx.set(d.name, d);
            });

            return this;
        }
    };

    var Task = function(spec) {
        this.spec = spec || [];
    };

    Task.prototype = {
        normalize: function() {
            var self = this;

            ['pre', 'do', 'post'].forEach(function(scope) {
                self[scope] = [];

                self.spec.forEach(function(el) {
                    if (el.name === scope) {
                        self[scope] = self[scope].concat(el.lines);
                    }
                });
            });

            return this;
        },

        resolve: function (context) {
            var self = this;
            ['pre', 'do', 'post'].forEach(function(scope) {
                self[scope].forEach(function(k) {
                    k.resolve(context);
                });
            });
        }
    };

    var Identifier = function(name) {
        this.name = name;
    };

    Identifier.prototype.resolve = function(context) {
        return context.get(this.name);
    }

    var TaskLine = function (elements) {
        this.elements = elements;
    };

    TaskLine.prototype = {
        resolve: function(context) {
            this.elements = this.elements.map(function(e) {
                return context.evaluate(e);
            });

            var child_process = require('child_process');
            var s = child_process.spawn('/bin/bash', ['-e']);
            s.stdout.on('data', function(data) {
                console.log('' + data);
            });
            s.stdin.write(this.elements.join(""));
            s.stdin.write("\nexit 0;\n");
        }
    };

    var TaskSection = function(name, lines) {
        this.name = name;
        this.lines = lines;
    };

    TaskSection.prototype = {
        resolve: function(context) {
            this.lines.forEach(function (l) {
                l.resolve(context);
            });
        }
    };

    var TaskPrecondition = function(name, expr) {
        this.name = name;
        this.expr = expr;
    };

    var renderSyntaxError = function(fileName, contents, e) {
        var ret = '';
        ret += 'Syntax error in ' + fileName + ' at line ' + e.line + "\n";
        ret += "\n";
        ret += "    " + fileName + ":" + "\n";
        ret += '    ----------------------------------------' + "\n";
        if (e.line > 1) {
            ret += '    ' + (e.line -1) + '. ' + contents.split("\n")[e.line -2] + "\n";
        }
        ret += '    ' + e.line + '. ' + contents.split("\n")[e.line -1] + "\n";
        ret += '    ' + new Array(e.column + 3).join(" ") + '^-- here' + "\n";
        ret += '    ----------------------------------------' + "\n";
        ret += "" + "\n";
        ret += e.message + "\n";
        return ret;
    }




    return {
        parseFile: function(file) {
            var parser = require('../lib/parser.js'),
                fs = require('fs'),
                ret,
                fileContents = fs.readFileSync(file, 'utf-8')
                ;

            try {
                ret = parser.parse(fileContents);
            } catch (e) {
                if (e.constructor === parser.SyntaxError) {
                    renderSyntaxError(file, fileContents, e);
                }
                throw e;
            }
            ret.normalize();
            return ret;
        },
        Declaration: Declaration,
        Definition: Definition,
        Arg: Arg,
        Container: Container,
        TaskLine: TaskLine,
        TaskSection: TaskSection,
        TaskPrecondition: TaskPrecondition,
        Task: Task,
        Identifier: Identifier,

        BinOp: BinOp,
        UnOp: UnOp,

        renderSyntaxError: renderSyntaxError
    }
})();
