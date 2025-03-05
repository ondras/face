import * as actions from "./actions.ts";
import * as utils from "./utils.ts";
import { Entity } from "../face.ts";
import { MyWorld } from "./world.ts";


export async function procureAction(entity: Entity, world: MyWorld): Promise<actions.Action> {
	while (true) {
		let event = await utils.readKey();
		let dx = Math.random() > 0.5 ? 1 : -1;
		let dy = Math.random() > 0.5 ? 1 : -1;
		let position = world.requireComponent(entity, "position");
		position.x += dx;
		position.y += dy;
		return new actions.Move(entity, position.x, position.y);
	}
}
