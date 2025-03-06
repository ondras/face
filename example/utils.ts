import { World } from "./world.ts";

declare global {
	interface Array<T> {
		random(): T;
	}
}

Array.prototype.random = function() {
	return this[Math.floor(Math.random()*this.length)];
}

export const DIRS = [
	[0, -1],
	[1, -1],
	[1, 0],
	[1, 1],
	[0, 1],
	[-1, 1],
	[-1, 0],
	[-1, -1]
];

export function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function entitiesAt(x: number, y: number, world: World) {
	// fixme spatial index
	return world.findEntities("position").filter(result => result.position.x == x && result.position.y == y);
}

export function canMoveTo(x: number, y: number, world: World) {
	let entities = entitiesAt(x, y, world);
	return entities.every(e => {
		let blocks = world.getComponent(e.entity, "blocks");
		if (!blocks) { return true; }
		return !blocks.movement;
	});
}

export async function readKey(): Promise<KeyboardEvent> {
	let { promise, resolve } = Promise.withResolvers<KeyboardEvent>();
	window.addEventListener("keydown", resolve, {once:true});
	return promise;
}

export function dist8(x1: number, y1: number, x2: number, y2: number) {
	let dx = Math.abs(x1 - x2);
	let dy = Math.abs(y1 - y2);
	return Math.max(dx, dy);
}

export function dist4(x1: number, y1: number, x2: number, y2: number) {
	let dx = Math.abs(x1 - x2);
	let dy = Math.abs(y1 - y2);
	return dx+dy;
}

export function distL2(x1: number, y1: number, x2: number, y2: number) {
	let dx = (x1 - x2);
	let dy = (y1 - y2);
	return Math.sqrt(dx**2 + dy**2);
}
