import { Entity } from "face.ts";
import { Action } from "../action/actions.ts";


export function procureAction(entity: Entity): Action {
	return { type: "idle" };
}
