import * as actions from "./actions.ts";
import * as utils from "./utils.ts";
import { Entity } from "../face.ts";
import { World, Position } from "./world.ts";


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
	"ArrowDown": "Numpad",
}

function eventToAction(e: KeyboardEvent, entity: Entity, pos: Position) {
	let { code } = e;
	if (code in Aliases) { code = Aliases[code as keyof typeof Aliases]; }
	if (code in NumpadOffsets) {
		let offset = NumpadOffsets[code as keyof typeof NumpadOffsets];
		return new actions.Move(entity, pos.x+offset[0], pos.y+offset[1]);
	}
}

export async function procureAction(entity: Entity, world: World): Promise<actions.Action> {
	let position = world.requireComponent(entity, "position");

	while (true) {
		let event = await utils.readKey();
		let action = eventToAction(event, entity, position);
		if (!action) { continue; }
		if (action.canBePerformed(world)) { return action; }
	}
}
