import * as ecs from "./ecs.ts";
import { assertEquals } from "jsr:@std/assert";


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



Deno.test("A", () => {
	let w = ecs.createWorld<Components>();
	let e = w.createEntity();
	assertEquals(w.queryComponent(e, "position"), undefined);
});

Deno.test("B", () => {
	let w = ecs.createWorld<Components>();
	let e = w.createEntity();
	let pos = {x:1, y:2};
	w.addComponent(e, "position", pos);
	assertEquals(w.queryComponent(e, "position"), pos);
});

Deno.test("C", () => {
	let w = ecs.createWorld<Components>();
	let e = w.createEntity();
	let pos = {x:1, y:2};
	let vis = {ch:"?"};
	w.addComponent(e, "position", pos);
	w.addComponent(e, "visual", vis);

	let result = w.queryComponents(e, "position", "visual");
	assertEquals(result?.position, pos);
	assertEquals(result?.visual, vis);
});
