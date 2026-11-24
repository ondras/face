type PromiseOrValue<T> = T | Promise<T>;
export type Processor<A> = (action: A, parent?: A) => PromiseOrValue<void | A[]>;
type Entry<A> = { action: A; parent?: A };


export class ActionPipeline<A> {
	protected processors: Processor<A>[] = [];
	protected queue: Entry<A>[] = [];

	push(action: A) { this.queue.push({ action }); }

	addProcessor(processor: Processor<A>) { this.processors.push(processor); }

	async run() {
		const { queue, processors } = this;
		while (queue.length) {
			let { action, parent } = queue.shift()!;
			let children: A[] = [];
			for (let processor of processors) {
				let result = await processor(action, parent);
				result && children.push(...result);
			}
			queue.unshift(...children.map(child => ({ action: child, parent: action })));
		}
	}
}
