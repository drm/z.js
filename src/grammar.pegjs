{
    z = require('../src/parser-util.js');
}

start
    = list:statement* {
        return new z.Container(list.filter(function(v) {
            return !!v;
        }));
    }

statement
    = task
    / definition
    / comment

comment
    = (
        single_line_comment
    /   multiline_comment
    ) {
        return null;
    }

single_line_comment
    = '#' [^\n]+ "\n"

multiline_comment
    = '/*' ( !('*/') . )* '*/'

task
    = name:identifier _ args:arguments? _ ':' ws deps:deplist? "\n"
      lines:task_line* _ {
        return new z.Definition(
            name,
            new z.Task(
                deps,
                new z.Closure(
                    args,
                    lines
                )
            )
        );
    }

ch
    = !('\n') c:. {
        return c;
    }

task_line
    = indent '@' i:identifier "\n" {
        return new z.Identifier(i);
    }
    / indent data:line "\n" {
        return new z.TaskLine(data);
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
    / d:data_without_expr                     "\n"  {
        return d;
    }

definition
    = i:identifier _ '=' _ e:expr _ {
        return new z.Definition(i, e);
    }

deplist = dep*

dep
    = ws i:identifier ws {
        return new z.Identifier(i);
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
        return new z.Arg(i, d);
    }

arg_default
    = _ '=' _ expr:expr                                          { return expr; }


identifier
    = f:[a-z_-]i tail:[a-z0-9_-]i* {
        return f + tail.join("");
    }

expr
    = string
    / number
    / boolean
    / null
    / i:identifier {
        return new z.Identifier(i);
    }
    / array_literal
    / call
    / object_literal

array_literal
    = '[' _ list:expr_list? _ ']' {
        return list;
    }

object_literal
    = '{' _ list:object_member_list? _ '}' {
        var o = {};
        list.forEach(function(k) {
            o[k[0]] = k[1];
        });
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
    = expr:expr _ ',' _ tail:expr_list                            { return [expr].concat(tail); }
    / expr:expr                                                   { return [expr]; }

call
    = identifier _ '(' _ call_args? _ ')'

call_args
    = expr*


string
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

number
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

// optional whitespace
_  = [ \t\r\n]*

ws = [ \t]*

indent = [ \t]+

// mandatory whitespace
__ = [ \t\r\n]+

DIGIT  = [0-9]
HEXDIG = [0-9a-f]i