import { world, spatialIndex } from "../world.ts";
import { Action } from "./actions.ts";


export default function gameProcessor(action: Action) {
	switch (action.type) {
		case "spawn": {
			world.addComponent(action.entity, "position", action.position);
		} break;

		case "move": {
			Object.assign(world.requireComponent(action.entity, "position"), action.position);
		} break;

		case "shoot": {
			let { target } = action;
			let targetEntities = spatialIndex.list(target.x, target.y);
			if (!targetEntities.size) { return; }

			// FIXME jen pokud je damage-able!
			let damage = {
				type: "damage",
				target: targetEntities.values().next().value!,
				amount: 1
			} as const;
			return [damage];
		}

		case "damage": {
			let health = world.requireComponent(action.target, "health");
			health.hp = Math.max(0, health.hp - action.amount);
			if (health.hp > 0) { return; }

			let death = {
				type: "death",
				entity: action.target
			} as const;
			return [death];
		}

		case "death": {
			world.removeEntity(action.entity);
		}
	}
}
