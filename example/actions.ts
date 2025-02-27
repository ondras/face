import { World, Entity } from "../ecs.js";


export interface Position {
    x: number;
    y: number;
}

export interface Visual {
    ch: string;
}

export interface Actor {
	wait: number;
}

interface Components {
    position: Position;
    visual: Visual;
    actor: Actor;
}

type MyWorld = World<Components>;

class Action<W extends World> {
	get duration() { return 0; }

	canBePerformed(world: W) {

	}

	async perform(world: MyWorld, loop: ActionLoop<MyWorld>) {}
}

class Move extends Action<MyWorld> {
	constructor(protected entity: Entity, protected x: number, protected y: number) {
		super();
	}

	async perform(world: MyWorld, loop: ActionLoop<MyWorld>) {
		const { entity, x, y } = this;
		let position = world.queryComponent(entity, "position");
		if (!position) { throw "fixme"; }

		position.x = x;
		position.y = y;
		// fixme render
		console.log("moving", entity, "to", x, y);

		world.queryComponent(entity, "actor")!.wait += this.duration;
	}

	get duration() { return 10; }
}

function procureEntity(world: MyWorld) {
	let entities = world.findEntities("actor");

	let minWait = 1/0;
	let minEntity: Entity | undefined;

	entities.forEach(entity => {
		let actor = world.queryComponent(entity, "actor")!;
		if (actor.wait < minWait) {
			minWait = actor.wait;
			minEntity = entity;
		}
	});

	entities.forEach(entity => {
		world.queryComponent(entity, "actor")!.wait -= minWait;
	});

	return minEntity;
}

async function procureAction(world: MyWorld, entity: Entity) {
	return new Move(world, entity, 0, 0);
}

interface LoopController<W extends World> {
	poll(): Promise<Action<W> | undefined>;
}


class ActionLoop<W extends World> {
	protected queue: Action<W>[] = [];

	constructor(protected controller: LoopController<W>) {

	}

	push(action: Action<W>) { this.queue.push(action); }
	unshift(action: Action<W>) { this.queue.unshift(action); }

	async *[Symbol.asyncIterator]() {
		const { queue, controller } = this;

		while (true) {
			if (!queue.length) {
				let action = await controller.poll();
				if (!action) { return; }
				this.push(action);
			}

			let action = queue.shift()!;
			await action.perform(world, this);
			yield action;
		}
	}
}

let world = new World<Components>();

class FairActorStrategy {
	constructor(protected world: World<{actor: Actor}>) {

	}

	next(): Entity | null {
		let entities = world.findEntities("actor");
		if (!entities.length) { return null; }

		// first non-waiting
		let entity = entities.find(entity => world.queryComponent(entity, "actor")!.wait == 0);

		if (entity) {
			world.queryComponent(entity, "actor")!.wait = 1;
			return entity;

		} else {
			entities.forEach(entity => world.queryComponent(entity, "actor")!.wait = 0);
			return this.next(); // ...and return first
		}
	}
}

let s = new FairActorStrategy(world)


let controller = {
	async poll() {
		let entity = procureEntity(world);
		if (!entity) { return; }

		let action = await procureAction(world, entity);
		return action;
	}
}

let loop = new ActionLoop<MyWorld>(controller);
for await (let action of loop) {

}


Deno.test("scheduler 1", () => {
	for (let i=0;i<10;i++) {
		let { value } = iterator.next();
	}
})
