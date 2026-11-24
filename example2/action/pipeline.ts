import spatialIndexProcessor from "./spatial-index-processor.ts";
import consoleProcessor from "./console-processor.ts";
import gameProcessor from "./game-processor.ts";
import displayProcessor from "./display-processor.ts";
import GraphProcessor from "./graph-processor.ts";
import { ActionPipeline } from "face.ts";
import { Action } from "./actions.ts";


export default class Pipeline extends ActionPipeline<Action> {
	protected graphProcessor = new GraphProcessor(this);

	constructor() {
		super();

		this.addProcessor(consoleProcessor);
		this.addProcessor(gameProcessor);
		this.addProcessor(spatialIndexProcessor);
		this.addProcessor(displayProcessor);
	}

	get graphNode() { return this.graphProcessor.node; }

	async run() {
		await super.run();
		this.graphProcessor.flush();
	}
}
