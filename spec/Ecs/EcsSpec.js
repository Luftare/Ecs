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

  describe('and entity is created', () => {
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

    describe('and component is added to an entity', () => {
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

      describe('and required components for systems are added', () => {
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

        describe('and entity is destroyed', () => {
          beforeEach(() => {
            entity.destroy();
          });

          it('should be removed from all systems', () => {
            ecs.run();
            expect(entity).not.toBeInSystem(systems.noop);
            expect(entity).not.toBeInSystem(systems.move);
            expect(entity).not.toBeInSystem(systems.render);
          });
        });

        describe('and rejected (included in "not" array of system) component is added', () => {
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

        describe('and required component is removed', () => {
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

  describe('and multiple entities are created', () => {
    let entities;
    const entityCount = 10;
    beforeEach(() => {
      entities = [...Array(entityCount)].map(() => ecs.createEntity());
    });

    it('systems should enroll only matching entities', () => {
      expect(systems.noop).toMatchNumberOfEntities(entityCount);
      expect(systems.move).toMatchNumberOfEntities(0);
      expect(systems.render).toMatchNumberOfEntities(0);
    });

    describe('and 2 entities receive 2 components in chain', () => {
      beforeEach(() => {
        entities[0].add('position', 5, 5).add('velocity', 3, 3);
        entities[1].add('position', 5, 5).add('velocity', 3, 3);
      });

      it('entities should store component data', () => {
        expect(entities[0].has('position')).toEqual(true);
        expect(entities[1].has('position')).toEqual(true);
        expect(entities[0].has('velocity')).toEqual(true);
        expect(entities[1].has('velocity')).toEqual(true);
        expect(entities[0].position).toBeDefined();
        expect(entities[1].position).toBeDefined();
        expect(entities[0].velocity).toBeDefined();
        expect(entities[1].velocity).toBeDefined();
        expect(entities[0].velocity.x).toEqual(3);
        expect(entities[0].velocity.y).toEqual(3);
        expect(entities[1].velocity.x).toEqual(3);
        expect(entities[1].velocity.y).toEqual(3);
      });

      it('systems should enroll only matching entities', () => {
        expect(systems.noop).toMatchNumberOfEntities(entityCount);
        expect(systems.move).toMatchNumberOfEntities(2);
        expect(systems.render).toMatchNumberOfEntities(0);
        entities.forEach((entity, i) => {
          expect(entity).not.toBeInSystem(systems.render);
          expect(entity).toBeInSystem(systems.noop);
          if(i < 2) {
            expect(entity).toBeInSystem(systems.move);
          } else {
            expect(entity).not.toBeInSystem(systems.move);
          }
        });
      });

      it('systems should be able to process enrolled entities', () => {
        ecs.run();
        expect(entities[0].position.x).toEqual(8);
        expect(entities[0].position.y).toEqual(8);
        expect(entities[1].position.x).toEqual(8);
        expect(entities[1].position.y).toEqual(8);
      });

      describe('and 1 entity is destroyed', () => {
        beforeEach(() => {
          entities[1].destroy();
        });

        it('should be rejected from all systems', () => {
          expect(systems.noop).toMatchNumberOfEntities(entityCount - 1);
          expect(systems.move).toMatchNumberOfEntities(1);
          expect(systems.render).toMatchNumberOfEntities(0);
        });
      });

      describe('and 1 entity receives rejected component', () => {
        beforeEach(() => {
          entities[0].add('stunned');
        });

        it('should be rejected from corresponding system', () => {
          expect(entities[0]).not.toBeInSystem(systems.move);
          expect(systems.move).toMatchNumberOfEntities(1);
        });
      });
    });
  });
});
