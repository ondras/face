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
	switch (brain.type) {
		case "ai": return ai.procureAction(entity, brain, world);
		case "ui": return ui.procureAction(entity, world);
	}
}

function createWall(x: number, y: number) {
	let visual = {ch:"#"};
	let blocks = { sight: true, movement: true };
	let position = {x, y, blocks};
	let id = world.createEntity({
		position,
		visual
	});

	display.draw(x, y, visual, {id, zIndex:0});

	return id;
}

function createPc(x: number, y: number) {
	let visual = {ch:"@", fg:"red"};
	let position = {x, y, blocks:{movement:true, sight:false}};

	let id = world.createEntity({
		position,
		visual,
		actor: {
			wait:0,
			brain: {type:"ui"}
		}
	});

	display.draw(x, y, visual, {id, zIndex:1});

	return id;
}

function createOrc(x: number, y: number, target: Entity) {
	let visual = {ch:"o", fg:"lime"};
	let position = {x, y, blocks:{movement:true, sight:false}};
	let task = {
		type: "attack",
		target
	} as const;

	let id = world.createEntity({
		position,
		visual,
		actor: {
			wait:0,
			brain: {type:"ai", task}
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

let pc = createPc(5, 5);
let orc = createOrc(15, 5, pc);
let s1 = new FairActorScheduler(world);
let s2 = new DurationActorScheduler(world);


while (true) {
	let actor = s1.next();
	if (!actor) { break; }
	let action = await procureAction(actor);
	await action.perform(world);
}
