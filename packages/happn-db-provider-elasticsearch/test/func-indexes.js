require('./fixtures/test-helper').describe({ timeout: 30e3 }, function (test) {
  const service = require('..');
  const path = require('path');
  const provider_path = path.resolve('../index.js');
  const async = require('async');
  const random = require('./fixtures/random');

  ['uncached', 'cached'].forEach((isCached) => {
    const testId = `${test.compressedUUID()}${isCached}`;
    test.log(`with test id ${testId}`);
    const index = `${testId}`;
    const customIndex = `${index}custom`;
    const config = {
      name: 'elastic',
      provider: provider_path,
      defaultIndex: index,
      host: test.getEndpoint(),
      indexes: [
        {
          index,
          body: {
            mappings: {},
          },
        },
        {
          index: customIndex,
        },
      ],
      dataroutes: [
        {
          pattern: '/custom/*',
          index: customIndex,
        },
        {
          dynamic: true, //dynamic routes generate a new index/type according to the items in the path
          pattern: '/dynamic/{{index}}/{{type}}/*',
        },
        {
          dynamic: true, //dynamic routes generate a new index/type according to the items in the path
          pattern: '/dynamicType/{{index}}/*',
          type: 'dynamic',
        },
        {
          pattern: '*',
          index,
        },
      ],
    };
    context(`test ${isCached} configuration`, () => {
      var serviceInstance = new service(config);

      before('should initialize the service', function (callback) {
        serviceInstance.initialize(callback);
      });

      after(async () => {
        await serviceInstance.stop();
      });

      var getElasticClient = function (callback) {
        var elasticsearch = require('elasticsearch');

        try {
          var client = new elasticsearch.Client({ host: test.getEndpoint() });

          client.ping(
            {
              requestTimeout: 30000,
            },
            function (e) {
              if (e) return callback(e);

              callback(null, client);
            }
          );
        } catch (e) {
          callback(e);
        }
      };

      var listAll = function (client, index, type, callback) {
        var elasticMessage = {
          index: index,
          type: type,

          body: {
            sort: [{ timestamp: { order: 'asc' } }],
            from: 0,
            size: 10000,
          },
        };

        client
          .search(elasticMessage)

          .then(function (resp) {
            if (resp.hits && resp.hits.hits && resp.hits.hits.length > 0) {
              callback(null, resp.hits.hits);
            } else callback(null, []);
          })
          .catch(function (e) {
            callback(e);
          });
      };

      it('can push and get data', function (done) {
        serviceInstance.upsert(
          '/custom/' + testId,
          { data: { test: customIndex } },
          {},
          function (e) {
            if (e) return done(e);

            serviceInstance.upsert(
              '/default/' + testId,
              { data: { test: 'default' } },
              {},
              function (e) {
                if (e) return done(e);

                getElasticClient(function (e, client) {
                  if (e) return done(e);
                  var foundItems = [];

                  setTimeout(function () {
                    listAll(client, index, 'happner', function (e, defaultItems) {
                      if (e) return done(e);
                      listAll(client, customIndex, 'happner', function (e, customItems) {
                        if (e) return done(e);
                        defaultItems.forEach(function (item) {
                          if (item._id === '/default/' + testId) foundItems.push(item);
                        });
                        test.expect(foundItems.length).to.be(1);
                        foundItems = [];
                        customItems.forEach(function (item) {
                          if (item._id === '/custom/' + testId) foundItems.push(item);
                        });
                        test.expect(foundItems.length).to.be(1);
                        done();
                      });
                    });
                  }, 1000);
                });
              }
            );
          }
        );
      });

      it('tests dynamic routes', function (done) {
        var now1 = Date.now().toString();
        var now2 = Date.now().toString();
        var path1 = `/dynamic/${testId}dynamic1/dynamicType1/dynamicValue1/${now1}`;
        var path2 = `/dynamic/${testId}dynamic2/dynamicType2/dynamicValue2/${now2}`;

        serviceInstance.upsert(path1, { data: { test: 'dynamic1' } }, {}, function (e) {
          if (e) return done(e);

          serviceInstance.upsert(path2, { data: { test: 'dynamic2' } }, {}, function (e) {
            if (e) return done(e);

            getElasticClient(function (e, client) {
              if (e) return done(e);

              setTimeout(function () {
                listAll(client, `${testId}dynamic1`, 'dynamicType1', function (e, dynamictems0) {
                  if (e) return done(e);

                  listAll(client, `${testId}dynamic2`, 'dynamicType2', function (e, dynamictems1) {
                    if (e) return done(e);

                    test.expect(dynamictems0.length).to.be(1);
                    test.expect(dynamictems0[0]._index).to.be(`${testId}dynamic1`);
                    test.expect(dynamictems0[0]._type).to.be(`dynamicType1`);
                    test.expect(dynamictems0[0]._source.path).to.be(path1);
                    test.expect(dynamictems1.length).to.be(1);
                    test.expect(dynamictems1[0]._index).to.be(`${testId}dynamic2`);
                    test.expect(dynamictems1[0]._type).to.be(`dynamicType2`);
                    test.expect(dynamictems1[0]._source.path).to.be(path2);

                    done();
                  });
                });
              }, 1000);
            });
          });
        });
      });

      var ROUTE_COUNT = 20;
      var ROW_COUNT = 100;
      var DELAY = 500;

      it(
        'tests parallel dynamic routes, creating ' +
          ROUTE_COUNT +
          ' routes and pushing ' +
          ROW_COUNT +
          ' data items into the routes',
        function (done) {
          this.timeout(1000 * ROW_COUNT + DELAY);

          var routes = [];
          var rows = [];
          var errors = [];
          var successes = [];

          for (var i = 0; i < ROUTE_COUNT; i++) {
            var index = test.compressedUUID();
            var route = '/dynamic/' + index + '/test_type';
            routes.push(route);
          }

          for (var ii = 0; ii < ROW_COUNT; ii++) {
            var routeIndex = random.integer(0, ROUTE_COUNT);

            if (routes[routeIndex] != null)
              rows.push(
                routes[routeIndex] +
                  '/route_' +
                  routeIndex.toString() +
                  '/' +
                  Date.now().toString() +
                  '/' +
                  routeIndex.toString()
              );
          }

          async.each(
            rows,
            function (row, callback) {
              serviceInstance.upsert(row, { data: { test: row } }, {}, function (e, created) {
                if (e) {
                  errors.push({ row: row, error: e });
                  return callback(e);
                }
                successes.push({ row: row, created });
                callback();
              });
            },
            function (e) {
              if (e) return done(e);

              var errorHappened = false;

              setTimeout(function () {
                async.each(
                  successes,
                  function (successfulRow, successfulRowCallback) {
                    var callbackError = function (error) {
                      if (!errorHappened) {
                        errorHappened = true;
                        successfulRowCallback(error);
                      }
                    };

                    serviceInstance.find(successfulRow.row, {}, function (e, data) {
                      if (e) return callbackError(e);

                      if (data.length === 0)
                        return callbackError(new Error('missing row for: ' + successfulRow.row));

                      if (data[0].data.test !== successfulRow.row)
                        return callbackError(
                          new Error(
                            'row test value ' +
                              data[0].data.test +
                              ' was not equal to ' +
                              successfulRow.row
                          )
                        );

                      successfulRowCallback();
                    });
                  },
                  done
                );
              }, DELAY);
            }
          );
        }
      );

      it('tests dynamic routes with type specified in the route', function (done) {
        var now1 = Date.now().toString();

        var path1 = '/dynamicType/' + `${testId}dynamicroute1` + '/any_value/' + now1;

        serviceInstance.upsert(path1, { data: { test: 'dynamic1' } }, {}, function (e) {
          if (e) return done(e);
          setTimeout(function () {
            var now2 = Date.now().toString();
            var path2 = '/dynamicType/' + `${testId}dynamicroute2` + '/any_value2/' + now2;

            serviceInstance.upsert(path2, { data: { test: 'dynamic2' } }, {}, function (e) {
              if (e) return done(e);

              getElasticClient(function (e, client) {
                if (e) return done(e);

                setTimeout(function () {
                  listAll(client, `${testId}dynamicroute*`, 'dynamic', function (e, dynamictems0) {
                    if (e) return done(e);

                    test.expect(dynamictems0.length).to.be(2);
                    test.expect(dynamictems0[0]._index).to.be(`${testId}dynamicroute1`);
                    test.expect(dynamictems0[0]._type).to.be('dynamic');
                    test.expect(dynamictems0[0]._source.path).to.be(path1);
                    test.expect(dynamictems0[1]._index).to.be(`${testId}dynamicroute2`);
                    test.expect(dynamictems0[1]._type).to.be('dynamic');
                    test.expect(dynamictems0[1]._source.path).to.be(path2);

                    done();
                  });
                }, 1000);
              });
            });
          }, 1000);
        });
      });
    });
  });
  // test.printOpenHandlesAfter(5e3);
});
