export function readKey(): Promise<KeyboardEvent> {
	let { promise, resolve } = Promise.withResolvers<KeyboardEvent>();
	window.addEventListener("keydown", resolve, {once:true});
	return promise;
}
