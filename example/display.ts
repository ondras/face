import RlDisplay from "@ondras/rl-display";
import world from "./world.ts";
import pubsub from "./pubsub.ts";
import { Entity } from "../face.ts";

import "@ondras/rl-display"; // define


const emptyVisual = {
	ch: "."
}

const display = document.querySelector<RlDisplay>("rl-display");

function onVisualShow(entity: Entity) {
	let {position, visual} = world.requireComponents(entity, "position", "visual");
	let options = {
		id: entity,
		zIndex: position.zIndex
	}
	display.draw(position.x, position.y, visual, options);
}

function onVisualHide(entity: Entity) {
	display.delete(entity);
}

function onVisualMove(entity: Entity) {
	let position = world.requireComponent(entity, "position");
	return display.move(entity, position.x, position.y);
}

export function init() {
	pubsub.subscribe("visual-show", data => onVisualShow(data.entity));
	pubsub.subscribe("visual-move", data => onVisualMove(data.entity));
	pubsub.subscribe("visual-hide", data => onVisualHide(data.entity));

	for (let i=0;i<display.cols;i++) {
		for (let j=0;j<display.rows;j++) {
			if (i % (display.cols-1) && j % (display.rows-1)) {
				display.draw(i, j, emptyVisual);
			}
		}
	}
}

export let cols = display.cols;
export let rows = display.rows;
