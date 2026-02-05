// deno-lint-ignore-file prefer-const

import Query from "./query.ts";
import TypedEventTarget from "./typed-event-target.ts";


// "public" types used as return values of public methods
export type Entity = number;

type ComponentBag<AllComponents, C extends keyof AllComponents> = {
	[K in C]: AllComponents[K];
};

type FindResult<AllComponents, C extends keyof AllComponents> = { entity: Entity } & ComponentBag<AllComponents, C>;

// private
type ComponentName<T> = keyof T & string;

interface Events<AllComponents> {
	"entity-create": CustomEvent<{ entity: Entity }>;
	"entity-remove": CustomEvent<{ entity: Entity }>;
	"component-add": CustomEvent<{ entity: Entity; component: ComponentName<AllComponents>; }>;
	"component-remove": CustomEvent<{ entity: Entity; component: ComponentName<AllComponents>; }>;
}

export class World<AllComponents = object> extends TypedEventTarget<Events<AllComponents>> {
	protected storage = new Map<Entity, Partial<AllComponents>>();
	protected counter = 0;

	/** world.createEntity({position:{x,y}}) */
	createEntity(init?: Partial<AllComponents>): Entity {
		let entity = ++this.counter;

		let detail = { entity };
		this.dispatchEvent(new CustomEvent("entity-create", { detail }));

		init && this.addComponents(entity, init);
		return entity;
	}

	removeEntity(entity: Entity) {
		let detail = { entity };
		this.dispatchEvent(new CustomEvent("entity-remove", { detail }));

		this.storage.delete(entity);
	}

	/** world.addComponent(3, "position", {x,y}) */
	addComponent<C extends ComponentName<AllComponents>>(entity: Entity, componentName: C, componentData: AllComponents[C]) {
		const { storage } = this;
		let data = storage.get(entity);
		if (!data) {
			data = {};
			storage.set(entity, data);
		}
		data[componentName] = structuredClone(componentData);

		let detail = {
			entity,
			component: componentName
		}
		this.dispatchEvent(new CustomEvent("component-add", { detail }));
	}

	/** world.addComponent(3, {position:{x,y}, name:{...}}) */
	addComponents(entity: Entity, components: Partial<AllComponents>) {
		for (let name in components) {
			this.addComponent(entity, name, components[name]!);
		}
	}

	/** world.removeComponents(3, "position", "name", ...) */
	removeComponents<C extends ComponentName<AllComponents>>(entity: Entity, ...components: C[]) {
		const { storage } = this;
		let data = storage.get(entity)!;
		// fixme nonexistant?
		components.forEach(component => {
			delete data[component];
			let detail = {
				entity,
				component
			}
			this.dispatchEvent(new CustomEvent("component-remove", { detail }));
		});
	}

	/** world.hasComponents(3, "position", "name", ...) */
	hasComponents<C extends ComponentName<AllComponents>>(entity: Entity, ...components: C[]): boolean {
		let data = this.storage.get(entity);
		if (!data) { return false; }
		return keysPresent(data, components);
	}

	findEntities<C extends ComponentName<AllComponents>>(...components: C[]): FindResult<AllComponents, C>[] {
		let result: FindResult<AllComponents, C>[] = [];

		for (let [entity, storage] of this.storage.entries()) {
			if (!keysPresent(storage, components)) { continue; }
			result.push({
				entity,
				...storage
			} as FindResult<AllComponents, C>);
		}

		return result;
	}

	/** world.getComponent(3, "position") -> {x,y} | undefined */
	getComponent<C extends ComponentName<AllComponents>>(entity: Entity, component: C): AllComponents[C] | undefined {
		let data = this.storage.get(entity);
		return data ? data[component] : undefined;
	}

	/** world.getComponents(3, "position", "name") -> {position:{x,y}, name:{...}} | undefined */
	getComponents<C extends ComponentName<AllComponents>>(entity: Entity, ...components: C[]): ComponentBag<AllComponents, C> | undefined {
		let data = this.storage.get(entity);
		if (!data || !keysPresent(data, components)) { return undefined; }
		return data as ComponentBag<AllComponents, C>;
	}

	/** world.requireComponent(3, "position") -> {x,y} | throw */
	requireComponent<C extends ComponentName<AllComponents>>(entity: Entity, component: C): AllComponents[C] {
		let result = this.getComponent(entity, component);
		if (!result) { throw new Error(`entity ${entity} is missing the required component ${component}`); }
		return result;
	}

	/** world.getComponents(3, "position", "name") -> {position:{x,y}, name:{...}} | throw */
	requireComponents<C extends ComponentName<AllComponents>>(entity: Entity, ...components: C[]): ComponentBag<AllComponents, C> {
		let result = this.getComponents(entity, ...components);
		if (!result) { throw new Error(`entity ${entity} is missing the required components ${components}`); }
		return result;
	}
/* */
	query<C extends ComponentName<AllComponents>>(...components: C[]) {
		return new Query(this, ...components);
	}
	/*	*/
}

function keysPresent(data: Record<string, unknown>, keys: string[]) {
	return keys.every(key => key in data);
}
