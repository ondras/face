import RlDisplay from "https://cdn.jsdelivr.net/gh/ondras/rl-display@master/src/rl-display.ts";
import { World, Entity, FairActorScheduler, DurationActorScheduler } from "../ecs.ts";


function sleep(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

interface Position {
    x: number;
    y: number;
}

interface Visual {
    ch: string;
}

interface Actor {
	wait: number;
}

interface Blocks {
	sight: boolean;
	movement: boolean;
}

interface Components {
    position: Position;
    visual: Visual;
    actor: Actor;
	blocks: Blocks;
}

type MyWorld = World<Components>;

class Action<W extends World> {
	get duration() { return 0; }

	canBePerformed(world: W) {}

	async perform(world: MyWorld) {}
}

class Move extends Action<MyWorld> {
	constructor(protected entity: Entity, protected x: number, protected y: number) {
		super();
	}

	async perform(world: MyWorld) {
		const { entity, x, y } = this;
		let position = world.queryComponent(entity, "position");
		if (!position) { throw "fixme"; }

		position.x = x;
		position.y = y;
		// fixme render
		console.log("moving", entity, "to", x, y);

		display.move(entity, x, y);
	}

	get duration() { return 10; }
}

async function procureAction(entity: Entity) {
	return new Move(entity, 0, 0);
}

let world = new World<Components>();

await customElements.whenDefined("rl-display");
let display = document.querySelector("rl-display") as RlDisplay;

function createWall(x: number, y: number) {
	let visual = {ch:"@"};
	let position = {x, y};
	let blocks = { sight: true, movement: true };
	let id = world.createEntity({
		position,
		visual,
		blocks
	});

	display.draw(x, y, visual, {id, zIndex:0});

	return id;

}

function createBeing(x: number, y: number) {
	let visual = {ch:"@"};
	let position = {x, y};
	let id = world.createEntity({
		position,
		visual,
		actor: {wait:0}
	});

	display.draw(x, y, visual, {id, zIndex:1});

	return id;
}

let pc = createBeing(5, 5);


let s1 = new FairActorScheduler(world);
let s2 = new DurationActorScheduler(world);


while (true) {
	let actor = s1.next();
	if (!actor) { break; }
	let action = await procureAction(actor);
	await action.perform(world);
	await sleep(1000);
}
