// deno-lint-ignore-file prefer-const

import { assertEquals, assert, assertThrows } from "jsr:@std/assert";
import { World } from "./face.ts";


interface Position {
    x: number;
    y: number;
}

interface Visual {
    ch: string;
}

interface Components {
    position: Position;
    visual: Visual;
}

Deno.test("component missing", () => {
	let w = new World<Components>();
	let e = w.createEntity();
	assertEquals(w.hasComponents(e, "position"), false);
	assertEquals(w.getComponent(e, "position"), undefined);
	assertThrows(() => w.requireComponent(e, "position"));
	assertThrows(() => w.requireComponents(e, "position"));
});

Deno.test("component present", () => {
	let w = new World<Components>();
	let e = w.createEntity();
	let pos = {x:1, y:2};
	w.addComponent(e, "position", pos);
	assertEquals(w.hasComponents(e, "position"), true);
	assertEquals(w.hasComponents(e, "position", "visual"), false);
	assertEquals(w.getComponent(e, "position"), pos);
	assertEquals(w.requireComponent(e, "position"), pos);
});

Deno.test("multiple components present", () => {
	let w = new World<Components>();
	let e = w.createEntity();
	let pos = {x:1, y:2};
	let vis = {ch:"?"};
	w.addComponent(e, "position", pos);
	w.addComponent(e, "visual", vis);

	assertEquals(w.hasComponents(e, "position", "visual"), true);

	let result = w.getComponents(e, "position", "visual");
	assertEquals(result?.position, pos);
	assertEquals(result?.visual, vis);

	result = w.requireComponents(e, "position", "visual");
	assertEquals(result.position, pos);
	assertEquals(result.visual, vis);
});

Deno.test("subset of components", () => {
	let w = new World<Components>();
	let e = w.createEntity();
	let pos = {x:1, y:2};
	let vis = {ch:"?"};

	w.addComponent(e, "position", pos);
	w.addComponent(e, "visual", vis);
	assertEquals(w.hasComponents(e, "position", "visual"), true);

	w.removeComponents(e, "visual");
	assertEquals(w.hasComponents(e, "position", "visual"), false);

	let result = w.getComponents(e, "position", "visual");
	assertEquals(result, undefined);
});

Deno.test("component search", () => {
	let w = new World<Components>();
	let e1 = w.createEntity();
	let e2 = w.createEntity();
	let e3 = w.createEntity();

	w.addComponent(e1, "position", {x:1, y:2});
	w.addComponent(e2, "visual", {ch:"?"});

	w.addComponent(e3, "position", {x:1, y:2});
	w.addComponent(e3, "visual", {ch:"?"});

	let positionResults = w.findEntities("position");
	let positionEntities = positionResults.map(result => result.entity);
	let visualEntities = w.findEntities("visual").map(result => result.entity);

	assert(positionEntities.includes(e1));
	assert(!positionEntities.includes(e2));
	assert(positionEntities.includes(e3));

	assert(!visualEntities.includes(e1));
	assert(visualEntities.includes(e2));
	assert(visualEntities.includes(e3));

	positionResults.forEach(result => {
		assert(result.entity);
		assert(result.position);
		assert(result.position.x);
	})
});

Deno.test("initial components", () => {
	let w = new World<Components>();
	let e = w.createEntity({
		position: {x:1, y:2},
		visual: {ch:"?"},
	});

	assert(w.hasComponents(e, "position", "visual"));
});

Deno.test("component removal", () => {
	let w = new World<Components>();
	let e = w.createEntity();
	w.addComponent(e, "position", {x:1, y:2});
	w.addComponent(e, "visual", {ch:"?"});

	w.removeComponents(e, "position");
	assertEquals(w.hasComponents(e, "position"), false);
	assertEquals(w.hasComponents(e, "visual"), true);
});

Deno.test("nonexistant entity", () => {
	let w = new World<Components>();
	let e = 1;

	assertEquals(w.hasComponents(e, "position"), false);
	assertEquals(w.getComponent(e, "position"), undefined);
	assertThrows(() => w.requireComponent(e, "position"));
	assertThrows(() => w.requireComponents(e, "position"));
	w.addComponent(e, "position", {x:1, y:2});
	assertEquals(w.hasComponents(e, "position"), true);
});

Deno.test("mutable component", () => {
	let w = new World<Components>();
	let e = w.createEntity();
	let position = {x:1, y:2};
	w.addComponent(e, "position", position);
	position.x = 3;
	assertEquals(w.requireComponent(e, "position").x, 1);
});

Deno.test("remove entity", () => {
	let w = new World<Components>();
	let e = w.createEntity();
	let position = {x:1, y:2};
	w.addComponent(e, "position", position);

	w.removeEntity(e);
	assertEquals(w.hasComponents(e, "position"), false);
});

Deno.test("events", () => {
	let w = new World<Components>();

	let events: CustomEvent[] = [];
	function listener(e: CustomEvent) { events.push(e);}

	w.addEventListener("entity-create", listener);
	w.addEventListener("entity-remove", listener);
	w.addEventListener("component-add", listener);
	w.addEventListener("component-remove", listener);

	let e1 = w.createEntity();
	assertEquals(events.length, 1);
	assertEquals(events[0].type, "entity-create");
	assertEquals(events[0].detail.entity, e1);
	events = [];

	let e2 = w.createEntity({position:{x:1,y:2}});
	assertEquals(events.length, 2);
	assertEquals(events[0].type, "entity-create");
	assertEquals(events[0].detail.entity, e2);
	assertEquals(events[1].type, "component-add");
	assertEquals(events[1].detail.entity, e2);
	assertEquals(events[1].detail.component, "position");
	events = [];

	w.addComponent(e1, "visual", {ch:"?"});
	assertEquals(events.length, 1);
	assertEquals(events[0].type, "component-add");
	assertEquals(events[0].detail.entity, e1);
	assertEquals(events[0].detail.component, "visual");
	events = [];

	w.removeComponents(e2, "position");
	assertEquals(events.length, 1);
	assertEquals(events[0].type, "component-remove");
	assertEquals(events[0].detail.entity, e2);
	assertEquals(events[0].detail.component, "position");
	events = [];

	w.removeEntity(e1);
	assertEquals(events.length, 1);
	assertEquals(events[0].type, "entity-remove");
	assertEquals(events[0].detail.entity, e1);
	events = [];
});
