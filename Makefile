.PHONY: test
PEGJS = node_modules/pegjs/bin/pegjs
BABEL = node_modules/babel/bin/babel.js
tests =

clean:
	rm -f lib/parser.js

$(PEGJS):
	npm install

lib:
	mkdir -p lib

lib/%.js: src/%.js
	$(BABEL) -o $@ $<

build: lib/parser-util.js lib/defaults.js lib/main.js lib/parser.js

lib/parser.js: $(PEGJS) lib src/grammar.pegjs lib/parser-util.js
	$(PEGJS) src/grammar.pegjs lib/parser.js

test: parser_test functional_test

parser_test: build parser-tests/* test.js
	node test.js $(tests)

functional_test: build functional-tests/*
	for f in functional-tests/*; do node lib/main.js $$f say; done;
