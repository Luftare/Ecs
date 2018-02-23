const ecs = new Ecs();
const groups = {
  MODEL: 'MODEL',
  GRAPHICS: 'GRAPHICS',
};
const comps = {
  POSITION: 'POSITION',
  VELOCITY: 'VELOCITY',
  RECTANGLE: 'RECTANGLE',
  INPUT: 'INPUT',
  PLAYER_CONTROLLED: 'PLAYER_CONTROLLED',
  AI_CONTROLLED: 'AI_CONTROLLED',
  COLOR: 'COLOR',
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

ecs.registerComponent(comps.AI_CONTROLLED);

//systems
ecs.registerSystem({//move entities with velocity
  group: groups.MODEL,
  has: [comps.POSITION, comps.VELOCITY],
  pre(dt) {

  },
  forEach(entity, dt){//iterates all entities with position and velocity component
    const { position, velocity } = entity;
    position.x += velocity.x * dt;
    position.y += velocity.y * dt;
  }
});

ecs.registerSystem({
  group: groups.GRAPHICS,
  has: [comps.POSITION],
  pre(view) {
    view.canvas.width = view.canvas.width;
  },
  forEach(entity, view) {
    const { x, y } = entity.position;
    const { ctx } = view;
    ctx.fillRect(x, y, 10, 10);
  }
})

ecs.registerSystem({
  group: groups.MODEL,
  has: [comps.INPUT, comps.PLAYER_CONTROLLED],
  mounted() {//called once system is created
    document.addEventListener("keydown", e => {//keydown event
      const key = keyCodeToName[e.keyCode];
      //TODO: DO something
    });

    document.addEventListener("keyup",function (e) {//keyup event

    });
  }
});

ecs.createEntity().add(comps.POSITION, 50, 50);

function loop() {
  const dt = 0.016;
  ecs.runGroup(groups.MODEL, dt);
  ecs.runGroup(groups.GRAPHICS, view);
  requestAnimationFrame(loop);
}

loop();
