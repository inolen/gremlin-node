.PHONY: jshint test

default: jshint test

jshint:
	find lib -name "*.js" | xargs node_modules/jshint/bin/jshint

test:
	node_modules/mocha/bin/mocha --ui tdd
