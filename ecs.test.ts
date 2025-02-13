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

let w = new ecs.World<Components>();


Deno.test("A", () => {
	let e = ecs.createEntity();
	assertEquals(ecs.queryComponent(e, "position"), undefined);
});

Deno.test("B", () => {
	let e = ecs.createEntity();
	let pos = {x:1, y:2};
	ecs.addComponent(e, "position", pos);
	assertEquals(ecs.queryComponent(e, "position"), pos);
});

Deno.test("C", () => {
	let e = ecs.createEntity();
	let pos = {x:1, y:2};
	let vis = {ch:"?"};
	ecs.addComponent(e, "position", pos);
	ecs.addComponent(e, "visual", vis);

	let result = ecs.queryComponents(e, "position", "visual");
	assertEquals(result?.position, pos);
	assertEquals(result?.visual, vis);
});
