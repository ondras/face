SOURCES := $(shell find . -name "*.ts")

index.js: $(SOURCES)
	deno bundle --check index.ts -o $@

check:
	deno check