.PHONY: test
PEGJS = node_modules/pegjs/bin/pegjs
BABEL = node_modules/babel/bin/babel.js
tests =

clean:
	rm -f lib/parser.js

$(PEGJS):
	npm install

try:
	$(PEGJS) src/test.pegjs lib/test.js
	node tmp.js

lib:
	mkdir -p lib

lib/parser-util.js: lib src/parser-util.js
	$(BABEL) src/parser-util.js -o lib/parser-util.js

lib/main.js: lib src/main.js
	$(BABEL) src/main.js -o lib/main.js

lib/parser.js: $(PEGJS) lib src/grammar.pegjs lib/parser-util.js
	$(PEGJS) src/grammar.pegjs lib/parser.js

test: parser_test functional_test

parser_test: lib/parser.js parser-tests/* test.js
	node test.js $(tests)

functional_test: lib/parser.js lib/main.js functional-tests/*
	for f in functional-tests/*; do node lib/main.js $$f say; done;
