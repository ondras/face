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

type StorageData = {
	[T in keyof Components]?: Components[T];
}
let storage = new Map<Entity, StorageData>();

export function createEntity(): Entity {
	return Math.random();
}

export function addComponent<T extends keyof Components>(entity: Entity, componentName: T, componentData: Components[T]) {
	let data = storage.get(entity);
	if (!data) {
		data = {};
		storage.set(entity, data);
	}
	data[componentName] = componentData;
}

export function queryComponent<T extends keyof Components>(entity: Entity, component: T): QueryResult<T> {
	let data = storage.get(entity);
	return data ? data[component] : data;
}

export function queryComponents<T extends keyof Components>(entity: Entity, ...components: T[]): MultiQueryResult<T> | undefined {
	return storage.get(entity) as MultiQueryResult<T>;
}
