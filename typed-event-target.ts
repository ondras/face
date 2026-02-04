type EventRecord<T> = {
    [key in keyof T]: Event;
};

type ListenerFunction<EventMap, E extends keyof EventMap> = (event: EventMap[E]) => void;
type ListenerObject<EventMap, E extends keyof EventMap> = { handleEvent(event: EventMap[E]): void }
type Listener<EventMap, E extends keyof EventMap> = ListenerFunction<EventMap, E> | ListenerObject<EventMap, E> | null;

export default class TypedEventTarget<EventMap extends EventRecord<EventMap>> extends EventTarget {
	addEventListener<E extends (keyof EventMap & string)>(type: E, listener: Listener<EventMap, E>, options?: AddEventListenerOptions | boolean	) {
		return super.addEventListener(type, listener as EventListener, options);
	}

	removeEventListener<E extends (keyof EventMap & string)>(type: E, listener: Listener<EventMap, E>, options?: EventListenerOptions | boolean) {
		return super.removeEventListener(type, listener as EventListener, options);
	}
/*
	type TypedCustomEvent<T, K extends keyof T> = CustomEvent<T[K]> & { readonly type: K };

	//dispatchEvent<K extends keyof EventMap>(event: TypedCustomEvent<EventMap, K>): boolean {
	dispatchEvent<E extends keyof EventMap>(event: CustomEvent<EventMap[E]>): boolean {
		return super.dispatchEvent(event);
	}
*/
}
