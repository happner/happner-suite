describe(
  require('../../__fixtures/utils/test_helper').create().testName(__filename, 3),
  function () {
    var Mesh = require('../../..');
    var meshInstance;
    require('chai').should();

    this.timeout(120000);

    it('loads a private module via the config', function (done) {
      var startingConfig = {
        modules: {},
        components: {
          '@private/cul-de-sac': {},
        },
      };

      meshInstance = {
        _createElement: function (elementSpec) {
          elementSpec.should.eql({
            module: {
              name: 'cul-de-sac', // <---------- module name without @private/
              config: {
                path: '@private/cul-de-sac',
              },
            },
            component: {
              name: 'cul-de-sac', // <---------- component name without @private/
              config: {
                moduleName: 'cul-de-sac',
              },
            },
          });
          done();
        },
      };

      Mesh.prototype._initializeElements.call(meshInstance, startingConfig, function () {});
    });

    it('renames existing @private/ module and merges in the path', function (done) {
      var startingConfig = {
        modules: {
          '@private/cul-de-sac': {
            construct: {
              blah: 'blah',
            },
          },
        },
        components: {
          '@private/cul-de-sac': {
            configstuff: ['here', 'too'],
          },
        },
      };

      meshInstance = {
        _createElement: function (spec) {
          // it created the correct element spec
          spec.should.eql({
            module: {
              name: 'cul-de-sac',
              config: {
                path: '@private/cul-de-sac',
                construct: {
                  blah: 'blah',
                },
              },
            },
            component: {
              name: 'cul-de-sac',
              config: {
                moduleName: 'cul-de-sac',
                configstuff: ['here', 'too'],
              },
            },
          });
          done();
        },
      };

      Mesh.prototype._initializeElements.call(meshInstance, startingConfig, function () {});
    });
  }
);
