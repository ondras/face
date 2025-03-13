interface Listener<M extends object, T extends keyof M> {
	(data: M[T]): any;
}

export class PubSub<M extends object> {
	protected listenerStorage = new Map<keyof M, Set<Function>>();

	subscribe<T extends keyof M>(message: T, listener: Listener<M, T>) {
		this.listenersFor(message).add(listener);
	}

	unsubscribe<T extends keyof M>(message: T, listener: Listener<M, T>) {
		this.listenersFor(message).delete(listener);
	}

	async publish<T extends keyof M>(message: T, data: M[T]) {
		let listeners = this.listenersFor(message);
		let promises = [...listeners].map(listener => listener(data));
		await Promise.all(promises);
	}

	protected listenersFor<T extends keyof M>(message: T) {
		const { listenerStorage } = this;
		let listeners = listenerStorage.get(message);
		if (!listeners) {
			listeners = new Set();
			listenerStorage.set(message, listeners);
		}
		return listeners;
	}
}
