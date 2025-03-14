import { Entity } from "../face.ts";
import pubsub from "./pubsub.ts";
import world from "./world.ts";



export function createPc(x: number, y: number) {
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

export function createOrc(x: number, y: number, target: Entity) {
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
