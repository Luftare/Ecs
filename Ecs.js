function Ecs() {
	let entities = [];
	let components = {};
	let systems = [];
	let idCounter = 1;

	function Entity() {};

	Entity.prototype = {
		add(name, ...args) {
			const preSystems = this.getMatchingSystems();
			this[name] = new components[name](...args);
			this.handleEnrollToSystems(preSystems);
			return this;
		},
		addMultiple(...calls) {
			const preSystems = this.getMatchingSystems();
			calls.forEach(call => {
				const [name, ...args] = call;
				this[name] = new components[name](...args);
			});
			this.handleEnrollToSystems(preSystems);
			return this;
		},
		removeMultiple(...names) {
			const preSystems = this.getMatchingSystems();
			names.forEach(name => {
				delete this[name];
			});
			this.handleEnrollToSystems(preSystems);
			return this;
		},
		handleEnrollToSystems(preSystems = []) {
			const postSystems = this.getMatchingSystems();
			const enteredSystems = postSystems.filter(system => !preSystems.includes(system));
			const leftSystems = preSystems.filter(system => !postSystems.includes(system));
			this.updateSystemsEntityLists(leftSystems, enteredSystems);
		},
		updateSystemsEntityLists(left, entered) {
			entered.forEach(system => {
				system.entities.push(this);
				system.enter(this);
			});
			left.forEach(system => {
				system.entities = system.entities.filter(entity => entity !== this);
				system.leave(this);
			});
		},
		remove(name) {
			const preSystems = this.getMatchingSystems();
			delete this[name];
			this.handleEnrollToSystems(preSystems);
			return this;
		},
		has(...keys) {
			return keys.every(key => !!this[key]);
		},
		destroy() {
			const preSystems = this.getMatchingSystems();
			this._garbage = true;
			this.updateSystemsEntityLists(preSystems, []);
			entities = entities.filter(entity => entity !== this);
		},
		matches(system) {
			return system.has.every(key => this.has(key)) && system.not.every(key => !this.has(key));
		},
		getMatchingSystems() {
			return systems.filter(system => this.matches(system));
		},
	};

	function System({
		mounted = noop,
		pre = noop,
		post = noop,
		forEach = noop,
		enter = noop,
		leave = noop,
		has = [],
		not = [],
		order = 0,
		group = '',
	}) {
		this.mounted = mounted;
		this.pre = pre;
		this.post = post;
		this.enter = enter;
		this.leave = leave;
		this.forEach = forEach;
		this.has = has;
		this.not = not;
		this.order = order;
		this.entities = [];
		this.group = group;
	};

	System.prototype = {
		run(globalArg) {
			this.pre(globalArg);
			this.entities.forEach(entity => this.forEach(entity, globalArg));
			this.post(globalArg);
		},
	};

	function createEntity() {
		const entity = new Entity();
		Object.defineProperty(entity, 'id', {
			enumerable: false,
			value: idCounter++
		});
		entities.push(entity);
		entity.handleEnrollToSystems();
		return entity;
	};

	function registerComponent(name, component = defaultComponent) {
		components[name] = component;
		return name;
	};

	function registerSystem(conf) {
		const system = new System(conf);
		systems.push(system);
		systems = systems.sort((a, b) => a.order - b.order);
		system.mounted();
		return system;
	};

	function run(globalArg) {
		systems.forEach(system => system.run(globalArg));
	};

	function runGroup(name, globalArg) {
		systems.forEach(system => system.group === name && system.run(globalArg));
	};

	function defaultComponent(v) {
		this.value = v;
	};

	function noop() {};

	return { createEntity, registerComponent, registerSystem, run, runGroup, entities };
}

try {
	module.exports = Ecs;
} catch(err) {}
