import RlDisplay from "@ondras/rl-display";
import { World, SpatialIndex } from "face.ts";


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

type Actor = {
    wait: number;
    brain: "pc" | "npc";
}

interface Components {
    visual: Visual;     // anything that *could* be visible
    position: Position; // anything that *is visible somewhere*
    actor: Actor;       // anything that generates actions
    blocks: Blocks;     // anything that blocks movement and/or sight
    health: Health;     // anything with the concept of "alive" and "damage-able"
}

export const world = new World<Components>();

export const spatialIndex = new SpatialIndex(world);

export const display = document.querySelector<RlDisplay>("rl-display")!;
