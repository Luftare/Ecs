describe('When components and systems are defined', () => {
  const Ecs = require('../../Ecs');
  let ecs;
  let systems = {};

  beforeEach(() => {
    ecs = new Ecs();

    ecs.registerComponent('position', function(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    });

    ecs.registerComponent('velocity', function(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    });

    ecs.registerComponent('sprite', function(src) {
      this.src = src;
    });

    ecs.registerComponent('hidden');

    ecs.registerComponent('stunned');

    systems.render = ecs.registerSystem({
      has: ['sprite', 'position'],
      not: ['hidden'],
      forEach(entity, globalArg) {

      }
    });

    systems.move = ecs.registerSystem({
      has: ['position', 'velocity'],
      not: ['stunned'],
      forEach(entity, globalArg) {
        const { position, velocity } = entity;
        position.x += velocity.x;
        position.y += velocity.y;
      }
    });

    systems.noop = ecs.registerSystem({
      forEach(entity, globalArg) {}
    });
  });

  describe('and when entity is created', () => {
    let entity;

    beforeEach(() => {
      entity = ecs.createEntity();
    });

    it('should have id', () => {
      expect(entity.id).toBeDefined();
    });

    it('should be able to enroll to matching systems', () => {
      ecs.run();
      expect(entity).toBeInSystem(systems.noop);
      expect(entity).not.toBeInSystem(systems.move);
      expect(entity).not.toBeInSystem(systems.render);
    });

    describe('and when component is added to an entity', () => {
      beforeEach(() => {
        entity.add('position', 5, 5);
      });

      it('should be able to know if the component exists', () => {
        expect(entity.has('position')).toEqual(true);
        expect(entity.has('nonExistentComponent')).toEqual(false);
      });

      it('should store the component data', () => {
        expect(entity.position).toBeDefined();
        expect(entity.position.x).toEqual(5);
        expect(entity.position.y).toEqual(5);
      });

      it('should be able to remove the component', () => {
        entity.remove('position');
        expect(entity.has('position')).toEqual(false);
        expect(entity.position).not.toBeDefined();
      });

      describe('and when required components for systems are added', () => {
        beforeEach(() => {
          entity.add('velocity', 2, 2);
        });

        it('systems should be able to enroll the entity', () => {
          ecs.run();
          expect(entity).toBeInSystem(systems.noop);
          expect(entity).toBeInSystem(systems.move);
          expect(entity).not.toBeInSystem(systems.render);
          expect(entity.position.x).toEqual(7);
          expect(entity.position.y).toEqual(7);
          ecs.run();
          expect(entity.position.x).toEqual(9);
          expect(entity.position.y).toEqual(9);
        });

        describe('and when rejected (included in "not" array of system) component is added', () => {
          beforeEach(() => {
            entity.add('stunned');
          });
          it('should be excluded from corresponding systems', () => {
            ecs.run();
            expect(entity.has('position')).toEqual(true);
            expect(entity.has('velocity')).toEqual(true);
            expect(entity).toBeInSystem(systems.noop);
            expect(entity).not.toBeInSystem(systems.move);
            expect(entity).not.toBeInSystem(systems.render);
          });
        });

        describe('and when required component is removed', () => {
          beforeEach(() => {
            entity.remove('velocity');
          });

          it('should be excluded from non-matching systems', () => {
            ecs.run();
            expect(entity).not.toBeInSystem(systems.move);
            expect(entity).not.toBeInSystem(systems.render);
            expect(entity.position.x).toEqual(5);
            expect(entity.position.y).toEqual(5);
          });
        });
      });
    });
  });

  describe('and when multiple entities are created', () => {
    let entities;
    const entityCount = 10;
    beforeEach(() => {
      entities = [...Array(entityCount)].map(() => ecs.createEntity());
    });

    it('systems should enroll only matchin entities', () => {
      expect(systems.noop).toMatchNumberOfEntities(entityCount);
      expect(systems.move).toMatchNumberOfEntities(0);
      expect(systems.render).toMatchNumberOfEntities(0);
    });

  });

});
