describe(
  require('../../__fixtures/utils/test_helper').create().testName(__filename, 3),
  function () {
    var expect = require('expect.js');
    var happn = require('../../../lib/index');
    var service = happn.service;
    var happn_client = happn.client;
    var async = require('async');

    var mode = 'embedded';
    var happnInstance = null;
    var test_id;

    this.timeout(120000);

    before('should initialize the service', function (callback) {
      test_id = Date.now() + '_' + require('shortid').generate();

      try {
        service.create(
          {
            services: {
              transport: {
                config: {
                  mode: 'https',
                },
              },
            },
          },
          function (e, happnInst) {
            if (e) return callback(e);

            happnInstance = happnInst;
            callback();
          }
        );
      } catch (e) {
        callback(e);
      }
    });

    var publisherclient;
    var listenerclient;

    after(function (done) {
      publisherclient.disconnect({ reconnect: false });
      listenerclient.disconnect({ reconnect: false });

      happnInstance.stop(done);
    });

    before('should initialize the clients', function (callback) {
      try {
        happn_client.create(
          {
            config: {
              protocol: 'https',
              allowSelfSignedCerts: true,
            },
          },
          function (e, instance) {
            if (e) return callback(e);

            publisherclient = instance;
            happn_client.create(
              {
                config: {
                  protocol: 'https',
                  allowSelfSignedCerts: true,
                },
              },
              function (e, instance) {
                if (e) return callback(e);
                listenerclient = instance;
                callback();
              }
            );
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
          '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/event/*',
          {
            event_type: 'set',
            count: 1,
          },
          function () {
            expect(
              listenerclient.state.events[
                '/SET@/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/event/*'
              ]
            ).to.be(undefined);
            callback();
          },
          function (e) {
            if (!e) {
              expect(
                listenerclient.state.events[
                  '/SET@/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/event/*'
                ].length
              ).to.be(1);

              //then make the change
              publisherclient.set(
                '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/event/blah',
                {
                  property1: 'property1',
                  property2: 'property2',
                  property3: 'property3',
                },
                null,
                function () {
                  //console.log('put happened - listening for result');
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
      var test_path_end = require('shortid').generate();
      publisherclient.get(
        '1_eventemitter_embedded_sanity/' + test_id + '/unfound/exact/' + test_path_end,
        null,
        function (e, results) {
          ////////////console.log('new data results');

          expect(e).to.be(null);
          expect(results).to.be(null);

          callback(e);
        }
      );
    });

    it('the publisher should set new data', function (callback) {
      try {
        var test_path_end = require('shortid').generate();

        publisherclient.set(
          '2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/' + test_path_end,
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
              '2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/' + test_path_end,
              null,
              function (e, results) {
                expect(results.property1 === 'property1').to.be(true);
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
        async.times(
          timesCount,
          function (n, timesCallback) {
            var test_random_path2 = require('shortid').generate();

            publisherclient.set(
              '/2_websockets_embedded_sanity/' + test_id + '/set_multiple/' + test_random_path2,
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
              '/2_websockets_embedded_sanity/' + test_id + '/set_multiple/*',
              null,
              function (e, results) {
                if (e) return callback(e);

                expect(results.length).to.be(timesCount);
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
        var test_path_end = require('shortid').generate();

        publisherclient.set(
          '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/merge/' + test_path_end,
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
                test_id +
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
                    test_id +
                    '/testsubscribe/data/merge/' +
                    test_path_end,
                  null,
                  function (e, results) {
                    if (e) return callback(e);

                    expect(results.property4).to.be('property4');
                    expect(results.property1).to.be('property1');

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
            expect(message).to.eql(firstTime);
            done();
          }
        },
        function (err) {
          expect(err).to.not.be.ok();
          publisherclient.set('setTest/object', object, {}, function (err) {
            expect(err).to.not.be.ok();
            publisherclient.set('setTest/object', object, {}, function (err) {
              expect(err).to.not.be.ok();
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
          expect(message).to.eql(object);
          if (firstTime) {
            firstTime = false;
            return;
          }
          done();
        },
        function (err) {
          expect(err).to.not.be.ok();
          publisherclient.set(
            'mergeTest/object',
            object,
            {
              merge: true,
            },
            function (err) {
              expect(err).to.not.be.ok();
              publisherclient.set(
                'mergeTest/object',
                object,
                {
                  merge: true,
                },
                function (err) {
                  expect(err).to.not.be.ok();
                }
              );
            }
          );
        }
      );
    });

    it('should search for a complex object', function (callback) {
      var test_path_end = require('shortid').generate();

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
        fields: {
          data: 1,
        },
        sort: {
          field1: 1,
        },
        limit: 1,
      };

      var criteria2 = null;

      var options2 = {
        fields: null,
        sort: {
          field1: 1,
        },
        limit: 2,
      };

      publisherclient.set(
        '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/complex/' + test_path_end,
        complex_obj,
        null,
        function (e) {
          expect(e == null).to.be(true);
          publisherclient.set(
            '/2_websockets_embedded_sanity/' +
              test_id +
              '/testsubscribe/data/complex/' +
              test_path_end +
              '/1',
            complex_obj,
            null,
            function (e) {
              expect(e == null).to.be(true);

              publisherclient.get(
                '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/complex*',
                {
                  criteria: criteria1,
                  options: options1,
                },
                function (e, search_result) {
                  ////////////console.log([e, search_result]);

                  expect(e == null).to.be(true);
                  expect(search_result.length === 1).to.be(true);

                  publisherclient.get(
                    '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/complex*',
                    {
                      criteria: criteria2,
                      options: options2,
                    },
                    function (e, search_result) {
                      expect(e == null).to.be(true);
                      expect(search_result.length === 2).to.be(true);

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
          '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/delete_me',
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
              '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/delete_me',
              {
                noPublish: true,
              },
              function (e, result) {
                expect(e).to.be(null);
                expect(result._meta.status).to.be('ok');

                ////////////////////console.log('DELETE RESULT');
                ////////////////////console.log(result);

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
        var test_path_end = require('shortid').generate();

        publisherclient.set(
          '2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/' + test_path_end,
          {
            property1: 'property1',
            property2: 'property2',
            property3: 'property3',
          },
          {
            noPublish: true,
          },
          function (e, insertResult) {
            expect(e).to.be(null);

            publisherclient.set(
              '2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/' + test_path_end,
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
                expect(e).to.be(null);
                expect(updateResult._meta.id === insertResult._meta.id).to.be(true);
                callback();
              }
            );
          }
        );
      } catch (e) {
        callback(e);
      }
    });
    // We set the listener client to listen for a PUT event according to a path, then we set a value with the publisher client.
    it('the listener should pick up a single published event', function (callback) {
      try {
        //first listen for the change
        listenerclient.on(
          '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/event',
          {
            event_type: 'set',
            count: 1,
          },
          function () {
            expect(
              listenerclient.state.events[
                '/SET@/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/event'
              ]
            ).to.be(undefined);
            callback();
          },
          function (e) {
            //////////////////console.log('ON HAS HAPPENED: ' + e);

            if (!e) {
              expect(
                listenerclient.state.events[
                  '/SET@/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/event'
                ].length
              ).to.be(1);
              //////////////////console.log('on subscribed, about to publish');

              //then make the change
              publisherclient.set(
                '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/event',
                {
                  property1: 'property1',
                  property2: 'property2',
                  property3: 'property3',
                },
                null,
                function () {
                  ////////////////////////////console.log('put happened - listening for result');
                }
              );
            } else callback(e);
          }
        );
      } catch (e) {
        callback(e);
      }
    });

    //We are testing setting data at a specific path

    it('the publisher should set new data ', function (callback) {
      try {
        var test_path_end = require('shortid').generate();

        publisherclient.set(
          '2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/' + test_path_end,
          {
            property1: 'property1',
            property2: 'property2',
            property3: 'property3',
          },
          null,
          function (e) {
            if (!e) {
              publisherclient.get(
                '2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/' + test_path_end,
                null,
                function (e, results) {
                  ////////////////////////console.log('new data results');
                  ////////////////////////console.log(results);
                  expect(results.property1 === 'property1').to.be(true);

                  if (mode !== 'embedded')
                    expect(results.payload[0].created === results.payload[0].modified).to.be(true);

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
        var test_path_end = require('shortid').generate();

        publisherclient.set(
          '2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/' + test_path_end,
          {
            property1: 'property1',
            property2: 'property2',
            property3: 'property3',
          },
          null,
          function (e, insertResult) {
            expect(e == null).to.be(true);

            publisherclient.set(
              '2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/' + test_path_end,
              {
                property1: 'property1',
                property2: 'property2',
                property3: 'property3',
                property4: 'property4',
              },
              null,
              function (e, updateResult) {
                expect(e == null).to.be(true);
                expect(updateResult._meta._id === insertResult._meta._id).to.be(true);
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
          '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/event',
          {
            event_type: 'set',
            count: 1,
          },
          function () {
            expect(
              listenerclient.state.events[
                '/SET@/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/event'
              ]
            ).to.be(undefined);
            callback();
          },
          function (e) {
            if (!e) {
              expect(
                listenerclient.state.events[
                  '/SET@/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/event'
                ].length
              ).to.be(1);

              ////////////////////////////console.log('on subscribed, about to publish');

              //then make the change
              publisherclient.set(
                '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/event',
                {
                  property1: 'property1',
                  property2: 'property2',
                  property3: 'property3',
                },
                null,
                function () {
                  ////////////////////////////console.log('put happened - listening for result');
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
      var test_path_end = require('shortid').generate();

      publisherclient.set(
        '2_websockets_embedded_sanity/' + test_id + '/testwildcard/' + test_path_end,
        {
          property1: 'property1',
          property2: 'property2',
          property3: 'property3',
        },
        null,
        function (e) {
          expect(e == null).to.be(true);
          publisherclient.set(
            '2_websockets_embedded_sanity/' + test_id + '/testwildcard/' + test_path_end + '/1',
            {
              property1: 'property1',
              property2: 'property2',
              property3: 'property3',
            },
            null,
            function (e) {
              expect(e == null).to.be(true);

              publisherclient.get(
                '2_websockets_embedded_sanity/' + test_id + '/testwildcard/' + test_path_end + '*',
                null,
                function (e, results) {
                  if (e) return callback();

                  expect(results.length === 2).to.be(true);
                  callback(e);
                }
              );
            }
          );
        }
      );
    });

    it('should get paths', function (callback) {
      var test_path_end = require('shortid').generate();

      publisherclient.set(
        '2_websockets_embedded_sanity/' + test_id + '/testwildcard/' + test_path_end,
        {
          property1: 'property1',
          property2: 'property2',
          property3: 'property3',
        },
        null,
        function (e) {
          expect(e == null).to.be(true);
          publisherclient.set(
            '2_websockets_embedded_sanity/' + test_id + '/testwildcard/' + test_path_end + '/1',
            {
              property1: 'property1',
              property2: 'property2',
              property3: 'property3',
            },
            null,
            function (e) {
              expect(e == null).to.be(true);

              publisherclient.getPaths(
                '2_websockets_embedded_sanity/' + test_id + '/testwildcard/' + test_path_end + '*',
                function (e, results) {
                  expect(results.length === 2).to.be(true);
                  callback(e);
                }
              );
            }
          );
        }
      );
    });

    it('the listener should pick up a single delete event', function (callback) {
      //We put the data we want to delete into the database
      publisherclient.set(
        '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/delete_me',
        {
          property1: 'property1',
          property2: 'property2',
          property3: 'property3',
        },
        null,
        function () {
          //////////////////console.log('did delete set');
          //path, event_type, count, handler, done
          //We listen for the DELETE event
          listenerclient.on(
            '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/delete_me',
            {
              event_type: 'remove',
              count: 1,
            },
            function (eventData) {
              ////console.log('on count 1 delete ');
              //////////////////console.log(message);

              //we are looking at the event internals on the listener to ensure our event management is working - because we are only listening for 1
              //instance of this event - the event listener should have been removed
              ////console.log('listenerclient.events');
              ////console.log(listenerclient.events);
              expect(
                listenerclient.state.events[
                  '/REMOVE@/2_websockets_embedded_sanity/' +
                    test_id +
                    '/testsubscribe/data/delete_me'
                ]
              ).to.be(undefined);

              ////console.log(eventData);

              //we needed to have removed a single item
              expect(eventData.payload.removed).to.be(1);

              ////////////////////////////console.log(message);

              callback();
            },
            function (e) {
              //console.log(e);

              ////////////console.log('ON HAS HAPPENED: ' + e);

              if (!e) return callback(e);

              ////console.log('listenerclient.events, pre');
              ////console.log(listenerclient.events);
              expect(
                listenerclient.state.events[
                  '/REMOVE@/2_websockets_embedded_sanity/' +
                    test_id +
                    '/testsubscribe/data/delete_me'
                ].length
              ).to.be(1);

              //////////////////console.log('subscribed, about to delete');

              //We perform the actual delete
              publisherclient.remove(
                '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/delete_me',
                null,
                function () {
                  //////////////////console.log('REMOVE HAPPENED!!!');
                  //////////////////console.log(e);
                  //////////////////console.log(result);
                  ////////////////////////////console.log('put happened - listening for result');
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
        '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/on_off_test',
        {
          event_type: 'set',
          count: 0,
        },
        function () {
          //we detach all listeners from the path here
          ////console.log('ABOUT OFF PATH');
          listenerclient.offPath(
            '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/on_off_test',
            function (e) {
              if (e) return callback(new Error(e));

              listenerclient.on(
                '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/on_off_test',
                {
                  event_type: 'set',
                  count: 0,
                },
                function () {
                  ////console.log('ON RAN');
                  ////console.log(message);

                  listenerclient.off(currentListenerId, function (e) {
                    if (e) return callback(new Error(e));
                    else return callback();
                  });
                },
                function (e, listenerId) {
                  if (e) return callback(new Error(e));

                  currentListenerId = listenerId;

                  publisherclient.set(
                    '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/on_off_test',
                    {
                      property1: 'property1',
                      property2: 'property2',
                      property3: 'property3',
                    },
                    {},
                    function (e) {
                      if (e) return callback(new Error(e));

                      ////console.log('DID ON SET');
                      ////console.log(setresult);
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
            '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/on_off_test',
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
              '/REMOVE@/2_websockets_embedded_sanity/' +
                test_id +
                '/testsubscribe/data/catch_all' ||
            meta.action ===
              '/SET@/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/catch_all'
          )
            caughtCount++;

          if (caughtCount === 2) callback();
        },
        function (e) {
          if (e) return callback(e);

          publisherclient.set(
            '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/catch_all',
            {
              property1: 'property1',
              property2: 'property2',
              property3: 'property3',
            },
            null,
            function () {
              publisherclient.remove(
                '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/catch_all',
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

      var onHappened = false;

      listenerclient.onAll(
        function () {
          onHappened = true;
          callback(new Error('this wasnt meant to happen'));
        },
        function (e) {
          if (e) return callback(e);

          listenerclient.on(
            '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/off_all_test',
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
                  '/2_websockets_embedded_sanity/' + test_id + '/testsubscribe/data/off_all_test',
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

    it('fails to connect on http and the client is destroyed', function (done) {
      happn_client.create(
        {
          config: {
            protocol: 'http',
          },
          testMode: true,
          connectTimeout: 1000,
        },
        function (e) {
          expect(e).to.be.an('object');
          expect(happn_client.lastClient).to.be.an('object');
          expect(happn_client.lastClient).to.have.property('options');
          expect(happn_client.lastClient.socket).to.be(null);
          done();
        }
      );
    });
  }
);
