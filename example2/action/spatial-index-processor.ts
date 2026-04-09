import { spatialIndex } from "../world.ts";
import { Action } from "./actions.ts";


export default function spatialIndexProcessor(action: Action) {
	switch (action.type) {
		case "spawn":
			spatialIndex.update(action.entity);
		break;
	}
}
