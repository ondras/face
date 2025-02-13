import * as ecs from "./ecs.ts";
import { assertEquals, assert } from "jsr:@std/assert";


export interface Position {
    x: number;
    y: number;
}

export interface Visual {
    ch: string;
}

interface Components {
    position: Position;
    visual: Visual;
}


Deno.test("component missing", () => {
	let w = ecs.createWorld<Components>();
	let e = w.createEntity();
	assertEquals(w.hasComponents(e, "position"), false);
	assertEquals(w.queryComponent(e, "position"), undefined);
});

Deno.test("component present", () => {
	let w = ecs.createWorld<Components>();
	let e = w.createEntity();
	let pos = {x:1, y:2};
	w.addComponent(e, "position", pos);
	assertEquals(w.hasComponents(e, "position"), true);
	assertEquals(w.hasComponents(e, "position", "visual"), false);
	assertEquals(w.queryComponent(e, "position"), pos);
});

Deno.test("multiple components present", () => {
	let w = ecs.createWorld<Components>();
	let e = w.createEntity();
	let pos = {x:1, y:2};
	let vis = {ch:"?"};
	w.addComponent(e, "position", pos);
	w.addComponent(e, "visual", vis);

	assertEquals(w.hasComponents(e, "position", "visual"), true);

	let result = w.queryComponents(e, "position", "visual");
	assertEquals(result?.position, pos);
	assertEquals(result?.visual, vis);
});

Deno.test("component search", () => {
	let w = ecs.createWorld<Components>();
	let e1 = w.createEntity();
	let e2 = w.createEntity();
	let e3 = w.createEntity();

	w.addComponent(e1, "position", {x:1, y:2});
	w.addComponent(e2, "visual", {ch:"?"});

	w.addComponent(e3, "position", {x:1, y:2});
	w.addComponent(e3, "visual", {ch:"?"});

	let position = w.findEntities("position");
	let visual = w.findEntities("visual");

	assert(position.includes(e1));
	assert(!position.includes(e2));
	assert(position.includes(e3));

	assert(!visual.includes(e1));
	assert(visual.includes(e2));
	assert(visual.includes(e3));
});
