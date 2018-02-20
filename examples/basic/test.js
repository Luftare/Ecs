const ecs = new Ecs();
const comps = {
  POSITION: 'POSITION',
  VELOCITY: 'VELOCITY',
  RECTANGLE: 'RECTANGLE',
  INPUT: 'INPUT',
  PLAYER_CONTROLLED: 'PLAYER_CONTROLLED',
  AI_CONTROLLED: 'AI_CONTROLLED',
  COLOR: 'COLOR',

}
//components
ecs.registerComponent(comps.POSITION, function(x = 0, y = 0) {
    this.x = x;
    this.y = y;
});

ecs.registerComponent(comps.VELOCITY, function(x = 0, y = 0) {
    this.x = x;
    this.y = y;
});

ecs.registerComponent(comps.RECTANGLE, function(width = 5, height = 5) {
    this.width = width;
    this.height = height;
});

ecs.registerComponent(comps.INPUT, function() {
    this.UP = false;
    this.DOWN = false;
    this.LEFT = false;
    this.RIGHT = false;
    this.SPACE = false;
});

ecs.registerComponent(comps.PLAYER_CONTROLLED);

ecs.registerComponent(comps.COLOR);

ecs.registerComponent(comps.AI_CONTROLLED);

//systems
ecs.registerSystem({//move entities with velocity
    has: [comps.POSITION, comps.VELOCITY],
    every(pos, vel){//iterates all entities with position and velocity component
        pos.x += vel.x;
        pos.y += vel.y;
    }
});

ecs.registerSystem({
  has: [comps.INPUT, comps.PLAYER_CONTROLLED],
  mounted() {//called once system is created
    const keyCodeToName = {//translate keyCode to key string
      "32":"SPACE",
      "38":"UP",
      "40":"DOWN",
      "37":"LEFT",
      "39":"RIGHT"
    };
    document.addEventListener("keydown", e => {//keydown event
      console.log(this)
      const key = keyCodeToName[e.keyCode];
      //TODO: DO something
    });

    document.addEventListener("keyup",function (e) {//keyup event

    });
  }
});

ecs.run();
