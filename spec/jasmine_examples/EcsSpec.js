describe('Ecs', () => {
  const Ecs = require('../../Ecs');
  let ecs;

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

    ecs.registerSystem({
      has: ['sprite', 'position'],
      not: ['hidden'],
      forEach(entity, globalArg) {

      }
    });

    ecs.registerSystem({
      has: ['position', 'velocity'],
      forEach(entity, globalArg) {
        const { position, velocity } = entity;
        position.x += velocity.x;
        position.y += velocity.y;
      }
    });
  });

  describe('when entity is created', () => {
    let entity;
    beforeEach(() => {
      entity = ecs.createEntity();
    });

    it('should have id', () => {
      expect(entity.id).toBeDefined();
    });

    describe('when component is added to an entity', () => {
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

      it('should enroll to matching systems', () => {
        entity.add('velocity', 5, 5);
        ecs.run();
        expect(entity.position.x).toEqual(10);
        expect(entity.position.y).toEqual(10);
      });
    });
  });
});
