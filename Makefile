copyright:
	python .scripts/make_copyright_headers.py

prettier:
	npx prettier --write .

eslint:
	npx eslint . --ext .ts

test:
	npx mocha $(args)

build:
	npx tsc --build

documentation:
	npx typedoc --out ./docs src

watch:
	npx tsc -w

clean:
	rm -rf dist/*
