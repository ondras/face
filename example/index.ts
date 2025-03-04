import { Entity, FairActorScheduler, DurationActorScheduler } from "../face.ts";
import world from "./world.ts";
import * as actions from "./actions.ts";
import display from "./display.ts";


function sleep(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

const emptyVisual = {
	ch: "."
}

async function procureAction(entity: Entity) {
	let dx = Math.random() > 0.5 ? 1 : -1;
	let dy = Math.random() > 0.5 ? 1 : -1;
	let position = world.queryComponent(entity, "position")!; // fixme
	position.x += dx;
	position.y += dy;
	return new actions.Move(entity, position.x, position.y);
}

function createWall(x: number, y: number) {
	let visual = {ch:"#"};
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

for (let i=0;i<display.cols;i++) {
	for (let j=0;j<display.rows;j++) {
		if (i % (display.cols-1) && j % (display.rows-1)) {
			display.draw(i, j, emptyVisual);
		} else {
			createWall(i, j);
		}
	}
}

let pc = createBeing(5, 5);
let s1 = new FairActorScheduler(world);
let s2 = new DurationActorScheduler(world);


while (true) {
	let actor = s1.next();
	if (!actor) { break; }
	let action = await procureAction(actor);
	await action.perform(world);
}
