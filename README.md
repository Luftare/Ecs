# Entity Component System

Ecs is a lightweight JS library that can be used to implement an entity-component-system architecture for games and other similar applications. Ecs doesn't try to be a game engine but it can be used in tandem with other libraries to build complete games. The core idea of Ecs is to enable better `composition over inheritance` thus helping you to focus on developing different behaviours and then composing the behaviours to create the actual game objects.

## How to install

```html
<script src="Ecs.js"></script>
```

## Examples

Create an instance of Ecs. There can be multiple parallel instances of Ecs existing at once.

```javascript
const ecs = new Ecs();
```

### Component

Define components to hold data.

```javascript
ecs.registerComponent('name', function(first, last) {
  this.first = first;
  this.last = last;
});

ecs.registerComponent('sprite', function(src) {
  this.src = src;
});

ecs.registerComponent('position', function(x, y) {
  this.x = x;
  this.y = y;
});

ecs.registerComponent('velocity', function(x, y, max) {
  this.x = x;
  this.y = y;
  this.max = max;
});

ecs.registerComponent('input', function() {
  this.UP = false;
  this.DOWN = false;
  this.LEFT = false;
  this.RIGHT = false;
  this.SPACE = false;
});

ecs.registerComponent('playerControlled');

ecs.registerComponent('hidden');
```

### Entity

Entities store components and unique id.

```javascript
const player = ecs.createEntity();
```

Components can be added and removed from entity. Adding and removing of components can be chained.

```javascript
const player = ecs
  .createEntity()
  .add('position', 50, 50)
  .add('velocity', 0, 0)
  .add('input');

//later in code
player.remove('velocity');
```

An entity can test existence of a component.

```javascript
const player = ecs.createEntity().add('position', 50, 50);

player.has('position'); //true
player.has('velocity'); //false
```

Individual components and their properties can be accessed directly as a property of the entity.

```javascript
player.position; //{ x: 50, y: 50 }
```

Entities have unique id. The id is not enumerable which enables simple iteration of components of an entity.

```javascript
const player = ecs.createEntity();

console.log(player.id); //--> 1
```

### System

Register systems to implement logic. Systems process entities that match their required components. `has` is an array defining all required components for an entity in order to be enrolled to the system. `not`is an array that can be used to exclude entities that have any of the components listed in the `not`array.

```javascript
ecs.registerSystem({
  //move entities with velocity
  has: ['position', 'velocity'],
  forEach(entity) {
    //iterates all entities with position and velocity component
    const { position, velocity } = entity;
    position.x += velocity.x;
    position.y += velocity.y;
  },
});
```

Use `not` array to exclude entities from the system. Below example shows how to render only entities that have position, sprite component and don't have `hidden` component. Another approach would be temporarily removing the sprite or position component.

```javascript
//Assuming there's a canvas and context for the sake of example as well as an object of cached sprites
ecs.registerSystem({
  has: ['position', 'sprite'],
  not: ['hidden'],
  pre({ ctx, canvas }) {
    //called once before iterating all entities
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  },
  forEach(entity, { cxt }) {
    const { x, y } = entity.position;
    const { name } = entity.sprite;
    ctx.drawImage(sprites[name], x, y);
  },
});
```

Run all systems. `run` method will iterate and run all registered systems. Each system will first call `method`, then iterate all enrolled entities and finally systems' `post` method is called.

```javascript
ecs.registerSystem({
  pre() {
    console.log('Called first.');
  },
  forEach() {
    console.log(
      'Iterating all enrolled entities after pre method of this system is run...'
    );
  },
  post() {
    console.log(
      'Called after all enrolled entities of this system are iterated.'
    );
  },
});

ecs.run();
//--> Called first.
//--> Iterating all enrolled entities after pre method of this system is run...
//--> Iterating all enrolled entities after pre method of this system is run...
//--> Iterating all enrolled entities after pre method of this system is run...
//...
//--> Called after all enrolled entities of this system are iterated.
```

Systems can be run in groups and system within a group can be ordered.

```javascript
ecs.registerSystem({
  pre() {
    console.log('Calculating physics...');
  },
  order: 1,
  group: 'model',
});

ecs.registerSystem({
  pre() {
    console.log('Handling player input...');
  },
  order: 0,
  group: 'model',
});

ecs.registerSystem({
  pre() {
    console.log('Rendering a new frame...');
  },
  group: 'graphics',
});

ecs.runGroup('model');
//--> Handling player input...
//--> Calculating physics...
ecs.runGroup('graphics');
//--> Rendering a new frame...
```

Pass a global argument to system call. Global argument is available in methods: `pre`, `forEach` and `post`.

```javascript
ecs.registerSystem({
  pre(globalArgument) {
    console.log(globalArgument); //--> Hello!
  },
  forEach(entity, globalArgument) {
    console.log(globalArgument); //--> Hello! (for each entity enrolled to this system)
  },
  post(globalArgument) {
    console.log(globalArgument); //--> Hello!
  },
});

ecs.run('Hello!');
```

Global argument can be used in group run calls, too.

```javascript
ecs.registerSystem({
  has: ['position', 'velocity'],
  forEach({ position, velocity }, dt) {
    position.x += velocity.x * dt;
    position.y += velocity.y * dt;
  },
  group: 'model',
});

ecs.registerSystem({
  has: ['position', 'size', 'color'],
  pre({ canvas }) {
    canvas.width = canvas.width; //dirty way of cleaning canvas
  },
  forEach({ position, size }, { ctx }) {
    const { x, y } = position;
    const { width, height } = size;
    ctx.fillRect(x, y, width, height);
  },
  group: 'graphics',
});

const deltaTimeInMs = 16;
const renderContext = {
  canvas: document.querySelector('canvas'),
  ctx: document.querySelector('canvas').getContext('2d'),
};

//Later in code within a game loop etc.
ecs.runGroup('model', deltaTimeInMs);
ecs.runGroup('graphics', renderContext);
```

## Optimization and tips

Every time the collection of components of an entity changes, all systems will iterate and see if the component should be added to the system or wether the component should be removed from a system it doesn't match anymore. Entities have `addMultiple` method that produces the same end result as chaining separate `add` methods. The difference is that `addMultiple` method updates system enrollment only once whereas multiple `add` calls update system enrollments on every call which can be expensive operation.

```javascript
const player = ecs
  .createEntity()
  .addMultiple([['position', 50, 50], ['velocity', 0, 0], ['input']]);
```

Removing of multiple components can be optimized with `removeMultiple` method, which follows the same logic as `addMultiple` method.

```javascript
const player = ecs
  .createEntity()
  .removeMultiple(['position', 'velocity', 'input']);
```

Components should be as atomic as possible. This increases the reusability of the component. However, sometimes the scope of the game might be so clear that for the sake of simplicity closely related components might be merged together. Here's an example where components are separated on atomic level:

```javascript
ecs.registerComponent('position', function(x = 0, y = 0) {
  this.x = x;
  this.y = y;
});

ecs.registerComponent('scale', function(x = 1, y = 1) {
  this.x = x;
  this.y = y;
});

ecs.registerComponent('rotation', function(angle = 0) {
  this.angle = angle;
});
```

...and here the components are merged as single component:

```javascript
ecs.registerComponent('transform', function(posX, posY, scaleX, scaleY, angle) {
  this.position = {
    x: posX,
    y: posY,
  };
  this.scale = {
    x: scaleX,
    y: scaleY,
  };
  this.rotation = angle;
});
```

Components with constructors can be optionally used although it is slightly against the paradigm of Ecs.

```javascript
function Vector(x, y) {
  this.x = x;
  this.y = y;
}

Vector.prototype.add = function(v) {
  this.x += v.x;
  this.y += v.y;
};

ecs.registerComponent('position', Vector);
ecs.registerComponent('velocity', Vector);

ecs.registerSystem({
  components: ['position', 'velocity'],
  forEach({ position, velocity }) {
    position.add(velocity);
  },
});
```
