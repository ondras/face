// deno-lint-ignore-file prefer-const

// "public" types used as return values of public methods
export type Entity = number;

type MultiQueryResult<C, T extends keyof C> = {
	[K in T]: C[K];
};

type FindResult<C, T extends keyof C> = {
	[K in T]: C[K];
} & { entity: Entity };

// private
type KeyOf<T> = Extract<keyof T, string>;

export class World<AllComponents = object> extends EventTarget {
	protected storage = new Map<Entity, Partial<AllComponents>>();
	protected counter = 0;

	createEntity(initialComponents: Partial<AllComponents> = {}): Entity {
		let entity = ++this.counter;
		initialComponents && this.addComponents(entity, initialComponents);
		return entity;
	}

	addComponent<C extends KeyOf<AllComponents>>(entity: Entity, componentName: C, componentData: AllComponents[C]) {
		const { storage } = this;
		let data = storage.get(entity);
		if (!data) {
			data = {};
			storage.set(entity, data);
		}
		data[componentName] = structuredClone(componentData);
	}

	addComponents(entity: Entity, components: Partial<AllComponents>) {
		for (let name in components) {
			this.addComponent(entity, name, components[name]!);
		}
	}

	removeComponents<C extends KeyOf<AllComponents>>(entity: Entity, ...components: C[]) {
		const { storage } = this;
		let data = storage.get(entity)!;
		// fixme nonexistant?
		components.forEach(component => delete data[component]);
	}

	hasComponents<C extends KeyOf<AllComponents>>(entity: Entity, ...components: C[]): boolean {
		let data = this.storage.get(entity);
		if (!data) { return false; }
		return keysPresent(data, components);
	}

	findEntities<C extends KeyOf<AllComponents>>(...components: C[]): FindResult<AllComponents, C>[] {
		let result: FindResult<AllComponents, C>[] = [];

		for (let [entity, storage] of this.storage.entries()) {
			if (keysPresent(storage, components)) {
				result.push({
					entity,
					...storage
				} as FindResult<AllComponents, C>);
			}
		}

		return result;
	}

	getComponent<C extends KeyOf<AllComponents>>(entity: Entity, component: C): AllComponents[C] | undefined {
		let data = this.storage.get(entity);
		return data ? data[component] : data;
	}

	getComponents<C extends KeyOf<AllComponents>>(entity: Entity, ..._components: C[]): MultiQueryResult<AllComponents, C> | undefined {
		return this.storage.get(entity) as MultiQueryResult<AllComponents, C>;
	}

	requireComponent<C extends KeyOf<AllComponents>>(entity: Entity, component: C): AllComponents[C] {
		let result = this.getComponent(entity, component);
		if (!result) { throw new Error(`entity ${entity} is missing the required component ${component}`); }
		return result;
	}

	requireComponents<C extends KeyOf<AllComponents>>(entity: Entity, ...components: C[]): MultiQueryResult<AllComponents, C> {
		let result = this.getComponents(entity, ...components);
		if (!result || !keysPresent(result, components)) { throw new Error(`entity ${entity} is missing the required components ${components}`); }
		return result;
	}
}

function keysPresent(data: Record<string, unknown>, keys: string[]) {
	return keys.every(key => key in data);
}
