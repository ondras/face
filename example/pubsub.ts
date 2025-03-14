import { PubSub, Entity } from "../face.ts";

interface Messages {
	"visual-show": {
		entity: Entity;
	};
	"visual-hide": {
		entity: Entity;
	};
	"visual-move": {
		entity: Entity;
	}
}

export default new PubSub<Messages>();
