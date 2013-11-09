.PHONY: jshint

jshint:
	find . -name "*.js" -maxdepth 1 | xargs node_modules/jshint/bin/jshint

default: jshint
