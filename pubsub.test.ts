// deno-lint-ignore-file prefer-const

import { assertEquals } from "jsr:@std/assert";
import { PubSub } from "./face.ts";


Deno.test("pubsub sync", () => {
	interface Messages {
		m: string;
	}
	let pubsub = new PubSub<Messages>();

	let observed = "";

	let listener = (data: string) => observed = data;
	pubsub.subscribe("m", listener);

	let data = "test";
	pubsub.publish("m", data);
	assertEquals(observed, data);

	pubsub.unsubscribe("m", listener);

	observed = "";
	pubsub.publish("m", data);
	assertEquals(observed, "");
});

Deno.test("pubsub async", async () => {
	interface Messages {
		m: string;
	}
	let pubsub = new PubSub<Messages>();

	let observed = "";

	let listener = async (data: string) => {
		await new Promise(resolve => setTimeout(resolve, 10));
		observed = data;
	}
	pubsub.subscribe("m", listener);

	let data = "test";
	let promise = pubsub.publish("m", data);
	assertEquals(observed, "");
	await promise;
	assertEquals(observed, data);
});
