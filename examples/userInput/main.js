window.onload = loop;

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const ecs = new Ecs();

function Vector(x = 0, y = 0) {
  this.x = x;
  this.y = y;
}

ecs.registerComponent('position', Vector);
ecs.registerComponent('velocity', Vector);
ecs.registerComponent('circle', function(radius) {
  this.radius = radius;
});
ecs.registerComponent('playerControlled');
ecs.registerComponent('input', function() {
  this.left = false;
  this.right = false;
  this.up = false;
  this.down = false;
});

ecs.registerSystem({
  has: ['position', 'velocity'],
  forEach({ position, velocity }, dt) {
    position.x += velocity.x * dt;
    position.y += velocity.y * dt;
  },
});

ecs.registerSystem({
  has: ['position', 'circle'],
  pre() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  },
  forEach({ position, circle }, dt) {
    ctx.beginPath();
    ctx.arc(position.x, position.y, circle.radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  },
});

ecs.registerSystem({
  mounted() {
    this.keysDown = {};
    window.addEventListener('keydown', ({ key }) => {
      this.keysDown[key] = true;
    });

    window.addEventListener('keyup', ({ key }) => {
      this.keysDown[key] = false;
    });
  },
  has: ['input', 'playerControlled'],
  forEach({ input }, dt) {
    input.up = !!this.keysDown.w;
    input.down = !!this.keysDown.s;
    input.left = !!this.keysDown.a;
    input.right = !!this.keysDown.d;
  },
});

ecs.registerSystem({
  has: ['velocity', 'input'],
  forEach({ velocity, input }) {
    const maxVelocity = 100;
    velocity.x = 0;
    velocity.y = 0;

    if (input.left) velocity.x = -maxVelocity;
    if (input.right) velocity.x = maxVelocity;
    if (input.up) velocity.y = -maxVelocity;
    if (input.down) velocity.y = maxVelocity;
  },
});

const humanPlayer = ecs
  .createEntity()
  .addMultiple([
    ['position', canvas.width / 2, canvas.height / 2],
    ['velocity'],
    ['input'],
    ['playerControlled'],
    ['circle', 10],
  ]);

function loop() {
  const tickTime = 0.016;
  ecs.run(tickTime);
  requestAnimationFrame(loop);
}
