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
