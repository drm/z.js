.PHONY: test
PEGJS = node_modules/pegjs/bin/pegjs
tests =

clean:
	rm lib/parser.js

$(PEGJS):
	npm install

lib/parser.js: $(PEGJS) src/grammar.pegjs lib/parser-util.js
	$(PEGJS) src/grammar.pegjs lib/parser.js

test: lib/parser.js parser-tests/* parser-test.js
	node parser-test.js $(tests)

lib/parser-util.js: src/parser-util.js
	cd lib && ln -sf ../src/parser-util.js