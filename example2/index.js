// ../query.ts
var Query = class extends EventTarget {
  ac = new AbortController();
  entities = /* @__PURE__ */ new Set();
  components;
  constructor(world2, ...components) {
    super();
    this.components = components;
    const options = {
      signal: this.ac.signal
    };
    world2.addEventListener("component-add", (e) => this.onAddComponent(e.detail.entity, e.detail.component), options);
    world2.addEventListener("component-remove", (e) => this.onRemoveComponent(e.detail.entity, e.detail.component), options);
    world2.addEventListener("entity-remove", (e) => this.onRemoveEntity(e.detail.entity), options);
    world2.addEventListener("reset", (e) => this.onReset(e.target), options);
    world2.findEntities(...components).keys().forEach((entity) => this.entities.add(entity));
  }
  destroy() {
    this.entities.clear();
    this.ac.abort();
  }
  onReset(world2) {
    const { entities, components } = this;
    entities.clear();
    world2.findEntities(...components).keys().forEach((entity) => entities.add(entity));
    this.dispatchEvent(new Event("change"));
  }
  onAddComponent(entity, component) {
    const { entities, components } = this;
    if (!components.includes(component)) {
      return;
    }
    entities.add(entity);
    this.dispatchEvent(new Event("change"));
  }
  onRemoveComponent(entity, component) {
    const { entities, components } = this;
    if (!components.includes(component)) {
      return;
    }
    entities.delete(entity);
    this.dispatchEvent(new Event("change"));
  }
  onRemoveEntity(entity) {
    const { entities } = this;
    if (!entities.has(entity)) {
      return;
    }
    entities.delete(entity);
    this.dispatchEvent(new Event("change"));
  }
};

// ../typed-event-target.ts
var TypedEventTarget = class extends EventTarget {
  addEventListener(type, listener, options) {
    return super.addEventListener(type, listener, options);
  }
  removeEventListener(type, listener, options) {
    return super.removeEventListener(type, listener, options);
  }
};

// ../world.ts
var World = class extends TypedEventTarget {
  storage = /* @__PURE__ */ new Map();
  counter = 0;
  /** world.createEntity({position:{x,y}}) */
  createEntity(init2) {
    let entity = ++this.counter;
    let detail = {
      entity
    };
    this.dispatchEvent(new CustomEvent("entity-create", {
      detail
    }));
    init2 && this.addComponents(entity, init2);
    return entity;
  }
  removeEntity(entity) {
    let detail = {
      entity
    };
    this.dispatchEvent(new CustomEvent("entity-remove", {
      detail
    }));
    this.storage.delete(entity);
  }
  /** world.addComponent(3, "position", {x,y}) */
  addComponent(entity, componentName, componentData) {
    const { storage } = this;
    let data = storage.get(entity);
    if (!data) {
      data = {};
      storage.set(entity, data);
    }
    data[componentName] = structuredClone(componentData);
    let detail = {
      entity,
      component: componentName
    };
    this.dispatchEvent(new CustomEvent("component-add", {
      detail
    }));
  }
  /** world.addComponent(3, {position:{x,y}, name:{...}}) */
  addComponents(entity, components) {
    for (let name in components) {
      this.addComponent(entity, name, components[name]);
    }
  }
  /** world.removeComponents(3, "position", "name", ...) */
  removeComponents(entity, ...components) {
    const { storage } = this;
    let data = storage.get(entity);
    components.forEach((component) => {
      delete data[component];
      let detail = {
        entity,
        component
      };
      this.dispatchEvent(new CustomEvent("component-remove", {
        detail
      }));
    });
  }
  /** world.hasComponents(3, "position", "name", ...) */
  hasComponents(entity, ...components) {
    let data = this.storage.get(entity);
    if (!data) {
      return false;
    }
    return keysPresent(data, components);
  }
  /** world.findEntities("position") -> Map<3, {position:{x,y}}> */
  findEntities(...components) {
    let result = /* @__PURE__ */ new Map();
    for (let [entity, storage] of this.storage.entries()) {
      if (!keysPresent(storage, components)) {
        continue;
      }
      result.set(entity, storage);
    }
    return result;
  }
  /** world.getComponent(3, "position") -> {x,y} | undefined */
  getComponent(entity, component) {
    let data = this.storage.get(entity);
    return data ? data[component] : void 0;
  }
  /** world.getComponents(3, "position", "name") -> {position:{x,y}, name:{...}} | undefined */
  getComponents(entity, ...components) {
    let data = this.storage.get(entity);
    if (!data || !keysPresent(data, components)) {
      return void 0;
    }
    return data;
  }
  /** world.requireComponent(3, "position") -> {x,y} | throw */
  requireComponent(entity, component) {
    let result = this.getComponent(entity, component);
    if (!result) {
      throw new Error(`entity ${entity} is missing the required component ${component}`);
    }
    return result;
  }
  /** world.getComponents(3, "position", "name") -> {position:{x,y}, name:{...}} | throw */
  requireComponents(entity, ...components) {
    let result = this.getComponents(entity, ...components);
    if (!result) {
      throw new Error(`entity ${entity} is missing the required components ${components}`);
    }
    return result;
  }
  query(...components) {
    return new Query(this, ...components);
  }
  toString() {
    let dict = {};
    for (let [entity, components] of this.storage.entries()) {
      dict[entity] = components;
    }
    return JSON.stringify(dict);
  }
  fromString(str) {
    const { storage } = this;
    let counter = 0;
    let dict = JSON.parse(str);
    storage.clear();
    for (let key in dict) {
      let entity = Number(key);
      storage.set(entity, dict[key]);
      if (entity > counter) {
        counter = entity;
      }
    }
    this.counter = counter;
    this.dispatchEvent(new CustomEvent("reset"));
  }
};
function keysPresent(data, keys) {
  return keys.every((key) => key in data);
}

// ../scheduler.ts
var DurationActorScheduler = class {
  world;
  query;
  constructor(world2) {
    this.world = world2;
    this.query = world2.query("actor");
  }
  next() {
    const { world: world2, query } = this;
    let { entities } = query;
    let actors = /* @__PURE__ */ new Map();
    entities.forEach((entity) => actors.set(entity, world2.requireComponent(entity, "actor")));
    let minEntity = findMinWait(actors);
    if (!minEntity) {
      return void 0;
    }
    let minWait = actors.get(minEntity).wait;
    actors.forEach((actor) => actor.wait -= minWait);
    return minEntity;
  }
  commit(entity, duration) {
    this.world.requireComponent(entity, "actor").wait += duration;
  }
};
function findMinWait(actors) {
  let minWait = 1 / 0;
  let minEntity;
  actors.forEach((actor, entity) => {
    if (actor.wait < minWait) {
      minWait = actor.wait;
      minEntity = entity;
    }
  });
  return minEntity;
}
var FairActorScheduler = class extends DurationActorScheduler {
  next() {
    let result = super.next();
    if (!result) {
      return void 0;
    }
    this.commit(result, 1);
    return result;
  }
};

// ../spatial-index.ts
var SpatialIndex = class {
  world;
  data = [];
  entityToSet = /* @__PURE__ */ new Map();
  constructor(world2) {
    this.world = world2;
    world2.addEventListener("reset", () => this.rebuild());
  }
  update(entity) {
    const { world: world2, data, entityToSet } = this;
    const existingSet = entityToSet.get(entity);
    if (existingSet) {
      existingSet.delete(entity);
      entityToSet.delete(entity);
    }
    const position = world2.getComponent(entity, "position");
    if (position) {
      const storage = getSetFor(position.x, position.y, data);
      storage.add(entity);
      entityToSet.set(entity, storage);
    }
  }
  list(x, y) {
    if (x < 0 || y < 0) {
      return /* @__PURE__ */ new Set();
    }
    return getSetFor(x, y, this.data);
  }
  rebuild() {
    const { world: world2 } = this;
    this.data = [];
    this.entityToSet.clear();
    let entities = world2.findEntities("position").keys();
    for (let entity of entities) {
      this.update(entity);
    }
  }
};
function getSetFor(x, y, data) {
  while (data.length <= x) {
    data.push([]);
  }
  const col = data[x];
  while (col.length <= y) {
    col.push(/* @__PURE__ */ new Set());
  }
  return col[y];
}

// ../action-pipeline.ts
var ActionPipeline = class {
  processors = [];
  queue = [];
  push(action) {
    this.queue.push(action);
  }
  addProcessor(processor) {
    this.processors.push(processor);
  }
  async run() {
    const { queue, processors } = this;
    while (queue.length) {
      let action = queue.shift();
      for (let processor of processors) {
        let result = await processor(action);
        result && queue.push(...result);
      }
    }
  }
};

// world.ts
var world = new World();
var spatialIndex = new SpatialIndex(world);
var display = document.querySelector("rl-display");

// action/spatial-index-processor.ts
function spatialIndexProcessor(action) {
  switch (action.type) {
    case "spawn":
    case "move":
      spatialIndex.update(action.entity);
      break;
  }
}

// action/console-processor.ts
function consoleProcessor(action) {
  console.log(action);
}

// action/game-processor.ts
function gameProcessor(action) {
  switch (action.type) {
    case "spawn":
      {
        world.addComponent(action.entity, "position", action.position);
      }
      break;
    case "move":
      {
        Object.assign(world.requireComponent(action.entity, "position"), action.position);
      }
      break;
  }
}

// geom.ts
function distEuclidean(x1, y1, x2, y2) {
  let dx = x1 - x2;
  let dy = y1 - y2;
  return Math.sqrt(dx ** 2 + dy ** 2);
}

// action/display-processor.ts
async function displayProcessor(action) {
  switch (action.type) {
    case "spawn":
      {
        const { position, entity } = action;
        const visual = world.requireComponent(entity, "visual");
        display.draw(position.x, position.y, visual, {
          zIndex: position.zIndex,
          id: entity
        });
      }
      break;
    case "shoot":
      {
        const { entity, target } = action;
        const source = world.requireComponent(entity, "position");
        let projectile = display.draw(source.x, source.y, {
          ch: "*",
          fg: "yellow"
        }, {
          zIndex: 3
        });
        let dist = distEuclidean(source.x, source.y, target.x, target.y);
        await display.move(projectile, target.x, target.y, dist * 20);
      }
      break;
    case "move":
      {
        let position = world.requireComponent(action.entity, "position");
        await display.move(action.entity, position.x, position.y);
      }
      break;
  }
}

// action/pipeline.ts
var Pipeline = class extends ActionPipeline {
  constructor() {
    super();
    this.addProcessor(consoleProcessor);
    this.addProcessor(gameProcessor);
    this.addProcessor(spatialIndexProcessor);
    this.addProcessor(displayProcessor);
  }
};

// brain/utils.ts
function readKey() {
  let { promise, resolve } = Promise.withResolvers();
  window.addEventListener("keydown", resolve, {
    once: true
  });
  return promise;
}

// brain/pc.ts
var NumpadOffsets = {
  "Numpad1": [
    -1,
    1
  ],
  "Numpad2": [
    0,
    1
  ],
  "Numpad3": [
    1,
    1
  ],
  "Numpad4": [
    -1,
    0
  ],
  "Numpad6": [
    1,
    0
  ],
  "Numpad7": [
    -1,
    -1
  ],
  "Numpad8": [
    0,
    -1
  ],
  "Numpad9": [
    1,
    -1
  ]
};
var ArrowAliases = {
  "ArrowLeft": "Numpad4",
  "ArrowRight": "Numpad6",
  "ArrowUp": "Numpad8",
  "ArrowDown": "Numpad2"
};
function eventToAction(e, entity) {
  let { code } = e;
  if (code in ArrowAliases) {
    code = ArrowAliases[code];
  }
  if (code in NumpadOffsets) {
    let offset = NumpadOffsets[code];
    let position = structuredClone(world.requireComponent(entity, "position"));
    position.x += offset[0];
    position.y += offset[1];
    return {
      type: "move",
      entity,
      position
    };
  }
  return null;
}
async function procureAction(entity) {
  while (true) {
    let event = await readKey();
    let action = await eventToAction(event, entity);
    if (action) {
      return action;
    }
    let tx = Math.floor(Math.random() * display.cols);
    let ty = Math.floor(Math.random() * display.rows);
    return {
      type: "shoot",
      entity,
      target: {
        x: tx,
        y: ty
      }
    };
  }
}

// brain/npc.ts
function procureAction2(entity) {
  return {
    type: "idle"
  };
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
    let w = Math.floor(area[0] / tileCount[0]);
    let h = Math.floor(area[1] / tileCount[1]);
    let ar = w / h;
    if (ar < aspectRatioRange[0]) {
      h = Math.floor(w / aspectRatioRange[0]);
    } else if (ar > aspectRatioRange[1]) {
      w = Math.floor(h * aspectRatioRange[1]);
    }
    return [
      w,
      h
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

// random.ts
Array.prototype.random = function() {
  return this[Math.floor(Math.random() * this.length)];
};

// index.ts
async function init(pipeline2) {
  const w = 30;
  const h = 10;
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
  let pc = world.createEntity({
    visual: {
      ch: "@",
      fg: "red"
    },
    blocks: {
      movement: true,
      sight: false
    },
    actor: {
      wait: 0,
      brain: "pc"
    },
    health: {
      hp: 10
    }
  });
  pipeline2.push({
    type: "spawn",
    entity: pc,
    position: {
      x: 5,
      y: 5,
      zIndex: 1
    }
  });
  await pipeline2.run();
}
function procureAction3(entity) {
  let brain = world.requireComponent(entity, "actor").brain;
  switch (brain) {
    case "pc":
      return procureAction(entity);
    case "npc":
      return procureAction2(entity);
  }
}
async function run(scheduler2) {
  while (true) {
    let actor = scheduler2.next();
    if (!actor) {
      break;
    }
    let action = await procureAction3(actor);
    scheduler2.commit(actor, "duration" in action ? action.duration : 1);
    pipeline.push(action);
    await pipeline.run();
  }
}
var pipeline = new Pipeline();
await init(pipeline);
var scheduler = new FairActorScheduler(world);
run(scheduler);
