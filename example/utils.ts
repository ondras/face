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
	return entities.every(e => !e.position.blocks.movement);
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

export function distEuclidean(x1: number, y1: number, x2: number, y2: number) {
	let dx = (x1 - x2);
	let dy = (y1 - y2);
	return Math.sqrt(dx**2 + dy**2);
}

const OCTILE_CARDINAL = 2;
const OCTILE_DIAGONAL = 3;

export function distOctile(x1: number, y1: number, x2: number, y2: number) {
	let dx = Math.abs(x1 - x2);
	let dy = Math.abs(y1 - y2);
	OCTILE_CARDINAL * Math.max(dx, dy) + (OCTILE_DIAGONAL-OCTILE_CARDINAL) * Math.min(dx, dy)
}
