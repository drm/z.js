.PHONY: test
PEGJS = node_modules/pegjs/bin/pegjs
tests =

clean:
	rm lib/parser.js

$(PEGJS):
	npm install

lib/parser.js: $(PEGJS) src/grammar.pegjs lib/parser-util.js
	$(PEGJS) src/grammar.pegjs lib/parser.js

test: lib/parser.js parser-tests/* test.js parser_test functional_test

parser_test:
	node test.js $(tests)

functional_test:
	node src/main.js functional-tests/01-hello.z hello

lib/parser-util.js: src/parser-util.js
	cd lib && ln -sf ../src/parser-util.js
