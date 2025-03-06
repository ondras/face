interface Data<T> {
	node: T;
	f: number;
	g: number;
	h: number;
	prev?: Data<T>;
}

interface Options<T> {
	neighbors(node: T): T[];
	cost(from: T, to: T): number;
	heuristic(from: T, to: T): number;
}

function* pasta<T>(from: T, to: T, options: Options<T>) {
	let open = new Map<T, Data<T>>();
	let closed = new Map<T, Data<T>>();

	let h = options.heuristic(from, to);
	let data = createData(from, 0, h);
	open.set(from, data);

	while (open.size > 0) {
		// najit ten z open, co ma nejnizsi f
		let minf = 1/0;
		let current;
		for (let data of open.values()) {
			if (data.f < minf) {
				current = data;
				minf = data.f;
			}
		}
		if (!current) { return; } // neni kde hledat?

		if (current.node == to) { hotovo; }

		open.delete(current.node);
		closed.set(current.node, current);

		for (let neighbor of options.neighbors(current.node)) {
			// pokud je v closed, nechceme ho?
			// pokud je v open ... tak nevim co s nim?
			let g = current.g + options.cost(current.node, neighbor)
			let h = options.heuristic(neighbor, to);
			let data = createData(neighbor, g, h, current);
			open.set(neighbor, data);
		}

		yield { open, closed };
	}
}

function createData<T>(node: T, g: number, h: number, prev?: Data<T>) {
	return {
		node,
		g,
		h,
		f: g+h,
		prev
	}
}

function reversePath<T>(data: Data<T>) {
	let path: Data<T>[] = [data];
	let current = data;
	while (current.prev) {
		current = current.prev;
		path.push(current);
	}

	return path.reverse();
}

/*
^ 1 2 3 4
5 6 7 8 9
a b c X e
f g X X j
k l m n $
*/

class AStar<T> {
	protected open = new Map<T, Data<T>>();
	protected closed = new Map<T, Data<T>>();

	constructor(from: T, to: T, options: Options<T>) {
		let h = options.heuristic(from, to);
		let data = createData(from, 0, h);
		this.open.set(from, data);
	}

	next(options: Options<T>) {
		// najit ten z open, co ma nejnizsi f
		let minf = 1/0;
		let current;
		for (let data of this.open.values()) {
			if (data.f < minf) {
				current = data;
				minf = data.f;
			}
		}
		if (!current) { return; } // neni kde hledat?

		if (current.node == to) { hotovo; }

		this.open.delete(current.node);
		this.closed.set(current.node, current);

		for (let neighbor of options.neighbors(current.node)) {
			// pokud je v closed, nechceme ho?
			// pokud je v open ... tak nevim co s nim?
			let g = current.g + options.cost(current.node, neighbor)
			let h = options.heuristic(neighbor, to);
			let data = createData(neighbor, g, h, current);
			this.open.set(neighbor, data);
		}
	}
}
