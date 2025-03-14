import { World as BaseWorld, Entity } from "../face.ts";

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
    position: Position;
    visual: Visual;
    actor: Actor;
    blocks: Blocks;
    health: Health;
}

export type World = BaseWorld<Components>;

export default new BaseWorld<Components>();
