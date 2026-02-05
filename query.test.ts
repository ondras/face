// deno-lint-ignore-file prefer-const

import { assertEquals } from "jsr:@std/assert";
import { World } from "./face.ts";


interface Components {
	name: string;
	speed: number;
}

Deno.test("query", () => {
	let w = new World<Components>();

	let e1 = w.createEntity({name:"e1"});
	let e2 = w.createEntity({speed:3});

	// retrieve entities at creation time
	let q = w.query("name");
	assertEquals(q.entities.size, 1);
	assertEquals(q.entities.has(e1), true);
	assertEquals(q.entities.has(e2), false);

	// add entity when created
	let e3 = w.createEntity({name:"e3"});
	assertEquals(q.entities.size, 2);
	assertEquals(q.entities.has(e1), true);
	assertEquals(q.entities.has(e2), false);
	assertEquals(q.entities.has(e3), true);

	// remove entity when destroyed
	w.removeEntity(e1);
	assertEquals(q.entities.size, 1);
	assertEquals(q.entities.has(e1), false);
	assertEquals(q.entities.has(e2), false);
	assertEquals(q.entities.has(e3), true);

	// add entity when component added
	w.addComponent(e2, "name", "e2");
	assertEquals(q.entities.size, 2);
	assertEquals(q.entities.has(e1), false);
	assertEquals(q.entities.has(e2), true);
	assertEquals(q.entities.has(e3), true);

	// remove entity when component removed
	w.removeComponents(e3, "name");
	assertEquals(q.entities.size, 1);
	assertEquals(q.entities.has(e1), false);
	assertEquals(q.entities.has(e2), true);
	assertEquals(q.entities.has(e3), false);

	q.destroy();
	assertEquals(q.entities.size, 0);
});
