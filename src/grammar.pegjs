{
    z = require('../src/parser-util.js');
}

start
    = declarations:spec* {
        return new z.Container(declarations);
    }

spec
    = declaration
    / definition
    / comment

comment = _ '/' '/' [^\n]+ "\n" _

declaration =
    name:identifier
    _ '=>'
    _ args:arguments?
    _ body:body _ {
        return new z.Declaration(name, args || [], body);
    }

definition =
    name:identifier
    _ '=' _
    body:expr _ {
        return new z.Definition(name, body);
    }

optional_declaration_operator
    = _ ':' _

task_line_start_operator
    = _ '-' _

body
    = '{' _ spec:task_spec* _ '}' { return new z.Task(spec); }
    / body:task_section_body      { return new z.Task([new z.TaskSection("do", body)]); }

task_spec
    = task_section
    / precondition

task_section
    = _ name:section_name optional_declaration_operator body:task_section_body _       { return new z.TaskSection(name, body); }

precondition
    = name:precondition_name _ optional_declaration_operator expr:expr _      { return new z.TaskPrecondition(name, expr); }

section_name
    = $ 'do'
    / $ 'pre'
    / $ 'post'

precondition_name
    = 'if'
    / 'unless'
    / 'assert'

task_section_body
    = '{' _ lines:task_line* _ '}'                              { return lines; }
    / line:task_line                                            { return [new z.TaskLine(line)]; }

task_line
    =  _ task_line_start_operator  _ data:line                  { return new z.TaskLine(data); }

arguments
    = '(' _ arglist:arglist? _ ')'                              { return arglist; }


cdata
    = !('$(') c:[^\n] { return c; };

data_with_expr
    = data:cdata* '$(' expr:expr ')' { return [data.join(""), expr]; }

data_without_expr
    = data:cdata* { return [data.join("")] }

line
    = d1:data_with_expr* d2:data_without_expr "\n"  {
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

arglist
    = arg:arg _ nextarg:nextarg? {
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

expr
    = arithmetic_expr
    / string
    / boolean
    / number
    / call
    / array_literal
    / identifier:identifier                                       { return new z.Identifier(identifier); }


op_sum
    = '+'
    / '-'

op_mul
    = '*'
    / '/'

arithmetic_expr =
    left:sum_operand
    _ op:op_sum
    _ right:sum_operand {
        return new z.BinOp(op, left, right);
    }

parenthesized_expr =
    '(' expr:expr ')' {
        return expr;
    }

sum_operand =
    ( multiplication
        / number
        / string
        / parenthesized_expr
    )

multiplication =
    left:multiplication_operand
    _ op:op_mul
    _ right:multiplication_operand {
        return new z.BinOp(op, left, right);
    }

multiplication_operand =
    number
    / parenthesized_expr

array_literal
    = '[' _ list:expr_list _ ']'                                  { return list; }

expr_list
    = expr:expr _ ',' _ tail:expr_list                            { return [expr].concat(tail); }
    / expr:expr                                                   { return [expr]; }

call
    = identifier _ '(' _ call_args? _ ')'

call_args
    = expr*

identifier
    = $ [a-zA-Z_]+

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

// mandatory whitespace
__ = [ \t\r\n]+


DIGIT  = [0-9]
HEXDIG = [0-9a-f]i