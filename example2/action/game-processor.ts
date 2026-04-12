import { world } from "../world.ts";
import { Action } from "./actions.ts";


export default function gameProcessor(action: Action) {
	switch (action.type) {
		case "spawn": {
			world.addComponent(action.entity, "position", action.position);
		} break;

		case "move": {
			Object.assign(world.requireComponent(action.entity, "position"), action.position);
		} break;
	}
}
