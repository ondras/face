import { Entity, World } from "./world.ts";


interface HasPosition {
	position: {
		x: number;
		y: number;
	}
}

export class SpatialIndex {
	protected world: World<HasPosition>;
	protected data: Set<Entity>[][] = [];
	protected entityToSet = new Map<Entity, Set<Entity>>();

	constructor(world: World) {
		this.world = world;
	}

	update(entity: Entity) {
		const { world, data, entityToSet } = this;

		const existingSet = entityToSet.get(entity);
		if (existingSet) {
			existingSet.delete(entity);
			entityToSet.delete(entity);
		}

		const position = world.getComponent(entity, "position");
		if (position) { // add/update
			const storage = getSetFor(position.x, position.y, data);
			storage.add(entity);
			entityToSet.set(entity, storage);
		}
	}

	list(x: number, y: number): Set<Entity> {
		if (x < 0 || y < 0) { return new Set(); }
		return getSetFor(x, y, this.data);
	}
}

function getSetFor(x: number, y: number, data: Set<Entity>[][]): Set<Entity> {
	while (data.length <= x) { data.push([]); }
	const col = data[x];
	while (col.length <= y) { col.push(new Set<Entity>()); }
	return col[y];
}
