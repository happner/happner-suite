/* eslint-disable no-unused-vars */
require('happn-commons-test').describe({ timeout: 20000, only: true }, function (test) {
  const { DataTypes } = require('sequelize');
  let async = test.commons.async;
  let mode = 'embedded';
  let test_id;
  let happnTestHelper;
  let publisherclient;
  let listenerclient;
  let schema = [
    {
      name: 'test',
      pattern: ['testing/*', '/testing/*', 'setTest/*', 'mergeTest*', '/increment/*', 'series/*'],
      indexes: {
        property1: DataTypes.STRING,
        property2: DataTypes.STRING,
        property3: DataTypes.STRING,
        property4: DataTypes.STRING,
        'increment-0': DataTypes.INTEGER,
        'increment-1': DataTypes.INTEGER,
        'increment-2': DataTypes.INTEGER,
        'increment-3': DataTypes.INTEGER,
        'increment-4': DataTypes.INTEGER,
        'increment-5': DataTypes.INTEGER,
        'increment-6': DataTypes.INTEGER,
        'increment-7': DataTypes.INTEGER,
        'increment-8': DataTypes.INTEGER,
        'increment-9': DataTypes.INTEGER,
        genre: DataTypes.STRING,
        name: DataTypes.STRING,
      },
    },
  ];
  const configs = [
    {
      port: 55000,
      services: {
        data: {
          config: {
            autoUpdateDBVersion: true,
            datastores: [
              {
                name: 'memory',
                isDefault: true,
              },
              {
                name: 'sqlite',
                provider: test.path.resolve(__dirname, '../../index'),
                patterns: [
                  'testing/*',
                  '/testing/*',
                  'setTest/*',
                  'mergeTest*',
                  '/increment/*',
                  'series/*',
                ],
                settings: {
                  schema,
                },
              },
            ],
          },
        },
      },
    },
    {
      port: 55002,
      secure: true,
      services: {
        data: {
          config: {
            autoUpdateDBVersion: true,
            datastores: [
              {
                name: 'memory',
                isDefault: true,
              },
              {
                name: 'sqlite',
                provider: test.path.resolve(__dirname, '../../index'),
                patterns: [
                  'testing/*',
                  '/testing/*',
                  'setTest/*',
                  'mergeTest*',
                  '/increment/*',
                  'series/*',
                ],
                settings: {
                  schema,
                },
              },
            ],
          },
        },
      },
    },
  ];

  configs.forEach((config) => {
    context('running battery of tests', function () {
      before('should initialize the service and clients', async () => {
        test_id = Date.now() + '_' + test.commons.nanoid();
        happnTestHelper = require('../__fixtures/happn-test-helper').create(config);
        await happnTestHelper.initialize();
        publisherclient = happnTestHelper.publisherclient;
        listenerclient = happnTestHelper.listenerclient;
      });

      after(async () => {
        await happnTestHelper.tearDown();
      });

      it('the publisher should set new data', function (callback) {
        try {
          let test_path_end = test.commons.nanoid();

          publisherclient.set(
            'testing/' + test_id + '/data/' + test_path_end,
            {
              property1: 'property1',
              property2: 'property2',
              property3: 'property3',
            },
            {
              noPublish: true,
            },
            function (e) {
              if (!e) {
                publisherclient.get(
                  'testing/' + test_id + '/data/' + test_path_end,
                  null,
                  function (e, results) {
                    test.expect(results.property1 === 'property1').to.be(true);
                    test.expect(results.created === results.modified).to.be(true);

                    callback(e);
                  }
                );
              } else callback(e);
            }
          );
        } catch (e) {
          callback(e);
        }
      });

      it('the listener should pick up a single wildcard event', function (callback) {
        try {
          //first listen for the change
          listenerclient.on(
            '/testing/' + test_id + '/data/event/*',
            {
              event_type: 'set',
              count: 1,
            },
            function () {
              test
                .expect(listenerclient.state.events['/SET@/testing/' + test_id + '/data/event/*'])
                .to.be(undefined);
              callback();
            },
            function (e) {
              if (!e) {
                test
                  .expect(
                    listenerclient.state.events['/SET@/testing/' + test_id + '/data/event/*'].length
                  )
                  .to.be(1);

                //then make the change
                publisherclient.set(
                  '/testing/' + test_id + '/data/event/blah',
                  {
                    property1: 'property1',
                    property2: 'property2',
                    property3: 'property3',
                  },
                  null,
                  function () {}
                );
              } else callback(e);
            }
          );
        } catch (e) {
          callback(e);
        }
      });

      it('the publisher should get null for unfound data, exact path', function (callback) {
        let test_path_end = test.commons.nanoid();
        publisherclient.get(
          'testing/' + test_id + '/unfound/exact/' + test_path_end,
          null,
          function (e, results) {
            test.expect(e).to.be(null);
            test.expect(results).to.be(null);
            callback(e);
          }
        );
      });

      it('set_multiple, the publisher should set multiple data items, then do a wildcard get to return them', function (callback) {
        let timesCount = 10;

        let testBasePath = 'testing/' + test_id + '/set_multiple';

        try {
          async.times(
            timesCount,
            function (n, timesCallback) {
              let test_random_path2 = test.commons.nanoid();

              publisherclient.set(
                testBasePath + '/' + test_random_path2,
                {
                  property1: 'property1',
                  property2: 'property2',
                  property3: 'property3',
                },
                {
                  noPublish: true,
                },
                timesCallback
              );
            },
            function (e) {
              if (e) return callback(e);

              listenerclient.get(testBasePath + '/' + '*', null, function (e, results) {
                if (e) return callback(e);

                test.expect(results.length).to.be(timesCount);

                results.every(function (result) {
                  /*
                   RESULT SHOULD LOOK LIKE THIS
                   { property1: 'property1',
                   property2: 'property2',
                   property3: 'property3',
                   _meta:
                   { modified: 1443606046766,
                   created: 1443606046766,
                   path: 'testing/1443606046555_VkyH6cE1l/set_multiple/E17kSpqE1l' } }
                   */

                  test.expect(result.property1).to.be('property1');
                  test.expect(result._meta.path.indexOf(testBasePath) === 0).to.be(true);

                  return true;
                });

                callback();
              });
            }
          );
        } catch (e) {
          callback(e);
        }
      });

      it('should set data, and then merge a new document into the data without overwriting old fields', function (callback) {
        try {
          let test_path_end = test.commons.nanoid();

          publisherclient.set(
            'testing/' + test_id + '/data/merge/' + test_path_end,
            {
              property1: 'property1',
              property2: 'property2',
              property3: 'property3',
            },
            null,
            function (e) {
              if (e) return callback(e);

              publisherclient.set(
                'testing/' + test_id + '/data/merge/' + test_path_end,
                {
                  property4: 'property4',
                },
                {
                  merge: true,
                },
                function (e) {
                  if (e) return callback(e);

                  publisherclient.get(
                    'testing/' + test_id + '/data/merge/' + test_path_end,
                    null,
                    function (e, results) {
                      if (e) return callback(e);
                      test.expect(results.property4).to.be('property4');
                      test.expect(results.property1).to.be('property1');
                      callback();
                    }
                  );
                }
              );
            }
          );
        } catch (e) {
          callback(e);
        }
      });

      it('should contain the same payload between 2 non-merging consecutive stores', function (done) {
        let object = {
          param1: 10,
          param2: 20,
        };
        let firstTimeNonMergeConsecutive;

        listenerclient.on(
          'setTest/nonMergeConsecutive',
          {
            event_type: 'set',
            count: 2,
          },
          function (message) {
            if (firstTimeNonMergeConsecutive === undefined) {
              firstTimeNonMergeConsecutive = message;
            } else {
              test.expect(message).to.eql(firstTimeNonMergeConsecutive);
              done();
            }
          },
          function (err) {
            test.expect(err).to.not.exist;
            publisherclient.set('setTest/nonMergeConsecutive', object, {}, function (err) {
              test.expect(err).to.not.be.ok();
              publisherclient.set('setTest/nonMergeConsecutive', object, {}, function (err) {
                test.expect(err).to.not.be.ok();
              });
            });
          }
        );
      });

      it('should contain the same payload between a merge and a normal store for first store', function (done) {
        let shortid = test.commons.nanoid();
        let object = {
          param1: 10,
          param2: 20,
        };
        let firstTime = true;
        listenerclient.on(
          'mergeTest5/object/*',
          {
            event_type: 'set',
            count: 2,
          },
          function (message) {
            test.expect(message).to.eql(object);

            if (firstTime) {
              firstTime = false;
              return;
            }
            done();
          },
          function (err) {
            if (err) return done(err);

            publisherclient.set(
              'mergeTest5/object/' + shortid,
              object,
              {
                merge: true,
              },
              function (err) {
                if (err) return done(err);

                publisherclient.set(
                  'mergeTest5/object/' + shortid,
                  object,
                  {
                    merge: true,
                  },
                  function (err) {
                    if (err) return done(err);
                  }
                );
              }
            );
          }
        );
      });

      it('should search for a object by dates', function (callback) {
        let test_path_end = test.commons.nanoid();

        let complex_obj = {
          property1: 'property1',
          property2: 'property2',
          property3: 'property3',
        };

        let from = Date.now();
        let to;

        publisherclient.set(
          'testing/' + test_id + '/data/complex/' + test_path_end,
          complex_obj,
          null,
          function (e) {
            test.expect(e == null).to.be(true);

            setTimeout(function () {
              to = Date.now();

              let criteria = {
                property1: {
                  $eq: 'property1',
                },
                created: {
                  $gte: from,
                  $lte: to,
                },
              };

              let options = {
                sort: {
                  property1: 1,
                },
                limit: 2,
              };
              publisherclient.get(
                'testing/' + test_id + '/data/complex*',
                {
                  criteria,
                  options,
                },
                function (e, search_result) {
                  test.expect(e == null).to.be(true);

                  if (search_result.length === 0) {
                    publisherclient.get(
                      'testing/' + test_id + '/data/complex/' + test_path_end,
                      function () {
                        callback(new Error('no items found in the date range'));
                      }
                    );
                  } else {
                    publisherclient.get(
                      'testing/' + test_id + '/data/complex/' + test_path_end,
                      function () {
                        callback();
                      }
                    );
                  }
                }
              );
            }, 300);
          }
        );
      });

      it('should delete some test data', function (callback) {
        try {
          //We put the data we want to delete into the database
          publisherclient.set(
            'testing/' + test_id + '/data/delete_me',
            {
              property1: 'property1',
              property2: 'property2',
              property3: 'property3',
            },
            {
              noPublish: true,
            },
            function () {
              //We perform the actual delete
              publisherclient.remove(
                'testing/' + test_id + '/data/delete_me',
                {
                  noPublish: true,
                },
                function (e, result) {
                  test.expect(e).to.be(null);
                  test.expect(result._meta.status).to.be('ok');
                  callback();
                }
              );
            }
          );
        } catch (e) {
          callback(e);
        }
      });

      it('the publisher should set new data then update the data', function (callback) {
        try {
          let test_path_end = test.commons.nanoid();

          publisherclient.set(
            'testing/' + test_id + '/data/' + test_path_end,
            {
              property1: 'property1',
              property2: 'property2',
              property3: 'property3',
            },
            {
              noPublish: true,
            },
            function (e, insertResult) {
              test.expect(e).to.be(null);

              publisherclient.set(
                'testing/' + test_id + '/data/' + test_path_end,
                {
                  property1: 'property1',
                  property2: 'property2',
                  property3: 'property3',
                  property4: 'property4',
                },
                {
                  noPublish: true,
                },
                function (e, updateResult) {
                  test.expect(e).to.be(null);
                  test.expect(updateResult._meta.path).to.not.be(null);
                  test.expect(updateResult._meta.created).to.not.be(null);
                  test.expect(updateResult._meta.path === insertResult._meta.path).to.be(true);
                  test
                    .expect(updateResult._meta.created === insertResult._meta.created)
                    .to.be(true);
                  callback();
                }
              );
            }
          );
        } catch (e) {
          callback(e);
        }
      });

      it('the listener should pick up a single published event', function (callback) {
        listenerclient.on(
          'testing/' + test_id + '/data/event',
          {
            event_type: 'set',
            count: 1,
          },
          function () {
            test
              .expect(listenerclient.state.events['/SET@testing/' + test_id + '/data/event'])
              .to.be(undefined);
            callback();
          },
          function (e) {
            if (!e) {
              test
                .expect(
                  listenerclient.state.events['/SET@testing/' + test_id + '/data/event'].length
                )
                .to.be(1);
              //then make the change
              publisherclient.set(
                'testing/' + test_id + '/data/event',
                {
                  property1: 'property1',
                  property2: 'property2',
                  property3: 'property3',
                },
                null,
                function () {}
              );
            } else callback(e);
          }
        );
      });

      it('the publisher should set new data ', function (callback) {
        try {
          let test_path_end = test.commons.nanoid();

          publisherclient.set(
            'testing/' + test_id + '/data/' + test_path_end,
            {
              property1: 'property1',
              property2: 'property2',
              property3: 'property3',
            },
            null,
            function (e) {
              if (!e) {
                publisherclient.get(
                  'testing/' + test_id + '/data/' + test_path_end,
                  null,
                  function (e, results) {
                    test.expect(results.property1 === 'property1').to.be(true);
                    if (mode !== 'embedded')
                      test
                        .expect(results.payload[0].created === results.payload[0].modified)
                        .to.be(true);
                    callback(e);
                  }
                );
              } else callback(e);
            }
          );
        } catch (e) {
          callback(e);
        }
      });

      it('the publisher should set new data then update the data', function (callback) {
        try {
          let test_path_end = test.commons.nanoid();

          publisherclient.set(
            'testing/' + test_id + '/data/' + test_path_end,
            {
              property1: 'property1',
              property2: 'property2',
              property3: 'property3',
            },
            null,
            function (e, insertResult) {
              test.expect(e == null).to.be(true);

              publisherclient.set(
                'testing/' + test_id + '/data/' + test_path_end,
                {
                  property1: 'property1',
                  property2: 'property2',
                  property3: 'property3',
                  property4: 'property4',
                },
                null,
                function (e, updateResult) {
                  test.expect(e == null).to.be(true);
                  test.expect(updateResult._meta._id === insertResult._meta._id).to.be(true);
                  callback();
                }
              );
            }
          );
        } catch (e) {
          callback(e);
        }
      });

      it('the listener should pick up a single published event', function (callback) {
        try {
          //first listen for the change
          listenerclient.on(
            'testing/' + test_id + '/data/event',
            {
              event_type: 'set',
              count: 1,
            },
            function () {
              test
                .expect(listenerclient.state.events['/SET@testing/' + test_id + '/data/event'])
                .to.be(undefined);
              callback();
            },
            function (e) {
              if (!e) {
                test
                  .expect(
                    listenerclient.state.events['/SET@testing/' + test_id + '/data/event'].length
                  )
                  .to.be(1);

                //then make the change
                publisherclient.set(
                  'testing/' + test_id + '/data/event',
                  {
                    property1: 'property1',
                    property2: 'property2',
                    property3: 'property3',
                  },
                  null,
                  function () {}
                );
              } else callback(e);
            }
          );
        } catch (e) {
          callback(e);
        }
      });

      it('should get using a wildcard', function (callback) {
        let test_path_end = test.commons.nanoid();

        publisherclient.set(
          'testing/' + test_id + '/testwildcard/' + test_path_end,
          {
            property1: 'property1',
            property2: 'property2',
            property3: 'property3',
          },
          null,
          function (e) {
            test.expect(e == null).to.be(true);
            publisherclient.set(
              'testing/' + test_id + '/testwildcard/' + test_path_end + '/1',
              {
                property1: 'property1',
                property2: 'property2',
                property3: 'property3',
              },
              null,
              function (e) {
                test.expect(e == null).to.be(true);

                publisherclient.get(
                  'testing/' + test_id + '/testwildcard/' + test_path_end + '*',
                  null,
                  function (e, results) {
                    if (e) return callback();

                    test.expect(results.length === 2).to.be(true);
                    callback(e);
                  }
                );
              }
            );
          }
        );
      });

      it('should get paths', function (callback) {
        let test_path_end = test.commons.nanoid();

        publisherclient.set(
          'testing/' + test_id + '/testwildcard/' + test_path_end,
          {
            property1: 'property1',
            property2: 'property2',
            property3: 'property3',
          },
          null,
          function (e) {
            test.expect(e == null).to.be(true);
            publisherclient.set(
              'testing/' + test_id + '/testwildcard/' + test_path_end + '/1',
              {
                property1: 'property1',
                property2: 'property2',
                property3: 'property3',
              },
              null,
              function (e) {
                test.expect(e == null).to.be(true);

                publisherclient.getPaths(
                  'testing/' + test_id + '/testwildcard/' + test_path_end + '*',
                  function (e, results) {
                    test.expect(results.length === 2).to.be(true);
                    callback(e);
                  }
                );
              }
            );
          }
        );
      });

      it('the listener should pick up a single delete event', function (callback) {
        publisherclient.set(
          'testing/' + test_id + '/data/delete_me',
          {
            property1: 'property1',
            property2: 'property2',
            property3: 'property3',
          },
          null,
          function () {
            listenerclient.on(
              'testing/' + test_id + '/data/delete_me',
              {
                event_type: 'remove',
                count: 1,
              },
              function (eventData) {
                //we are looking at the event internals on the listener to ensure our event management is working - because we are only listening for 1
                //instance of this event - the event listener should have been removed
                test
                  .expect(
                    listenerclient.state.events['/REMOVE@testing/' + test_id + '/data/delete_me']
                  )
                  .to.be(undefined);

                //we needed to have removed a single item
                test.expect(eventData.payload.removed).to.be(1);

                callback();
              },
              function (e) {
                if (!e) return callback(e);

                test
                  .expect(
                    listenerclient.state.events['/REMOVE@testing/' + test_id + '/data/delete_me']
                      .length
                  )
                  .to.be(1);

                //We perform the actual delete
                publisherclient.remove(
                  'testing/' + test_id + '/data/delete_me',
                  null,
                  function () {}
                );
              }
            );
          }
        );
      });

      it('should unsubscribe from an event', function (callback) {
        let currentListenerId;

        listenerclient.on(
          'testing/' + test_id + '/data/on_off_test',
          {
            event_type: 'set',
            count: 0,
          },
          function () {
            listenerclient.offPath('testing/' + test_id + '/data/on_off_test', function (e) {
              if (e) return callback(new Error(e));

              listenerclient.on(
                'testing/' + test_id + '/data/on_off_test',
                {
                  event_type: 'set',
                  count: 0,
                },
                function () {
                  listenerclient.off(currentListenerId, function (e) {
                    if (e) return callback(new Error(e));
                    else return callback();
                  });
                },
                function (e, listenerId) {
                  if (e) return callback(new Error(e));

                  currentListenerId = listenerId;

                  publisherclient.set(
                    'testing/' + test_id + '/data/on_off_test',
                    {
                      property1: 'property1',
                      property2: 'property2',
                      property3: 'property3',
                    },
                    {},
                    function (e) {
                      if (e) return callback(new Error(e));
                    }
                  );
                }
              );
            });
          },
          function (e, listenerId) {
            if (e) return callback(new Error(e));

            currentListenerId = listenerId;

            publisherclient.set(
              'testing/' + test_id + '/data/on_off_test',
              {
                property1: 'property1',
                property2: 'property2',
                property3: 'property3',
              },
              {},
              function (e) {
                if (e) return callback(new Error(e));
              }
            );
          }
        );
      });

      it('should subscribe to the catch all notification', function (callback) {
        this.timeout(10000);
        let caughtCount = 0;

        listenerclient.onAll(
          function (_eventData, meta) {
            if (
              meta.action === '/REMOVE@testing/' + test_id + '/data/catch_all' ||
              meta.action === '/SET@testing/' + test_id + '/data/catch_all'
            )
              caughtCount++;

            if (caughtCount === 2) callback();
          },
          function (e) {
            if (e) return callback(e);

            publisherclient.set(
              'testing/' + test_id + '/data/catch_all',
              {
                property1: 'property1',
                property2: 'property2',
                property3: 'property3',
              },
              null,
              function () {
                publisherclient.remove(
                  'testing/' + test_id + '/data/catch_all',
                  null,
                  function () {}
                );
              }
            );
          }
        );
      });

      it('should unsubscribe from all events', function (callback) {
        this.timeout(10000);

        let onHappened = false;

        listenerclient.onAll(
          function () {
            onHappened = true;
            callback(new Error('this wasnt meant to happen'));
          },
          function (e) {
            if (e) return callback(e);

            listenerclient.on(
              'testing/' + test_id + '/data/off_all_test',
              {
                event_type: 'set',
                count: 0,
              },
              function () {
                onHappened = true;
                callback(new Error('this wasnt meant to happen'));
              },
              function (e) {
                if (e) return callback(e);

                listenerclient.offAll(function (e) {
                  if (e) return callback(e);

                  publisherclient.set(
                    'testing/' + test_id + '/data/off_all_test',
                    {
                      property1: 'property1',
                      property2: 'property2',
                      property3: 'property3',
                    },
                    null,
                    function (e) {
                      if (e) return callback(e);

                      setTimeout(function () {
                        if (!onHappened) callback();
                      }, 3000);
                    }
                  );
                });
              }
            );
          }
        );
      });

      it('should not publish with noPublish set', function (done) {
        let timeout;
        //first listen for the change
        listenerclient.on(
          'testing/' + test_id + '/testNoPublish',
          {
            event_type: 'set',
            count: 1,
          },
          function (message) {
            clearTimeout(timeout);
            setImmediate(function () {
              test.expect(message).to.not.be.ok();
            });
          },
          function (e) {
            test.expect(e).to.not.be.ok();

            timeout = setTimeout(function () {
              listenerclient.offPath('testing/' + test_id + '/testNoPublish', function () {
                done();
              });
            }, 1000);
            publisherclient.set(
              'testing/' + test_id + '/testNoPublish',
              {
                property1: 'property1',
                property2: 'property2',
                property3: 'property3',
              },
              {
                noPublish: true,
              },
              function (e) {
                test.expect(e).to.not.be.ok();
              }
            );
          }
        );
      });

      it('increments a value on a path', function (done) {
        let async = require('async');

        let test_string = test.commons.nanoid();
        let test_base_url = '/increment/' + test_id + '/' + test_string;

        async.timesSeries(
          10,
          function (time, timeCB) {
            publisherclient.set(
              test_base_url,
              'counter',
              {
                increment: 1,
                noPublish: true,
              },
              timeCB
            );
          },
          function (e) {
            if (e) return done(e);

            listenerclient.get(test_base_url, function (e, result) {
              if (e) return done(e);
              test.expect(result.counter.value).to.be(10);
              done();
            });
          }
        );
      });

      it('the listener can call count for data', function (done) {
        var test_string = test.commons.nanoid();
        var test_base_url = '/count_happn/' + test_id + '/set/string/' + test_string;
        publisherclient.set(
          test_base_url,
          test_string,
          {
            noPublish: true,
          },
          function (e) {
            test.expect(e).to.not.exist;
            listenerclient.count(test_base_url, function (e, count) {
              test.expect(e).to.not.exist;
              test.expect(count.value).to.eql(1);
              done();
            });
          }
        );
      });

      it('increments a value on a path, multiple gauges', function (done) {
        let async = require('async');

        let test_string = test.commons.nanoid();
        let test_base_url = '/increment/' + test_id + '/' + test_string;

        async.timesSeries(
          10,
          function (time, timeCB) {
            publisherclient.set(
              test_base_url,
              'counter-' + time,
              {
                increment: 1,
                noPublish: true,
              },
              function (e) {
                timeCB(e);
              }
            );
          },
          function (e) {
            if (e) return done(e);

            listenerclient.get(test_base_url, function (e, result) {
              if (e) return done(e);

              test.expect(result['counter-0'].value).to.be(1);
              test.expect(result['counter-1'].value).to.be(1);
              test.expect(result['counter-2'].value).to.be(1);
              test.expect(result['counter-3'].value).to.be(1);
              test.expect(result['counter-4'].value).to.be(1);
              test.expect(result['counter-5'].value).to.be(1);
              test.expect(result['counter-6'].value).to.be(1);
              test.expect(result['counter-7'].value).to.be(1);
              test.expect(result['counter-8'].value).to.be(1);
              test.expect(result['counter-9'].value).to.be(1);

              done();
            });
          }
        );
      });

      it('increments a value on a path, convenience method, multiple gauges', function (done) {
        let async = require('async');

        let test_string = test.commons.nanoid();
        let test_base_url = '/increment/' + test_id + '/' + test_string;

        async.timesSeries(
          10,
          function (time, timeCB) {
            publisherclient.increment(test_base_url, 'counter-' + time, 1, function (e) {
              timeCB(e);
            });
          },
          function (e) {
            if (e) return done(e);

            listenerclient.get(test_base_url, function (e, result) {
              if (e) return done(e);

              test.expect(result['counter-0'].value).to.be(1);
              test.expect(result['counter-1'].value).to.be(1);
              test.expect(result['counter-2'].value).to.be(1);
              test.expect(result['counter-3'].value).to.be(1);
              test.expect(result['counter-4'].value).to.be(1);
              test.expect(result['counter-5'].value).to.be(1);
              test.expect(result['counter-6'].value).to.be(1);
              test.expect(result['counter-7'].value).to.be(1);
              test.expect(result['counter-8'].value).to.be(1);
              test.expect(result['counter-9'].value).to.be(1);

              done();
            });
          }
        );
      });

      it('increments a value on a path, convenience method, listens on path receives event', function (done) {
        let test_string = test.commons.nanoid();
        let test_base_url = '/increment/convenience/' + test_id + '/' + test_string;

        listenerclient.on(
          test_base_url,
          function (data) {
            test.expect(data.value).to.be(1);
            test.expect(data.gauge).to.be('counter');

            done();
          },
          function (e) {
            if (e) return done(e);

            publisherclient.increment(test_base_url, 1, function (e) {
              if (e) return done(e);
            });
          }
        );
      });

      it('increments a value on a path, convenience method with custom gauge and increment, listens on path receives event', function (done) {
        let test_string = test.commons.nanoid();
        let test_base_url = '/increment/convenience/' + test_id + '/' + test_string;

        listenerclient.on(
          test_base_url,
          function (data) {
            test.expect(data.value).to.be(3);
            test.expect(data.gauge).to.be('custom');

            done();
          },
          function (e) {
            if (e) return done(e);

            publisherclient.increment(test_base_url, 'custom', 3, function (e) {
              if (e) return done(e);
            });
          }
        );
      });

      it('increments and decrements a value on a path, convenience method with custom gauge and increment and decrement, listens on path receives event', function (done) {
        let test_string = test.commons.nanoid();
        let test_base_url = '/increment/convenience/' + test_id + '/' + test_string;

        let incrementCount = 0;

        listenerclient.on(
          test_base_url,
          function (data) {
            incrementCount++;

            if (incrementCount === 1) {
              test.expect(data.value).to.be(3);
              test.expect(data.gauge).to.be('custom');
            }

            if (incrementCount === 2) {
              test.expect(data.value).to.be(1);
              test.expect(data.gauge).to.be('custom');
              done();
            }
          },
          function (e) {
            if (e) return done(e);

            publisherclient.increment(test_base_url, 'custom', 3, function (e) {
              if (e) return done(e);

              publisherclient.increment(test_base_url, 'custom', -2, function (e) {
                if (e) return done(e);
              });
            });
          }
        );
      });

      it('increments a value on a path, convenience method, no counter so defaults to 1, listens on path receives event', function (done) {
        let test_string = test.commons.nanoid();
        let test_base_url = '/increment/convenience/' + test_id + '/' + test_string;

        listenerclient.on(
          test_base_url,
          function (data) {
            test.expect(data.value).to.be(1);
            test.expect(data.gauge).to.be('counter');

            done();
          },
          function (e) {
            if (e) return done(e);

            publisherclient.increment(test_base_url, function (e) {
              if (e) return done(e);
            });
          }
        );
      });

      it('can page using skip and limit', async () => {
        this.timeout(5000);

        let totalRecords = 100;
        let pageSize = 10;
        let expectedPages = totalRecords / pageSize;
        let indexes = [];

        for (let i = 0; i < totalRecords; i++) indexes.push(i);

        for (let index of indexes) {
          await publisherclient.set('series/horror/' + index, {
            name: 'nightmare on elm street',
            genre: 'horror',
            episode: index,
          });
          await publisherclient.set('series/fantasy/' + index, {
            name: 'game of thrones',
            genre: 'fantasy',
            episode: index,
          });
        }

        let options = {
          sort: {
            '_meta.created': -1,
          },
          limit: 200,
        };

        let criteria = {
          genre: 'horror',
        };

        let foundPages = [];

        for (let i = 0; i < expectedPages; i++) {
          options.skip = foundPages.length;
          let results = await listenerclient.get('series/*', {
            criteria,
            options,
          });
          foundPages = foundPages.concat(results);
        }

        let allResults = await listenerclient.get('series/*', {
          criteria: criteria,
          options: {
            sort: {
              '_meta.created': -1,
            },
            limit: 200,
          },
        });

        test.expect(allResults.length).to.eql(foundPages.length);
        test.expect(allResults).to.eql(foundPages);
      });

      it('can search using $like criteria', async () => {
        await publisherclient.set('series/like/1', {
          name: 'test-a-like-comparison-1',
        });
        await publisherclient.set('series/like/2', {
          name: 'test-a-like-comparison-2',
        });
        await publisherclient.set('series/like/3', {
          name: 'test-a-like-comparison-3',
        });

        const found1 = await publisherclient.get('series/like/*', {
          criteria: {
            name: { $like: 'test-a-like-comparison-1' },
          },
        });
        test.expect(found1.length).to.be(1);

        const found2 = await publisherclient.get('series/like/*', {
          criteria: {
            name: { $like: 'test-a-like-comparison-%' },
          },
        });
        test.expect(found2.length).to.be(3);
      });
    });
  });
});
