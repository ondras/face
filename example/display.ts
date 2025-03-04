import RlDisplay from "https://cdn.jsdelivr.net/gh/ondras/rl-display@master/src/rl-display.ts";

await customElements.whenDefined("rl-display");
export default document.querySelector("rl-display") as RlDisplay;
