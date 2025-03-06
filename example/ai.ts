import { Entity } from "../face.ts";
import { World, AIBrain } from "./world.ts";
import * as actions from "./actions.ts";
import * as utils from "./utils.ts";


function wander(entity: Entity, world: World) {
	let position = world.requireComponent(entity, "position");

	let dirs = utils.DIRS.filter(dir => utils.canMoveTo(position.x+dir[0], position.y+dir[1], world));
	if (!dirs.length) { return new actions.Wait(entity); }

	let dir = dirs.random();
	position.x += dir[0];
	position.y += dir[1];
	return new actions.Move(entity, position.x, position.y);
}

export function procureAction(entity: Entity, brain: AIBrain, world: World): actions.Action {
	return wander(entity, world);
}
