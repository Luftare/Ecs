const ecs = new Ecs();
const groups = {
  MODEL: 'MODEL',
  GRAPHICS: 'GRAPHICS',
};
const comps = {
  POSITION: 'position',
  VELOCITY: 'velocity',
  RECTANGLE: 'rectangle',
  INPUT: 'input',
  PLAYER_CONTROLLED: 'playerControlled',
  AI_CONTROLLED: 'aiControlled',
  COLOR: 'color',
};
const keyCodeToName = {//translate keyCode to key string
  "32": "SPACE",
  "38": "UP",
  "40": "DOWN",
  "37": "LEFT",
  "39": "RIGHT"
};
const view = {
  canvas: document.querySelector('canvas'),
  ctx: document.querySelector('canvas').getContext("2d"),
};

window.onload = loop;

//components
ecs.registerComponent(comps.POSITION, function(x = 0, y = 0) {
  this.x = x;
  this.y = y;
});

ecs.registerComponent(comps.VELOCITY, function(x = 0, y = 0) {
  this.x = x;
  this.y = y;
});

ecs.registerComponent(comps.RECTANGLE, function(width = 5, height = 5) {
  this.width = width;
  this.height = height;
});

ecs.registerComponent(comps.INPUT, function() {
  this.UP = false;
  this.DOWN = false;
  this.LEFT = false;
  this.RIGHT = false;
  this.SPACE = false;
});

ecs.registerComponent(comps.PLAYER_CONTROLLED);

ecs.registerComponent(comps.COLOR);

ecs.registerComponent(comps.HIDDEN);

ecs.registerComponent(comps.AI_CONTROLLED);

//systems
ecs.registerSystem({//move entities with velocity
  group: groups.MODEL,
  has: [comps.POSITION, comps.VELOCITY],
  pre(dt) {

  },
  forEach({ position, velocity }, dt){//iterates all entities with position and velocity component
    position.x += velocity.x * dt;
    position.y += velocity.y * dt;
  }
});

ecs.registerSystem({
  group: groups.GRAPHICS,
  has: [comps.POSITION, comps.RECTANGLE, comps.COLOR],
  not: [comps.HIDDEN],
  pre({ canvas }) {
    canvas.width = canvas.width;
  },
  forEach({ position, rectangle, color }, { ctx }) {
    const { x, y } = position;
    const { width, height } = rectangle;
    ctx.fillStyle = color.value;
    ctx.fillRect(x, y, width, height);
  }
})

function createMeteorite() {
  ecs.createEntity()
    .add(comps.POSITION, Math.random() * view.canvas.width, 0)
    .add(comps.VELOCITY, 50, 50)
    .add(comps.RECTANGLE, 20, 20)
    .add(comps.COLOR, "orange");
}

function createSnowFlake() {
  ecs.createEntity()
    .add(comps.POSITION, Math.random() * view.canvas.width * 2 - view.canvas.width, 0)
    .add(comps.VELOCITY, 0, 5)
    .add(comps.RECTANGLE, 1, 2)
    .add(comps.COLOR, "white");
}

function loop() {
  const dt = 0.016;
  createSnowFlake();
  Math.random() > 0.9 && createMeteorite();
  ecs.runGroup(groups.MODEL, dt);
  ecs.runGroup(groups.GRAPHICS, view);
  requestAnimationFrame(loop);
}
