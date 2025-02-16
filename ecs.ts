// deno-lint-ignore-file prefer-const

export type Entity = number;

export function createWorld<Components> () {
	type StorageData = { [T in keyof Components]?: Components[T]; }

	type QueryResult<T extends keyof Components> = Components[T] | undefined;

	type MultiQueryResult<T extends keyof Components> = {
		[K in T]: QueryResult<K>;
	};

	return new class World {
		#storage = new Map<Entity, StorageData>();

		createEntity(initialComponents: StorageData = {}): Entity {
			let entity = Math.random();
			if (initialComponents) { this.#storage.set(entity, structuredClone(initialComponents)); }
			return entity;
		}

		addComponent<T extends keyof Components>(entity: Entity, componentName: T, componentData: Components[T]) {
			let data = this.#storage.get(entity);
			if (!data) {
				data = {};
				this.#storage.set(entity, data);
			}
			data[componentName] = componentData;
		}

		removeComponent<T extends keyof Components>(entity: Entity, ...component: T[]) {
			let data = this.#storage.get(entity) as StorageData;
			component.forEach(c => delete data[c]);
		}

		hasComponents<T extends keyof Components>(entity: Entity, ...component: T[]): boolean {
			let data = this.#storage.get(entity) as StorageData;
			if (!data) { return false; }
			return component.every(c => c in data);
		}

		findEntities<T extends keyof Components>(...components: T[]): Entity[] {
			return [...this.#storage.keys()].filter(entity => this.hasComponents(entity, ...components));
		}

		queryComponent<T extends keyof Components>(entity: Entity, component: T): QueryResult<T> {
			let data = this.#storage.get(entity);
			return data ? data[component] : data;
		}

		queryComponents<T extends keyof Components>(entity: Entity, ..._components: T[]): MultiQueryResult<T> | undefined {
			return this.#storage.get(entity) as MultiQueryResult<T>;
		}
	}
}
