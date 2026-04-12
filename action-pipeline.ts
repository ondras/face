type PromiseOrValue<T> = T | Promise<T>;
type Processor<A> = (action: A) => PromiseOrValue<void | A[]>;


export class ActionPipeline<A> {
	protected processors: Processor<A>[] = [];
	protected queue: A[] = [];

	push(action: A) { this.queue.push(action); }

	addProcessor(processor: Processor<A>) { this.processors.push(processor); }

	async run() {
		const { queue, processors } = this;
		while (queue.length) {
			let action = queue.shift()!;
			for (let processor of processors) {
				let result = await processor(action);
				result && queue.push(...result);
			}
		}
	}
}
