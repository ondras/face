import { Entity, FairActorScheduler, DurationActorScheduler } from "../face.ts";
import { Action } from "./actions.ts";
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
	let position = {x, y};
	let id = world.createEntity({
		position,
		visual,
		blocks
	});

	display.draw(x, y, visual, {id, zIndex:0});

	return id;
}

function createPc(x: number, y: number) {
	let visual = {ch:"@", fg:"red"};
	let blocks = {movement:true, sight:false};
	let position = {x, y, };

	let id = world.createEntity({
		position,
		visual,
		blocks,
		actor: {
			wait:0,
			brain: {type:"ui"}
		},
		health: { hp: 10 }
	});

	display.draw(x, y, visual, {id, zIndex:2});

	return id;
}

function createOrc(x: number, y: number, target: Entity) {
	let visual = {ch:"o", fg:"lime"};
	let position = {x, y, };
	let blocks = {movement:true, sight:false};
	let task = {
		type: "attack",
		target
	} as const;

	let id = world.createEntity({
		position,
		visual,
		blocks,
		actor: {
			wait:0,
			brain: {type:"ai", task}
		},
		health: { hp: 1 }
	});

	display.draw(x, y, visual, {id, zIndex:2});

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


let action: Action | undefined;
while (true) {
	if (!action) {
		let actor = s1.next();
		if (!actor) { break; }
		action = await procureAction(actor);
	}
	console.log("got action", action)
	action = await action.perform(world) || undefined;
}
