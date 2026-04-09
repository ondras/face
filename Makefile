test:
	deno test --coverage --clean
	deno coverage --detailed

example:
	$(MAKE) -C example

.PHONY: example
