// ../world.ts
var World = class extends EventTarget {
  storage = /* @__PURE__ */ new Map();
  counter = 0;
  createEntity(initialComponents = {}) {
    let entity = ++this.counter;
    initialComponents && this.addComponents(entity, initialComponents);
    return entity;
  }
  addComponent(entity, componentName, componentData) {
    const { storage } = this;
    let data = storage.get(entity);
    if (!data) {
      data = {};
      storage.set(entity, data);
    }
    data[componentName] = structuredClone(componentData);
  }
  addComponents(entity, components) {
    for (let name in components) {
      this.addComponent(entity, name, components[name]);
    }
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
  world;
  constructor(world2) {
    this.world = world2;
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
    let promises = [
      ...listeners
    ].map((listener) => listener(data));
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

// ../spatial-index.ts
var SpatialIndex = class {
  world;
  data = [];
  constructor(world2) {
    this.world = world2;
  }
  update(entity) {
    const { world: world2, data } = this;
    data.forEach((col) => {
      col.forEach((entities) => {
        let index = entities.indexOf(entity);
        if (index > -1) {
          entities.splice(index, 1);
        }
      });
    });
    let position = world2.getComponent(entity, "position");
    if (position) {
      let storage = getStorageFor(position.x, position.y, data);
      storage.push(entity);
    }
  }
  list(x, y) {
    return getStorageFor(x, y, this.data);
  }
};
function getStorageFor(x, y, data) {
  while (data.length <= x) {
    data.push([]);
  }
  let col = data[x];
  while (col.length <= y) {
    col.push([]);
  }
  return col[y];
}

// world.ts
var world = new World();
var pubsub = new PubSub();
var spatialIndex = new SpatialIndex(world);
var display = document.querySelector("rl-display");

// utils.ts
Array.prototype.random = function() {
  return this[Math.floor(Math.random() * this.length)];
};
function readKey() {
  let { promise, resolve } = Promise.withResolvers();
  window.addEventListener("keydown", resolve, {
    once: true
  });
  return promise;
}
function distEuclidean(x1, y1, x2, y2) {
  let dx = x1 - x2;
  let dy = y1 - y2;
  return Math.sqrt(dx ** 2 + dy ** 2);
}

// pc.ts
function createEntity(x, y) {
  let visual = {
    ch: "@",
    fg: "red"
  };
  let blocks = {
    movement: true,
    sight: false
  };
  let position = {
    x,
    y,
    zIndex: 2
  };
  let entity = world.createEntity({
    position,
    visual,
    blocks,
    actor: {
      wait: 0,
      brain: "pc"
    },
    health: {
      hp: 10
    }
  });
  spatialIndex.update(entity);
  display.draw(position.x, position.y, visual, {
    zIndex: 1,
    id: entity
  });
  return entity;
}
async function shoot(entity) {
  let tx = Math.floor(Math.random() * display.cols);
  let ty = Math.floor(Math.random() * display.rows);
  let source = world.requireComponent(entity, "position");
  let projectile = display.draw(source.x, source.y, {
    ch: "*",
    fg: "yellow"
  }, {
    zIndex: 3
  });
  let dist = distEuclidean(source.x, source.y, tx, ty);
  await display.move(projectile, tx, ty, dist * 20);
}
async function act(entity) {
  while (true) {
    let event = await readKey();
    await shoot(entity);
    return;
  }
}

// npc.ts
async function act2(entity) {
}

// deno:https://jsr.io/@ondras/rl-display/2.0.0/src/storage.ts
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
    return [
      ...ids
    ].find((id) => this.getById(id).zIndex == zIndex);
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
      this.#keyToIds.set(key, /* @__PURE__ */ new Set([
        id
      ]));
    }
  }
  delete(id) {
    this.#idToData.delete(id);
    let key = this.#idToKey.get(id);
    this.#keyToIds.get(key).delete(id);
    this.#idToKey.delete(id);
  }
};

// deno:https://jsr.io/@ondras/rl-display/2.0.0/src/rl-display.ts
var EFFECTS = {
  "pulse": {
    keyframes: {
      scale: [
        1,
        1.6,
        1
      ],
      offset: [
        0,
        0.1,
        1
      ]
    },
    options: 500
  },
  "fade-in": {
    keyframes: {
      opacity: [
        0,
        1
      ]
    },
    options: 300
  },
  "fade-out": {
    keyframes: {
      opacity: [
        1,
        0
      ]
    },
    options: 300
  },
  "jump": {
    keyframes: [
      {
        scale: 1,
        translate: 0
      },
      {
        scale: "1.2 0.8",
        translate: "0 20%"
      },
      {
        scale: "0.7 1.3",
        translate: "0 -70%"
      },
      {
        scale: 1,
        translate: 0
      }
    ],
    options: 600
  },
  "explode": {
    keyframes: [
      {
        scale: 0.9,
        opacity: 1
      },
      {
        scale: 1
      },
      {
        scale: 1.3
      },
      {
        scale: 1.2
      },
      {
        scale: 1.3
      },
      {
        scale: 1.4
      },
      {
        scale: 1.3
      },
      {
        scale: "2 1.5",
        opacity: 1
      },
      {
        scale: "4 3",
        opacity: 0.5
      },
      {
        scale: "8 6",
        opacity: 0
      }
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
    let w2 = Math.floor(area[0] / tileCount[0]);
    let h2 = Math.floor(area[1] / tileCount[1]);
    let ar = w2 / h2;
    if (ar < aspectRatioRange[0]) {
      h2 = Math.floor(w2 / aspectRatioRange[0]);
    } else if (ar > aspectRatioRange[1]) {
      w2 = Math.floor(h2 * aspectRatioRange[1]);
    }
    return [
      w2,
      h2
    ];
  }
  constructor() {
    super();
    this.attachShadow({
      mode: "open"
    });
    this.#canvas.id = "canvas";
  }
  /** Number of columns (characters in horizontal direction) */
  get cols() {
    return Number(this.style.getPropertyValue("--cols")) || 20;
  }
  set cols(cols) {
    this.style.setProperty("--cols", String(cols));
  }
  /** Number of rows (characters in vertical direction) */
  get rows() {
    return Number(this.style.getPropertyValue("--rows")) || 10;
  }
  set rows(rows) {
    this.style.setProperty("--rows", String(rows));
  }
  /** Center the viewport above a given position */
  panTo(x, y, scale = 1, timing) {
    const { cols, rows } = this;
    let props = {
      "--pan-dx": ((cols - 1) / 2 - x) * scale,
      "--pan-dy": ((rows - 1) / 2 - y) * scale,
      "--scale": scale
    };
    let options = mergeTiming({
      duration: 300,
      fill: "both"
    }, timing);
    let a = this.animate([
      props
    ], options);
    return waitAndCommit(a);
  }
  /** Reset the viewport back to the center of the canvas */
  panToCenter(timing) {
    const { cols, rows } = this;
    return this.panTo((cols - 1) / 2, (rows - 1) / 2, 1, timing);
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
      this.#storage.update(id, {
        x,
        y,
        zIndex
      });
      node = data.node;
    } else {
      node = document.createElement("div");
      this.#canvas.append(node);
      this.#storage.add(id, {
        x,
        y,
        zIndex,
        node
      });
    }
    updateVisual(node, visual);
    updateProperties(node, {
      "--x": x,
      "--y": y,
      "z-index": zIndex
    });
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
    this.#storage.update(id, {
      x,
      y
    });
    this.#applyDepth(oldX, oldY);
    data.node.hidden = false;
    let props = {
      "--x": x,
      "--y": y
    };
    let options = mergeTiming({
      duration: 150,
      fill: "both"
    }, timing);
    let a = data.node.animate([
      props
    ], options);
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
    let data = [
      ...ids
    ].map((id) => this.#storage.getById(id));
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
	    calc(var(--tile-width) * var(--pan-dx))
	    calc(var(--tile-height) * var(--pan-dy));

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

// index.ts
var w = 30;
var h = 10;
display.cols = w;
display.rows = h;
for (let i = 0; i < w; i++) {
  for (let j = 0; j < h; j++) {
    display.draw(i, j, {
      ch: ".",
      fg: "gray"
    }, {
      zIndex: 0
    });
  }
}
var scheduler = new FairActorScheduler(world);
var pcEntity = createEntity(5, 5);
while (true) {
  let actor = scheduler.next();
  if (!actor) {
    break;
  }
  let brain = world.requireComponent(actor, "actor").brain;
  switch (brain) {
    case "pc":
      await act(actor);
      break;
    case "npc":
      await act2(actor);
      break;
  }
}
