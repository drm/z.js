{
    var z = require('./parser-util.js');

    function create(node) {
        if (options.nodebug) {
            return node;
        }
        node.debug = location();
        node.debug.file = options.file;
        node.debug.src = options.src;
        return node;
    }

    function decorate(decorators, object) {
        decorators.forEach(function(decorator) {
            object = create(new z.Decorator(decorator, object));
        });
        return object;
    }
}

// -------------------------------------------------------------------------------------------------------------------
// Start rules
// -------------------------------------------------------------------------------------------------------------------

start
    = prelude:prelude?
      list:statement* {
        var container = new z.Container();
        container.addPrelude(prelude);

        list.forEach(function(d) {
            if (!!d) {
                container.context.set(d.name, d);
            }
        });

        return container;
    }

// -------------------------------------------------------------------------------------------------------------------
// Prelude
// -------------------------------------------------------------------------------------------------------------------

PRELUDE_START = '{{'
PRELUDE_END = '}}'
prelude
    = PRELUDE_START
        content:$(
            (!(PRELUDE_END) ch:.)
        )*
        PRELUDE_END {
        return content;
    }

// -------------------------------------------------------------------------------------------------------------------
// Statements
// -------------------------------------------------------------------------------------------------------------------
statement
    = task
    / definition
    / comment
    / NEWLINE {
        return null;
    }

// -------------------------------------------------------------------------------------------------------------------
// Task definition
// -------------------------------------------------------------------------------------------------------------------
task
    = decorators:decorator*
      name:identifier ws args:arguments? ws ':' ws EOL
      lines:task_line* _ {
        return create(new z.Definition(
            name,
            decorate(
                decorators,
                create(new z.Closure(args || [], lines))
            )
        ));
    }

decorator
    = '@' e:expr ws EOL {
        return e;
    }

ch
    = !('\n') c:. {
        return c;
    }

task_line
    = indent '@' i:identifier EOL {
        return create(new z.Identifier(i));
    }
    / indent data:line EOL {
        return create(new z.TaskLine(data));
    }

cdata
    = !('$(') c:[^\n] { return c; };

data_with_expr
    = data:cdata* '$(' expr:expr ')' { return [data.join(""), expr]; }

data_without_expr
    = data:cdata* { return [data.join("")] }

line
    = d1:data_with_expr* d2:data_without_expr {
        var d = [];
        d1.forEach(function(i) {
            if (i) {
                d = d.concat(i);
            }
        });
        return d2[0].length > 0 ? d.concat(d2) : d;
    }
    / d:data_without_expr EOL  {
        return d;
    }


// -------------------------------------------------------------------------------------------------------------------
// Regular definition
// -------------------------------------------------------------------------------------------------------------------
definition
    = i:identifier _ '=' _ e:expr _ {
        return create(new z.Definition(i, e));
    }

deplist = dep*

dep
    = ws i:identifier ws {
        return create(new z.Identifier(i));
    }

arguments
    = '(' args:arglist? ')' {
        return args;
    }


arglist
    = _ arg:arg _ nextarg:nextarg? _ {
        return nextarg ? [arg].concat(nextarg) : [arg];
    }

nextarg
    = ',' _ arglist:arglist {
        return arglist;
    }

arg
    = i:identifier d:arg_default? {
        return create(new z.Arg(i, d));
    }

arg_default
    = _ '=' _ expr:expr {
        return expr;
    }

identifier "Identifier"
    = f:[a-z_-]i tail:[a-z0-9_-]i* {
        return f + tail.join("");
    }


_expr
    =   op: UNARY_OP*
        e:(
            '(' args:arglist? ')' ws '=>' ws expr:expr {
                return create(new z.Closure(
                    args,
                    [expr]
                    ));
                }
            / '(' expr: expr ')' {
               return expr
            }
            / literal:(
                string
                / number
                / boolean
                / null
                / array_literal
                / object_literal
            ) {
                return create(new z.Literal(literal));
            }
            / i:identifier {
                return create(new z.Identifier(i));
            }
        ) s:subscript* {
            s.forEach(function(subscript) {
                subscript.setSubject(e);
                e = subscript;
            });
            if (op.length) {
                op.reverse().forEach(function(op) {
                    e = create(new z.UnOp(op, e));
                });
            }
            return e;
        }

expr
    = lhs:(_expr) op:(
        _ op:BINARY_OP _ expr:_expr {
            return {
                op: op,
                expr: expr
            };
        }
    )* {
        var ret = lhs;
        if (op) {
            op.forEach(function(operation, i) {
                if (i > 0 && typeof ret.op !== 'undefined') {
                    if (z.precedence(ret.op) <= z.precedence(operation.op)) {
                        ret = create(new z.BinOp(
                            operation.op,
                            ret,
                            operation.expr
                        ));
                    } else {
                        ret = create(new z.BinOp(
                            ret.op,
                            ret.left,
                            create(new z.BinOp(
                                operation.op,
                                ret.right,
                                operation.expr
                            ))
                        ));
                    }
                } else {
                    ret = create(new z.BinOp(
                        operation.op,
                        ret,
                        operation.expr
                    ));
                }
            });
        }
        return ret;
    }

subscript
    = invocation
    / dot_member_access
    / member_access

invocation
    =  '(' args:expr_list? ')' {
        return create(new z.Invocation(args));
    }

dot_member_access
    = '.' name:identifier {
        return create(new z.MemberAccess(new z.Literal(name)));
    }

member_access
    = '[' e:expr ']' {
        return create(new z.MemberAccess(e));
    }

array_literal
    = '[' _ list:expr_list? _ ']' {
        return list || [];
    }

object_literal "Object"
    = '{' _ list:object_member_list? _ '}' {
        var o = {};
        if (list) {
            list.forEach(function(k) {
                o[k[0]] = k[1];
            });
        }
        return o;
    }

object_member_list
    = o:object_member tail:object_member_tail* {
        return [o].concat(tail);
    }
object_member_tail
    = ',' _ o:object_member {
        return o;
    }

object_member
    = name:( string / identifier)
      _ ':' _ value:expr {
        return [name, value];
    }

expr_list
    = expr:expr _ ',' _ tail:expr_list {
        return [expr].concat(tail);
    }
    / expr:expr {
        return [expr];
    }


string "String"
    = double_quoted_string
    / single_quoted_string

single_quoted_string
    = "'" chars:single_quoted_char* "'" { return chars.join(""); }

double_quoted_string
    = '"' chars:double_quoted_char* '"' { return chars.join(""); }

double_quoted_char
  = "\\"
    sequence:(
        '"' { return '"' }
      / "\\" { return "\\" }
      / "b" { return "\b"; }
      / "f" { return "\f"; }
      / "n" { return "\n"; }
      / "r" { return "\r"; }
      / "t" { return "\t"; }
      / "u" digits:$(HEXDIG HEXDIG HEXDIG HEXDIG) {
          return String.fromCharCode(parseInt(digits, 16));
        }
    )
    { return sequence; }
  / $ [^"]+

single_quoted_char
  = "\\"
    sequence:(
        "'"  { return "'"; }
      / "\\" { return "\\"; }
    )
    { return sequence; }
  / $ [^']+

number "Number"
    = float
    / integer

integer
    = i:[0-9]+ { return parseInt(i.join("")); }

float
    = v:( [0-9]* '.' [0-9]+ ) { return parseFloat(v[0].join("") + '.' + v[2].join("")); }

boolean
    = 'true' { return true; }
    / 'false' { return false; }

null
    = 'null' { return null; }

// -------------------------------------------------------------------------------------------------------------------
// Comments
// -------------------------------------------------------------------------------------------------------------------
comment "Comment"
    = (
        single_line_comment
    /   multiline_comment
    ) {
        return null;
    }

inline_comment
    = ( '#' / '//' ) [^\n]+
    / multiline_comment

single_line_comment
    = ( '#' / '//' ) [^\n]* EOL

multiline_comment
    = '/*' ( !('*/') . )* '*/'


// -------------------------------------------------------------------------------------------------------------------
// Whitespace
// -------------------------------------------------------------------------------------------------------------------

// any optional whitespace
_  "whitespace"
    = [ \t\r\n]*

// optional whitespace without newlines
ws "whitespace"
    = [ \t]*

// mandatory whitespace
__ = [ \t\r\n]+

// mandatory whitespace without newlines
indent = [ \t]+


BINARY_OP "Binary operator"
    = '+' / '-' / '*' / '/' / '&&' / '||' / '=='

UNARY_OP
    = '!' / '+' / '-' / '&'

// -------------------------------------------------------------------------------------------------------------------
// Some helpful definitions
// -------------------------------------------------------------------------------------------------------------------

EOL = ( NEWLINE / EOF )
EOF = !.
DIGIT  = [0-9]
HEXDIG = [0-9a-f]i
NEWLINE = "\n"
