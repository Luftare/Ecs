# Ecs
 Ecs is a general purpose entity-component-system library written in JavaScript. Create entities and change their behaviour by adding or removing components, create independent systems for highly specific tasks. Ecs encourages for the reusability of components and systems accross projects for increased productivity.
### Key features
 - integrated event system and custom events
 - prioritized system calls
 - system groups
 - optional global system arguments
 - no dependencies

### Examples

Create components to hold data:
```javascript
Ecs.component("name");//this component has single attribute --> val

Ecs.component("talkingToPhone");//same as above, but used as a boolean

Ecs.component("collider",function(shape,size){
    this.shape = shape;
    if(shape === "circle"){
        this.radius = size;
    } else if(shape === "square"){
        this.width = size*2;
        this.height = size*2;
    }
});

Ecs.component("position", function(x, y){//custom constructor function
    this.x = x || 0;//default values
    this.y = y || 0;
});

Ecs.component("velocity", function(x, y){//another custom constructor function
    this.x = x || 0;//components hold only data, all logic and methods are decoupled to the systems
    this.y = y || 0;
});
```
Create entities and add or remove components to change the behaviour of the entities:
```javascript
var hero = Ecs.entity()
    .add("name", "Leeroy")
    .add("collider","circle",50)
    .add("sprite", "hero.png")
    .add("position", 50, 50)
    .add("velocity");//default values --> x:0, y:0
    
var rock = Ecs.entity()
    .add("position", 100, 100)
    .add("sprite", "rock.png")
    .add("collider","circle",150);
```
Create systems to introduce logic and to process data:
```javascript
Ecs.system({//move entities with position and velocity components
    components: ["position","velocity"],
    every: function(pos, vel){
        pos.x += vel.x;
        pos.y += vel.y;
    }
});

Ecs.system({//arrive method is called once when an entity meets the satisfying collection of components listed by this system
    components: ["name", "talkingToPhone"],
    arrive: function(name,talkingToPhone){//--> entity got satisfying collection of components
        console.log("Hello, it's " + name.val);
    },
    every: function(name,talkingToPhone){//--> called on every run cycle
        console.log("Bla bla bla...");
    },
    leave: function(name,talkingToPhone){//--> entity lost satisfying collection of components
        console.log("Bye!");
    }
});

Ecs.system({//listen to multiple events and handle events for each entity satisfying the component listing of this system
    on: ["mousedown", "touchstart"],
    components: ["position", "atPointer"],//component listing is optional. Removing is makes the system just a regular event listener
    handle: function(position, atPointer, entity, e){
        position.x = (e.changedTouches? e.changedTouched[0].pageX : e.pageX);
        position.y = (e.changedTouches? e.changedTouched[0].pageY : e.pageY);
    }
});
```
