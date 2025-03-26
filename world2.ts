// deno-lint-ignore-file prefer-const

type ComponentKeys<C> = Exclude<keyof C & string, "id">;

type AllComponents<C, T extends ComponentKeys<C>> = { [P in T]: C[P]; };
type SomeComponents<C, T extends ComponentKeys<C>> = { [P in T]?: C[P]; };
type Entity<C, T extends ComponentKeys<C>> = AllComponents<C, T> & { id: number; }

class World<C extends Omit<object, "id">> {
	protected counter = 0;
	protected entities: (Partial<C> & { id: number; })[] = [];

	createEntity<T extends ComponentKeys<C>>(componentInit: SomeComponents<C, T> = {}): Entity<C, T> {
		let entity = {
			...componentInit,
			id: this.counter++
		} as Entity<C, T>;
		this.entities.push(entity);
		return entity;
	}

	findEntities<T extends ComponentKeys<C>>(...components: T[]): Entity<C, T>[] {
		return this.entities.filter(entity => {
			return components.every(c => c in entity);
		}) as Entity<C, T>[];
	}
}

interface HasPosition {
	pos: {
		x: number;
		y: number;
	}
}
interface HasName {
	name: string;
}

type E<T=object> = T & { id:number};
let w = new World<HasPosition & HasName>();

function log(e: E<HasPosition>) {
	console.log(e.pos.x);
	console.log(e.id);
}

let e = w.createEntity();
w.findEntities("pos", "name").forEach(e => {
	console.log(e.name);
	log(e);
})

