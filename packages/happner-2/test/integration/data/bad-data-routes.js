[{ type: 'nedb' }, { type: 'loki' }].forEach((testConfig) => {
  require('../../__fixtures/utils/test_helper').describe({ timeout: 30e3 }, (test) => {
    const filename =
      testConfig.type === 'nedb'
        ? test.newTestFileNedb({ name: 'persist-mem-datastores' })
        : test.newTestFile({ name: 'persist-mem-datastores' });
    const provider =
      testConfig.type === 'nedb' ? 'happn-db-provider-nedb' : 'happn-db-provider-loki';

    var config = {
      happn: {
        port: 55000,
        name: 'persist-mem-datastores',
        secure: true,
        services: {
          data: {
            config: {
              autoUpdateDBVersion: true,
              datastores: [
                {
                  name: 'persist',
                  provider,
                  settings: {
                    filename,
                  },
                },
                {
                  name: 'mem',
                  provider,
                },
              ],
            },
          },
        },
      },
      __testOptions: {
        getClient: true,
      },
      modules: {
        persistComponent: {
          instance: {
            writeData: function ($happn, options, callback) {
              $happn.data.set(options.path, options.data, {}, function (e, response) {
                return callback(e, response);
              });
            },
          },
        },
      },
      components: {
        persistComponent: {
          data: {
            routes: {
              'persist/*': 'persist',
              'mem/*': 'mem',
              'bad/*': 'not-existing',
            },
          },
        },
      },
    };

    it(`should fail to start the service due to bad dataroute ${testConfig.type}`, function (done) {
      test.startUp([config], (e) => {
        test
          .expect(e.message)
          .to.be('bad component data route: missing datastore with the key [not-existing]');
        done();
      });
    });
  });
});
