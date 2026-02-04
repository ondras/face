// deno-lint-ignore-file prefer-const

import { assertEquals, assert } from "jsr:@std/assert";
import { World, Actor, FairActorScheduler, DurationActorScheduler } from "./face.ts";


interface Components {
	actor: Actor;
	name: string;
	speed: number;
}

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