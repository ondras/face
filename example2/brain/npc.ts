import { Entity } from "face.ts";
import { Action } from "../action/actions.ts";
import type ActionPipeline from "../action/pipeline.ts";
import { world } from "../world.ts";


export function procureAction(entity: Entity): Action {
	return { type: "idle" };
}

export async function spawn(pipeline: ActionPipeline) {
	let entity = world.createEntity({
		visual: {ch:"g", fg:"lime"},
		blocks: {movement:true, sight:false},
		actor: {
			wait: 0,
			brain: "npc"
		},
		health: { hp: 3 }
	});

	let x = 10;
	let y = 5;

	pipeline.push({ type: "spawn", entity, position: {x, y, zIndex: 1} });
	await pipeline.run();
}