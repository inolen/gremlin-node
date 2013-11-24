.PHONY: package lint test

default: package lint test

package:
	mvn clean package

lint:
	find lib -name "*.js" | xargs node_modules/jshint/bin/jshint

test:
	node_modules/mocha/bin/mocha --ui tdd --reporter=spec
