# Ecs
 Ecs is a general purpose entity-component-system library written in JavaScript. 
## Examples
Create a variety of components:
```javascript
Ecs.component("name",function(name){
    this.val = name;
});

Ecs.component("enemy");//single bit component

Ecs.component("velocity",function(x,y){
    this.x = x || 0;
    this.y = y || 0;
});

Ecs.component("position",function(x,y){
    this.x = x || 0;
    this.y = y || 0;
});
```
Create entities and add modules to introduce behaviour to the entities.
```javascript
var hero = Ecs.entity()
    .add("name","Leeroy")
    .add("position",50,50)
    .add("velocity");//expecting default values --> x:0, y:0
    
var monster = Ecs.entity()
    .add("position",100,100)
    .add("velocity")
    .add("enemy");//single bit component
```
Create systems to introduce logic and to process data:
```javascript
Ecs.system({//simple movement
    components: ["position","velocity"],
    every: function(pos,vel){
        pos.x += vel.x;
        pos.y += vel.y;
    }
});

Ecs.system({//arrive and leave methods
    components: ["talkingToPhone"],
    arrive: function(entity){
        console.log("Hello, it's " + entity.components.name.val);
    },
    every: function(){
        console.log("Bla bla bla...");
    },
    leave: function(entity){
        console.log("Bye!");
    }
});

Ecs.system({
    on: ["mousedown","touchstart"],
    components: ["position","followPointer"],
    handle: function(position,followPointer,entity,e){
        position.x = (e.changedTouches? e.changedTouched[0].pageX : e.pageX);
        position.y = (e.changedTouches? e.changedTouched[0].pageY : e.pageY);
    }
});
```
