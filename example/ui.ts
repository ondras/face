import * as actions from "./actions.ts";
import * as utils from "./utils.ts";
import { Entity } from "../face.ts";
import { World, Position } from "./world.ts";


function eventToAction(e: KeyboardEvent, entity: Entity, pos: Position) {
	switch (e.code) {
		case "ArrowLeft": return new actions.Move(entity, pos.x-1, pos.y);
		case "ArrowRight": return new actions.Move(entity, pos.x+1, pos.y);
		case "ArrowUp": return new actions.Move(entity, pos.x, pos.y-1);
		case "ArrowDown": return new actions.Move(entity, pos.x, pos.y+1);
	}
}

export async function procureAction(entity: Entity, world: World): Promise<actions.Action> {
	let position = world.requireComponent(entity, "position");

	while (true) {
		let event = await utils.readKey();
		let action = eventToAction(event, entity, position);
		return action;
	}
}
