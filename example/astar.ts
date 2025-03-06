interface AStarNode {
	id: string;
	f: number;
	g: number;
	h: number;
}

class AStar {
	protected open = new Set<AStarNode>();
	protected closed = new Set<AStarNode>();

	constructor(from, to) {
		let g = 0;
		let h = heuristic(from, to);
		let fromNode = {
			id: from,
			g,
			h,
			f: g+h
		}

		this.open.add(fromNode);
	}

	next() {
		// najit ten z open, co ma nejnizsi f
		let minf = 1/0;
		let minNode = undefined;
		this.open.forEach(node => {
			if (node.f < minf) {
				minNode = node;
				minf = node.f;
			}
		});
		if (!minNode) { return; } // neni kde hledat?

		if (minNode == to) { hotovo; }

		this.open.delete(minNode);
		this.closed.add(minNode);

		let neighbors = getNeighbors(minNode);
		for (let neighbor of neighbors) {
			// pokud je v closed, nechceme ho -> mozna tohle garantuje uz getNeighbors
			// pokud je v open ... tak nevim co s nim
			let h = heuristic(neighbor, to)
			let g = minNode.g + distance(minNode, neighbor)
			let node = {
				id: neighbor,
				g,
				h,
				f: g+h
			}
			this.open.add(node);
		}
	}
}

/*
^ 1 2 3 4
5 6 7 8 9
a b c X e
f g X X j
k l m n $
*/
