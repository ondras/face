// deno-lint-ignore-file prefer-const

import { assertEquals, assert } from "jsr:@std/assert";
import { World, SpatialIndex } from "./face.ts";


interface Position {
    x: number;
    y: number;
}

interface Components {
	position: Position;
}

Deno.test("spatial index", () => {
	let w = new World<Components>();
	let si = new SpatialIndex(w);

	let e1 = w.createEntity({position: {x:5, y:5}});
	let e2 = w.createEntity({position: {x:5, y:5}});

	assertEquals(si.list(0, 0).size, 0);
	assertEquals(si.list(5, 5).size, 0);

	si.update(e1);
	assertEquals(si.list(5, 5).size, 1);
	assert(si.list(5, 5).has(e1));

	si.update(e2);
	assertEquals(si.list(5, 5).size, 2);
	assert(si.list(5, 5).has(e1));
	assert(si.list(5, 5).has(e2));

	w.requireComponent(e1, "position").x = 6;
	si.update(e1);

	assertEquals(si.list(5, 5).size, 1);
	assert(si.list(5, 5).has(e2));
	assertEquals(si.list(6, 5).size, 1);
	assert(si.list(6, 5).has(e1));

	w.removeComponents(e2, "position");
	si.update(e2);
	assertEquals(si.list(5, 5).size, 0);
});

Deno.test("negative coordinates", () => {
	let w = new World<Components>();
	let si = new SpatialIndex(w);

	let e = w.createEntity({position: {x:1, y:1}});
	si.update(e);

	assertEquals(si.list(-1, 1).size, 0);
	assertEquals(si.list(1, -1).size, 0);
	assertEquals(si.list(-1, -1).size, 0);
	assertEquals(si.list(1, 1).size, 1);
});

Deno.test("rebuilds after world fromString", () => {
	let w = new World<Components>();
	let si = new SpatialIndex(w);

	let snapshot = w.toString();

	let e1 = w.createEntity({position: {x:1, y:1}});
	si.update(e1);

	assertEquals(si.list(1, 1).size, 1);
	assert(si.list(1, 1).has(e1));

	w.fromString(snapshot);

	assertEquals(si.list(1, 1).size, 0);
});

Deno.test("rebuild restores entities from snapshot", () => {
	let w = new World<Components>();
	let si = new SpatialIndex(w);

	let e1 = w.createEntity({position: {x:2, y:3}});
	si.update(e1);
	let snapshot = w.toString();

	w.requireComponent(e1, "position").x = 4;
	w.requireComponent(e1, "position").y = 5;
	si.update(e1);

	assertEquals(si.list(2, 3).size, 0);
	assertEquals(si.list(4, 5).size, 1);

	w.fromString(snapshot);

	assertEquals(si.list(2, 3).size, 1);
	assert(si.list(2, 3).has(e1));
	assertEquals(si.list(4, 5).size, 0);
});
