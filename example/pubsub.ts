import { PubSub } from "../face.ts";

interface Messages {
	"component-add": {
		"a": number;
	}
	"component-remove": {
		"a": string;
	}
}

let pubsub = new PubSub<Messages>;
pubsub.subscribe("component-add", console.log)

pubsub.publish("component-add", {"a": 13})
