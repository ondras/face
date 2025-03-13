interface Events {
	"a": {b:"string"}
}

class MyEvent<T> extends CustomEvent<T> {
	protected promises: Promise<any>[] = [];
	waitUntil(p: Promise<any>) {
		this.promises.push(p);
	}

	async finish() {
		await Promise.all(this.promises);
	}
}

type Listener<T extends keyof Events> = ((e: MyEvent<Events[T]>) => void) | { handleEvent(e: MyEvent<Events[T]>): void; } | null;

class ET extends EventTarget {
	addEventListener<T extends keyof Events>(name: T, listener: Listener<T>, options?: EventListenerOptions) {
		return super.addEventListener(name, listener as EventListenerOrEventListenerObject, options);
	}

	removeEventListener<T extends keyof Events>(name: T, listener: Listener<T>, options?: EventListenerOptions) {
		return super.removeEventListener(name, listener as EventListenerOrEventListenerObject, options);
	}

	dispatchEvent<T extends keyof Events>(e: MyEvent<Events[T]>) {
		return super.dispatchEvent(e);
	}
}

let et = new ET();

let e = new MyEvent("test");
et.addEventListener("a", e => {
	console.warn("1");
	(e as MyEvent<any>).waitUntil(new Promise(resolve => setTimeout(resolve, 500)));
	console.warn("2");
});
et.dispatchEvent(e);
console.warn("3");
await e.finish();
console.warn("4");

export {};