.PHONY: test
PEGJS = node_modules/pegjs/bin/pegjs
tests =

clean:
	rm lib/parser.js

$(PEGJS):
	npm install

try:
	$(PEGJS) src/test.pegjs lib/test.js
	node tmp.js

lib/parser.js: $(PEGJS) src/grammar.pegjs src/parser-util.js
	$(PEGJS) src/grammar.pegjs lib/parser.js

test: parser_test functional_test

parser_test: lib/parser.js parser-tests/* test.js
	node test.js $(tests)

functional_test: lib/parser.js functional-tests/*
	node src/main.js functional-tests/01-hello.z say
	node src/main.js functional-tests/02-hello.z say
	node src/main.js functional-tests/03-hello.z say
	node src/main.js functional-tests/04-hello.z say
	node src/main.js functional-tests/05-hello.z say
	node src/main.js functional-tests/06-hello.z say
	node src/main.js functional-tests/07-hello.z say
	node src/main.js functional-tests/08-hello.z say
	node src/main.js functional-tests/09-hello.z say

