// deno-lint-ignore-file prefer-const

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

function populatedWorld(count: number) {
	let world = new World<Components>();

	for (let i = 0; i < count; i++) {
		world.createEntity({
			position: { x: i, y: i },
			visual: { ch: "?" },
		});
	}

	return world;
}

for (let count of [10, 100, 1000]) {
	Deno.bench(`query create (${count})`, { group: "query create" }, b => {
		let world = populatedWorld(count);
		let query;

		b.start();
		query = world.query("position");
		b.end();

		query.destroy();
	});
}

for (let count of [10, 100, 1000]) {
	Deno.bench(`query add matching entity (${count})`, { group: "query add matching" }, b => {
		let world = populatedWorld(count);
		let query = world.query("position");

		b.start();
		world.createEntity({ position: { x: count, y: count } });
		b.end();

		query.destroy();
	});
}

for (let count of [10, 100, 1000]) {
	Deno.bench(`query add irrelevant entity (${count})`, { group: "query add irrelevant" }, b => {
		let world = populatedWorld(count);
		let query = world.query("position");

		b.start();
		world.createEntity({ visual: { ch: "@" } });
		b.end();

		query.destroy();
	});
}

for (let count of [10, 100, 1000]) {
	Deno.bench(`query remove entity (${count})`, { group: "query remove" }, b => {
		let world = populatedWorld(count);
		let query = world.query("position");
		let entity = count;

		b.start();
		world.removeEntity(entity);
		b.end();

		query.destroy();
	});
}

for (let count of [10, 100, 1000]) {
	Deno.bench(`query iterate (${count})`, { group: "query iterate" }, b => {
		let world = populatedWorld(count);
		let query = world.query("position");
		let total = 0;

		b.start();
		query.entities.forEach(entity => total += entity);
		b.end();

		if (total < 0) { throw new Error("unreachable"); }
		query.destroy();
	});
}
