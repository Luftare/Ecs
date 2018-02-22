function Ecs() {
	let entities = [];
	let components = {};
	let systems = [];
	let idCounter = 1;

	function Entity() {};

	Entity.prototype = {
		add(name, ...args) {
			this[name] = new components[name](...args);
			return this;
		},
		remove(name) {
			delete this[name];
			return this;
		},
		has(...keys) {
			return keys.every(key => !!this[key]);
		},
		destroy() {
			this._garbage = true;
			entities = entities.filter(entity => entity !== this);
		},
		matches(system) {
			return system.has.every(key => this.has(key)) && system.not.every(key => !this.has(key));
		},
		isActive() {
			return !this._garbage;
		}
	};

	function System({
		mounted = noop,
		pre = noop,
		post = noop,
		forEach = noop,
		has = [],
		not = [],
		order = 0,
	}) {
		this.mounted = mounted;
		this.pre = pre;
		this.post = post;
		this.forEach = forEach;
		this.has = has;
		this.not = not;
		this.order = order;
		this.entities = [];
	};

	System.prototype = {
		enrollEntities() {
			this.entities = this.getMatchingEntities();
		},
		run(globalArg) {
			this.enrollEntities();
			this.pre(globalArg);
			this.entities.forEach(entity => this.forEach(entity, globalArg));
			this.post(globalArg);
		},
		getMatchingEntities() {
			return entities.filter(entity => entity.isActive() && entity.matches(this));
		},
		getOtherEntities(currentEntity) {
			return entities.filter(entity => entity.isActive() && entity !== currentEntity);
		}
	};

	function createEntity() {
		const entity = new Entity();
		Object.defineProperty(entity, 'id', {
			enumerable: false,
			value: idCounter++
		});
		entities.push(entity);
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
		systems.forEach(s => s.run(globalArg));
	};

	function getMatchingSystems(entity) {
		return systems.filter(system => entity.matches(system));
	}

	function runGroup(name, globalArg) {
		systems.filter(system => system.group === name).forEach(system => system.run(globalArg));
	};

	function defaultComponent(v) {
		this.value = v;
	}

	function noop() {};

	return { createEntity, registerComponent, registerSystem, run, runGroup, entities };
}

try {
	module.exports = Ecs;
} catch(err) {}
