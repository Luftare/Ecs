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
ecs.registerComponent("name", function(first, last) {
  this.first = first;
  this.last = last;
});

ecs.registerComponent("sprite", function(src) {
  this.src = src;
});

ecs.registerComponent("position", function(x, y) {
  this.x = x;
  this.y = y;
});

ecs.registerComponent("velocity", function(x, y, max) {
  this.x = x;
  this.y = y;
  this.max = max;
});

ecs.registerComponent("input", function() {
  this.UP = false;
  this.DOWN = false;
  this.LEFT = false;
  this.RIGHT = false;
  this.SPACE = false;
});

ecs.registerComponent("playerControlled");

ecs.registerComponent("hidden");
```
### Entity
Entities store components and unique id.
```javascript
const player = ecs.createEntity();
```
Components can be added and removed from entity. Adding and removing of components can be chained.
```javascript
const player = ecs.createEntity()
  .add("position", 50, 50)
  .add("velocity",0 ,0)
  .add("input");

//later in code
player.remove("velocity");
```
An entity can test existence of a component.
```javascript   
const player = ecs.createEntity()
  .add("position", 50, 50);

player.has("position");//true
player.has("velocity");//false
```
Individual components and their properties can be accessed directly as a property of the entity.
```javascript
player.position;//{ x: 50, y: 50 }
```
Entities have unique id. The id is not enumerable which enables simple iteration of components of an entity.
```javascript
const player = ecs.createEntity();

console.log(player.id);//--> 1
```
### System
Register systems to implement logic. Systems process entities that match their required components. `has` is an array listing all required components for an entity to be enrolled to the system. `not`is an array that can be used to exclude those entities that have any of the components listed in the `not`array.
```javascript
ecs.registerSystem({//move entities with velocity
  components: ["position", "velocity"],
  forEach(position, velocity) {//iterates all entities with position and velocity component
    pos.x += vel.x;
    pos.y += vel.y;
  }
});
```
Use `not` array to exclude entities from the system. Below example shows how to render only entities that have position, sprite component and don't have `hidden` component. Another approach would be temporarily removing the sprite or position component.
```javascript
//Assuming there's a canvas and context for the sake of example as well as an object of cached sprites
ecs.registerSystem({
  has: ["position", "sprite"],
  not: ["hidden"],
  pre() {//called once before iterating all entities
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  },
  forEach(position, sprite) {
    ctx.drawImage(sprites[sprite.name], position.x, position.y);
  }
});
```
Run all systems.
```javascript
ecs.run();
```
Systems can be run in groups and system within a group can be ordered.
```javascript
ecs.registerSystem({
  pre() {
    console.log("Calculating physics...");
  },
  order: 1,
  group: "model"
});

ecs.registerSystem({
  pre() {
    console.log("Handling player input...");
  },
  order: 0,
  group: "model"
});

ecs.registerSystem({
  pre() {
    console.log("Rendering a new frame...");
  },
  group: "graphics"
});

ecs.runGroup("model");
//--> Handling player input...
//--> Calculating physics...
ecs.runGroup("graphics");
//--> Rendering a new frame...
```
Pass a global argument to system call.
```javascript
ecs.registerSystem({
  has: ["position", "velocity"],
  forEach(position, velocity, entity, dt) {
    position.x += velocity.x * dt;
    position.y += velocity.y * dt;
  },
  group: "model",
});

//Within a game loop...
const dt = 16;
ecs.run(dt);//delta time value is typically calculated inside a game loop
ecs.runGroup("model", dt);//global argument can be used in group run calls, too
```
## General findings and misc
Components with constructors can be optionally used although it is slightly against the paradigm of Ecs.
```javascript
function Vector(x, y) {
  this.x = x;
  this.y = y;
}

Vector.prototype.add = function(v) {
  this.x += v.x;
  this.y += v.y;
}

ecs.registerComponent("position", Vector);
ecs.registerComponent("velocity", Vector);

ecs.registerSystem({
  components: ["position", "velocity"],
  forEach(pos, vel, entity) {
    pos.add(vel);//calling "add" method from position component which is instanceof Vector
  }
});
```
