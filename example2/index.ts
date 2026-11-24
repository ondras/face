import { DurationActorScheduler, Entity } from "face.ts";
import { world, display, spatialIndex } from "./world.ts";
import { Action } from "./action/actions.ts";
import ActionPipeline from "./action/pipeline.ts";

import * as pc from "./brain/pc.ts";
import * as npc from "./brain/npc.ts";

import "@ondras/rl-display"; // define
import "./random.ts"; // define


async function init(pipeline: ActionPipeline) {
	const w = 30;
	const h = 10;
	display.cols = w;
	display.rows = h;
	for (let i=0;i<w;i++) {
		for (let j=0;j<h;j++) {
			display.draw(i, j, {ch:".", fg:"gray"}, { zIndex: 0 });
		}
	}

	world.addEventListener("entity-remove", e => {
		const { entity } = e.detail;
		display.delete(entity);
		spatialIndex.update(entity);
	})

	document.body.append(pipeline.graphNode);

	await pc.spawn(5, 5, pipeline);
	await npc.spawn(pipeline);
}

function procureAction(entity: Entity): Promise<Action> | Action {
	let brain = world.requireComponent(entity, "actor").brain;
	switch (brain) {
		case "pc": return pc.procureAction(entity);
		case "npc": return npc.procureAction(entity);
	}
}

async function run(scheduler: DurationActorScheduler) {
	while (true) {
		let actor = scheduler.next();
		if (!actor) { break; }

		let action = await procureAction(actor);
		pipeline.push(action);
		await pipeline.run();

		scheduler.commit(actor, "duration" in action ? action.duration : 1);
	}
}

let pipeline = new ActionPipeline();
await init(pipeline);

let scheduler = new DurationActorScheduler(world);
run(scheduler);
