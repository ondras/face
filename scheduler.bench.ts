// deno-lint-ignore-file prefer-const

import { DurationActorScheduler, FairActorScheduler, World, type Actor } from "./face.ts";


interface Components {
	actor: Actor;
	name: string;
}

function populatedWorld(count: number) {
	let world = new World<Components>();

	for (let i = 0; i < count; i++) {
		world.createEntity({
			actor: { wait: i % 5 },
			name: `${i}`,
		});
	}

	return world;
}

for (let count of [10, 100, 1000]) {
	Deno.bench(`duration scheduler next (${count})`, { group: "duration next" }, b => {
		let world = populatedWorld(count);
		let scheduler = new DurationActorScheduler(world);

		b.start();
		scheduler.next();
		b.end();
	});
}

for (let count of [10, 100, 1000]) {
	Deno.bench(`fair scheduler next (${count})`, { group: "fair next" }, b => {
		let world = populatedWorld(count);
		let scheduler = new FairActorScheduler(world);

		b.start();
		scheduler.next();
		b.end();
	});
}

for (let count of [10, 100, 1000]) {
	Deno.bench(`duration scheduler commit (${count})`, { group: "duration commit" }, b => {
		let world = populatedWorld(count);
		let scheduler = new DurationActorScheduler(world);
		let entity = count;

		b.start();
		scheduler.commit(entity, 1);
		b.end();
	});
}
