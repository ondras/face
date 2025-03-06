// deno-lint-ignore-file prefer-const

import { Entity, World } from "./world.ts";


export interface Actor {
	wait: number;
}

export class FairActorScheduler {
	constructor(protected world: World<{actor: Actor}>) {}

	next(): Entity | undefined {
		let results = this.world.findEntities("actor");
		if (!results.length) { return undefined; }

		// first non-waiting
		let result = results.find(({actor}) => actor.wait == 0);

		if (result) {
			result.actor.wait = 1;
			return result.entity;
		} else {
			results.forEach(({actor}) => actor.wait = 0);
			return this.next(); // ...and return first
		}
	}
}

export class DurationActorScheduler {
	constructor(protected world: World<{actor: Actor}>) {}

	next(): Entity | undefined {
		let results = this.world.findEntities("actor");

		let minWait = 1/0;
		let minResult: typeof results[0] | undefined;

		results.forEach(result => {
			if (result.actor.wait < minWait) {
				minWait = result.actor.wait;
				minResult = result;
			}
		});

		results.forEach(({actor}) => actor.wait -= minWait);

		return minResult?.entity;
	}

	commit(entity: Entity, duration: number) {
		this.world.requireComponent(entity, "actor").wait += duration;
	}
}
