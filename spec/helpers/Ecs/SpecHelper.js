beforeEach(function () {
  jasmine.addMatchers({
    toBeInSystem() {
      return {
        compare(actual, expected) {
          const entity = actual;
          const system = expected;
          const entities = system.getMatchingEntities();
          return {
            pass: entities.includes(entity)
          };
        },
      };
    },
    toMatchNumberOfEntities() {
      return {
        compare(actual, expected) {
          const system = actual;
          const entities = system.getMatchingEntities();
          return {
            pass: entities.length === expected
          };
        },
      };
    },
  });
});
