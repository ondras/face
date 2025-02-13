export interface Position {
    x: number;
    y: number;
}

export interface Visual {
    ch: string;
}

interface Components {
    position: Position;
    visual: Visual;
}

export type QueryResult<T extends keyof Components> = Components[T] | undefined;

export type MultiQueryResult<T extends keyof Components> = {
    [K in T]: QueryResult<K>;
};

export type Entity = number;
type ComponentName = keyof Components;

type StorageData = {
	[T in keyof Components]?: Components[T];
}
let storage = new Map<Entity, StorageData>();

export function createEntity(): Entity {
	return Math.random();
}

export function addComponent<T extends ComponentName>(entity: Entity, componentName: T, componentData: Components[T]) {
	let data = storage.get(entity);
	if (!data) {
		data = {};
		storage.set(entity, data);
	}
	data[componentName] = componentData;
}

export function hasComponent<T extends ComponentName>(entity: Entity, component: T): boolean {
	let data = storage.get(entity);
	return !!data && (component in data);
}

export function queryComponent<T extends ComponentName>(entity: Entity, component: T): QueryResult<T> {
	let data = storage.get(entity);
	return data ? data[component] : data;
}

export function queryComponents<T extends ComponentName>(entity: Entity, ...components: T[]): MultiQueryResult<T> | undefined {
	return storage.get(entity) as MultiQueryResult<T>;
}

export function findEntities<T extends ComponentName>(component: T): Entity[] {
	return [...storage.keys()].filter(entity => hasComponent(entity, component));
}


export class World<Components extends Record<string, Record<string, any>>> {
	#storage = new Map<Entity, StorageData>();

	createEntity(): Entity {
		return Math.random();
	}

	addComponent<T extends ComponentName>(entity: Entity, componentName: T, componentData: Components[T]) {
		let data = storage.get(entity);
		if (!data) {
			data = {};
			storage.set(entity, data);
		}
		data[componentName] = componentData;
	}

	hasComponent<T extends ComponentName>(entity: Entity, component: T): boolean {
		let data = storage.get(entity);
		return !!data && (component in data);
	}

	queryComponent<T extends ComponentName>(entity: Entity, component: T): QueryResult<T> {
		let data = storage.get(entity);
		return data ? data[component] : data;
	}

	queryComponents<T extends ComponentName>(entity: Entity, ...components: T[]): MultiQueryResult<T> | undefined {
		return storage.get(entity) as MultiQueryResult<T>;
	}

	findEntities<T extends ComponentName>(component: T): Entity[] {
		return [...storage.keys()].filter(entity => hasComponent(entity, component));
	}

}
