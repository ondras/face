import { World, Entity } from "../face.ts";
import { MyWorld } from "../world.ts";
import display from "./display.ts";


class Action<W extends World> {
	get duration() { return 0; }

	canBePerformed(world: W) {}

	async perform(world: MyWorld) {}
}

export class Move extends Action<MyWorld> {
	constructor(protected entity: Entity, protected x: number, protected y: number) {
		super();
	}

	async perform(world: MyWorld) {
		const { entity, x, y } = this;
		let position = world.requireComponent(entity, "position");

		position.x = x;
		position.y = y;
		console.log("moving", entity, "to", x, y);

		return display.move(entity, x, y);
	}

	get duration() { return 10; }
}
