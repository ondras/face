import { World } from "../face.ts";


interface Position {
    x: number;
    y: number;
}

interface Visual {
    ch: string;
}

interface Actor {
	wait: number;
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

export type MyWorld = World<Components>;

export default new World<Components>();
