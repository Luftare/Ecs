var ecs = new Ecs();

//components
ecs.component("position", function(x, y){
    this.x = x || 0;
    this.y = y || 0;
});

ecs.component("velocity", function(x, y){
    this.x = x || 0;
    this.y = y || 0;
});

ecs.component("input", function(){
    this.UP = false;
    this.DOWN = false;
    this.LEFT = false;
    this.RIGHT = false;
    this.SPACE = false;
});

ecs.component("playerControlled");

ecs.component("AIControlled");

//systems
ecs.system({//move entities with velocity
    components: ["position", "velocity"],
    every: function(pos, vel){//iterates all entities with position and velocity component
        pos.x += vel.x;
        pos.y += vel.y;
    }
});

ecs.system({
  init: function () {//called once system is created
    var system = this;
    document.addEventListener("keydown",function (e) {//keydown event
      var key = system.keyCodeToName[e.keyCode];
      if(key){//check if valid key: SPACE, UP, DOWN, LEFT or RIGHT
        system.emit("keyboardEvent",key,true);
      }
    });

    document.addEventListener("keyup",function (e) {//keyup event
      var key = system.keyCodeToName[e.keyCode];
      if(key){//check if valid key: SPACE, UP, DOWN, LEFT or RIGHT
        system.emit("keyboardEvent",key,false);
      }
    });
  },
  keyCodeToName: {//translate keyCode to key string
    "32":"SPACE",
    "38":"UP",
    "40":"DOWN",
    "37":"LEFT",
    "39":"RIGHT"
  }
});

ecs.system({
  components: ["input","playerControlled"],
  on: ["keyboardEvent"],
  onevent: function (key,value) {
    this.iterate(function (input) {//iterate all entities
      input[key] = value;
    });
  }
});

ecs.system({
  components: ["velocity","input"],
  every: function (vel,input) {//simple input handler
    var speed = 5;
    vel.x = vel.y = 0;
    if(input.UP) vel.y = -speed;
    if(input.DOWN) vel.y = speed;
    if(input.LEFT) vel.x = -speed;
    if(input.RIGHT) vel.x = speed;
  }
});

//entities
var player = ecs.entity()
    .add("input")
    .add("playerControlled")
    .add("position", 50, 50)
    .add("velocity",0,0);

var zombi = ecs.entity()
    .add("input")
    .add("AIControlled")
    .add("position", 100, 50)
    .add("velocity",0,0);

setInterval(function () {
  ecs.run();
},100)
