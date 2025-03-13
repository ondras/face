// deno-lint-ignore-file prefer-const

import { PubSub } from "./pubsub.ts";

// "public" types used as return values of public methods
export type Entity = number;

type MultiQueryResult<C, T extends keyof C> = {
	[K in T]: C[K];
};

type FindResult<C, T extends keyof C> = {
	[K in T]: C[K];
} & { entity: Entity };

export interface Messages {
	"component-add": {},
	"component-remove": {}
}

// private
type Storage<C> = Partial<C>;

export class World<C = object> {
	protected storage = new Map<Entity, Storage<C>>();
	protected counter = 0;
	protected pubsub?: PubSub<Messages>;

	createEntity(initialComponents: Storage<C> = {}): Entity {
		let entity = ++this.counter;
		if (initialComponents) { this.storage.set(entity, structuredClone(initialComponents)); }
		return entity;
	}

	addComponent<T extends keyof C>(entity: Entity, componentName: T, componentData: C[T]) {
		const { storage, pubsub } = this;
		let data = storage.get(entity);
		if (!data) {
			data = {};
			storage.set(entity, data);
		}
		data[componentName] = componentData;
		pubsub?.publish("component-add", {});
	}

	removeComponent<T extends keyof C>(entity: Entity, ...component: T[]) {
		const { storage, pubsub } = this;
		let data = storage.get(entity) as Storage<C>;
		// fixme nonexistant?
		component.forEach(c => {
			delete data[c];
			pubsub?.publish("component-remove", {});
		});
	}

	hasComponents<T extends keyof C>(entity: Entity, ...components: T[]): boolean {
		let data = this.storage.get(entity);
		if (!data) { return false; }
		return keysPresent(data, components);
	}

	findEntities<T extends keyof C>(...components: T[]): FindResult<C, T>[] {
		let result: FindResult<C, T>[] = [];

		for (let [entity, storage] of this.storage.entries()) {
			if (keysPresent(storage, components)) {
				result.push({
					entity,
					...storage
				} as FindResult<C, T>);
			}
		}

		return result;
	}

	getComponent<T extends keyof C>(entity: Entity, component: T): C[T] | undefined {
		let data = this.storage.get(entity);
		return data ? data[component] : data;
	}

	getComponents<T extends keyof C>(entity: Entity, ..._components: T[]): MultiQueryResult<C, T> | undefined {
		return this.storage.get(entity) as MultiQueryResult<C, T>;
	}

	requireComponent<T extends keyof C>(entity: Entity, component: T): C[T] {
		let result = this.getComponent(entity, component);
		if (!result) { throw new Error(`entity ${entity} is missing the required component ${String(component)}`); }
		return result;
	}

	requireComponents<T extends keyof C>(entity: Entity, ...components: T[]): MultiQueryResult<C, T> {
		let result = this.getComponents(entity, ...components);
		if (!result || !keysPresent(result, components)) { throw new Error(`entity ${entity} is missing the required components ${components}`); }
		return result;
	}
}

function keysPresent(data: Record<string, any>, keys: (string | number | symbol)[]) {
	return keys.every(key => key in data);
}
