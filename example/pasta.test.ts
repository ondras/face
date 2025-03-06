import { Pasta } from "./pasta.ts";
import { assertEquals, assert } from "jsr:@std/assert";
import * as utils from "./utils.ts";


/*
A B C D E
F G H I J
K L M N O
P Q R S T
U V W X Y
*/
let COLS = 5;
let WALLS_MID = new Set(["N", "R", "S"]);
let WALLS_SIDE = new Set(["N", "O"]);
let WALLS_IMPOSSIBLE = new Set(["M", "N", "O", "R", "W"]);


Deno.test("walls, topo 8, h=euclidean", () => {
	let options = createOptions({topo:8, walls:"mid", h:"e"});
	let path = new Pasta("A", "Y", options).run();
	assertEquals(path.join(""), "AGHIOTY");
});

Deno.test.only("empty, topo 8, h=g", () => {
	let options = createOptions({topo:8, walls:false, h:"g"});
	let path = new Pasta("A", "Y", options).run();
	assertEquals(path.join(""), "AGMSY");
});

Deno.test("walls, topo 8, h=g", () => {
	let options = createOptions({topo:8, walls:"mid", h:"g"});
	let path = new Pasta("A", "Y", options).run();
	assertEquals(path.join(""), "AGMIOTY");
});

Deno.test("impossible, topo 8, h=g", () => {
	let options = createOptions({topo:8, walls:"impossible", h:"g"});
	let path = new Pasta("A", "Y", options).run();
	assert(!path);
});

Deno.test("empty, topo 4, h=g", () => {
	let options = createOptions({topo:4, walls:false, h:"g"});
	let path = new Pasta("A", "Y", options).run();
	assertEquals(path.join(""), "ABCDEJOTY");
});

Deno.test("walls, topo 4, h=g", () => {
	let options = createOptions({topo:4, walls:"side", h:"g"});
	let path = new Pasta("A", "Y", options).run();
	assertEquals(path.join(""), "ABCHMRSTY");
});


Deno.test("detailed, empty, topo 8, h=g", () => {
	let options = createOptions({topo:8, walls:false, h:"g"});
	let p = new Pasta("A", "Y", options);

	let result = p.next();
	assert(!result, "first iteration - done");
	assertMapKeys(p.closed, "A", "first iteration - closed set");
	assertMapKeys(p.open, "BFG", "first iteration - open set");

	result = p.next();
	assert(!result, "second iteration - done");
	assertMapKeys(p.closed, "AG", "second iteration - closed set");
	assertMapKeys(p.open, "BCFHKLM", "second iteration - open set");

	result = p.next();
	assert(!result, "third iteration - done");
	assertMapKeys(p.closed, "AGM", "third iteration - closed set");
	assertMapKeys(p.open, "BCFHIKLNQRS", "third iteration - open set");

	result = p.next();
	assert(!result, "fourth iteration - done");
	assertMapKeys(p.closed, "AGMS", "fourth iteration - closed set");
	assertMapKeys(p.open, "BCFHIKLNOQRTWXY", "fourth iteration - open set");

	result = p.next();
	assertEquals(result.sort().join(""), "AGMSY", "fifth iteration - path");
});

interface Conf {
	topo: 4 | 8;
	walls: false | "mid" | "side" | "impossible";
	h: "g" | "e";
}
function createOptions(conf: Conf) {
	function cost(from: string, to: string) {
		let c1 = idToCoords(from);
		let c2 = idToCoords(to);
		switch (conf.topo) {
			case 4: return utils.dist4(...c1, ...c2);
			case 8: return utils.dist8(...c1, ...c2);
		}
	}

	function heuristic(from: string, to: string) {
		switch (conf.h) {
			case "g": return cost(from, to);
			case "e":
				let c1 = idToCoords(from);
				let c2 = idToCoords(to);
				return utils.distEuclidean(...c1, ...c2);
			break;
		}
	}

	function neighbors(node: string) {
		let [x, y] = idToCoords(node);
		let dirs = utils.DIRS;
		if (conf.topo == 4) { dirs = dirs.filter(dir => !(dir[0]*dir[1])); }
		let neighbors = dirs.map(dir => [x + dir[0], y + dir[1]] as [number, number])
			.filter(pos => {
				let [x, y] = pos;
				return x >= 0 && x < COLS && y >= 0 && y < COLS;
			})
			.map(pos => coordsToId(...pos));
		if (conf.walls) {
			let walls = {
				mid: WALLS_MID,
				side: WALLS_SIDE,
				impossible: WALLS_IMPOSSIBLE,
			}[conf.walls];
			neighbors = neighbors.filter(id => !walls.has(id));
		}
		return neighbors;
	}
	return {cost, heuristic, neighbors};
}

function idToCoords(id: string) {
	let index = id.charCodeAt(0) - "A".charCodeAt(0);
	let col = index % COLS;
	let row = Math.floor(index / COLS);
	return [col, row] as [number, number];
}

function coordsToId(x: number, y: number) {
	let index = y * COLS + x;
	return String.fromCharCode(index + "A".charCodeAt(0));
}

function assertMapKeys(map: Map<string, any>, expected: string, message?: string) {
	assertEquals([...map.keys()].sort().join(""), expected, message);
}
