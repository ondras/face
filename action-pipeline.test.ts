// deno-lint-ignore-file prefer-const

import { assertEquals, assertStrictEquals } from "jsr:@std/assert";
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

Deno.test("action pipeline processes returned actions before queued actions", async () => {
	let pipeline = new ActionPipeline<Action>();
	let log: string[] = [];

	pipeline.addProcessor(action => {
		log.push(action.type);
		if (action.type == "a") { return [{ type: "b" }, { type: "c" }]; }
	});

	pipeline.push({ type: "a" });
	pipeline.push({ type: "d" });

	await pipeline.run();

	assertEquals(log, ["a", "b", "c", "d"]);
});

Deno.test("action pipeline processes branching actions depth-first", async () => {
	let pipeline = new ActionPipeline<Action>();
	let log: string[] = [];

	pipeline.addProcessor(action => {
		log.push(action.type);
		if (action.type == "a") { return [{ type: "b" }, { type: "c" }]; }
		if (action.type == "b") { return [{ type: "d" }, { type: "e" }]; }
		if (action.type == "c") { return [{ type: "f" }]; }
	});

	pipeline.push({ type: "a" });

	await pipeline.run();

	assertEquals(log, ["a", "b", "d", "e", "c", "f"]);
});

Deno.test("action pipeline preserves returned action order across processors", async () => {
	let pipeline = new ActionPipeline<Action>();
	let log: string[] = [];

	pipeline.addProcessor(action => {
		log.push(`${action.type}:first`);
		if (action.type == "a") { return [{ type: "b" }, { type: "c" }]; }
	});
	pipeline.addProcessor(action => {
		log.push(`${action.type}:second`);
		if (action.type == "a") { return Promise.resolve([{ type: "d" }, { type: "e" }]); }
	});
	pipeline.push({ type: "a" });

	await pipeline.run();

	assertEquals(log, [
		"a:first", "a:second",
		"b:first", "b:second",
		"c:first", "c:second",
		"d:first", "d:second",
		"e:first", "e:second"
	]);
});

Deno.test("action pipeline passes immediate parent references to processors", async () => {
	let pipeline = new ActionPipeline<Action>();
	let a = { type: "a" };
	let b = { type: "b" };
	let c = { type: "c" };
	let d = { type: "d" };
	let e = { type: "e" };
	let parents = new Map<Action, Action | undefined>([
		[a, undefined], [b, a], [c, a], [d, b], [e, undefined]
	]);
	let log: string[] = [];

	pipeline.addProcessor((action, parent) => {
		assertStrictEquals(parent, parents.get(action));
		if (action == a) { return [b]; }
		if (action == b) { return [d]; }
	});
	pipeline.addProcessor((action, parent) => {
		assertStrictEquals(parent, parents.get(action));
		log.push(action.type);
		if (action == a) { return Promise.resolve([c]); }
	});
	pipeline.push(a);
	pipeline.push(e);

	await pipeline.run();

	assertEquals(log, ["a", "b", "d", "c", "e"]);
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
