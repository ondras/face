import { Position } from "./world.ts";


export const DIRS = [
	[0, -1],
	[1, -1],
	[1, 0],
	[1, 1],
	[0, 1],
	[-1, 1],
	[-1, 0],
	[-1, -1]
] as [number, number][];


export function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function ring(center: Position) {
	return DIRS.map(([dx, dy]) => [center.x+dx, center.y+dy] as [number, number]);
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

export const OCTILE_CARDINAL = 2;
export const OCTILE_DIAGONAL = 3;

export function distOctile(x1: number, y1: number, x2: number, y2: number) {
	let dx = Math.abs(x1 - x2);
	let dy = Math.abs(y1 - y2);
	return OCTILE_CARDINAL * Math.max(dx, dy) + (OCTILE_DIAGONAL-OCTILE_CARDINAL) * Math.min(dx, dy)
}
