import { Entity } from "face.ts";
import { world, display } from "../world.ts";
import * as utils from "./utils.ts";
import { Action } from "../action/actions.ts";
import type ActionPipeline from "../action/pipeline.ts";


type PromiseOrValue<T> = T | Promise<T>;


export const NumpadOffsets = {
	"Numpad1": [-1,  1],
	"Numpad2": [ 0,  1],
	"Numpad3": [ 1,  1],
	"Numpad4": [-1,  0],
	"Numpad6": [ 1,  0],
	"Numpad7": [-1, -1],
	"Numpad8": [ 0, -1],
	"Numpad9": [ 1, -1]
}

export const ArrowAliases = {
	"ArrowLeft": "Numpad4",
	"ArrowRight": "Numpad6",
	"ArrowUp": "Numpad8",
	"ArrowDown": "Numpad2",
}

function eventToAction(e: KeyboardEvent, entity: Entity): PromiseOrValue<Action | null> {
	let { code } = e;
	if (code in ArrowAliases) { code = ArrowAliases[code as keyof typeof ArrowAliases]; }
	if (code in NumpadOffsets) {
		let offset = NumpadOffsets[code as keyof typeof NumpadOffsets];
		let position = structuredClone(world.requireComponent(entity, "position"));
		position.x += offset[0];
		position.y += offset[1];

		return {type: "move", entity, position};
	}

	if (code == "Period") {
		return {type:"idle"};
	}

	if (code == "KeyQ") {
		let tx = Math.floor(Math.random()*display.cols);
		let ty = Math.floor(Math.random()*display.rows);
		return {type:"shoot", entity, target: {x: tx, y: ty}};
	}

	if (code == "KeyW") {
		let entities = world.findEntities("position", "actor");
		let candidates = [...entities.values()].filter(components => components.actor.brain == "npc");
		let tx = candidates[0].position.x;
		let ty = candidates[0].position.y;
		return {type:"shoot", entity, target: {x: tx, y: ty}};
	}

	return null;
}

export async function procureAction(entity: Entity): Promise<Action> {
	while (true) {
		let event = await utils.readKey();
		let action = await eventToAction(event, entity);
		if (action) { return action; }
	}
}

export async function spawn(x: number, y: number, pipeline: ActionPipeline) {
	let entity = world.createEntity({
		visual: {ch:"@", fg:"red"},
		blocks: {movement:true, sight:false},
		actor: {
			wait: 0,
			brain: "pc"
		},
		health: { hp: 10 }
	});

	pipeline.push({ type: "spawn", entity, position: {x, y, zIndex: 1} });

	await pipeline.run();
}