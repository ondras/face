test:
	rm -rf coverage
	deno test --coverage
	deno coverage --detailed

example:
	$(MAKE) -C example

.PHONY: example
