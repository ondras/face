import * as actions from "./actions.ts";
import { Entity } from "../face.ts";
import world from "./world.ts";


export function procureAction(entity: Entity) {
	let dx = Math.random() > 0.5 ? 1 : -1;
	let dy = Math.random() > 0.5 ? 1 : -1;
	let position = world.requireComponent(entity, "position");
	position.x += dx;
	position.y += dy;
	return new actions.Move(entity, position.x, position.y);
}
