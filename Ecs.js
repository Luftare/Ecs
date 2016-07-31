(function () {
  var Ecs = {};
  var idCounter = 1;//Ecs specific id counter
  var componentProtos = {};//component templates
  var entities = {};//entities by id
  var systems = {};//systems by id
  var toProcess = [];//systems by priority
  var nameToId = {};//hash table of names and corresponding ids
  var systemGroups = {};
  var customEvents = {};

  // ---------- ENTITY ---------- 
  Ecs.entity = function(){
    var ent = new Entity();
    entities[ent.id] = ent;
    return ent;
  };

  function Entity(){
    this.id = getId();
    this.components = {};
  };

  Entity.prototype.add = function(){
    var name = arguments[0];
    var comp = createComponent();

    if(!componentProtos[nameToId[name]]){
      ERROR("cannot find a component named: '" + name +"'");
    }

    var constr = componentProtos[nameToId[arguments[0]]].constr;
    if(arguments.length > 1) [].shift.call(arguments);//shift first parameter from the arguments array
    if(constr){
      constr.apply(comp,arguments);
    }
    
    this.components[name] = comp;

    var sys;
    var comp;
    var isMatch = true;

    for(key in systems){//update systems' entity lists
      isMatch = true;
      sys = systems[key];
      for (var i = 0; i < sys.components.length; i++) {
        comp = sys.components[i];
        if( !(comp in this.components) ){
          isMatch = false;
        }
      }
      if(isMatch){
        if(!sys.validEntities[this.id]){
          //arrival to system
          sys.validEntities[this.id] = this;
          if(sys.arrive){
            var args = parseArguments(sys.components,this.components);
            args.push(this);
            sys.arrive.apply(sys,args);
          } 
        }
      }
    }
    return this;
  };

  Entity.prototype.remove = function(name){
    var sys;
    var comp;
    var isMatch = true;

    for(key in systems){
      sys = systems[key];
      if(this.id in sys.validEntities){
        for (var i = 0; i < sys.components.length; i++) {
          if(sys.components[i] === name){
            if(sys.leave){
              var args = parseArguments(sys.components,this.components);
              args.push(this);
              sys.leave.apply(sys,args);
            }
            delete sys.validEntities[this.id];
          }
        };
      }
    }

    var comp = this.components[name];
    if(comp){
      delete this.components[name];
    }
  };

  Entity.prototype.clearComponents = function(){
    this.components = {};
  }

  Entity.prototype.destroy = function(triggerLeave){

    if(triggerLeave){//trigger possible leave event handlers
      for(key in this.components){
        this.remove(key);
      }
    } else {//silently remove entity from systems
      for(key in systems){
        sys = systems[key];
        if(this.id in sys.validEntities){
          if(sys.validEntities.leave)
          delete sys.validEntities[this.id];
        }
      }
    }
    delete entities[this.id];//remove from entity list
    delete this.components;//remove components
  };

  // ---------- COMPONENT ---------- 
  Ecs.component = function(name,constr){
    var compProto = new ComponentProto();
    compProto.name = name;
    compProto.constr = constr || defaultConstructor;
    nameToId[compProto.name] = compProto.id;
    componentProtos[compProto.id] = compProto;
    return compProto.id;
  };

  function createComponent(){
    return new Component();
  }

  function defaultConstructor(val){
    this.val = val;
  };

  function Component(){
    
  };

  function ComponentProto(){
    this.id = getId();
  };

  // ---------- SYSTEM ---------- 
  Ecs.system = function(prop){
    prop = prop || {};
    var isCustomEvent;
    var system = new System();
    for(key in prop){
      system[key] = prop[key];
    }

    if(system.on && system.handle && this.addEventListener){//setup event listening and handling
      for (var i = 0; i < system.on.length; i++) {
        isCustomEvent = false;
        if( !("on"+system.on[i] in this) ){//not a default evet
          isCustomEvent = true;
          if(!(system.on[i] in customEvents)){//not in custom events
            customEvents[system.on[i]] = new CustomEvent(system.on[i],{detail: "wazap"});//add new custom event
          }
        }

        addEventListener(system.on[i],function(e){
          if(system.components.length > 0){
            for(key in system.validEntities){
              ent = system.validEntities[key];
              var args = parseArguments(system.components,ent.components);
              args.push(ent);
              args.push(isCustomEvent? (e.detail || e) : e);
              system.handle.apply(system,args);
            }
          } else {//no components listed for filtering, fire once and pass event object as argument
            system.handle.call(system,isCustomEvent? (e.detail || e) : e);
          }
        });
      };
    }

    if(system.init) system.init.call(system);
    //default values
    system.priority = system.priority || 0;
    system.components = system.components || [];

    if(system.group){
      if(systemGroups[system.group]){//existing group
        systemGroups[system.group].push(system);
      } else {
        systemGroups[system.group] = [system];//create new array
      }
      updatePrioritizedList(systemGroups[system.group],system);
    }

    systems[system.id] = system;
    updatePrioritizedList(toProcess,system);
    return system.id;
  };

  function System(){
    this.id = getId();
    this.validEntities = {};
  }

  System.prototype.run = function(globalArguments){//run all systems
    var ent;
    var args;

    if(this.pre) this.pre(globalArguments);

    if(this.every){
      for(key in this.validEntities){
        ent = this.validEntities[key];
        args = parseArguments(this.components,ent.components);
        args.push(ent);
        args.push(globalArguments);
        this.every.apply(this,args);
      }
    }
  }

  // ---------- ENGINE ---------- 
  Ecs.run = function(args){
    for (var i = 0; i < toProcess.length; i++) {//run all systems in descending priority order
      toProcess[i].run(args);
    };
  };

  Ecs.runGroup = function(groupName,args){//run systems within a specific group in descending priority order
    var group = systemGroups[groupName];
    if(group){
      for (var i = 0; i < group.length; i++) {
        group[i].run(args);
      };
    }
  };

  Ecs.event = function(name,args){//trigger custom event with custom argument
    if(name in customEvents){
      customEvents[name].initCustomEvent(name, true, true, args);
      dispatchEvent(customEvents[name], args);
    }
  };

  Ecs.getEntities = function(){
    return entities;
  }

  // ---------- UTILITIES ---------- 
  function isFun(fun) {
    return typeof fun === 'function';
  }

  function ERROR(msg){
    throw new Error(msg);
  }

  function isStr(str){
    return typeof str === 'string';
  }

  function isNum(num) {
    return !isNaN(parseFloat(num)) && isFinite(num);
  }

  function getId(){
    return idCounter++;
  }

  function parseArguments(keys,obj){//return new array of values in object listed in array 'keys'
    var arr = [];
    for (var i = 0; i < keys.length; i++) {
      arr.push(obj[keys[i]]);
    };
    return arr;
  }

  function updatePrioritizedList(){
    var arr = arguments[0];
    for (var i = 1; i < arguments.length; i++) {
      arr.push(arguments[i]);
    };
    arr.sort(compareDescendingPriority);
  }

  function compareDescendingPriority(a,b){
    return b.priority - a.priority;
  }

  // ---------- EXPORTS ---------- 
  if (typeof module === "object" && // CommonJS
  typeof module.exports === "object") {
    module.exports = Ecs;
  } else if (typeof define === "function" && define.amd) { // AMD module
    define("Ecs", [], function() { return Ecs } )
  } else { // global object
    this.Ecs = Ecs;
  }
}).call(this);
