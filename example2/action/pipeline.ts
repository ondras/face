import { Action } from "./actions.ts";


type Processor = (action: Action) => Promise<void> | void;

export default class Pipeline {
	protected processors: Processor[] = [];
	protected queue: Action[] = [];

	push(action: Action) { this.queue.push(action); }

	addProcessor(processor: Processor) { this.processors.push(processor); }

	async run() {
		const { queue, processors } = this;
		while (queue.length) {
			let action = queue.shift()!;
			for (let processor of processors) {
				await processor(action);
			}
		}
	}
}
