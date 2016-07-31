# Ecs
 Ecs is a general purpose entity-component-system library written in JavaScript suitable for game development. Create entities and change their behaviour by adding or removing components, create independent systems for highly specific tasks. Ecs encourages for the reusability of components and systems accross projects for increased productivity.
### Key features
 - Integrated event system and custom events
 - Prioritized system calls
 - System groups
 - Optional global system arguments
 - No dependencies
 - Expressive entity filtering

### Examples

Create components to hold data:
```javascript
Ecs.component("name");

Ecs.component("position", function(x, y){
    this.x = x || 0;
    this.y = y || 0;
});
```
Create entities and add or remove components to change their behaviour:
```javascript
var hero = Ecs.entity()
    .add("name", "Leeroy")
    .add("collider","circle", 50)
    .add("sprite", "hero.png")
    .add("position", 50, 50)
    .add("velocity");
    
var rock = Ecs.entity()
    .add("position", 100, 100)
    .add("sprite", "rock.png")
    .add("collider", "circle", 150);
```
Create systems to introduce logic and to process data:
```javascript
Ecs.system({
    components: ["position", "velocity"],
    every: function(pos, vel){
        pos.x += vel.x;
        pos.y += vel.y;
    }
});

Ecs.system({
    components: ["name", "talkingToPhone"],
    arrive: function(name, talkingToPhone){
        console.log("Hello, it's " + name.val);
    },
    every: function(name, talkingToPhone){
        console.log("Bla bla bla...");
    },
    leave: function(name, talkingToPhone){
        console.log("Bye!");
    }
});

Ecs.system({
    on: ["mousedown", "touchstart"],
    components: ["position", "atPointer"],
    handle: function(position, atPointer, entity, e){
        position.x = (e.changedTouches? e.changedTouched[0].pageX : e.pageX);
        position.y = (e.changedTouches? e.changedTouched[0].pageY : e.pageY);
    }
});
```
Run the systems in a simple loop:
```javascript
function loop(){
    var dt;
    /* calculate dt */
    Ecs.run(dt);//optional global argument across all systems
    requestAnimationFrame(loop);
}
loop();
```
