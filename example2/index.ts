import { FairActorScheduler } from "../face.ts";
import { world, display } from "./world.ts";

import * as pc from "./pc.ts";
import * as npc from "./npc.ts";

import "@ondras/rl-display"; // define

const w = 30;
const h = 10;
display.cols = w;
display.rows = h;
for (let i=0;i<w;i++) {
	for (let j=0;j<h;j++) {
		display.draw(i, j, {ch:".", fg:"gray"}, { zIndex: 0 });
	}
}

let scheduler = new FairActorScheduler(world);
let pcEntity = pc.createEntity(5, 5);

while (true) {
	let actor = scheduler.next();
	if (!actor) { break; }

	let brain = world.requireComponent(actor, "actor").brain;
	switch (brain) {
		case "pc": await pc.act(actor); break;
		case "npc": await npc.act(actor); break;
	}
}
