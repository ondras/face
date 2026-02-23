// deno-lint-ignore-file prefer-const

import { Entity, World } from "./world.ts";
import Query from "./query.ts"


export interface Actor {
	wait: number;
}

interface Components {
	actor: Actor;
}

export class DurationActorScheduler {
	query: Query<"actor">;

	constructor(protected world: World<Components>) {
		this.query = world.query("actor");
	}

	next(): Entity | undefined {
		const { world, query } = this;
		let { entities } = query;

		// entity->actor mapping for easy access
		let actors = new Map<Entity, Actor>();
		entities.forEach(entity => actors.set(entity, world.requireComponent(entity, "actor")));

		// best entity (with lowest wait time)
		let minEntity = findMinWait(actors);
		if (!minEntity) { return undefined; }

		let minWait = actors.get(minEntity)!.wait;
		actors.forEach(actor => actor.wait -= minWait);

		return minEntity;
	}

	commit(entity: Entity, duration: number) {
		this.world.requireComponent(entity, "actor").wait += duration;
	}
}

function findMinWait(actors: Map<Entity, Actor>): Entity | undefined {
	let minWait = 1/0;
	let minEntity: Entity | undefined;

	actors.forEach((actor, entity) => {
		if (actor.wait < minWait) {
			minWait = actor.wait;
			minEntity = entity;
		}
	});

	return minEntity;
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
