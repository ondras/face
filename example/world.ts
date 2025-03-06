import { World as BaseWorld, Entity } from "../face.ts";


export interface Position {
    x: number;
    y: number;
}

interface Visual {
    ch: string;
}

type Task = { type:"attack"; target:Entity; }

type UIBrain = { type:"ui"; };
export type AIBrain = { type:"ai"; task?:Task; };

type Actor = {
    wait: number;
    brain: UIBrain | AIBrain;
}

interface Blocks {
	sight: boolean;
	movement: boolean;
}

interface Components {
    position: Position;
    visual: Visual;
    actor: Actor;
	blocks: Blocks;
}

export type World = BaseWorld<Components>;

export default new BaseWorld<Components>();
