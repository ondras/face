import { Entity } from "../face.ts";
import { World } from "./world.ts";
import display from "./display.ts";
import * as utils from "./utils.ts";


type ValueOrPromise<T> = T | Promise<T>;

export abstract class Action {
	get duration() { return 1; }
	canBePerformed(world: World) { return true; }
	abstract perform(world: World): ValueOrPromise<Action[]>;
}

export class Wait extends Action {
	constructor(protected entity: Entity) {
		super();
	}

	perform(world: World) { return []; }
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
		if (Math.random() > 0.1) {
			console.log("hit");
			return [new Damage(attacker, target)];
		} else {
			console.log("miss");
			return [];
		}
	}
}

export class Damage extends Action {
	constructor(protected attacker: Entity, protected target: Entity) {
		super();
	}

	perform(world: World) {
		const { attacker, target } = this;
		let health = world.requireComponent(target, "health");
		health.hp -= 1;
		if (health.hp <= 0) { return [new Death(target)]; }
		return [];
	}
}

export class Death extends Action {
	constructor(protected entity: Entity) {
		super();
	}

	perform(world: World) {
		return [];
	}
}



let et = new EventTarget();
class MyEvent<T> extends CustomEvent<T> {
	protected promises: Promise<any>[] = [];
	waitUntil(p: Promise<any>) {
		this.promises.push(p);
	}

	async finish() {
		await Promise.all(this.promises);
	}
}


let e = new MyEvent("test");
et.addEventListener("test", e => {
	console.warn("1");
	(e as MyEvent<any>).waitUntil(new Promise(resolve => setTimeout(resolve, 500)));
	console.warn("2");
});
et.dispatchEvent(e);
console.warn("3");
await e.finish();
console.warn("4");
