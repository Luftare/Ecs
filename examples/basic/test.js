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

ecs.component("name");

ecs.component("color");

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
  onenter: function (input) {
    input.RIGHT = input.LEFT = input.UP = input.DOWN = false;
  },
  init: function () {
    this.on("keyboardEvent", function (key,value) {
      this.iterate(function (input) {//iterate all entities
        input[key] = value;
      });
    });
  }
});

ecs.system({
  components: ["input","position","velocity","AIControlled"],
  onenter: function (input) {
    input.RIGHT = input.UP = input.DOWN = false;
    input.LEFT = true;
  },
  every: function (input,pos,vel,AIC,entity) {
    if(pos.x < 50){
      input.RIGHT = true;
      input.LEFT = false;
    } else if(pos.x > 300){
      input.RIGHT = false;
      input.LEFT = true;
    }
  }
});

ecs.system({
  components: ["velocity","input"],
  every: function (vel,input) {//simple input handler
    var speed = 1.5;
    vel.x = vel.y = 0;
    if(input.UP) vel.y = -speed;
    if(input.DOWN) vel.y = speed;
    if(input.LEFT) vel.x = -speed;
    if(input.RIGHT) vel.x = speed;
  }
});

ecs.system({
  components: ["position","name","color"],
  onenter: function (pos,name,color,entity) {
    var el = document.createElement("div");
    el.innerHTML = "<span id='entity"+entity.id+"'style='position:absolute;padding:15px;background-color:"+color.value+";'>"+name.value+"</span>";
    document.body.appendChild(el);
  },
  every: function (pos,name,color,entity) {
    var el = document.getElementById("entity"+entity.id);
    el.style.marginLeft = pos.x+"px";
    el.style.marginTop = pos.y+"px";
  }
});

ecs.system({
  components: ["input"],
  init: function () {
    var system = this;
    this.on("keyboardEvent", function (key,value) {
      if(key === "SPACE" && value){
        system.iterate(function (input,entity) {
          if(entity.has("playerControlled")){
            entity.remove("playerControlled").add("AIControlled");
          } else {
            entity.add("playerControlled").remove("AIControlled");
          }
        });
      }
    });
  }
});

//entities
var player = ecs.entity()//player
  .add("input")
  .add("name","Player")
  .add("color","lightblue")
  .add("playerControlled")
  .add("position", 50, 50)
  .add("velocity",0,0);

var zombie = ecs.entity()//zombie 1
  .add("input")
  .add("name","Zombie")
  .add("color","lightgreen")
  .add("AIControlled")
  .add("position", 320, 250)
  .add("velocity",0,0);

ecs.entity()//another zombie
  .add("input")
  .add("name","Zombie")
  .add("color","lightgreen")
  .add("AIControlled")
  .add("position", 100, 350)
  .add("velocity",0,0);


setInterval(function () {
  ecs.run();
},20)
