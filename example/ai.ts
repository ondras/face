import { Entity } from "../face.ts";
import { World, AIBrain, Position } from "./world.ts";
import * as actions from "./actions.ts";
import * as utils from "./utils.ts";


function wander(entity: Entity, world: World) {
	let position = world.requireComponent(entity, "position");

	let available = utils.ring(position).filter(pos => utils.canMoveTo(...pos, world));
	if (!available.length) { return new actions.Wait(entity); }

	let pos = available.random();
	return new actions.Move(entity, ...pos);
}

function canAttack(attacker: Entity, position: Position, world: World) {
	let source = world.requireComponent(attacker, "position");
	return (utils.dist8(source.x, source.y, position.x, position.y) == 1);
}

function getCloserTo(entity: Entity, position: Position, world: World) {
	let source = world.requireComponent(entity, "position");
	let available = utils.ring(source).filter(pos => utils.canMoveTo(...pos, world));

	function CMP(pos1: [number,number], pos2: [number,number]) {
		let dist1 = utils.distOctile(...pos1, position.x, position.y);
		let dist2 = utils.distOctile(...pos2, position.x, position.y);
		return dist1-dist2;
	}
	available.sort(CMP);

	if (available.length > 0) {
		let best = available.shift()!;
		return new actions.Move(entity, ...best);
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
