import { Entity } from "../face.ts";
import { World, AIBrain, Position } from "./world.ts";
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

function canAttack(attacker: Entity, position: Position, world: World) {
	let source = world.requireComponent(attacker, "position");
	let dist = utils.dist8(source.x, source.y, position.x, position.y);
	return (dist == 1);
}

function getCloserTo(entity: Entity, position: Position, world: World) {
	let source = world.requireComponent(entity, "position");

	function CMP(dir1: number[], dir2: number[]) {
		let dist1 = utils.dist8(source.x+dir1[0], source.y+dir1[1], position.x, position.y);
		let dist2 = utils.dist8(source.x+dir2[0], source.y+dir2[1], position.x, position.y);
		return dist1-dist2;
	}

	let dirs = utils.DIRS.toSorted(CMP);
	if (dirs.length > 0) {
		let bestDir = dirs.shift();
		return new actions.Move(entity, source.x+bestDir[0], source.y+bestDir[1]);
	} else {
		return wander(entity, world);
	}
}

export function procureAction(entity: Entity, brain: AIBrain, world: World): actions.Action {
	const { task } = brain;
	if (task) {
		switch (task.type) {
			case "attack":
				let targetPosition = world.requireComponent(task.target, "position");
				if (canAttack(entity, targetPosition, world)) {
					return new actions.Attack(entity, task.target);
				} else {
					return getCloserTo(entity, targetPosition, world);
				}
			break;
		}
	} else {
		return wander(entity, world);
	}
}
