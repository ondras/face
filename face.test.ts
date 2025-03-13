// deno-lint-ignore-file prefer-const

import { World, Events, Actor, FairActorScheduler, DurationActorScheduler, PubSub } from "./face.ts";
import { assertEquals, assert, assertThrows } from "jsr:@std/assert";


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
	actor: Actor;
	name: string;
	speed: number;
}

interface Messages {
	"a": {b:string}
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

	w.removeComponent(e, "position");
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

Deno.test("fair scheduler", () => {
	let w = new World<Components>();
	let s = new FairActorScheduler(w);

	assert(!s.next());

	w.createEntity({actor:{wait: 0}, name:"1"});
	w.createEntity({actor:{wait: 0}, name:"2"});
	let log = "";

	for (let i=0;i<10;i++) {
		let entity = s.next();
		assert(entity);
		log += w.getComponent(entity!, "name");
	}

	assertEquals(log, "1212121212");
});

Deno.test("duration scheduler", () => {
	let w = new World<Components>();
	let s = new DurationActorScheduler(w);

	assert(!s.next());

	w.createEntity({actor:{wait: 0}, name:"1", speed:100});
	w.createEntity({actor:{wait: 0}, name:"2", speed:200});
	w.createEntity({actor:{wait: 0}, name:"3", speed:50});
	let log = "";

	for (let i=0;i<14;i++) {
		let entity = s.next();
		assert(entity);

		let speed = w.getComponent(entity!, "speed")!;
		s.commit(entity!, 1/speed);

		log += w.getComponent(entity!, "name");
	}

	assert(log.includes("1"));
	assert(log.includes("2"));
	assert(log.includes("3"));

	assertEquals(log.match(/2/g)!.length, 8);
	assertEquals(log.match(/1/g)!.length, 4);
	assertEquals(log.match(/3/g)!.length, 2);
});

Deno.test("pubsub", async () => {
	let pubsub = new PubSub<Messages>();
	let count = 0;

	let listener = async function(data: Messages["a"]) {
		await new Promise(resolve => setTimeout(resolve, 5));
		assertEquals(data.b, "test");
		count++;
	}

	pubsub.subscribe("a", listener);
	await pubsub.publish("a", {b:"test"});
	assertEquals(count, 1);

	pubsub.unsubscribe("a", listener);
	await pubsub.publish("a", {b:"test"});
	assertEquals(count, 1);
});

Deno.test("builtin events", async () => {
	let w = new World<Components>();
	let e = w.createEntity();
	let addCount = 0;
	let removeCount = 0;

	let addListener = function(ev: CustomEvent<Events["component-add"]>) {
		assertEquals(ev.detail.entity, e);
		addCount++;
	}

	let removeListener = function(ev: CustomEvent<Events["component-remove"]>) {
		assertEquals(ev.detail.entity, e);
		removeCount++;
	}

	w.addEventListener("component-add", addListener);
	w.addEventListener("component-remove", removeListener);


	w.addComponent(e, "position", {x:1, y:2});
	assertEquals(addCount, 1);
	assertEquals(removeCount, 0);

	w.removeComponent(e, "position");
	assertEquals(addCount, 1);
	assertEquals(removeCount, 1);
});

Deno.test("custom events, sync", () => {
	interface TestEvents extends Events {
		"test": {"a":string}
	}
	let w = new World<Components, TestEvents>();
	let count = 0;

	let listener = function(e: CustomEvent<TestEvents["test"]>) {
		assertEquals(e.detail.a, "b");
		count++;
	}

	w.addEventListener("test", listener);
	w.dispatchEvent(new CustomEvent("test", {detail:{a:"b"}}));
	assertEquals(count, 1);

	w.removeEventListener("test", listener);
	w.dispatchEvent(new CustomEvent("test", {detail:{a:"b"}}));
	assertEquals(count, 1);
});

Deno.test("custom events, async", async () => {
	interface TestEvents extends Events {
		"test": {"a":string}
	}
	let w = new World<Components, TestEvents>();
	let count = 0;

	let listener = function(e: WaitingEvent<{}>) {
		let p1 = new Promise(resolve => setTimeout(resolve, 10));
		let p2 = p1.then(() => count++);
		e.waitUntil(p2);
	}
	w.addEventListener("test", listener);

	let event = new WaitingEvent("test", {detail:{a:"b"}});
	w.dispatchEvent(event);
	assertEquals(count, 0);

	await event.finish();
	assertEquals(count, 1);
});

class WaitingEvent<T> extends CustomEvent<T> {
	protected promises: Promise<any>[] = [];
	waitUntil(p: Promise<any>) {
		this.promises.push(p);
	}

	async finish() {
		await Promise.all(this.promises);
	}
}
