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



Deno.bench("createEntity empty", () => {
	let world = new World<Components>();
	world.createEntity();
});


Deno.bench("createEntity with components", () => {
	let world = new World<Components>();
	world.createEntity({
		position: { x: 1, y: 2 },
		visual: { ch: "@" },
	});
});


Deno.bench("addComponent", () => {
	let world = new World<Components>();
	let entity = world.createEntity();
	world.addComponent(entity, "position", { x: 1, y: 2 });
});


Deno.bench("addComponents", () => {
	let world = new World<Components>();
	let entity = world.createEntity();
	world.addComponents(entity, {
		position: { x: 1, y: 2 },
		visual: { ch: "@" },
	});
});

Deno.bench("getComponent", b => {
	let world = populatedWorld(100);

	b.start();
	world.getComponent(50, "position");
	b.end();
});

Deno.bench("requireComponent", b => {
	let world = populatedWorld(100);

	b.start();
	world.requireComponent(50, "position");
	b.end();
});

Deno.bench("hasComponents single", b => {
	let world = populatedWorld(100);

	b.start();
	world.hasComponents(50, "position");
	b.end();
});

Deno.bench("hasComponents multi", b => {
	let world = populatedWorld(100);

	b.start();
	world.hasComponents(50, "position", "visual");
	b.end();
});

Deno.bench("getComponents", b => {
	let world = populatedWorld(100);

	b.start();
	world.getComponents(50, "position", "visual");
	b.end();
});

for (let count of [10, 100, 1000]) {
	Deno.bench(`findEntities position (${count})`, { group: "findEntities" }, b => {
		let world = populatedWorld(count);

		b.start();
		world.findEntities("position");
		b.end();
	});
}


Deno.bench("removeEntity", () => {
	let world = new World<Components>();
	let entity = world.createEntity({ position: { x: 1, y: 2 } });
	world.removeEntity(entity);
});


Deno.bench("removeComponents", () => {
	let world = new World<Components>();
	let entity = world.createEntity({
		position: { x: 1, y: 2 },
		visual: { ch: "@" },
	});
	world.removeComponents(entity, "position");
});

for (let count of [10, 100, 1000]) {
	Deno.bench(`toString (${count})`, { group: "toString" }, b => {
		let world = populatedWorld(count);

		b.start();
		world.toString();
		b.end();
	});
}

for (let count of [10, 100, 1000]) {
	Deno.bench(`fromString (${count})`, { group: "fromString" }, b => {
		let world = populatedWorld(count);
		let serialized = world.toString();

		b.start();
		world.fromString(serialized);
		b.end();
	});
}
