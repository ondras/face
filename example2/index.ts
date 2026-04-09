import { FairActorScheduler, Entity } from "face.ts";
import { world, display } from "./world.ts";
import { Action } from "./action/actions.ts";
import Pipeline from "./action/pipeline.ts";

import spatialIndexProcessor from "./action/spatial-index-processor.ts";
import consoleProcessor from "./action/console-processor.ts";
import gameProcessor from "./action/game-processor.ts";
import displayProcessor from "./action/display-processor.ts";

import * as pc from "./brain/pc.ts";
import * as npc from "./brain/npc.ts";

import "@ondras/rl-display"; // define
import "./random.ts"; // define

const w = 30;
const h = 10;
display.cols = w;
display.rows = h;
for (let i=0;i<w;i++) {
	for (let j=0;j<h;j++) {
		display.draw(i, j, {ch:".", fg:"gray"}, { zIndex: 0 });
	}
}

let pipeline = new Pipeline();
pipeline.addProcessor(consoleProcessor);
pipeline.addProcessor(gameProcessor);
pipeline.addProcessor(spatialIndexProcessor);
pipeline.addProcessor(displayProcessor);


async function init() {
	let pc = world.createEntity({
		visual: {ch:"@", fg:"red"},
		blocks: {movement:true, sight:false},
		actor: {
			wait:0,
			brain: "pc"
		},
		health: { hp: 10 }
	});

	pipeline.push({ type: "spawn", entity: pc, position: {x: 5, y: 5, zIndex: 1} });

	await pipeline.run();
}

await init();

let scheduler = new FairActorScheduler(world);

function procureAction(entity: Entity): Promise<Action> | Action {
	let brain = world.requireComponent(entity, "actor").brain;
	switch (brain) {
		case "pc": return pc.procureAction(entity);
		case "npc": return npc.procureAction(entity);
	}
}

while (true) {
	let actor = scheduler.next();
	if (!actor) { break; }

	let action = await procureAction(actor);
	scheduler.commit(actor, "duration" in action ? action.duration : 1);

	pipeline.push(action);
	await pipeline.run();
}
