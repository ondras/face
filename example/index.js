globalThis.window.DENO_ENV = 'development';


// ../world.ts
var World = class extends EventTarget {
  storage = /* @__PURE__ */ new Map();
  counter = 0;
  createEntity(initialComponents = {}) {
    let entity = ++this.counter;
    if (initialComponents) {
      this.storage.set(entity, structuredClone(initialComponents));
    }
    return entity;
  }
  addComponent(entity, componentName, componentData) {
    const { storage } = this;
    let data = storage.get(entity);
    if (!data) {
      data = {};
      storage.set(entity, data);
    }
    data[componentName] = componentData;
  }
  removeComponents(entity, ...components) {
    const { storage } = this;
    let data = storage.get(entity);
    components.forEach((component) => delete data[component]);
  }
  hasComponents(entity, ...components) {
    let data = this.storage.get(entity);
    if (!data) {
      return false;
    }
    return keysPresent(data, components);
  }
  findEntities(...components) {
    let result = [];
    for (let [entity, storage] of this.storage.entries()) {
      if (keysPresent(storage, components)) {
        result.push({
          entity,
          ...storage
        });
      }
    }
    return result;
  }
  getComponent(entity, component) {
    let data = this.storage.get(entity);
    return data ? data[component] : data;
  }
  getComponents(entity, ..._components) {
    return this.storage.get(entity);
  }
  requireComponent(entity, component) {
    let result = this.getComponent(entity, component);
    if (!result) {
      throw new Error(`entity ${entity} is missing the required component ${component}`);
    }
    return result;
  }
  requireComponents(entity, ...components) {
    let result = this.getComponents(entity, ...components);
    if (!result || !keysPresent(result, components)) {
      throw new Error(`entity ${entity} is missing the required components ${components}`);
    }
    return result;
  }
};
function keysPresent(data, keys) {
  return keys.every((key) => key in data);
}

// ../scheduler.ts
var FairActorScheduler = class {
  constructor(world) {
    this.world = world;
  }
  next() {
    let results = this.world.findEntities("actor");
    if (!results.length) {
      return void 0;
    }
    let result = results.find(({ actor }) => actor.wait == 0);
    if (result) {
      result.actor.wait = 1;
      return result.entity;
    } else {
      results.forEach(({ actor }) => actor.wait = 0);
      return this.next();
    }
  }
};
var DurationActorScheduler = class {
  constructor(world) {
    this.world = world;
  }
  next() {
    let results = this.world.findEntities("actor");
    let minWait = 1 / 0;
    let minResult;
    results.forEach((result) => {
      if (result.actor.wait < minWait) {
        minWait = result.actor.wait;
        minResult = result;
      }
    });
    results.forEach(({ actor }) => actor.wait -= minWait);
    return minResult?.entity;
  }
  commit(entity, duration) {
    this.world.requireComponent(entity, "actor").wait += duration;
  }
};

// ../pubsub.ts
var PubSub = class {
  listenerStorage = /* @__PURE__ */ new Map();
  subscribe(message, listener) {
    this.listenersFor(message).add(listener);
  }
  unsubscribe(message, listener) {
    this.listenersFor(message).delete(listener);
  }
  async publish(message, data) {
    let listeners = this.listenersFor(message);
    let promises = [...listeners].map((listener) => listener(data));
    await Promise.all(promises);
  }
  listenersFor(message) {
    const { listenerStorage } = this;
    let listeners = listenerStorage.get(message);
    if (!listeners) {
      listeners = /* @__PURE__ */ new Set();
      listenerStorage.set(message, listeners);
    }
    return listeners;
  }
};

// world.ts
var world_default = new World();

// pubsub.ts
var pubsub_default = new PubSub();

// https://jsr.io/@ondras/rl-display/1.0.0/src/storage.ts
var Storage = class {
};
function positionKey(x, y) {
  return `${x},${y}`;
}
var MapStorage = class extends Storage {
  #idToData = /* @__PURE__ */ new Map();
  #idToKey = /* @__PURE__ */ new Map();
  #keyToIds = /* @__PURE__ */ new Map();
  getById(id) {
    return this.#idToData.get(id);
  }
  getIdsByPosition(x, y) {
    return this.#keyToIds.get(positionKey(x, y)) || /* @__PURE__ */ new Set();
  }
  getIdByPosition(x, y, zIndex) {
    let ids = this.getIdsByPosition(x, y);
    return [...ids].find((id) => this.getById(id).zIndex == zIndex);
  }
  add(id, data) {
    this.#idToData.set(id, data);
    let key = positionKey(data.x, data.y);
    this.#idToKey.set(id, key);
    this.#addIdToSet(id, key);
  }
  update(id, data) {
    let currentData = this.getById(id);
    Object.assign(currentData, data);
    let currentKey = this.#idToKey.get(id);
    let newKey = positionKey(currentData.x, currentData.y);
    if (currentKey != newKey) {
      this.#keyToIds.get(currentKey).delete(id);
      this.#addIdToSet(id, newKey);
      this.#idToKey.set(id, newKey);
    }
  }
  #addIdToSet(id, key) {
    if (this.#keyToIds.has(key)) {
      this.#keyToIds.get(key).add(id);
    } else {
      this.#keyToIds.set(key, /* @__PURE__ */ new Set([id]));
    }
  }
  delete(id) {
    this.#idToData.delete(id);
    let key = this.#idToKey.get(id);
    this.#keyToIds.get(key).delete(id);
    this.#idToKey.delete(id);
  }
};

// https://jsr.io/@ondras/rl-display/1.0.0/src/rl-display.ts
var EFFECTS = {
  "pulse": {
    keyframes: {
      scale: [1, 1.6, 1],
      offset: [0, 0.1, 1]
    },
    options: 500
  },
  "fade-in": {
    keyframes: { opacity: [0, 1] },
    options: 300
  },
  "fade-out": {
    keyframes: { opacity: [1, 0] },
    options: 300
  },
  "jump": {
    keyframes: [
      { scale: 1, translate: 0 },
      { scale: "1.2 0.8", translate: "0 20%" },
      { scale: "0.7 1.3", translate: "0 -70%" },
      { scale: 1, translate: 0 }
    ],
    options: 600
  },
  "explode": {
    keyframes: [
      { scale: 0.9, opacity: 1 },
      { scale: 1 },
      { scale: 1.3 },
      { scale: 1.2 },
      { scale: 1.3 },
      { scale: 1.4 },
      { scale: 1.3 },
      { scale: "2 1.5", opacity: 1 },
      { scale: "4 3", opacity: 0.5 },
      { scale: "8 6", opacity: 0 }
    ],
    options: 800
  }
};
var RlDisplay = class extends HTMLElement {
  #storage = new MapStorage();
  #canvas = document.createElement("div");
  /** By default, only the top-most character is draw. Set overlap=true to draw all of them. */
  overlap = false;
  /**
   * Computes an optimal character size if we want to fit a given number of characters into a given area.
   */
  static computeTileSize(tileCount, area, aspectRatioRange) {
    let w = Math.floor(area[0] / tileCount[0]);
    let h = Math.floor(area[1] / tileCount[1]);
    let ar = w / h;
    if (ar < aspectRatioRange[0]) {
      h = Math.floor(w / aspectRatioRange[0]);
    } else if (ar > aspectRatioRange[1]) {
      w = Math.floor(h * aspectRatioRange[1]);
    }
    return [w, h];
  }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.#canvas.id = "canvas";
  }
  /** Number of columns (characters in horizontal direction) */
  get cols() {
    return Number(this.style.getPropertyValue("--cols")) || 20;
  }
  set cols(cols2) {
    this.style.setProperty("--cols", String(cols2));
  }
  /** Number of rows (characters in vertical direction) */
  get rows() {
    return Number(this.style.getPropertyValue("--rows")) || 10;
  }
  set rows(rows2) {
    this.style.setProperty("--rows", String(rows2));
  }
  /** Set the zoom amount, maintaining the position set by panTo() */
  scaleTo(scale, timing) {
    let options = mergeTiming({ duration: 300, fill: "both" }, timing);
    let a = this.animate([{ "--scale": scale }], options);
    return waitAndCommit(a);
  }
  /** Center the viewport above a given position */
  panTo(x, y, timing) {
    const { cols: cols2, rows: rows2 } = this;
    let props = {
      "--pan-dx": (cols2 - 1) / 2 - x,
      "--pan-dy": (rows2 - 1) / 2 - y
    };
    let options = mergeTiming({ duration: 300, fill: "both" }, timing);
    let a = this.animate([props], options);
    return waitAndCommit(a);
  }
  /** Reset the viewport back to the center of the canvas */
  panToCenter(timing) {
    const { cols: cols2, rows: rows2 } = this;
    return this.panTo((cols2 - 1) / 2, (rows2 - 1) / 2, timing);
  }
  /**
   * Draws one character (and optionally removes it from its previous position).
   */
  draw(x, y, visual, options = {}) {
    let id = options.id || Math.random();
    let zIndex = options.zIndex || 0;
    let existing = this.#storage.getIdByPosition(x, y, zIndex);
    if (existing && existing != id) {
      this.delete(existing);
    }
    let node;
    let data = this.#storage.getById(id);
    if (data) {
      this.#storage.update(id, { x, y, zIndex });
      node = data.node;
    } else {
      node = document.createElement("div");
      this.#canvas.append(node);
      this.#storage.add(id, { x, y, zIndex, node });
    }
    updateVisual(node, visual);
    updateProperties(node, { "--x": x, "--y": y, "z-index": zIndex });
    this.#applyDepth(x, y);
    return id;
  }
  /** Move a previously drawn character to a different position */
  async move(id, x, y, timing) {
    let data = this.#storage.getById(id);
    if (!data) {
      return;
    }
    let existing = this.#storage.getIdByPosition(x, y, data.zIndex);
    if (existing && existing != id) {
      this.delete(existing);
    }
    let { x: oldX, y: oldY } = data;
    this.#storage.update(id, { x, y });
    this.#applyDepth(oldX, oldY);
    data.node.hidden = false;
    let props = {
      "--x": x,
      "--y": y
    };
    let options = mergeTiming({ duration: 150, fill: "both" }, timing);
    let a = data.node.animate([props], options);
    await waitAndCommit(a);
    this.#applyDepth(x, y);
  }
  /** Remove a character from anywhere, based on its id */
  delete(id) {
    let data = this.#storage.getById(id);
    if (data) {
      data.node.remove();
      this.#storage.delete(id);
      this.#applyDepth(data.x, data.y);
    }
  }
  /** Remove a character from a position (without requiring its id) */
  deleteAt(x, y, zIndex = 0) {
    let id = this.#storage.getIdByPosition(x, y, zIndex);
    if (id) {
      this.delete(id);
    }
  }
  /** @ignore */
  clearAll() {
  }
  /** Apply an animation effect. Either a pre-built string or a standardized Keyframe definition. */
  fx(id, keyframes, options) {
    let record = this.#storage.getById(id);
    if (!record) {
      return;
    }
    if (typeof keyframes == "string") {
      let def = EFFECTS[keyframes];
      return record.node.animate(def.keyframes, options || def.options);
    } else {
      return record.node.animate(keyframes, options);
    }
  }
  /** @ignore */
  connectedCallback() {
    this.shadowRoot.replaceChildren(createStyle(PRIVATE_STYLE), this.#canvas);
    this.cols = this.cols;
    this.rows = this.rows;
  }
  #applyDepth(x, y) {
    if (this.overlap) {
      return;
    }
    let ids = this.#storage.getIdsByPosition(x, y);
    let data = [...ids].map((id) => this.#storage.getById(id));
    let maxZindex = -1 / 0;
    data.forEach((data2) => maxZindex = Math.max(maxZindex, data2.zIndex));
    data.forEach((data2) => {
      data2.node.hidden = data2.zIndex < maxZindex;
    });
  }
};
function mergeTiming(options, timing) {
  if (timing) {
    if (typeof timing == "number") {
      options.duration = timing;
    } else {
      Object.assign(options, timing);
    }
  }
  return options;
}
async function waitAndCommit(a) {
  await a.finished;
  a.effect.target.isConnected && a.commitStyles();
}
function createStyle(src) {
  let style = document.createElement("style");
  style.textContent = src;
  return style;
}
var PUBLIC_STYLE = `
@property --x {
	syntax: "<number>";
	inherits: false;
	initial-value: 0;
}

@property --y {
	syntax: "<number>";
	inherits: false;
	initial-value: 0;
}

@property --scale {
	syntax: "<number>";
	inherits: true;
	initial-value: 1;
}

@property --pan-dx {
	syntax: "<number>";
	inherits: true;
	initial-value: 0;
}

@property --pan-dy {
	syntax: "<number>";
	inherits: true;
	initial-value: 0;
}
`;
var PRIVATE_STYLE = `
:host {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	font-family: monospace;
	color: gray;
	background-color: black;
	user-select: none;
	--tile-width: 20px;
	--tile-height: 20px;
}

#canvas {
	flex: none;
	position: relative;
	width: calc(var(--tile-width) * var(--cols));
	height: calc(var(--tile-height) * var(--rows));
	scale: var(--scale);
	translate:
	    calc(var(--tile-width) * var(--pan-dx) * var(--scale))
	    calc(var(--tile-height) * var(--pan-dy) * var(--scale));

	div {
		display: block; /* not hidden with [hidden] */
		position: absolute;
		width: var(--tile-width);
		text-align: center;
		left: calc(var(--tile-width) * var(--x));
		top: calc(var(--tile-height) * var(--y));
		font-size: calc(var(--tile-height));
		line-height: 1;

		&[hidden] { color: transparent !important; }
	}
}
`;
customElements.define("rl-display", RlDisplay);
document.head.append(createStyle(PUBLIC_STYLE));
function updateProperties(node, props) {
  for (let key in props) {
    node.style.setProperty(key, props[key]);
  }
}
function updateVisual(node, visual) {
  if (visual.ch) {
    node.textContent = visual.ch;
  }
  let props = {};
  if (visual.fg) {
    props.color = visual.fg;
  }
  if (visual.bg) {
    props["background-color"] = visual.bg;
  }
  updateProperties(node, props);
}

// display.ts
var emptyVisual = {
  ch: "."
};
var display = document.querySelector("rl-display");
function onVisualShow(entity) {
  let { position, visual } = world_default.requireComponents(entity, "position", "visual");
  let options = {
    id: entity,
    zIndex: position.zIndex
  };
  display.draw(position.x, position.y, visual, options);
}
function onVisualHide(entity) {
  display.delete(entity);
}
function onVisualMove(entity) {
  let position = world_default.requireComponent(entity, "position");
  return display.move(entity, position.x, position.y);
}
function init() {
  pubsub_default.subscribe("visual-show", (data) => onVisualShow(data.entity));
  pubsub_default.subscribe("visual-move", (data) => onVisualMove(data.entity));
  pubsub_default.subscribe("visual-hide", (data) => onVisualHide(data.entity));
  for (let i = 0; i < display.cols; i++) {
    for (let j = 0; j < display.rows; j++) {
      if (i % (display.cols - 1) && j % (display.rows - 1)) {
        display.draw(i, j, emptyVisual);
      }
    }
  }
}
var cols = display.cols;
var rows = display.rows;

// actions.ts
function createReadableStream() {
  let controller;
  let start = (c) => controller = c;
  let stream = new ReadableStream({ start });
  return { stream, controller };
}
var Action = class {
  logStream;
  logController;
  get duration() {
    return 1;
  }
  constructor() {
    let { stream, controller } = createReadableStream();
    this.logStream = stream;
    this.logController = controller;
  }
  log(...parts) {
    this.logController.enqueue(parts.join(" "));
  }
};
var Wait = class extends Action {
  constructor(entity) {
    super();
    this.entity = entity;
  }
  perform() {
    return [];
  }
};
var Move = class extends Action {
  constructor(entity, x, y) {
    super();
    this.entity = entity;
    this.x = x;
    this.y = y;
  }
  async perform() {
    const { entity, x, y } = this;
    let position = world_default.requireComponent(entity, "position");
    position.x = x;
    position.y = y;
    this.log("moving", entity, "to", x, y);
    await pubsub_default.publish("visual-move", { entity });
    return [];
  }
  get duration() {
    return 10;
  }
};
var Attack = class extends Action {
  constructor(attacker, target) {
    super();
    this.attacker = attacker;
    this.target = target;
  }
  async perform() {
    const { attacker, target } = this;
    this.log("entity", attacker, "attacking", target);
    if (Math.random() > 0.1) {
      this.log("hit");
      return [new Damage(attacker, target)];
    } else {
      this.log("miss");
      return [];
    }
  }
};
var Damage = class extends Action {
  constructor(attacker, target) {
    super();
    this.attacker = attacker;
    this.target = target;
  }
  perform() {
    const { attacker, target } = this;
    let health = world_default.requireComponent(target, "health");
    health.hp -= 1;
    if (health.hp <= 0) {
      return [new Death(target)];
    }
    return [];
  }
};
var Death = class extends Action {
  constructor(entity) {
    super();
    this.entity = entity;
  }
  perform() {
    const { entity } = this;
    this.log("death", entity);
    const { position, visual } = world_default.requireComponents(entity, "position", "visual");
    let corpse = world_default.createEntity({
      position: {
        ...position,
        zIndex: 1
      },
      visual: {
        ch: "%",
        fg: visual.fg
      }
    });
    pubsub_default.publish("visual-show", { entity: corpse });
    world_default.removeComponent(entity, "actor", "position");
    pubsub_default.publish("visual-hide", { entity });
    return [];
  }
};

// utils.ts
Array.prototype.random = function() {
  return this[Math.floor(Math.random() * this.length)];
};
var DIRS = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1]
];
function ring(center) {
  return DIRS.map(([dx, dy]) => [center.x + dx, center.y + dy]);
}
function entitiesAt(x, y) {
  return world_default.findEntities("position").filter((result) => result.position.x == x && result.position.y == y);
}
function canMoveTo(x, y) {
  let entities = entitiesAt(x, y);
  return entities.every((e) => {
    let blocks = world_default.getComponent(e.entity, "blocks");
    if (blocks?.movement) {
      return false;
    }
    return true;
  });
}
async function readKey() {
  let { promise, resolve } = Promise.withResolvers();
  window.addEventListener("keydown", resolve, { once: true });
  return promise;
}
function dist8(x1, y1, x2, y2) {
  let dx = Math.abs(x1 - x2);
  let dy = Math.abs(y1 - y2);
  return Math.max(dx, dy);
}
var OCTILE_CARDINAL = 2;
var OCTILE_DIAGONAL = 3;
function distOctile(x1, y1, x2, y2) {
  let dx = Math.abs(x1 - x2);
  let dy = Math.abs(y1 - y2);
  return OCTILE_CARDINAL * Math.max(dx, dy) + (OCTILE_DIAGONAL - OCTILE_CARDINAL) * Math.min(dx, dy);
}

// ui.ts
var NumpadOffsets = {
  "Numpad1": [-1, 1],
  "Numpad2": [0, 1],
  "Numpad3": [1, 1],
  "Numpad4": [-1, 0],
  "Numpad6": [1, 0],
  "Numpad7": [-1, -1],
  "Numpad8": [0, -1],
  "Numpad9": [1, -1]
};
var Aliases = {
  "ArrowLeft": "Numpad4",
  "ArrowRight": "Numpad6",
  "ArrowUp": "Numpad8",
  "ArrowDown": "Numpad2"
};
function findAttackable(entities) {
  return entities.find((entity) => {
    return world_default.getComponent(entity.entity, "health");
  })?.entity;
}
function findMovementBlocking(entities) {
  return entities.find((entity) => {
    return world_default.getComponent(entity.entity, "blocks")?.movement;
  })?.entity;
}
function eventToAction(e, entity, pos) {
  let { code } = e;
  if (code in Aliases) {
    code = Aliases[code];
  }
  if (code in NumpadOffsets) {
    let offset = NumpadOffsets[code];
    let x = pos.x + offset[0];
    let y = pos.y + offset[1];
    let entities = entitiesAt(x, y);
    let attackable = findAttackable(entities);
    let movementBlocking = findMovementBlocking(entities);
    if (attackable) {
      return new Attack(entity, attackable);
    } else if (movementBlocking) {
      console.log("bump into", movementBlocking);
      return;
    } else {
      return new Move(entity, pos.x + offset[0], pos.y + offset[1]);
    }
  }
}
async function procureAction(entity) {
  let position = world_default.requireComponent(entity, "position");
  while (true) {
    let event = await readKey();
    let action = eventToAction(event, entity, position);
    if (action) {
      return action;
    }
  }
}

// ai.ts
function wander(entity) {
  let position = world_default.requireComponent(entity, "position");
  let available = ring(position).filter((pos2) => canMoveTo(...pos2));
  if (!available.length) {
    return new Wait(entity);
  }
  let pos = available.random();
  return new Move(entity, ...pos);
}
function canAttack(attacker, position) {
  let source = world_default.requireComponent(attacker, "position");
  return dist8(source.x, source.y, position.x, position.y) == 1;
}
function getCloserTo(entity, position) {
  let source = world_default.requireComponent(entity, "position");
  let available = ring(source).filter((pos) => canMoveTo(...pos));
  function CMP(pos1, pos2) {
    let dist1 = distOctile(...pos1, position.x, position.y);
    let dist2 = distOctile(...pos2, position.x, position.y);
    return dist1 - dist2;
  }
  available.sort(CMP);
  if (available.length > 0) {
    let best = available.shift();
    return new Move(entity, ...best);
  } else {
    return wander(entity);
  }
}
function procureAction2(entity, brain) {
  const { task } = brain;
  if (task) {
    switch (task.type) {
      case "attack":
        let targetPosition = world_default.requireComponent(task.target, "position");
        if (canAttack(entity, targetPosition)) {
          return new Attack(entity, task.target);
        } else {
          return getCloserTo(entity, targetPosition);
        }
        break;
    }
  } else {
    return wander(entity);
  }
}

// bestiary.ts
function createPc(x, y) {
  let visual = { ch: "@", fg: "red" };
  let blocks = { movement: true, sight: false };
  let position = { x, y, zIndex: 2 };
  let entity = world_default.createEntity({
    position,
    visual,
    blocks,
    actor: {
      wait: 0,
      brain: { type: "ui" }
    },
    health: { hp: 10 }
  });
  pubsub_default.publish("visual-show", { entity });
  return entity;
}
function createOrc(x, y, target) {
  let visual = { ch: "o", fg: "lime" };
  let position = { x, y, zIndex: 2 };
  let blocks = { movement: true, sight: false };
  let task = {
    type: "attack",
    target
  };
  let entity = world_default.createEntity({
    position,
    visual,
    blocks,
    actor: {
      wait: 0,
      brain: { type: "ai", task }
    },
    health: { hp: 1 }
  });
  pubsub_default.publish("visual-show", { entity });
  return entity;
}

// index.ts
function procureAction3(entity) {
  let brain = world_default.requireComponent(entity, "actor").brain;
  switch (brain.type) {
    case "ai":
      return procureAction2(entity, brain);
    case "ui":
      return procureAction(entity);
  }
}
function createWall(x, y) {
  let visual = { ch: "#" };
  let blocks = { sight: true, movement: true };
  let position = { x, y, zIndex: 0 };
  let entity = world_default.createEntity({
    position,
    visual,
    blocks
  });
  pubsub_default.publish("visual-show", { entity });
  return entity;
}
async function logToConsole(action) {
  for await (let chunk of action.logStream) {
    console.log(chunk);
  }
}
function processAction(action) {
  logToConsole(action);
  return action.perform();
}
init();
for (let i = 0; i < cols; i++) {
  for (let j = 0; j < rows; j++) {
    if (i % (cols - 1) && j % (rows - 1)) {
      continue;
    } else {
      createWall(i, j);
    }
  }
}
var pc = createPc(5, 5);
var orc = createOrc(15, 5, pc);
var s1 = new FairActorScheduler(world_default);
var s2 = new DurationActorScheduler(world_default);
var actionQueue = [];
while (true) {
  if (!actionQueue.length) {
    let actor = s1.next();
    if (!actor) {
      break;
    }
    let action2 = await procureAction3(actor);
    actionQueue.push(action2);
  }
  let action = actionQueue.shift();
  console.log("got action", action.constructor.name);
  let newActions = await processAction(action);
  actionQueue.unshift(...newActions);
}
