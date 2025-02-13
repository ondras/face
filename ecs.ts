export type Entity = number;

export type BaseComponents = Record<string, any>;

export function createWorld<Components extends BaseComponents> () {
	type StorageData = {
		[T in keyof Components]?: Components[T];
	}

	type QueryResult<T extends keyof Components> = Components[T] | undefined;

	type MultiQueryResult<T extends keyof Components> = {
		[K in T]: QueryResult<K>;
	};

	return new class World {
		#storage = new Map<Entity, StorageData>();

		createEntity(): Entity {
			return Math.random();
		}

		addComponent<T extends keyof Components>(entity: Entity, componentName: T, componentData: Components[T]) {
			let data = this.#storage.get(entity);
			if (!data) {
				data = {};
				this.#storage.set(entity, data);
			}
			data[componentName] = componentData;
		}

		hasComponent<T extends keyof Components>(entity: Entity, component: T): boolean {
			let data = this.#storage.get(entity);
			return !!data && (component in data);
		}

		queryComponent<T extends keyof Components>(entity: Entity, component: T): QueryResult<T> {
			let data = this.#storage.get(entity);
			return data ? data[component] : data;
		}

		queryComponents<T extends keyof Components>(entity: Entity, ...components: T[]): MultiQueryResult<T> | undefined {
			return this.#storage.get(entity) as MultiQueryResult<T>;
		}

		findEntities<T extends keyof Components>(component: T): Entity[] {
			return [...this.#storage.keys()].filter(entity => this.hasComponent(entity, component));
		}
	}
}