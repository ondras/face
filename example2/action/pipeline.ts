import spatialIndexProcessor from "./spatial-index-processor.ts";
import consoleProcessor from "./console-processor.ts";
import gameProcessor from "./game-processor.ts";
import displayProcessor from "./display-processor.ts";
import { ActionPipeline } from "face.ts";
import { Action } from "./actions.ts";


export default class Pipeline extends ActionPipeline<Action> {
	constructor() {
		super();

		this.addProcessor(consoleProcessor);
		this.addProcessor(gameProcessor);
		this.addProcessor(spatialIndexProcessor);
		this.addProcessor(displayProcessor);
	}
}
