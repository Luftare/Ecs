window.onload = loop;

const ecs = new Ecs();

function Vector(x, y) {
  this.x = x;
  this.y = y;
}

// Components
ecs.registerComponent('position', Vector);

ecs.registerComponent('velocity', Vector);

ecs.registerComponent('rectangle', function(width = 5, height = 5) {
  this.width = width;
  this.height = height;
});

ecs.registerComponent('color');

// Systems
ecs.registerSystem({
  group: 'model',
  has: ['position', 'velocity'],
  forEach({ position, velocity }, dt) {
    position.x += velocity.x * dt;
    position.y += velocity.y * dt;
  },
});

ecs.registerSystem({
  group: 'model',
  has: ['position'],
  forEach(entity) {
    const { position } = entity;
    const isOffScreen =
      position.y > view.canvas.height || position.x > view.canvas.width;

    if (isOffScreen) {
      entity.destroy();
    }
  },
});

ecs.registerSystem({
  group: 'graphics',
  has: ['position', 'rectangle', 'color'],
  pre({ ctx, canvas }) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  },
  forEach({ position, rectangle, color }, { ctx }) {
    const { x, y } = position;
    const { width, height } = rectangle;
    ctx.fillStyle = color.value;
    ctx.fillRect(x, y, width, height);
  },
});

function createMeteorite() {
  const startX = Math.random() * view.canvas.width;
  ecs.createEntity().addMultiple([
    ['position', startX, 0],
    ['velocity', 20, 50],
    ['rectangle'], // default values
    ['color', 'black'],
  ]);
}

function createSnowFlake() {
  const startX = Math.random() * view.canvas.width;
  ecs
    .createEntity()
    .addMultiple([
      ['position', startX, 0],
      ['velocity', 0, 5],
      ['rectangle', 1, 2],
      ['color', 'white'],
    ]);
}

const view = {
  canvas: document.querySelector('canvas'),
  ctx: document.querySelector('canvas').getContext('2d'),
};

function loop() {
  const tickTime = 0.016;

  createSnowFlake();

  if (Math.random() > 0.9) createMeteorite();

  ecs.runGroup('model', tickTime);
  ecs.runGroup('graphics', view);

  requestAnimationFrame(loop);
}
