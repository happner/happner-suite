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
            },
          },
        },
      },
    };

    before(`should initialize the test with services ${testConfig.type}`, function (done) {
      test.startUp([config], done);
    });

    after(`tears down all services and clients ${testConfig.type}`, function (done) {
      test.tearDown(done);
    });

    it(`checks the default datastores are in place ${testConfig.type}`, function (done) {
      var service = test.findService('persist-mem-datastores');
      var happnServer = service.instance._mesh.happn.server;
      test.expect(happnServer.services.data.datastores.mem).to.not.be(null);
      if (testConfig.type === 'nedb') {
        test
          .expect(
            happnServer.services.data.dataroutes['/_data/persistComponent/mem/*'].provider.db
              .inMemoryOnly
          )
          .to.be(true);

        test
          .expect(
            happnServer.services.data.dataroutes['/_data/persistComponent/persist/*'].provider.db
              .filename
          )
          .to.be(filename);
      }
      done();
    });

    it(`writes to mem path, and then to persist path, ensures the data is in the right places ${testConfig.type}`, function (done) {
      var service = test.findService('persist-mem-datastores');

      service.instance.exchange.persistComponent.writeData(
        {
          path: 'persist/some/data',
          data: { data: 'isPersisted' },
        },
        function (e) {
          if (e) return done(e);

          var record = test.getRecordFromSmallFile({
            filename,
            dataPath: '/_data/persistComponent/persist/some/data',
            type: testConfig.type,
          });

          if (testConfig.type === 'nedb') {
            test.expect(record.data.data).to.be('isPersisted');
          } else {
            test.expect(record.operation.arguments[1].data.data).to.be('isPersisted');
          }

          service.instance.exchange.persistComponent.writeData(
            {
              path: 'mem/some/data',
              data: { data: 'isVolatile' },
            },
            function (e) {
              if (e) return done(e);

              test.getRecordFromHappn(
                {
                  instanceName: 'persist-mem-datastores',
                  dataPath: '/_data/persistComponent/mem/some/data',
                },
                function (e, record) {
                  test.expect(record.data).to.be('isVolatile');

                  var notFoundRecord = test.getRecordFromSmallFile({
                    filename,
                    dataPath: '/_data/persistComponent/mem/some/data',
                    type: testConfig.type,
                  });
                  test.expect(notFoundRecord).to.be(null);
                  done();
                }
              );
            }
          );
        }
      );
    });
  });
});
