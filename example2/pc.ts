import { world, spatialIndex, display } from "./world.ts";
import { Entity } from "../face.ts";
import * as utils from "./utils.ts";


export function createEntity(x: number, y: number) {
	let visual = {ch:"@", fg:"red"};
	let blocks = {movement:true, sight:false};
	let position = {x, y, zIndex:2};

	let entity = world.createEntity({
		position,
		visual,
		blocks,
		actor: {
			wait:0,
			brain: "pc"
		},
		health: { hp: 10 }
	});

	spatialIndex.update(entity);

	display.draw(position.x, position.y, visual, { zIndex: 1, id: entity});

	return entity;
}

function redraw(entity: Entity) {
	let position = world.requireComponent(entity, "position");
	display.move(entity, position.x, position.y);
}

function eventToAction(e: KeyboardEvent, entity: Entity) {
	let { code } = e;
	if (code in utils.ArrowAliases) { code = utils.ArrowAliases[code as keyof typeof utils.ArrowAliases]; }
	if (code in utils.NumpadOffsets) {
		let offset = utils.NumpadOffsets[code as keyof typeof utils.NumpadOffsets];
		let position = world.requireComponent(entity, "position");
		position.x += offset[0];
		position.y += offset[1];

		redraw(entity);

		// FIXME show
		return true;
	}

	return false;
}


export async function act(entity: Entity) {
	while (true) {
		let event = await utils.readKey();
		let ok = eventToAction(event, entity);
		if (ok) { return; }
	}

}