# Entity Component System
Ecs is an implementation of entity component system architecture in JavaScript. Ecs architecture helps to keep the logic and the data separated.
## How to install
```html
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
    this.x = x;
    this.y = y;
});

ecs.component("velocity", function (x, y, max){
    this.x = x;
    this.y = y;
    this.max = max;
});

ecs.component("input", function (){
    this.UP = false;
    this.DOWN = false;
    this.LEFT = false;
    this.RIGHT = false;
    this.SPACE = false;
});

ecs.component("playerControlled");

ecs.component("hidden");
```
### Entity
Entities are simple objects and they have two properties: `id` [int] and `components` [object].
```javascript
var player = ecs.entity();
```
Add and remove components from entity. Adding and removing of entities can be chained.
```javascript
var player = ecs.entity()
    .add("position", 50, 50)//add components to entity
    .add("velocity",0,0)
    .add("input");
    
player.remove("velocity");//remove components from entity
```
Test if entity has a specific component.
```javascript   
console.log(player.has("position"));//true
console.log(player.has("velocity"));//false
```
Individual components and their data can be accessed through the `components` property of an entity;
```javascript
player.components.position;//{x:50,y:50}
```
Entities have unique id.
```javascript
var ent = ecs.entity();
console.log(ent.id);
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
Components with constructors can be optionally used although it is slightly against the paradigm of Ecs.
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
    pos.add(vel);//calling "add" method from position component which is instanceof Vector
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
Each system maintain an array of entities matching the components listed in the `components` array.
```javascript
ecs.system({
  components: ["position","velocity"],
  every: function(pos,vel,ent){
    //"this" refers to the system
    console.log(this.entities);//array of entities matching this system's components array
    this.iterate(function(entity){
      //iterating this.entities array    
    });
    this.iterateOthers(function(other){
      //iterating this.entities array except for the entity ("ent") on which the "every" method is called
    });
  }
});
```
