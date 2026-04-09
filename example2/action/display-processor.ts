import { display, world } from "../world.ts";
import { Action } from "./actions.ts";
import * as geom from "../geom.ts";


export default async function displayProcessor(action: Action) {
	switch (action.type) {
		case "spawn": {
			const { position, entity } = action;
			const visual = world.requireComponent(entity, "visual");
			display.draw(position.x, position.y, visual, { zIndex: position.zIndex, id: entity});
		} break;

		case "shoot": {
			const { entity, target } = action;
			const source = world.requireComponent(entity, "position");

			let projectile = display.draw(source.x, source.y, {ch:"*", fg:"yellow"}, { zIndex: 3 });
			let dist = geom.distEuclidean(source.x, source.y, target.x, target.y);
			await display.move(projectile, target.x, target.y, dist * 20);

		}
	}
}
