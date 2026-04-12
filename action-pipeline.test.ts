// deno-lint-ignore-file prefer-const

import { assertEquals } from "jsr:@std/assert";
import { ActionPipeline } from "./face.ts";


interface Action {
	type: string;
}

Deno.test("action pipeline empty run", async () => {
	let pipeline = new ActionPipeline<Action>();
	let calls = 0;

	pipeline.addProcessor(_action => { calls++; });

	await pipeline.run();

	assertEquals(calls, 0);
});

Deno.test("action pipeline basic processing", async () => {
	let pipeline = new ActionPipeline<Action>();
	let log: string[] = [];

	pipeline.addProcessor(action => { log.push(action.type); });
	pipeline.push({ type: "a" });

	await pipeline.run();

	assertEquals(log, ["a"]);
});

Deno.test("action pipeline processor order", async () => {
	let pipeline = new ActionPipeline<Action>();
	let log: string[] = [];

	pipeline.addProcessor(action => { log.push(`${action.type}:first`); });
	pipeline.addProcessor(action => { log.push(`${action.type}:second`); });
	pipeline.push({ type: "a" });

	await pipeline.run();

	assertEquals(log, ["a:first", "a:second"]);
});

Deno.test("action pipeline finishes all processors before returned actions", async () => {
	let pipeline = new ActionPipeline<Action>();
	let log: string[] = [];

	pipeline.addProcessor(action => {
		log.push(`${action.type}:first`);
		if (action.type == "a") { return [{ type: "b" }]; }
	});
	pipeline.addProcessor(action => {
		log.push(`${action.type}:second`);
	});
	pipeline.push({ type: "a" });

	await pipeline.run();

	assertEquals(log, ["a:first", "a:second", "b:first", "b:second"]);
});

Deno.test("action pipeline processes returned actions in FIFO order", async () => {
	let pipeline = new ActionPipeline<Action>();
	let log: string[] = [];

	pipeline.addProcessor(action => {
		log.push(action.type);
		if (action.type == "a") { return [{ type: "b" }, { type: "c" }]; }
	});

	pipeline.push({ type: "a" });
	pipeline.push({ type: "d" });

	await pipeline.run();

	assertEquals(log, ["a", "d", "b", "c"]);
});

Deno.test("action pipeline processes cascading actions", async () => {
	let pipeline = new ActionPipeline<Action>();
	let log: string[] = [];

	pipeline.addProcessor(action => {
		log.push(action.type);
		if (action.type == "a") { return [{ type: "b" }]; }
		if (action.type == "b") { return [{ type: "c" }]; }
	});

	pipeline.push({ type: "a" });

	await pipeline.run();

	assertEquals(log, ["a", "b", "c"]);
});

Deno.test("action pipeline awaits async processors", async () => {
	let pipeline = new ActionPipeline<Action>();
	let log: string[] = [];

	pipeline.addProcessor(async action => {
		log.push(`${action.type}:start`);
		await new Promise(resolve => setTimeout(resolve, 10));
		log.push(`${action.type}:end`);
	});

	pipeline.push({ type: "a" });
	pipeline.push({ type: "b" });

	await pipeline.run();

	assertEquals(log, ["a:start", "a:end", "b:start", "b:end"]);
});
