globalThis.window.DENO_ENV = 'development';


// ../world.ts
var World = class {
  #storage = /* @__PURE__ */ new Map();
  #counter = 0;
  createEntity(initialComponents = {}) {
    let entity = ++this.#counter;
    if (initialComponents) {
      this.#storage.set(entity, structuredClone(initialComponents));
    }
    return entity;
  }
  addComponent(entity, componentName, componentData) {
    let data = this.#storage.get(entity);
    if (!data) {
      data = {};
      this.#storage.set(entity, data);
    }
    data[componentName] = componentData;
  }
  removeComponent(entity, ...component) {
    let data = this.#storage.get(entity);
    component.forEach((c) => delete data[c]);
  }
  hasComponents(entity, ...components) {
    let data = this.#storage.get(entity);
    if (!data) {
      return false;
    }
    return keysPresent(data, components);
  }
  findEntities(...components) {
    let result = [];
    for (let [entity, storage] of this.#storage.entries()) {
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
    let data = this.#storage.get(entity);
    return data ? data[component] : data;
  }
  getComponents(entity, ..._components) {
    return this.#storage.get(entity);
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

// world.ts
var world_default = new World();

// display.ts
await customElements.whenDefined("rl-display");
var display_default = document.querySelector("rl-display");

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
function entitiesAt(x, y, world) {
  return world.findEntities("position").filter((result) => result.position.x == x && result.position.y == y);
}
function canMoveTo(x, y, world) {
  let entities = entitiesAt(x, y, world);
  return entities.every((e) => {
    let blocks = world.getComponent(e.entity, "blocks");
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

// actions.ts
var Action = class {
  get duration() {
    return 1;
  }
  canBePerformed(world) {
    return true;
  }
};
var Wait = class extends Action {
  constructor(entity) {
    super();
    this.entity = entity;
  }
  perform(world) {
  }
};
var Move = class extends Action {
  constructor(entity, x, y) {
    super();
    this.entity = entity;
    this.x = x;
    this.y = y;
  }
  canBePerformed(world) {
    return canMoveTo(this.x, this.y, world);
  }
  async perform(world) {
    const { entity, x, y } = this;
    let position = world.requireComponent(entity, "position");
    position.x = x;
    position.y = y;
    console.log("moving", entity, "to", x, y);
    return display_default.move(entity, x, y);
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
  async perform(world) {
    const { attacker, target } = this;
    console.log("entity", attacker, "attacking", target);
    if (Math.random() > 0.1) {
      console.log("hit");
      return new Damage(attacker, target);
    } else {
      console.log("miss");
    }
  }
};
var Damage = class extends Action {
  constructor(attacker, target) {
    super();
    this.attacker = attacker;
    this.target = target;
  }
  perform(world) {
    const { attacker, target } = this;
    let health = world.requireComponent(target, "health");
    health.hp -= 1;
    if (health.hp <= 0) {
      return new Death(target);
    }
  }
};
var Death = class extends Action {
  constructor(entity) {
    super();
    this.entity = entity;
  }
  perform(world) {
  }
};

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
function eventToAction(e, entity, pos) {
  let { code } = e;
  if (code in Aliases) {
    code = Aliases[code];
  }
  if (code in NumpadOffsets) {
    let offset = NumpadOffsets[code];
    return new Move(entity, pos.x + offset[0], pos.y + offset[1]);
  }
}
async function procureAction(entity, world) {
  let position = world.requireComponent(entity, "position");
  while (true) {
    let event = await readKey();
    let action2 = eventToAction(event, entity, position);
    if (!action2) {
      continue;
    }
    if (action2.canBePerformed(world)) {
      return action2;
    }
  }
}

// ai.ts
function wander(entity, world) {
  let position = world.requireComponent(entity, "position");
  let available = ring(position).filter((pos2) => canMoveTo(...pos2, world));
  if (!available.length) {
    return new Wait(entity);
  }
  let pos = available.random();
  return new Move(entity, ...pos);
}
function canAttack(attacker, position, world) {
  let source = world.requireComponent(attacker, "position");
  return dist8(source.x, source.y, position.x, position.y) == 1;
}
function getCloserTo(entity, position, world) {
  let source = world.requireComponent(entity, "position");
  let available = ring(source).filter((pos) => canMoveTo(...pos, world));
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
    return wander(entity, world);
  }
}
function procureAction2(entity, brain, world) {
  const { task } = brain;
  if (task) {
    switch (task.type) {
      case "attack":
        let targetPosition = world.requireComponent(task.target, "position");
        if (canAttack(entity, targetPosition, world)) {
          return new Attack(entity, task.target);
        } else {
          return getCloserTo(entity, targetPosition, world);
        }
        break;
    }
  } else {
    return wander(entity, world);
  }
}

// index.ts
var emptyVisual = {
  ch: "."
};
function procureAction3(entity) {
  let brain = world_default.requireComponent(entity, "actor").brain;
  switch (brain.type) {
    case "ai":
      return procureAction2(entity, brain, world_default);
    case "ui":
      return procureAction(entity, world_default);
  }
}
function createWall(x, y) {
  let visual = { ch: "#" };
  let blocks = { sight: true, movement: true };
  let position = { x, y };
  let id = world_default.createEntity({
    position,
    visual,
    blocks
  });
  display_default.draw(x, y, visual, { id, zIndex: 0 });
  return id;
}
function createPc(x, y) {
  let visual = { ch: "@", fg: "red" };
  let blocks = { movement: true, sight: false };
  let position = { x, y };
  let id = world_default.createEntity({
    position,
    visual,
    blocks,
    actor: {
      wait: 0,
      brain: { type: "ui" }
    },
    health: { hp: 10 }
  });
  display_default.draw(x, y, visual, { id, zIndex: 2 });
  return id;
}
function createOrc(x, y, target) {
  let visual = { ch: "o", fg: "lime" };
  let position = { x, y };
  let blocks = { movement: true, sight: false };
  let task = {
    type: "attack",
    target
  };
  let id = world_default.createEntity({
    position,
    visual,
    blocks,
    actor: {
      wait: 0,
      brain: { type: "ai", task }
    },
    health: { hp: 1 }
  });
  display_default.draw(x, y, visual, { id, zIndex: 2 });
  return id;
}
for (let i = 0; i < display_default.cols; i++) {
  for (let j = 0; j < display_default.rows; j++) {
    if (i % (display_default.cols - 1) && j % (display_default.rows - 1)) {
      display_default.draw(i, j, emptyVisual);
    } else {
      createWall(i, j);
    }
  }
}
var pc = createPc(5, 5);
var orc = createOrc(15, 5, pc);
var s1 = new FairActorScheduler(world_default);
var s2 = new DurationActorScheduler(world_default);
var action;
while (true) {
  if (!action) {
    let actor = s1.next();
    if (!actor) {
      break;
    }
    action = await procureAction3(actor);
  }
  console.log("got action", action.constructor.name);
  action = await action.perform(world_default) || void 0;
}
