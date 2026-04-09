import { Action } from "./actions.ts";


export default function consoleProcessor(action: Action) {
	console.log(action);
}
