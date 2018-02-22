beforeEach(function () {
  jasmine.addMatchers({
    toBeInSystem() {
      return {
        compare(actual, expected) {
          const entity = actual;
          const system = expected;
          system.enrollEntities();
          return {
            pass: system.entities.includes(entity)
          }
        }
      }
    },
    toMatchNumberOfEntities() {
      return {
        compare(actual, expected) {
          const system = actual;
          system.enrollEntities();
          return {
            pass: system.entities.length === expected
          }
        }
      }
    }
  });
});
