import { Entity } from "../face.ts";
import { world, pubsub, spatialIndex } from "./world.ts";


type ValueOrPromise<T> = T | Promise<T>;

function createReadableStream<T=string>() {
	let controller!: ReadableStreamDefaultController<T>;
	let start = (c: typeof controller) => controller = c;
	let stream = new ReadableStream<T>({ start });
	return { stream, controller };
}

export abstract class Action {
	readonly logStream: ReadableStream<string>;
	protected logController: ReadableStreamDefaultController<string>;
	get duration() { return 1; }

	constructor() {
		let { stream, controller } = createReadableStream<string>();
		this.logStream = stream;
		this.logController = controller;
	}

	protected log(...parts: any[]) {
		this.logController.enqueue(parts.join(" "));
	}

	end() {
		this.logController.close();
	}

	abstract perform(): ValueOrPromise<Action[]>;
}

export class Wait extends Action {
	constructor(protected entity: Entity) {
		super();
	}

	perform() { return []; }
}

export class Move extends Action {
	constructor(protected entity: Entity, protected x: number, protected y: number) {
		super();
	}

	async perform() {
		const { entity, x, y } = this;
		let position = world.requireComponent(entity, "position");

		position.x = x;
		position.y = y;
		this.log("moving", entity, "to", x, y);

		spatialIndex.update(entity);

		await pubsub.publish("visual-move", {entity});

		return [];
	}

	get duration() { return 10; }
}

export class Attack extends Action {
	constructor(protected attacker: Entity, protected target: Entity) {
		super();
	}

	async perform() {
		const { attacker, target } = this;
		this.log("entity", attacker, "attacking", target);
		if (Math.random() > 0.1) {
			this.log("hit");
			return [new Damage(attacker, target)];
		} else {
			this.log("miss");
			return [];
		}
	}
}

export class Damage extends Action {
	constructor(protected attacker: Entity, protected target: Entity) {
		super();
	}

	perform() {
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

	perform() {
		const { entity } = this;
		this.log("death", entity);

		const { position, visual } = world.requireComponents(entity, "position", "visual");
		let corpse = world.createEntity({
			position: {
				...position,
				zIndex: 1
			},
			visual: {
				ch: "%",
				fg: visual.fg
			}
		});
		spatialIndex.update(corpse);
		pubsub.publish("visual-show", {entity:corpse});

		world.removeComponents(entity, "actor", "position");
		spatialIndex.update(entity);
		pubsub.publish("visual-hide", {entity});

		return [];
	}
}
