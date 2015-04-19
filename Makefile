.PHONY: test
PEGJS = node_modules/pegjs/bin/pegjs
tests =

clean:
	rm -f lib/parser.js

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
	for f in functional-tests/*; do node src/main.js $$f say; done;
