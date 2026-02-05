import { Entity, World } from "./world.ts"


type ComponentName<T> = keyof T & string;

export default class Query<AllComponents, C extends ComponentName<AllComponents>> extends EventTarget {
	protected ac = new AbortController();
	readonly entities = new Set<Entity>();
	protected components: C[];

	constructor(world: World<AllComponents>, ...components: C[]) {
		super();

		this.components = components;

		const options = { signal: this.ac.signal };
		world.addEventListener("component-add", e => this.onAddComponent(e.detail.entity, e.detail.component as C), options);
		world.addEventListener("component-remove", e => this.onRemoveComponent(e.detail.entity, e.detail.component as C), options);
		world.addEventListener("entity-remove", e => this.onRemoveEntity(e.detail.entity), options);

		world.findEntities(...components).forEach(result => this.entities.add(result.entity));
	}

	destroy() {
		this.entities.clear();
		this.ac.abort();
	}

	protected onAddComponent(entity: Entity, component: C) {
		const { entities, components } = this;

		if (!components.includes(component)) { return; }
		entities.add(entity);

		this.dispatchEvent(new Event("change"));
	}

	protected onRemoveComponent(entity: Entity, component: C) {
		const { entities, components } = this;

		if (!components.includes(component)) { return; }
		entities.delete(entity);

		this.dispatchEvent(new Event("change"));
	}

	protected onRemoveEntity(entity: Entity) {
		const { entities } = this;

		if (!entities.has(entity)) { return; }
		entities.delete(entity);

		this.dispatchEvent(new Event("change"));
	}
}
