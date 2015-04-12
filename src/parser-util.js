module.exports = (function () {
    var vm = require('vm');

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
        },

        normalize: function () {
            if (this.expr.normalize) {
                this.expr.normalize();
            }
            return this;
        }
    };

    var Decorator = function (decoratee, expr) {
        this.decoratee = decoratee;
        this.expr = expr;
    };

    Decorator.prototype = {
        resolve: function (context) {
            var decoratorConstructor = this.expr.resolve(context); //.resolve(this.expr);
            var self = this;
            var decorator = new decoratorConstructor(
                self.decoratee,
                self.args
            );
            return decorator.resolve(context);
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
            return target.call(this.args.map(function(a) {
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
        }
    };


    var Closure = function (args, body) {
        this.args = args || [];
        this.body = body || [];
    };

    Closure.prototype = {
        resolve: function (context) {
            context.enterScope(this.name);
            this.args.forEach(function (a) {
                a.resolve(context);
            });
            var ret = this.body.forEach(function (d) {
                d.resolve(context);
            });
            context.exitScope(this.name);
            return ret;
        },

        normalize: function () {
            this.args.forEach(function (a) {
                a.normalize();
            });
            this.body.forEach(function (o) {
                o.normalize();
            });
            return this;
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
        resolve: function (context) {
            if (!context.exists(this.name)) {
                context.set(this.name, context.evaluate(this.default_value));
            }
        },

        normalize: function () {
            return this;
        }
    }

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
                    return expr;
                case typeof expr === 'number':
                case typeof expr === 'boolean':
                    return '' + expr;
                case typeof expr == 'undefined':
                    throw new Error("Cannot resolve undefined value");
            }
            if (typeof expr.resolve === 'function') {
                return expr.resolve(this);
            } else if (typeof expr === 'function') {
                return expr;
            }
            throw new Error("Unmatched type " + (typeof expr) + " (" + expr.constructor.name + ")");
        },

        enterScope: function (name) {
            this.scope.push(name);
        },

        exitScope: function (name) {
            var popped = this.scope.pop();
            if (popped !== name) {
                throw new ScopeError("Invalid scope shift, expected to exit scope '" + name + "' but got '" + popped + "'");
            }
        }
    };

    var Container = function (declarations) {
        this.context = new Context();
        if (typeof declarations === "undefined") {
            declarations = [];
        }

        this.root = declarations;

        this.context.set('depends', DependsDecorator);
        this.context.set('triggers', TriggerDecorator);
    };

    Container.prototype = {
        addPrelude: function(prelude) {
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
        },

        normalize: function () {
            var ctx = this.context;
            this.root.filter(function (d) {
                return d instanceof Definition;
            }).forEach(function (d) {
                if (typeof d === 'object') {
                    d.normalize();
                }
                ctx.set(d.name, d);
            });

            return this;
        }
    };

    var Identifier = function (name) {
        this.name = name;
    };

    Identifier.prototype.resolve = function (context) {
        return context.evaluate(context.get(this.name));
    };

    var TaskLine = function (elements) {
        this.elements = elements;
    };

    TaskLine.prototype = {
        resolve: function (context) {
            this.elements = this.elements.map(function (e) {
                return context.evaluate(e);
            });

            var child_process = require('child_process');
            var s = child_process.spawn('/bin/bash', ['-e']);
            s.stdout.on('data', function (data) {
                process.stdout.write(data);
            });
            s.stdin.write(this.elements.join(""));
            s.stdin.end();
        },

        normalize: function () {
            return this;
        }
    };

    var Call = function(fn, args) {

    };

    Call.prototype.resolve = function (context) {
        return context.resolve(this.fn).apply(this.args);
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


    return {
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
            ret.normalize();
            return ret;
        },
        Call: Call,
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

        renderSyntaxError: renderSyntaxError
    }
})();
