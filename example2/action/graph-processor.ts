import { world } from "../world.ts";
import { Action } from "./actions.ts";
import type Pipeline from "./pipeline.ts";


export default class GraphProcessor {
	readonly node = document.createElement("div");
	protected ul = document.createElement("ul");
	protected actionNodes = new Map<Action, HTMLElement>();

	constructor(protected pipeline: Pipeline) {
		const { node, ul } = this;
		node.classList.add("actions");

		node.append(ul);

		pipeline.addProcessor((action: Action, parentAction?: Action) => this.graphProcessor(action, parentAction));
	}

	graphProcessor(action: Action, parentAction?: Action) {
		const { node, actionNodes } = this;

		let li = document.createElement("li");
		let span = document.createElement("span");
		let ul = document.createElement("ul");

		span.textContent = action.type;
		li.append(span, ul);

		actionNodes.set(action, li);

		if (parentAction) {
			let parentNode = actionNodes.get(parentAction);
			if (!parentNode) { throw new Error(`Unable to find node for parent action ${parentAction}`); }
			parentNode.querySelector("ul")!.append(li);
		} else {
			this.ul.append(li);
		}
	}

	flush() {
		const { node, actionNodes } = this;
/*
		for (let actionNode of actionNodes.values()) {
			if (actionNode.parentNode) { continue; }
			let ul = document.createElement("ul");
			ul.append(actionNode);
			node.append(ul);
		}
*/
		this.scroll();

		actionNodes.clear();
	}

	protected scroll() {
		const { ul } = this;

		// FIXME kdyz ma justify-content:end, tak nema scrollWidth??
		while (1) {
			let first = ul.children[0] as HTMLElement;
			if (!first || first.offsetLeft >= 0) { break; }
			first.remove();
		}
	}
}
