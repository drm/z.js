module.exports = (function () {
    var Definition = function (name, body) {
        this.name = name;
        this.expr = body;
    };
    Definition.prototype = {
        resolve: function (context) {
            if (typeof this.expr === 'object') {
                return this.expr.resolve(context);
            }
            return this.expr;
        }
    };

    var Decorator = function (expr, object) {
        this.expr = expr;
        this.decoratee = object;
    };
    Decorator.prototype = {
        resolve: function (context) {
            var decorator = context.evaluate(this.expr.resolve(context));
            var decorated = decorator(this.decoratee);
            return decorated.resolve(context);
        }
    };

    var DependsDecorator = function (decoratee, args) {
        this.decoratee = decoratee;
        this.args = args;
    };
    DependsDecorator.prototype = {
        resolve: function (context) {
            this.args.forEach(function(dep) {
                context.evaluate(context.get(dep.name));
            });
            return this.decoratee.resolve(context);
        }
    };

    var TriggerDecorator = function (decoratee, args) {
        this.decoratee = decoratee;
        this.args = args;
    };
    TriggerDecorator.prototype = {
        resolve: function (context) {
            this.decoratee.resolve(context);
            this.args.forEach(function(dep) {
                context.evaluate(context.get(dep.name));
            });
        }
    };

    var Invocation = function(args) {
        this.args = args || [];
    };

    Invocation.prototype = {
        setSubject: function(subject) {
            this.expr = subject;
            return this;
        },

        resolve: function(context) {
            var target = this.expr.resolve(context);
            return target.call(context, this.args.map(function(a) {
                return context.evaluate(a);
            }));
        }
    };

    var MemberAccess = function(member) {
        this.member = member;
    };

    MemberAccess.prototype = {
        setSubject: function(subject) {
            this.expr = subject;
            return this;
        },

        resolve: function(context) {
            return this.expr.resolve(context)[context.evaluate(this.member)];
        }
    };


    var Closure = function (args, body) {
        this.args = args || [];
        this.body = body || [];
    };

    Closure.prototype = {
        resolve: function (context) {
            var body = this.body;
            var argSpec = this.args;
            return function(args) {
                var closureArgs = args;
                argSpec.forEach(function (a, i) {
                    context.set(a.name, closureArgs[i]);
                });
                var ret;
                body.forEach(function (d) {
                    ret = context.evaluate(d);
                });
                return ret;
            };
        }
    };

    var BinOp = function (op, left, right) {
        this.op = op;
        this.left = left;
        this.right = right;
    };

    BinOp.prototype = {
        resolve: function(context) {
            var lhs = context.evaluate(this.left);
            var rhs = context.evaluate(this.right);

            switch (this.op) {
                case '+': return lhs + rhs;
                case '-': return lhs - rhs;
                case '/': return lhs / rhs;
                case '*': return lhs * rhs;
            }

            throw new Error("Invalid operator" + this.op);
        }
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
        resolve: function (context) {
            if (!context.exists(this.name)) {
                context.set(this.name, context.evaluate(this.default_value));
            }
        }
    };

    var Context = function () {
        this.scope = [];
        this.environment = {};
    };

    Context.prototype = {
        set: function (a, b) {
            this.environment[a] = b;
        },

        get: function (a) {
            return this.environment[a];
        },

        exists: function (a) {
            return typeof this.environment[a] !== 'undefined';
        },

        evaluate: function (expr) {
            switch (true) {
                case typeof expr === 'string':
                case typeof expr === 'number':
                case typeof expr === 'boolean':
                case typeof expr === 'null':
                case typeof expr === 'function':
                    return expr;
                case typeof expr == 'undefined':
                    throw new Error("Cannot resolve undefined value");
            }
            if (typeof expr.resolve === 'function') {
                return expr.resolve(this);
            }
            throw new Error("Unmatched type " + (typeof expr) + " (" + expr.constructor.name + ")");
        }
    };

    var Container = function () {
        this.context = new Context();
    };

    Container.prototype = {
        addPrelude: function(prelude) {
            var vm = require('vm');

            vm.runInContext(
                prelude,
                vm.createContext({
                    container: this,
                    console: console
                })
            );
        },

        get: function (n) {
            return this.context.get(n);
        },

        set: function(n, v) {
            return this.context.set(n, v);
        },

        getContext: function () {
            return this.context;
        },

        resolve: function (v) {
            if (!this.context.exists(v)) {
                throw new Error("Trying to resolve undefined value '" + v + "'");
            }
            return this.get(v).resolve(this.getContext());
        }
    };

    var Identifier = function (name) {
        this.name = name;
    };

    Identifier.prototype.resolve = function (context) {
        return context.evaluate(context.get(this.name));
    };

    var Literal = function(value) {
        this.value = value;
    };
    Literal.prototype = {
        resolve: function(context) {
            if (typeof this.value === 'object') {
                var ret, val = this.value;
                if (val.constructor === Array) {
                    ret = [];
                    val.forEach(function(v, k) {
                        ret[k]= v.resolve(context);
                    });
                } else {
                    ret = {};
                    Object.keys(val).forEach(function(n) {
                        ret[n]= val[n].resolve(context);
                    });
                }
                return ret;
            }
            return this.value;
        }
    };


    var TaskLine = function (elements) {
        this.elements = elements;
    };

    TaskLine.prototype = {
        resolve: function (context) {
            this.elements = this.elements.map(function (e) {
                var ret = context.evaluate(e);
                if (typeof ret === 'function') {
                    ret = ret.call();
                }
                return ret;
            });

            var child_process = require('child_process');
            var s = child_process.spawn('/bin/bash', ['-e']);
            s.stdout.on('data', function (data) {
                process.stdout.write(data);
            });
            s.stdin.write(this.elements.join(""));
            s.stdin.end();
        }
    };

    var TaskSection = function (name, lines) {
        this.name = name;
        this.lines = lines;
    };

    TaskSection.prototype = {
        resolve: function (context) {
            this.lines.forEach(function (l) {
                l.resolve(context);
            });
        }
    };

    var renderSyntaxError = function (fileName, contents, e) {
        var ret = '';
        ret += 'Syntax error in ' + fileName + ' at line ' + e.line + "\n";
        ret += "\n";
        ret += "    " + fileName + ":" + "\n";
        ret += '    ----------------------------------------' + "\n";
        if (e.line > 1) {
            ret += '    ' + (e.line - 1) + '. ' + contents.split("\n")[e.line - 2] + "\n";
        }
        ret += '    ' + e.line + '. ' + contents.split("\n")[e.line - 1] + "\n";
        ret += '    ' + new Array(e.column + 3).join(" ") + '^-- here' + "\n";
        ret += '    ----------------------------------------' + "\n";
        ret += "" + "\n";
        ret += e.message + "\n";
        return ret;
    };

    var precedence = ['*', '/', '+', '-'];

    return {
        precedence: function(op) {
            return precedence.indexOf(op);
        },

        parseFile: function (file) {
            var parser = require('../lib/parser.js'),
                fs = require('fs'),
                ret,
                fileContents = fs.readFileSync(file, 'utf-8')
                ;

            try {
                ret = parser.parse(fileContents);
            } catch (e) {
                if (e.constructor === parser.SyntaxError) {
                    console.log(renderSyntaxError(file, fileContents, e));
                }
                throw e;
            }
            return ret;
        },
        Literal: Literal,
        Closure: Closure,
        Definition: Definition,
        Decorator: Decorator,
        Invocation: Invocation,
        MemberAccess: MemberAccess,
        Arg: Arg,
        Container: Container,
        TaskLine: TaskLine,
        Identifier: Identifier,

        BinOp: BinOp,
        UnOp: UnOp,

        Context: Context,

        renderSyntaxError: renderSyntaxError
    }
})();
