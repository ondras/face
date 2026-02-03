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

function processEvent(e: KeyboardEvent, entity: Entity) {
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

async function shoot(entity: Entity) {
	let tx = Math.floor(Math.random()*display.cols);
	let ty = Math.floor(Math.random()*display.rows);

	let source = world.requireComponent(entity, "position");
	/*
	let path = bresenham(source.x, source.y, tx, ty);

	let projectile = display.draw(source.x, source.y, {ch:"*", fg:"yellow"}, { zIndex: 3 });
	while (true) {
		let point = path.shift()!;
		await display.move(projectile, point[0], point[1]);

		if (!path.length) break;

	}
		*/

	let projectile = display.draw(source.x, source.y, {ch:"*", fg:"yellow"}, { zIndex: 3 });
	let dist = utils.distEuclidean(source.x, source.y, tx, ty);
	await display.move(projectile, tx, ty, dist * 20);
}


export async function act(entity: Entity) {
	while (true) {
		let event = await utils.readKey();
		/*
		let ok = processEvent(event, entity);
		if (ok) { return; }
		*/

		await shoot(entity);
		return;
	}

}

function bresenham(sx: number, sy: number, tx: number, ty: number) {
  let dx = Math.abs(tx - sx),
      dy = Math.abs(ty - sy),
      x = sx, y = sy,
      sxStep = Math.sign(tx-sx),
      syStep = Math.sign(ty-sy),
      err = dx - dy,
      pts = [];

  while (true) {
    pts.push([x, y]);
    if (x === tx && y === ty) break;
    let e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sxStep; }
    if (e2 <  dx) { err += dx; y += syStep; }
  }
  return pts;
}
