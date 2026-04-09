import { Entity } from "face.ts";
import { Position } from "../world.ts";


export interface Idle {
	type: "idle";
}

export interface Attack {
	type: "attack";
	duration: number;
	attacker: Entity;
	target: Entity;
}

export interface Spawn {
	type: "spawn";
	entity: Entity;
	position: Position;
}

export interface Damage {
	type: "damage";
	target: Entity;
	amount: number;
}

export interface Shoot {
	type: "shoot";
	entity: Entity;
	target: Position;
}

export type Action = Idle | Attack | Spawn | Damage | Shoot;
