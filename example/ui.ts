import * as actions from "./actions.ts";
import * as utils from "./utils.ts";
import { Entity } from "../face.ts";
import { world, spatialIndex, Position } from "./world.ts";


const NumpadOffsets = {
	"Numpad1": [-1,  1],
	"Numpad2": [ 0,  1],
	"Numpad3": [ 1,  1],
	"Numpad4": [-1,  0],
	"Numpad6": [ 1,  0],
	"Numpad7": [-1, -1],
	"Numpad8": [ 0, -1],
	"Numpad9": [ 1, -1]
}

const Aliases = {
	"ArrowLeft": "Numpad4",
	"ArrowRight": "Numpad6",
	"ArrowUp": "Numpad8",
	"ArrowDown": "Numpad2",
}

function findAttackable(entities: Entity[]) {
	// fixme detekuje mrtvoly
	return entities.find(entity => {
		return world.getComponent(entity, "health");
	});
}

function findMovementBlocking(entities: Entity[]) {
	// fixme detekuje mrtvoly
	return entities.find(entity => {
		return world.getComponent(entity, "blocks")?.movement;
	});
}

function eventToAction(e: KeyboardEvent, entity: Entity, pos: Position) {
	let { code } = e;
	if (code in Aliases) { code = Aliases[code as keyof typeof Aliases]; }
	if (code in NumpadOffsets) {
		let offset = NumpadOffsets[code as keyof typeof NumpadOffsets];
		let x = pos.x + offset[0];
		let y = pos.y + offset[1];
		let entities = spatialIndex.list(x, y);
		let attackable = findAttackable(entities);
		let movementBlocking = findMovementBlocking(entities);
		if (attackable) {
			return new actions.Attack(entity, attackable);
		} else if (movementBlocking) {
			console.log("bump into", movementBlocking);
			// FIXME
			return;
		} else {
			return new actions.Move(entity, pos.x+offset[0], pos.y+offset[1]);
		}
	}
}

export async function procureAction(entity: Entity): Promise<actions.Action> {
	let position = world.requireComponent(entity, "position");

	while (true) {
		let event = await utils.readKey();
		let action = eventToAction(event, entity, position);
		if (action) { return action; }
	}
}
