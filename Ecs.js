var Ecs = function(){
	var idCounter,
		components,
		systems,
		groups,
		entities,
		garbage;

	function Ecs(){
		this.init();
	};

	Ecs.prototype.init = function(){
		idCounter = 0;
		entities = [];
		components = {};
		groups = {};
		systems = [];
	};

	Ecs.prototype.entity = function(){
		var entity = new Entity();
		entities.push(entity);
		return entity;
	};

	Ecs.prototype.system = function(options){
		var system = new System(options);
		systems.push(system);
		return system;
	};

	Ecs.prototype.component = function(name,fn){
		if(components[name]) throw new Error("Overwriting already existing component: "+name)
		components[name] = fn || function(value){this.value = value;};
	};

	Ecs.prototype.removeEntity = function (id) {
		for (var i = 0; i < entities.length; i++) {
			if(entities[i].id === id){
				entities[i]._disabled = true;
				garbage = true;
				break;
			}
		}
	};

	Ecs.prototype.run = function(globalArgs){
		if(garbage) clearGarbage();
		var i;
		var len = systems.length;
		for(i = 0; i < len; i++){
			systems[i].run.call(systems[i],globalArgs);
		}
	};

	Ecs.prototype.runGroup = function(name,globalArgs){
		if(garbage) clearGarbage();
		if(groups[name]){
			var i;
			var len = groups[name].length;
			for(i = 0; i < len; i++){
				groups[name][i].run.call(groups[name][i],globalArgs);
			}
		}
	};

	Ecs.prototype.getEntities = function(){
		return entities;
	};

	Ecs.prototype.getEntityById = function (id) {
		for (var i = 0; i < entities.length; i++) {
			if(id === entities[i].id) return entities[i];
		}
	}

	Ecs.prototype.iterateAll = function (cb) {
		var len = entities.length;
		for (var i = 0; i < len; i++) {
			cb(entities[i]);
		}
	};

	Ecs.prototype.emit = function () {
		var name = arguments[0];
		var args = Array.prototype.slice.call(arguments);
		args.shift();
		for (var i = 0; i < systems.length; i++) {
			if(systems[i].subscriptions[name]){
				systems[i].subscriptions[name].apply(systems[i], args);
			}
		}
	};

	function Entity(){
		this.components = {};
		this.id = idCounter++;
	};

	Entity.prototype.add = function(){
		var name = arguments[0];
		var args = Array.prototype.slice.call(arguments);
		this.components[name] = {};
		if(!components[name]) throw new Error("Component doesn't exist: "+name)
		this.components[name] = new (Function.prototype.bind.apply(components[name], args));
		onAddComponent(this);
		return this;
	};

	Entity.prototype.remove = function(name){
		delete this.components[name];
		onRemoveComponent(this);
		return this;
	};

	Entity.prototype.has = function(name){
		return !!this.components[name];
	};

	Entity.prototype.destroy = function () {
		for (var i = 0; i < entities.length; i++) {
			if(entities[i].id === this.id){
				entities.splice(i,1);
			}
		}
		for (var i = 0; i < systems.length; i++) {
			for (var j = 0; j < systems[i].entities.length; j++) {
				if(systems[i].entities[j].id === this.id){
					systems[i].entities.splice(j,1);
				}
			}
		}
	};

	function clearGarbage() {
		entities = entities.filter(function (e) {
			return !e._disabled;
		});
		for (var i = 0; i < systems.length; i++) {
			systems[i].entities = systems[i].entities.filter(function (e) {
				return !e._disabled;
			})
		}
		garbage = false;
	}

	function onAddComponent(entity){
		var i;
		var len = systems.length;
		var has;
		for(i = 0; i < len; i++){
			if(systems[i].hasEntity(entity) && systems[i].entityHasNot(entity)){//did we add component that is in "not" list?
				systems[i].removeEntity(entity);
			}
			if(!systems[i].hasEntity(entity) && systems[i].entityHasComponents(entity) && !systems[i].entityHasNot(entity)){//did we add component that suffices to a new system?
				systems[i].addEntity(entity);
			}
		}
	};

	function onRemoveComponent(entity){
		var i;
		var len = systems.length;
		for(i = 0; i < len; i++){
			if(systems[i].hasEntity(entity) && !systems[i].entityHasComponents(entity)){//did we remove component that was needed for this system
				systems[i].removeEntity(entity);
			}
			if(!systems[i].hasEntity(entity) && systems[i].entityHasComponents(entity) && !systems[i].entityHasNot(entity)){//did we remove "not" listed component and suffice to list?
				systems[i].addEntity(entity);
			}
		}
	};

	function System(options){
		var key;
		for(key in options){
			if(options.hasOwnProperty(key)){
				this[key] = options[key];
			}
		}

		if(this.group !== undefined){
			groups[this.group] = groups[this.group]? groups[this.group] : [];
			groups[this.group].push(this);
		}
		this.subscriptions = {};
		this.entities = [];
    if(options.init) options.init.call(this);
	};

	System.prototype.run = function(globalArgs){
		if(this.pre){
			this.pre.apply(this,arguments);
		}
    if(!this.every) return;
    var args;
		var i;
		var len = this.entities.length;
		for(i = 0; i < len; i++){
			this._currentEntity = this.entities[i];
			args = this.getArguments(this.entities[i]);
			if(globalArgs) args.push(globalArgs);
			this.every.apply(this,args);
		}
		this._currentEntity = null;
	};

	System.prototype.getArguments = function(entity){
		if(!this.components) return false;
		var args = [];
		var i;
		var len = this.components.length;
		for(i = 0; i < len; i++){
			args.push(entity.components[this.components[i]]);
		}
		args.push(entity);
		return args;
	};

	System.prototype.hasEntity = function(entity){
		var i;
		var len = this.entities.length;
		for(i = 0; i < len; i++){
			if(this.entities[i].id === entity.id) return true;
		}
		return false;
	};

	System.prototype.removeEntity = function(entity){
		if(this.onleave){
			this.onleave.apply(entity,this.getArguments(entity));
		}
		var i;
		var len = this.entities.length;
		for(i = 0; i < len; i++){
			if(this.entities[i].id === entity.id){
				this.entities.splice(i,1);
				return true;
			}
		}
		return false;
	};

	System.prototype.addEntity = function(entity){
		this.entities.push(entity);
		if(this.onenter){
			this.onenter.apply(entity,this.getArguments(entity));
		}
	};

	System.prototype.entityHasComponents = function(entity){
		if(!this.components) return true;
		var i;
		var len = this.components.length;
		for(i = 0; i < len; i++){
			if(!entity.components[this.components[i]]){
				return false;
			}
		}
		return true;
	};

	System.prototype.entityHasNot = function(entity){
		if(!this.not) return false;
		var i;
		var len = this.not.length;
		for(i = 0; i < len; i++){
			if(entity.components[this.not[i]]){
				return true;
			}
		}
		return false;
	};

	System.prototype.iterate = function (cb) {
		var args;
		var i;
		var len = this.entities.length;
		for(i = 0; i < len; i++){
			args = this.getArguments(this.entities[i]);
			cb.apply(this.entities[i],args);
		}
	};

	System.prototype.iterateOthers = function (cb) {
		var args;
		var i;
		var len = this.entities.length;
		for(i = 0; i < len; i++){
			if(this.entities[i].id !== this._currentEntity.id){
				args = this.getArguments(this.entities[i]);
				cb.apply(this.entities[i],args);
			}
		}
	};

	System.prototype.emit = function () {
		var name = arguments[0];
		var args = Array.prototype.slice.call(arguments);
		args.shift();
		for (var i = 0; i < systems.length; i++) {
			if(systems[i].subscriptions[name]){
				systems[i].subscriptions[name].apply(systems[i], args);
			}
		}
	};

	System.prototype.on = function (name,cb) {
		this.subscriptions[name] = cb;
	}

	return new Ecs();
};
