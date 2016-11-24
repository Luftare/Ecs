var ecs = new Ecs();
var ecs2 = new Ecs();

//components
ecs.component("name",function (first,last) {
  this.first = first;
  this.last = last;
  this.full = first + " " + last;
});

ecs.component("hidden");//shorthand, can be used as bit or as single value, see next component

ecs.component("sprite");

ecs.component("position",function(x,y){
  this.x = x;
  this.y = y;
});

ecs.component("velocity",function(x,y){
  this.x = x;
  this.y = y;
});

//systems
ecs.system({//every and pre system calls
  components: ["position","velocity"],
  pre: function () {
    //called before iterating all entities by "every"
  },
  every: function (pos,vel,dt) {//executes when ecs.run is called. dt is the global argument
    pos.x += vel.x;
    pos.y += vel.y;
  }
});

ecs.system({//rendering
  components: ["position","sprite"],
  not: ["hidden"],//exclude entities that are hidden
  pre: function () {
    //clear the drawing canvas, called once before iterating through the entities in the "every" call
  },
  every: function (pos,sprite) {//executes when ecs.run is called
    //sprite.value --> "hero.png" in case of our hero, "monster.png" in case of the monster
  }
});

ecs.system({//system enter and leave events
  components: ["name"],
  enter: function (name) {
    console.log("Welcome, " + name.full);
  },
  leave: function () {
    console.log("Bye!");
  },
});

//entities
var hero = ecs.entity()
            .add("name","Jack","Spears")
            .add("sprite","hero.png")
            .add("position",50,40)
            .add("velocity",5,0);

var monster = ecs.entity()
            .add("sprite","monster.png")
            .add("position",100,40)
            .add("velocity",-5,0);

//example of game loop
var dt = 1000;//argument for all systems when calling run
setInterval(function () {
  ecs.run(dt);//calling "every" method on all systems, passing a global argument
},dt);
