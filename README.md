# Entity Component System
Ecs is an implementation of entity component system architecture in JavaScript. Ecs architecture helps to keep the logic and the data separated.

## Install
```javascript
<script src="Ecs.js"></script>
```
## Examples
Create an instance of Ecs.
```javascript
var ecs = new Ecs();
```
### Component
Define components to hold data.
```javascript
ecs.component("name", function (first,last) {
  this.first = first;
  this.last = last;
  this.full = first + " " + last;
});

ecs.component("sprite", function (src){
  this.src = src;
});

ecs.component("position", function (x, y){
    this.x = x || 0;
    this.y = y || 0;
});

ecs.component("velocity", function (x, y){
    this.x = x || 0;
    this.y = y || 0;
});

ecs.component("input", function (){
    this.UP = false;
    this.DOWN = false;
    this.LEFT = false;
    this.RIGHT = false;
    this.SPACE = false;
});

ecs.component("age");//age is stored to parameter called "value"

ecs.component("playerControlled");

ecs.component("hidden");
```
### Entity
Create entities and add or remove components to change their behaviour.
```javascript
var player = ecs.entity()
    .add("name", "John", "Doe")
    .add("age", 22)
    .add("sprite", "hero.png")
    .add("playerControlled")
    .add("position", 50, 50)
    .add("velocity",0,0);

var powerup = ecs.entity()
    .add("position",100,100)
    .add("sprite","coin.png");
```
Entities have unique id.
```javascript
var ent = ecs.entity();
console.log(ent.id);
```
Entities can be removed.
```javascript
var ent = ecs.entity();
var anotherEnt = ecs.entity();

ecs.removeEntity(ent.id);//call ecs to remove entity by id

anotherEnt.destroy();//same end result as in the above example
```
### System
Create systems to implement logic. Systems process entities that have all components listed in the "components"-array.
```javascript
ecs.system({//move entities with velocity
    components: ["position", "velocity"],
    every: function (pos, vel){//iterates all entities with position and velocity component
        pos.x += vel.x;
        pos.y += vel.y;
    }
});
```
Components with constructors can be optionally used although it is against the paradigm of ECS.
```javascript
function Vector(x,y){
  this.x = x;
  this.y = y;
}

Vector.prototype.add = function(v){
  this.x += v.x;
  this.y += v.y;
}

ecs.component("position", Vector);
ecs.component("velocity", Vector);

ecs.system({
  components: ["position", "velocity"],
  every: function(pos,vel){
    pos.add(vel);
  }
});
```
Use "not" array to exclude entities from the system.
```javascript
ecs.system({//sprite rendering system
    components: ["position","sprite"],
    not: ["hidden"],
    pre: function () {//called once before iterating all entities
      view.clearCanvas();//assume a view module/object
    },
    every: function (pos, sprite){
      view.drawImage(sprite.src,pos.x,pos.y);
    }
});
```
Systems have onenter and onleave events for entities joining and leaving.
```javascript
ecs.system({
    components: ["name","talkingToPhone"],
    onenter: function (name,talking) {
      console.log("Hello, it's "+ name.full);
    },
    every: function (name,talking) {
      console.log("bla bla bla...");
    },
    onleave: function (name,talking) {
      console.log("Bye!");
    }
});
```
Systems have an event bus to communicate with other systems.
```javascript
ecs.system({
  init: function () {//called once system is created
    var system = this;
    document.addEventListener("click",function (e) {
      var msg = "Hello!";
      system.emit("some_event",msg);
    });
  }
});

ecs.system({
  init: function () {
    this.on("some_event",function (e) {
      console.log(e)//clicking will print "Hello!"
    })
  }
});
```
Run all systems. You can call the run method inside a game loop.
```javascript
ecs.run();
```
Systems can be run in groups.
```javascript
ecs.system({
  pre: function () {
    console.log("Running a system.")
  },
  group: "somegroup"
});

ecs.system({
  pre: function () {
    console.log("Running another system.")
  },
  group: "somegroup"
});

ecs.runGroup("somegroup");
```
Pass a global argument to system call.
```javascript
ecs.system({
  components: ["position","velocity"],
  every: function(pos,vel,ent,dt){
    pos.x += vel.x*dt;
    pos.y += vel.y*dt;
  }
});

var dt = 16;
ecs.run(dt);//typically inside a game loop
ecs.runGroup("model",dt);//global argument can be used in group run calls, too
```
