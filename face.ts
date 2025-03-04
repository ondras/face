// deno-lint-ignore-file prefer-const

// "public" types used as return values of public methods
export type Entity = number;

type QueryResult<C, T extends keyof C> = C[T] | undefined;

type MultiQueryResult<C, T extends keyof C> = {
	[K in T]: QueryResult<C, K>;
};

type FindResult<C, T extends keyof C> = {
	[K in T]: C[T];
} & { entity: Entity };


// private
type Storage<C> = Partial<C>;

export class World<C = {}> {
	#storage = new Map<Entity, Storage<C>>();
	#counter = 0;

	createEntity(initialComponents: Storage<C> = {}): Entity {
		let entity = ++this.#counter;
		if (initialComponents) { this.#storage.set(entity, structuredClone(initialComponents)); }
		return entity;
	}

	addComponent<T extends keyof C>(entity: Entity, componentName: T, componentData: C[T]) {
		let data = this.#storage.get(entity);
		if (!data) {
			data = {};
			this.#storage.set(entity, data);
		}
		data[componentName] = componentData;
	}

	removeComponent<T extends keyof C>(entity: Entity, ...component: T[]) {
		let data = this.#storage.get(entity) as Storage<C>;
		// fixme nonexistant?
		component.forEach(c => delete data[c]);
	}

	hasComponents<T extends keyof C>(entity: Entity, ...components: T[]): boolean {
		let data = this.#storage.get(entity);
		if (!data) { return false; }
		return keysPresent(data, components);
	}

	findEntities<T extends keyof C>(...components: T[]): FindResult<C, T>[] {
		let result: FindResult<C, T>[] = [];

		for (let [entity, storage] of this.#storage.entries()) {
			if (keysPresent(storage, components)) {
				result.push({
					entity,
					...storage
				} as FindResult<C, T>);
			}
		}

		return result;
	}

	queryComponent<T extends keyof C>(entity: Entity, component: T): QueryResult<C, T> {
		let data = this.#storage.get(entity);
		return data ? data[component] : data;
	}

	queryComponents<T extends keyof C>(entity: Entity, ..._components: T[]): MultiQueryResult<C, T> | undefined {
		return this.#storage.get(entity) as MultiQueryResult<C, T>;
	}
}

function keysPresent(data: Record<string, any>, keys: (string | number | symbol)[]) {
	return keys.every(key => key in data);
}


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
		this.world.queryComponent(entity, "actor")!.wait += duration;
	}
}
