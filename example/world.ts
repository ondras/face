import { World, Entity, SpatialIndex, PubSub } from "../face.ts";


interface Blocks {
	sight: boolean;
	movement: boolean;
}

export interface Position {
    x: number;
    y: number;
    zIndex?: number;
}

interface Visual {
    ch: string;
    fg: string;
}

interface Health {
    hp: number;
}

type Task = { type:"attack"; target:Entity; }

type UIBrain = { type:"ui"; };
export type AIBrain = { type:"ai"; task?:Task; };

type Actor = {
    wait: number;
    brain: UIBrain | AIBrain;
}


interface Components {
    position: Position; // anything bound to a set of coordinates
    visual: Visual;     // anything with a visual representation
    actor: Actor;       // anything that generates actions
    blocks: Blocks;     // anything
    health: Health;     // anything with the concept of "alive" and "damage-able"
}

export const world = new World<Components>();


interface Messages {
	"visual-show": {
		entity: Entity;
	};
	"visual-hide": {
		entity: Entity;
	};
	"visual-move": {
		entity: Entity;
	}
}
export const pubsub = new PubSub<Messages>();


export const spatialIndex = new SpatialIndex(world);
