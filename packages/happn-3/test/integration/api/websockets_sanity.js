require('../../__fixtures/utils/test_helper').describe({ timeout: 10e3 }, (test) => {
  let happn = require('../../../lib/index');
  let service = happn.service;
  let happn_client = happn.client;
  let happnInstance = null;
  let testId = test.newid();

  before('should initialize the service', function (callback) {
    testId = Date.now() + '_' + test.newid();

    try {
      service.create(function (e, happnInst) {
        if (e) return callback(e);

        happnInstance = happnInst;
        callback();
      });
    } catch (e) {
      callback(e);
    }
  });

  after(function (done) {
    this.timeout(20000);

    publisherclient.disconnect(
      {
        timeout: 2000,
      },
      function (e) {
        //eslint-disable-next-line no-console
        if (e) console.warn('failed disconnecting publisher client');
        listenerclient.disconnect(
          {
            timeout: 2000,
          },
          function (e) {
            //eslint-disable-next-line no-console
            if (e) console.warn('failed disconnecting listener client');
            happnInstance.stop(done);
          }
        );
      }
    );
  });

  var publisherclient;
  var listenerclient;
  var disconnectclient;

  /*
   We are initializing 2 clients to test saving data against the database, one client will push data into the
   database whilst another listens for changes.
   */
  before('should initialize the clients', function (callback) {
    try {
      happn_client.create(function (e, instance) {
        if (e) return callback(e);
        publisherclient = instance;

        happn_client.create(function (e, instance) {
          if (e) return callback(e);
          listenerclient = instance;

          happn_client.create(function (e, instance) {
            if (e) return callback(e);
            disconnectclient = instance;
            callback();
          });
        });
      });
    } catch (e) {
      callback(e);
    }
  });

  it('should disconnect the disconnect client', function (callback) {
    disconnectclient.disconnect().then(callback);
  });

  it('the listener should pick up a single wildcard event', function (callback) {
    try {
      //first listen for the change
      listenerclient.on(
        '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/event/*',
        {
          event_type: 'set',
          count: 1,
        },
        function () {
          test
            .expect(
              listenerclient.state.events[
                '/SET@/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/event/*'
              ]
            )
            .to.be(undefined);
          callback();
        },
        function (e) {
          if (!e) {
            test
              .expect(
                listenerclient.state.events[
                  '/SET@/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/event/*'
                ].length
              )
              .to.be(1);

            //then make the change
            publisherclient.set(
              '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/event/blah',
              {
                property1: 'property1',
                property2: 'property2',
                property3: 'property3',
              },
              null,
              function (e) {
                if (e) return callback(e);
              }
            );
          } else callback(e);
        }
      );
    } catch (e) {
      callback(e);
    }
  });

  it('the uses the onPublished event handler', function (callback) {
    listenerclient
      .on('/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/onPublished/*', {
        onPublished: function (message, meta) {
          test.expect(message.property1).to.be('property1');
          test.expect(meta.created <= Date.now()).to.be(true);
          callback();
        },
      })
      .then(function (eventId) {
        test.expect(eventId >= 0).to.be(true);
        test
          .expect(
            listenerclient.state.events[
              '/ALL@/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/onPublished/*'
            ].length
          )
          .to.be(1);

        publisherclient.set(
          '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/onPublished/blah',
          {
            property1: 'property1',
            property2: 'property2',
            property3: 'property3',
          },
          null,
          function (e) {
            if (e) return callback(e);
          }
        );
      })
      .catch(callback);
  });

  it('the listener should pick up a wildcard event, no parameters', function (callback) {
    try {
      //first listen for the change
      listenerclient.on(
        '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/anyevent/*',
        function () {
          test
            .expect(
              listenerclient.state.events[
                '/ALL@/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/anyevent/*'
              ].length
            )
            .to.be(1);
          callback();
        },
        function (e) {
          if (!e) {
            test
              .expect(
                listenerclient.state.events[
                  '/ALL@/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/anyevent/*'
                ].length
              )
              .to.be(1);

            //then make the change
            publisherclient.set(
              '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/anyevent/blah',
              {
                property1: 'property1',
                property2: 'property2',
                property3: 'property3',
              },
              null,
              function (e) {
                if (e) return callback(e);
              }
            );
          } else callback(e);
        }
      );
    } catch (e) {
      callback(e);
    }
  });

  it('the listener should pick up a wildcard event, key without preceding /', function (callback) {
    try {
      //first listen for the change
      listenerclient.on(
        '2_websockets_embedded_sanity/anyevent/*',
        function () {
          test
            .expect(
              listenerclient.state.events['/ALL@2_websockets_embedded_sanity/anyevent/*'].length
            )
            .to.be(1);
          callback();
        },
        function (e) {
          if (!e) {
            test
              .expect(
                listenerclient.state.events['/ALL@2_websockets_embedded_sanity/anyevent/*'].length
              )
              .to.be(1);

            //then make the change
            publisherclient.set(
              '2_websockets_embedded_sanity/anyevent/blah',
              {
                property1: 'property1',
                property2: 'property2',
                property3: 'property3',
              },
              null,
              function (e) {
                if (e) return callback(e);
              }
            );
          } else callback(e);
        }
      );
    } catch (e) {
      callback(e);
    }
  });

  it('the listener should pick up a wildcard event, key without preceding / once', function (callback) {
    try {
      //first listen for the change
      listenerclient.on(
        '2_websockets_embedded_sanity/anyeventonce/*',
        {
          count: 1,
        },
        function () {
          test
            .expect(listenerclient.state.events['/ALL@2_websockets_embedded_sanity/anyeventonce/*'])
            .to.be(undefined);
          callback();
        },
        function (e) {
          if (!e) {
            test
              .expect(
                listenerclient.state.events['/ALL@2_websockets_embedded_sanity/anyeventonce/*']
                  .length
              )
              .to.be(1);

            //then make the change
            publisherclient.set(
              '2_websockets_embedded_sanity/anyeventonce/blah',
              {
                property1: 'property1',
                property2: 'property2',
                property3: 'property3',
              },
              {},
              function (e) {
                if (e) return callback(e);
              }
            );
          } else callback(e);
        }
      );
    } catch (e) {
      callback(e);
    }
  });

  it('the publisher should get null for unfound data, exact path', function (callback) {
    var test_path_end = test.newid();
    publisherclient.get(
      '2_websockets_embedded_sanity/' + testId + '/unfound/exact/' + test_path_end,
      null,
      function (e, results) {
        test.expect(e).to.be(null);
        test.expect(results).to.be(null);
        callback(e);
      }
    );
  });

  it('the publisher should get null for unfound data, bad options', function (callback) {
    var test_path_end = test.newid();
    publisherclient.get(
      '2_websockets_embedded_sanity/' + testId + '/unfound/exact/' + test_path_end,
      'bad options',
      function (e, results) {
        test.expect(e).to.be(null);
        test.expect(results).to.be(null);
        callback(e);
      }
    );
  });

  it('the publisher should get [] for unfound data, wildcard path', function (callback) {
    var test_path_end = test.newid();

    publisherclient.get(
      '2_websockets_embedded_sanity/' + testId + '/unfound/wild/*' + test_path_end + '/*',
      null,
      function (e, results) {
        test.expect(e).to.be(null);
        test.expect(results.length).to.be(0);
        callback(e);
      }
    );
  });

  it('the publisher should set new data', function (callback) {
    try {
      var test_path_end = test.newid();

      publisherclient.set(
        '2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/' + test_path_end,
        {
          property1: 'property1',
          property2: 'property2',
          property3: 'property3',
        },
        {
          noPublish: true,
        },
        function (e) {
          if (e) return callback(e);

          publisherclient.get(
            '2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/' + test_path_end,
            null,
            function (e, results) {
              test.expect(results.property1 === 'property1').to.be(true);
              callback(e);
            }
          );
        }
      );
    } catch (e) {
      callback(e);
    }
  });

  it('set_multiple, the publisher should set multiple data items, then do a wildcard get to return them', function (callback) {
    var timesCount = 10;

    try {
      test.commons.async.times(
        timesCount,
        function (n, timesCallback) {
          var test_random_path2 = test.newid();

          publisherclient.set(
            '/2_websockets_embedded_sanity/' + testId + '/set_multiple/' + test_random_path2,
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

          listenerclient.get(
            '/2_websockets_embedded_sanity/' + testId + '/set_multiple/*',
            null,
            function (e, results) {
              if (e) return callback(e);

              test.expect(results.length).to.be(timesCount);
              callback();
            }
          );
        }
      );
    } catch (e) {
      callback(e);
    }
  });

  it('should set data, and then merge a new document into the data without overwriting old fields', function (callback) {
    try {
      var test_path_end = test.newid();

      publisherclient.set(
        '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/merge/' + test_path_end,
        {
          property1: 'property1',
          property2: 'property2',
          property3: 'property3',
        },
        null,
        function (e) {
          if (e) return callback(e);

          publisherclient.set(
            '/2_websockets_embedded_sanity/' +
              testId +
              '/testsubscribe/data/merge/' +
              test_path_end,
            {
              property4: 'property4',
            },
            {
              merge: true,
            },
            function (e) {
              if (e) return callback(e);

              publisherclient.get(
                '/2_websockets_embedded_sanity/' +
                  testId +
                  '/testsubscribe/data/merge/' +
                  test_path_end,
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

  it('should set data, and then merge a new document into the data without mutating the input object', function (callback) {
    try {
      var test_path_end = test.newid();

      publisherclient.set(
        '/1_eventemitter_embedded_sanity/' + testId + '/testsubscribe/data/merge/' + test_path_end,
        {
          property1: 'property1',
          property2: 'property2',
          property3: 'property3',
        },
        null,
        function (e) {
          if (e) return callback(e);
          var mergeObject = { data: { property4: 'property4' } };
          publisherclient.set(
            '/1_eventemitter_embedded_sanity/' +
              testId +
              '/testsubscribe/data/merge/' +
              test_path_end,
            mergeObject.data,
            {
              merge: true,
            },
            function (e) {
              if (e) return callback(e);
              test.expect(mergeObject.data).to.eql({ property4: 'property4' });
              callback();
            }
          );
        }
      );
    } catch (e) {
      callback(e);
    }
  });

  it('should contain the same payload between 2 non-merging consecutive stores', function (done) {
    var object = {
      param1: 10,
      param2: 20,
    };
    var firstTime;

    listenerclient.on(
      'setTest/object',
      {
        event_type: 'set',
        count: 2,
      },
      function (message) {
        if (firstTime === undefined) {
          firstTime = message;
        } else {
          test.expect(message).to.eql(firstTime);
          done();
        }
      },
      function (err) {
        test.expect(err).to.not.be.ok();
        publisherclient.set('setTest/object', object, {}, function (err) {
          test.expect(err).to.not.be.ok();
          publisherclient.set('setTest/object', object, {}, function (err) {
            test.expect(err).to.not.be.ok();
          });
        });
      }
    );
  });

  it('should contain the same payload between a merge and a normal store for first store', function (done) {
    var object = {
      param1: 10,
      param2: 20,
    };
    var firstTime = true;

    listenerclient.on(
      'mergeTest/object',
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
        test.expect(err).to.not.be.ok();
        publisherclient.set(
          'mergeTest/object',
          object,
          {
            merge: true,
          },
          function (err) {
            test.expect(err).to.not.be.ok();
            publisherclient.set(
              'mergeTest/object',
              object,
              {
                merge: true,
              },
              function (err) {
                test.expect(err).to.not.be.ok();
              }
            );
          }
        );
      }
    );
  });

  it('should search for a complex object', function (callback) {
    var test_path_end = test.newid();

    var complex_obj = {
      regions: ['North', 'South'],
      towns: ['North.Cape Town'],
      categories: ['Action', 'History'],
      subcategories: ['Action.angling', 'History.art'],
      keywords: ['bass', 'Penny Siopis'],
      field1: 'field1',
    };

    var criteria1 = {
      $or: [
        {
          regions: {
            $containsAny: ['North', 'South', 'East', 'West'],
          },
        },
        {
          towns: {
            $containsAny: ['North.Cape Town', 'South.East London'],
          },
        },
        {
          categories: {
            $containsAny: ['Action', 'History'],
          },
        },
      ],
      keywords: {
        $containsAny: ['bass', 'Penny Siopis'],
      },
    };

    var options1 = {
      sort: {
        field1: 1,
      },
      limit: 1,
    };

    var criteria2 = null;

    var options2 = {
      fields: {
        towns: 1,
        keywords: 1,
      },
      sort: {
        field1: 1,
      },
      limit: 2,
    };

    publisherclient.set(
      '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/complex/' + test_path_end,
      complex_obj,
      null,
      function (e) {
        if (e) return callback(e);

        publisherclient.set(
          '/2_websockets_embedded_sanity/' +
            testId +
            '/testsubscribe/data/complex/' +
            test_path_end +
            '/1',
          complex_obj,
          null,
          function (e) {
            if (e) return callback(e);
            publisherclient.get(
              '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/complex*',
              {
                criteria: criteria1,
                options: options1,
              },
              function (e, search_result) {
                if (e) return callback(e);

                test.expect(search_result.length === 1).to.be(true);

                publisherclient.get(
                  '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/complex*',
                  {
                    criteria: criteria2,
                    options: options2,
                  },
                  function (e, search_result) {
                    if (e) return callback(e);

                    test.expect(search_result.length === 2).to.be(true);
                    callback(e);
                  }
                );
              }
            );
          }
        );
      }
    );
  });

  it('should delete some test data', function (callback) {
    try {
      //We put the data we want to delete into the database
      publisherclient.set(
        '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/delete_me',
        {
          property1: 'property1',
          property2: 'property2',
          property3: 'property3',
        },
        {
          noPublish: true,
        },
        function () {
          publisherclient.remove(
            '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/delete_me',
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

  it('should delete multiple items', function (callback) {
    try {
      //We put the data we want to delete into the database
      publisherclient.set(
        '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/delete_us/1',
        {
          property1: 'property1',
          property2: 'property2',
          property3: 'property3',
        },
        {
          noPublish: true,
        },
        function (e) {
          if (e) return callback(e);

          //We put the data we want to delete into the database
          publisherclient.set(
            '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/delete_us/2',
            {
              property1: 'property1',
              property2: 'property2',
              property3: 'property3',
            },
            {
              noPublish: true,
            },
            function (e) {
              if (e) return callback(e);

              //We perform the actual delete
              publisherclient.remove(
                '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/delete_us/*',
                {
                  noPublish: true,
                },
                function (e, result) {
                  test.expect(e).to.be(null);

                  test.expect(result._meta.status).to.be('ok');

                  test.expect(result.removed).to.be(2);

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

  it('should delete multiple items filtered by criteria', async () => {
    await publisherclient.set('test/delete/1', { test: 1 });
    await publisherclient.set('test/delete/2', { test: 2 });
    await publisherclient.set('test/delete/3', { test: 3 });
    let items = (await publisherclient.get('test/delete/*')).map((item) => item.test);
    test.expect(items).to.eql([1, 2, 3]);
    await publisherclient.remove('test/delete/*', {
      criteria: {
        test: { $eq: 2 },
      },
    });
    items = (await publisherclient.get('test/delete/*')).map((item) => item.test);
    test.expect(items).to.eql([1, 3]);
    await publisherclient.remove('test/delete/*');
    items = (await publisherclient.get('test/delete/*')).map((item) => item.test);
    test.expect(items).to.eql([]);
  });

  it('the publisher should set new data then update the data', function (callback) {
    try {
      var test_path_end = test.newid();

      publisherclient.set(
        '2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/' + test_path_end,
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
            '2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/' + test_path_end,
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
              test.expect(updateResult._meta.id === insertResult._meta.id).to.be(true);
              callback();
            }
          );
        }
      );
    } catch (e) {
      callback(e);
    }
  });

  it('should unsubscribe from a specific event', function (done) {
    var emitted = {};

    var reference1;
    var reference2;

    var path =
      '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/on_off_specific_test';

    listenerclient.on(
      path,
      {
        event_type: 'set',
        count: 0,
      },
      function (message) {
        if (!emitted[reference1]) emitted[reference1] = [];
        emitted[reference1].push(message);
      },
      function (e, eventReference) {
        reference1 = eventReference;

        return listenerclient.on(
          path,
          {
            event_type: 'set',
            count: 0,
          },
          function (message) {
            if (!emitted[reference2]) emitted[reference2] = [];
            emitted[reference2].push(message);
          },
          function (e, eventReference) {
            reference2 = eventReference;

            listenerclient
              .set(path, { test: 'data1' })
              .then(function () {
                return listenerclient.set(path, { test: 'data2' });
              })
              .then(function () {
                return listenerclient.off(reference2);
              })
              .then(function () {
                return listenerclient.set(path, { test: 'data3' });
              })
              .then(function () {
                test.expect(emitted[reference1].length).to.be(3);
                test.expect(emitted[reference2].length).to.be(2);

                done();
              })
              .catch(done);
          }
        );
      }
    );
  });

  //	We set the listener client to listen for a PUT event according to a path, then we set a value with the publisher client.
  it('the listener should pick up a single published event', function (callback) {
    try {
      //first listen for the change
      listenerclient.on(
        '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/event',
        {
          event_type: 'set',
          count: 1,
        },
        function () {
          test
            .expect(
              listenerclient.state.events[
                '/SET@/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/event'
              ]
            )
            .to.be(undefined);
          callback();
        },
        function (e) {
          if (!e) {
            test
              .expect(
                listenerclient.state.events[
                  '/SET@/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/event'
                ].length
              )
              .to.be(1);
            publisherclient.set(
              '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/event',
              {
                property1: 'property1',
                property2: 'property2',
                property3: 'property3',
              },
              null,
              function () {
                //do nothing
              }
            );
          } else callback(e);
        }
      );
    } catch (e) {
      callback(e);
    }
  });

  it('the publisher should set new data ', function (callback) {
    try {
      var test_path_end = test.newid();

      publisherclient.set(
        '2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/' + test_path_end,
        {
          property1: 'property1',
          property2: 'property2',
          property3: 'property3',
        },
        null,
        function (e) {
          if (!e) {
            publisherclient.get(
              '2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/' + test_path_end,
              null,
              function (e, results) {
                test.expect(results.property1 === 'property1').to.be(true);
                test.expect(results._meta.created === results._meta.modified).to.be(true);
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
      var test_path_end = test.newid();

      publisherclient.set(
        '2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/' + test_path_end,
        {
          property1: 'property1',
          property2: 'property2',
          property3: 'property3',
        },
        null,
        function (e, insertResult) {
          test.expect(e == null).to.be(true);

          publisherclient.set(
            '2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/' + test_path_end,
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
      listenerclient.on(
        '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/event',
        {
          event_type: 'set',
          count: 1,
        },
        function () {
          test
            .expect(
              listenerclient.state.events[
                '/SET@/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/event'
              ]
            )
            .to.be(undefined);
          callback();
        },
        function (e) {
          if (!e) {
            test
              .expect(
                listenerclient.state.events[
                  '/SET@/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/event'
                ].length
              )
              .to.be(1);
            publisherclient.set(
              '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/event',
              {
                property1: 'property1',
                property2: 'property2',
                property3: 'property3',
              },
              null,
              function () {
                //do nothing
              }
            );
          } else callback(e);
        }
      );
    } catch (e) {
      callback(e);
    }
  });

  it('should get using a wildcard', function (callback) {
    var test_path_end = test.newid();

    publisherclient.set(
      '2_websockets_embedded_sanity/' + testId + '/testwildcard/' + test_path_end,
      {
        property1: 'property1',
        property2: 'property2',
        property3: 'property3',
      },
      null,
      function (e) {
        test.expect(e == null).to.be(true);
        publisherclient.set(
          '2_websockets_embedded_sanity/' + testId + '/testwildcard/' + test_path_end + '/1',
          {
            property1: 'property1',
            property2: 'property2',
            property3: 'property3',
          },
          null,
          function (e) {
            test.expect(e == null).to.be(true);

            publisherclient.get(
              '2_websockets_embedded_sanity/' + testId + '/testwildcard/' + test_path_end + '*',
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
    var test_path_end = test.newid();

    publisherclient.set(
      '2_websockets_embedded_sanity/' + testId + '/testwildcard/' + test_path_end,
      {
        property1: 'property1',
        property2: 'property2',
        property3: 'property3',
      },
      null,
      function (e) {
        test.expect(e == null).to.be(true);
        publisherclient.set(
          '2_websockets_embedded_sanity/' + testId + '/testwildcard/' + test_path_end + '/1',
          {
            property1: 'property1',
            property2: 'property2',
            property3: 'property3',
          },
          null,
          function (e) {
            test.expect(e == null).to.be(true);

            publisherclient.getPaths(
              '2_websockets_embedded_sanity/' + testId + '/testwildcard/' + test_path_end + '*',
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
      '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/delete_me',
      {
        property1: 'property1',
        property2: 'property2',
        property3: 'property3',
      },
      null,
      function () {
        listenerclient.on(
          '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/delete_me',
          {
            event_type: 'remove',
            count: 1,
          },
          function (eventData) {
            test
              .expect(
                listenerclient.state.events[
                  '/REMOVE@/2_websockets_embedded_sanity/' +
                    testId +
                    '/testsubscribe/data/delete_me'
                ]
              )
              .to.be(undefined);
            test.expect(eventData.payload.removed).to.be(1);
            callback();
          },
          function (e) {
            if (!e) return callback(e);
            test
              .expect(
                listenerclient.state.events[
                  '/REMOVE@/2_websockets_embedded_sanity/' +
                    testId +
                    '/testsubscribe/data/delete_me'
                ].length
              )
              .to.be(1);
            publisherclient.remove(
              '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/delete_me',
              null,
              function () {
                //do nothing
              }
            );
          }
        );
      }
    );
  });

  it('should unsubscribe from a path', function (callback) {
    this.timeout(5000);
    var eventFired = false;
    listenerclient.on(
      '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/on_off_test',
      {
        event_type: 'set',
        count: 0,
      },
      function () {
        eventFired = true;
      },
      function () {
        listenerclient.offPath(
          '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/on_off_test',
          function (e) {
            if (e) return callback(new Error(e));
            publisherclient.set(
              '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/on_off_test',
              {
                property1: 'property1',
                property2: 'property2',
                property3: 'property3',
              },
              {},
              function (e) {
                if (e) return callback(new Error(e));
                setTimeout(function () {
                  test.expect(eventFired).to.be(false);
                  callback();
                }, 2000);
              }
            );
          }
        );
      }
    );
  });

  it('should unsubscribe from an event', function (callback) {
    var currentListenerId;

    listenerclient.on(
      '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/on_off_test',
      {
        event_type: 'set',
        count: 0,
      },
      function () {
        listenerclient.offPath(
          '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/on_off_test',
          function (e) {
            if (e) return callback(new Error(e));

            listenerclient.on(
              '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/on_off_test',
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
                  '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/on_off_test',
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
          }
        );
      },
      function (e, listenerId) {
        if (e) return callback(new Error(e));

        currentListenerId = listenerId;

        publisherclient.set(
          '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/on_off_test',
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
    var caughtCount = 0;

    listenerclient.onAll(
      function (eventData, meta) {
        if (
          meta.action ===
            '/REMOVE@/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/catch_all' ||
          meta.action ===
            '/SET@/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/catch_all'
        )
          caughtCount++;

        if (caughtCount === 2) callback();
      },
      function (e) {
        if (e) return callback(e);

        publisherclient.set(
          '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/catch_all',
          {
            property1: 'property1',
            property2: 'property2',
            property3: 'property3',
          },
          null,
          function () {
            publisherclient.remove(
              '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/catch_all',
              null,
              function () {
                //do nothing
              }
            );
          }
        );
      }
    );
  });

  it('should unsubscribe from all events', function (callback) {
    this.timeout(10000);

    var onHappened = false;

    listenerclient.onAll(
      function () {
        onHappened = true;
        callback(new Error('this wasnt meant to happen'));
      },
      function (e) {
        if (e) return callback(e);

        listenerclient.on(
          '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/off_all_test',
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
                '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/off_all_test',
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

  it('will do events in the order they are passed', function (done) {
    publisherclient.set(
      '/test_event_order',
      {
        property1: 'property1Value',
      },
      {},
      function () {
        publisherclient.log.info('Done setting');
      }
    );
    publisherclient.remove('/test_event_order', function () {
      publisherclient.log.info('Done removing');
      setTimeout(function () {
        publisherclient.get('/test_event_order', null, function (e, result) {
          test.expect(result).to.be(null);
          done();
        });
      }, 1000);
    });
  });

  it('should search for a complex object with a data property', function (callback) {
    this.timeout(10000);

    var test_path_end = test.newid();

    var complex_obj = {
      data: {
        regions: ['North', 'South'],
        towns: ['North.Cape Town'],
        categories: ['Action', 'History'],
        subcategories: ['Action.angling', 'History.art'],
        keywords: ['bass', 'Penny Siopis'],
        field1: 'field1',
        timestamp: Date.now(),
      },
    };

    var from = Date.now() - 1000;
    var to;

    publisherclient.set(
      '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/complex/' + test_path_end,
      complex_obj,
      null,
      function (e) {
        test.expect(e == null).to.be(true);

        setTimeout(function () {
          to = Date.now() + 1000;

          var criteria = {
            'data.data.timestamp': {
              $gte: from,
              $lte: to,
            },
          };

          var options = {
            fields: null,
            sort: {
              'data.data.field1': 1,
            },
            limit: 2,
          };
          publisherclient.get(
            '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/complex*',
            {
              criteria: criteria,
              options: options,
            },
            function (e, search_result) {
              if (e) return callback(e);

              if (search_result.length === 0) {
                callback(new Error('no items found in the date range'));
              } else callback();
            }
          );
        }, 500);
      }
    );
  });

  it('should search for a complex object with a data property, using _data', function (callback) {
    this.timeout(10000);

    var test_path_end = test.newid();

    var complex_obj = {
      data: {
        regions: ['North', 'South'],
        towns: ['North.Cape Town'],
        categories: ['Action', 'History'],
        subcategories: ['Action.angling', 'History.art'],
        keywords: ['bass', 'Penny Siopis'],
        field1: 'field1',
        timestamp: Date.now(),
      },
    };

    var from = Date.now() - 1000;
    var to;

    publisherclient.set(
      '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/complex/' + test_path_end,
      complex_obj,
      null,
      function (e) {
        test.expect(e == null).to.be(true);

        setTimeout(function () {
          to = Date.now() + 1000;

          var criteria = {
            '_data.data.timestamp': {
              $gte: from,
              $lte: to,
            },
          };

          var options = {
            fields: null,
            sort: {
              '_data.data.field1': 1,
            },
            limit: 2,
          };

          ////////////console.log('searching');
          publisherclient.get(
            '/2_websockets_embedded_sanity/' + testId + '/testsubscribe/data/complex*',
            {
              criteria: criteria,
              options: options,
            },
            function (e, search_result) {
              if (e) return callback(e);

              if (search_result.length === 0) {
                callback(new Error('no items found in the date range'));
              } else callback();
            }
          );
        }, 500);
      }
    );
  });

  it('subscribes with a count - we ensure the event only gets kicked off for the correct amounts', function (callback) {
    var hits = 0;
    listenerclient.on(
      '/2_websockets_embedded_sanity/' + testId + '/count/2/*',
      {
        event_type: 'set',
        count: 2,
      },
      function () {
        hits++;
      },
      function (e) {
        if (e) return callback(e);

        publisherclient.set('/2_websockets_embedded_sanity/' + testId + '/count/2/1', {
          property1: 'property1',
          property2: 'property2',
          property3: 'property3',
        });

        publisherclient.set('/2_websockets_embedded_sanity/' + testId + '/count/2/2', {
          property1: 'property1',
          property2: 'property2',
          property3: 'property3',
        });

        publisherclient.set('/2_websockets_embedded_sanity/' + testId + '/count/2/2', {
          property1: 'property1',
          property2: 'property2',
          property3: 'property3',
        });

        setTimeout(function () {
          if (hits !== 2) return callback(new Error('hits were over the agreed on 2'));
          callback();
        }, 1500);
      }
    );
  });

  it('subscribes with a count - we ensure the event only gets kicked off for the correct amounts - negative test', function (callback) {
    var hits = 0;
    //first listen for the change
    listenerclient.on(
      '/2_websockets_embedded_sanity/' + testId + '/count/2/*',
      {
        event_type: 'set',
        count: 3,
      },
      function () {
        hits++;
      },
      function (e) {
        if (e) return callback(e);

        publisherclient.set('/2_websockets_embedded_sanity/' + testId + '/count/2/1', {
          property1: 'property1',
          property2: 'property2',
          property3: 'property3',
        });

        publisherclient.set('/2_websockets_embedded_sanity/' + testId + '/count/2/2', {
          property1: 'property1',
          property2: 'property2',
          property3: 'property3',
        });

        publisherclient.set('/2_websockets_embedded_sanity/' + testId + '/count/2/2', {
          property1: 'property1',
          property2: 'property2',
          property3: 'property3',
        });

        setTimeout(function () {
          if (hits !== 3) return callback(new Error('hits were over the agreed on 2'));
          callback();
        }, 1500);
      }
    );
  });

  it('subscribe, then does an off with a bad handle', function (done) {
    var currentEventId;
    //first listen for the change
    listenerclient.on(
      '/2_websockets_embedded_sanity/' + testId + '/off-handle/2/*',
      {
        event_type: 'set',
      },
      function () {
        //do nothing
      },
      function (e, eventId) {
        if (e) return done(e);

        currentEventId = eventId;

        publisherclient.set('/2_websockets_embedded_sanity/' + testId + '/off-handle/2/1', {
          property1: 'property1',
          property2: 'property2',
          property3: 'property3',
        });

        publisherclient.set('/2_websockets_embedded_sanity/' + testId + '/off-handle/2/2', {
          property1: 'property1',
          property2: 'property2',
          property3: 'property3',
        });

        publisherclient.set('/2_websockets_embedded_sanity/' + testId + '/off-handle/2/2', {
          property1: 'property1',
          property2: 'property2',
          property3: 'property3',
        });

        setTimeout(function () {
          publisherclient.off('/2_websockets_embedded_sanity/*', function (e) {
            test.expect(e.toString()).to.be('Error: handle must be a number');

            publisherclient.off(null, function (e) {
              test.expect(e.toString()).to.be('Error: handle cannot be null');

              publisherclient.off(currentEventId, done);
            });
          });
        }, 1500);
      }
    );
  });

  it('increments a value on a path', function (done) {
    var test_string = test.newid();
    var test_base_url = '/increment/' + testId + '/' + test_string;

    test.commons.async.timesSeries(
      10,
      function (time, timeCB) {
        publisherclient.set(
          test_base_url,
          'counter',
          { increment: 1, noPublish: true },
          function (e) {
            timeCB(e);
          }
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

  it('increments a value on a path, convenience method, listens on path receives event', function (done) {
    var test_string = test.newid();
    var test_base_url = '/increment/convenience/' + testId + '/' + test_string;

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

  it('tests an aggregated search fails, due to unimplemented error', function (callback) {
    listenerclient.get(
      '/searches-and-aggregation/*',
      {
        criteria: {
          'data.group': {
            $eq: 'odd',
          },
        },
        aggregate: [
          {
            $group: {
              _id: '$data.custom',
              total: {
                $sum: '$data.id',
              },
            },
          },
        ],
      },
      function (e) {
        test
          .expect(e.toString())
          .to.be(
            'SystemError: aggregate feature not available for provider on path: /searches-and-aggregation/*'
          );
        callback();
      }
    );
  });

  it('tests a search with a case-insensitive collation fails, due to unimplemented error', function (callback) {
    listenerclient.get(
      '/searches-and-aggregation/*',
      {
        criteria: {
          'data.group': {
            $eq: 'odd',
          },
        },
        options: {
          collation: {
            locale: 'en_US',
            strength: 1,
          },
        },
      },
      function (e) {
        test
          .expect(e.toString())
          .to.be(
            'SystemError: collation feature not available for provider on path: /searches-and-aggregation/*'
          );
        callback();
      }
    );
  });

  it('should publish and receive the published data, the publish response should be lean', function (callback) {
    listenerclient.on(
      '/2_websockets_embedded_sanity/' + testId + '/testpublish/data/event/*',
      {
        event_type: 'set',
        count: 1,
      },
      function (data) {
        test.expect(data).to.eql({
          property1: 'property1',
          property2: 'property2',
          property3: 'property3',
        });
        callback();
      },
      function (e) {
        if (e) return callback(e);
        publisherclient.publish(
          '/2_websockets_embedded_sanity/' + testId + '/testpublish/data/event/1',
          {
            property1: 'property1',
            property2: 'property2',
            property3: 'property3',
          },
          function (e, result) {
            if (e) return callback(e);
            delete result._meta.eventId;
            delete result._meta.sessionId;
            test.expect(result).to.eql({
              _meta: {
                path: '/2_websockets_embedded_sanity/' + testId + '/testpublish/data/event/1',
                type: 'response',
                status: 'ok',
                published: true,
              },
            });
          }
        );
      }
    );
  });
});
