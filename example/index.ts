import { Entity, FairActorScheduler, DurationActorScheduler } from "../face.ts";
import world from "./world.ts";
import display from "./display.ts";
import * as ui from "./ui.ts";
import * as ai from "./ai.ts";


const emptyVisual = {
	ch: "."
}

function procureAction(entity: Entity) {
	let brain = world.requireComponent(entity, "actor").brain;
	switch (brain) {
		case "ai": return ai.procureAction(entity);
		case "ui": return ui.procureAction(entity);
	}
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
		actor: {
			wait:0,
			brain:"ai"
		}
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
