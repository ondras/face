import { Entity, FairActorScheduler, DurationActorScheduler } from "../face.ts";
import { Action } from "./actions.ts";
import world from "./world.ts";
import * as display from "./display.ts";
import pubsub from "./pubsub.ts";
import * as ui from "./ui.ts";
import * as ai from "./ai.ts";


function procureAction(entity: Entity) {
	let brain = world.requireComponent(entity, "actor").brain;
	switch (brain.type) {
		case "ai": return ai.procureAction(entity, brain);
		case "ui": return ui.procureAction(entity);
	}
}

function createWall(x: number, y: number) {
	let visual = {ch:"#"};
	let blocks = { sight: true, movement: true };
	let position = {x, y, zIndex:0};
	let entity = world.createEntity({
		position,
		visual,
		blocks
	});

	pubsub.publish("visual-show", {entity});

	return entity;
}

function createPc(x: number, y: number) {
	let visual = {ch:"@", fg:"red"};
	let blocks = {movement:true, sight:false};
	let position = {x, y, zIndex:2};

	let entity = world.createEntity({
		position,
		visual,
		blocks,
		actor: {
			wait:0,
			brain: {type:"ui"}
		},
		health: { hp: 10 }
	});

	pubsub.publish("visual-show", {entity});

	return entity;
}

function createOrc(x: number, y: number, target: Entity) {
	let visual = {ch:"o", fg:"lime"};
	let position = {x, y, zIndex:2};
	let blocks = {movement:true, sight:false};
	let task = {
		type: "attack",
		target
	} as const;

	let entity = world.createEntity({
		position,
		visual,
		blocks,
		actor: {
			wait:0,
			brain: {type:"ai", task}
		},
		health: { hp: 1 }
	});

	pubsub.publish("visual-show", {entity});

	return entity;
}

await display.init();

for (let i=0;i<display.cols;i++) {
	for (let j=0;j<display.rows;j++) {
		if (i % (display.cols-1) && j % (display.rows-1)) {
			continue;
		} else {
			createWall(i, j);
		}
	}
}

let pc = createPc(5, 5);
let orc = createOrc(15, 5, pc);
let s1 = new FairActorScheduler(world);
let s2 = new DurationActorScheduler(world);


let actionQueue: Action[] = [];
while (true) {
	if (!actionQueue.length) {
		let actor = s1.next();
		if (!actor) { break; }
		let action = await procureAction(actor);
		actionQueue.push(action);
	}
	let action = actionQueue.shift()!;
	console.log("got action", action.constructor.name)

	let newActions = await action.perform();
	actionQueue.unshift(...newActions);
}
