// deno-lint-ignore-file prefer-const

export type Entity = number;

export type ComponentBag<C> = { [T in keyof C]?: C[T]; }

type Storage<C> = ComponentBag<C>;

type QueryResult<C, T extends keyof C> = C[T] | undefined;

type MultiQueryResult<C, T extends keyof C> = {
	[K in T]: QueryResult<C, K>;
};

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
		component.forEach(c => delete data[c]);
	}

	hasComponents<T extends keyof C>(entity: Entity, ...component: T[]): boolean {
		let data = this.#storage.get(entity) as Storage<C>;
		if (!data) { return false; }
		return component.every(c => c in data);
	}

	findEntities<T extends keyof C>(...components: T[]): Entity[] {
		return [...this.#storage.keys()].filter(entity => this.hasComponents(entity, ...components));
	}

	queryComponent<T extends keyof C>(entity: Entity, component: T): QueryResult<C, T> {
		let data = this.#storage.get(entity);
		return data ? data[component] : data;
	}

	queryComponents<T extends keyof C>(entity: Entity, ..._components: T[]): MultiQueryResult<C, T> | undefined {
		return this.#storage.get(entity) as MultiQueryResult<C, T>;
	}
}
