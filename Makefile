test:
	rm -rf coverage
	deno test --coverage
	deno coverage --detailed
