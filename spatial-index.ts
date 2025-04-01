import { Entity, World } from "./world.ts";


interface HasPosition {
	position: {
		x: number;
		y: number;
	}
}

export class SpatialIndex {
	protected world: World<HasPosition>;
	protected data: Entity[][][] = [];

	constructor(world: World) {
		this.world = world;
	}

	update(entity: Entity) {
		const { world, data } = this;

		data.forEach(col => {
			col.forEach(entities => {
				let index = entities.indexOf(entity);
				if (index > -1) { entities.splice(index, 1); }
			});
		});

		let position = world.getComponent(entity, "position");
		if (position) { // add/update
			let storage = getStorageFor(position.x, position.y, data);
			storage.push(entity);
		}
	}

	list(x: number, y: number): Entity[] {
		return getStorageFor(x, y, this.data);
	}
}

function getStorageFor(x: number, y: number, data: Entity[][][]) {
	while (data.length <= x) { data.push([]); }
	let col = data[x];
	while (col.length <= y) { col.push([]); }
	return col[y];
}