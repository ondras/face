import { Entity } from "../face.ts";
import { World } from "./world.ts";
import display from "./display.ts";
import * as utils from "./utils.ts";


export class Action {
	get duration() { return 0; }

	canBePerformed(world: World) {}

	async perform(world: World) {}
}

export class Wait extends Action {
	constructor(protected entity: Entity) {
		super();
	}
}

export class Move extends Action {
	constructor(protected entity: Entity, protected x: number, protected y: number) {
		super();
	}

	canBePerformed(world: World) {
		return utils.canMoveTo(this.x, this.y, world);
	}

	async perform(world: World) {
		const { entity, x, y } = this;
		let position = world.requireComponent(entity, "position");

		position.x = x;
		position.y = y;
		console.log("moving", entity, "to", x, y);

		return display.move(entity, x, y);
	}

	get duration() { return 10; }
}

export class Attack extends Action {
	constructor(protected attacker: Entity, protected target: Entity) {
		super();
	}

	async perform(world: World) {
		const { attacker, target } = this;
		console.log("entity", attacker, "attacking", target);
	}
}
