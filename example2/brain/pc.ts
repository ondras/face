import { Entity } from "face.ts";
import { world, display } from "../world.ts";
import * as utils from "./utils.ts";
import { Action } from "../action/actions.ts";


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

function processEvent(e: KeyboardEvent, entity: Entity) {
	let { code } = e;
	if (code in ArrowAliases) { code = ArrowAliases[code as keyof typeof ArrowAliases]; }
	if (code in NumpadOffsets) {
		let offset = NumpadOffsets[code as keyof typeof NumpadOffsets];
		let position = world.requireComponent(entity, "position");
		position.x += offset[0];
		position.y += offset[1];

		// FIXME show
		return true;
	}

	return false;
}

export async function procureAction(entity: Entity): Promise<Action> {
	while (true) {
		let event = await utils.readKey();
		/*
		let ok = processEvent(event, entity);
		if (ok) { return; }
		*/
		let tx = Math.floor(Math.random()*display.cols);
		let ty = Math.floor(Math.random()*display.rows);

		return {type:"shoot", entity, target: {x: tx, y: ty}};
	}
}
