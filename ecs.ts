// deno-lint-ignore-file prefer-const

export type Entity = number;

type Storage<C> = Partial<C>;

type QueryResult<C, T extends keyof C> = C[T] | undefined;

type MultiQueryResult<C, T extends keyof C> = {
	[K in T]: QueryResult<C, K>;
};

type FindResult<C> = Storage<C> & { entity: Entity };

export class World<C = {}> {
	#storage = new Map<Entity, Storage<C>>();

	createEntity(initialComponents: Storage<C> = {}): Entity {
		let entity = Math.random();
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

	findEntities<T extends keyof C>(...components: T[]): FindResult<C>[] {
		let result: FindResult<C>[] = [];

		for (let [entity, storage] of this.#storage.entries()) {
			if (keysPresent(storage, components)) {
				result.push({
					entity,
					...storage
				});
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
