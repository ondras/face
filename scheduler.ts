// deno-lint-ignore-file prefer-const

import { Entity, World } from "./world.ts";


export interface Actor {
	wait: number;
}

export class DurationActorScheduler {
	constructor(protected world: World<{actor: Actor}>) {}

	next(): Entity | undefined {
		let results = this.world.findEntities("actor");

		let minWait = 1/0;
		let minEntity: Entity | undefined;

		results.forEach((components, entity) => {
			if (components.actor.wait < minWait) {
				minWait = components.actor.wait;
				minEntity = entity;
			}
		});
		results.forEach(r => r.actor.wait -= minWait);

		return minEntity;
	}

	commit(entity: Entity, duration: number) {
		this.world.requireComponent(entity, "actor").wait += duration;
	}
}

export class FairActorScheduler extends DurationActorScheduler {
	next() {
		let result = super.next();
		if (!result) { return undefined; }

		// auto-commit: picked entity gets a constant wait (moves to the end of the line)
		this.commit(result, 1);

		return result;
	}
}
