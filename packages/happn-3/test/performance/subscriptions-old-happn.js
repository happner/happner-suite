describe(require('../__fixtures/utils/test_helper').create().testName(__filename, 3), function () {
  var happn = require('happn');
  var happn_client = happn.client;
  var service = happn.service;
  var async = require('async');
  var happnInstance = null;
  var random = require('../__fixtures/utils/random');
  var CONSTANTS = require('../../lib/constants');

  var SUBSCRIPTION_COUNT = 1000;
  var SEARCH_COUNT = 10000;

  var NOSTORE = true;
  var CONSISTENCY = CONSTANTS.CONSISTENCY.TRANSACTIONAL;

  this.timeout(SUBSCRIPTION_COUNT * 1000);

  beforeEach('should initialize the service', function (callback) {
    service.create({}, function (e, happnInst) {
      if (e) return callback(e);
      happnInstance = happnInst;
      callback();
    });
  });

  var client;
  beforeEach('should initialize the client', function (callback) {
    happn_client.create(
      {
        plugin: happn.client_plugins.intra_process,
        context: happnInstance,
      },
      function (e, instance) {
        if (e) return callback(e);
        client = instance;
        callback();
      }
    );
  });

  afterEach('disconnect client', function (done) {
    client.disconnect(done);
  });

  afterEach('disconnect server', function (done) {
    happnInstance.stop(done);
  });

  it(
    'creates ' +
      SUBSCRIPTION_COUNT +
      ' random paths, and randomly selects a wildcard option for each path, subscribes, then loops through the paths and searches ' +
      SEARCH_COUNT +
      ' times in parallel',
    function (done) {
      var subscriptions = [];

      //eslint-disable-next-line no-console
      console.log('building subscriptions...');

      var randomPaths = random.randomPaths({
        count: SUBSCRIPTION_COUNT,
      });

      randomPaths.forEach(function (path) {
        var possibleSubscriptions = random.getWildcardPermutations(path);

        var subscriptionPath =
          possibleSubscriptions[random.integer(0, possibleSubscriptions.length - 1)];

        subscriptions.push(subscriptionPath);
      });

      var searchPaths = [];

      for (var i = 0; i < SEARCH_COUNT; i++)
        searchPaths.push(randomPaths[random.integer(0, randomPaths.length - 1)]);

      //eslint-disable-next-line no-console
      console.log('built subscriptions...');

      var startedSubscribing = Date.now();
      var setResults = {
        counters: {},
      };

      var eventsCount = 0;
      var startedSearching;

      var handleOn = function (data, meta) {
        if (!setResults[meta.path]) setResults[meta.path] = [];
        setResults[meta.path].push(data);
        setResults.counters[data.counter] = true;
        eventsCount++;

        //eslint-disable-next-line no-console
        console.log('event path: ' + meta.path);
        //eslint-disable-next-line no-console
        console.log('match path: ' + this.path);

        if (eventsCount === 10000) {
          //eslint-disable-next-line no-console
          console.log(JSON.stringify(setResults, null, 2));
          //eslint-disable-next-line no-console
          console.log(JSON.stringify(subscriptions, null, 2));
          //eslint-disable-next-line no-console
          console.log(
            'handled ' +
              eventsCount +
              ' events in ' +
              ((Date.now() - startedSearching) / 1000).toString() +
              ' seconds'
          );
        }
      };

      async.each(
        subscriptions,
        function (subscription, subscriptionCB) {
          //eslint-disable-next-line no-console
          console.log('subscribed:::', subscription);
          client.on(
            subscription,
            handleOn.bind({
              path: subscription,
            }),
            subscriptionCB
          );
        },
        function () {
          //eslint-disable-next-line no-console
          console.log(
            'did ' +
              SUBSCRIPTION_COUNT +
              ' subscriptions in ' +
              ((Date.now() - startedSubscribing) / 1000).toString() +
              ' seconds'
          );
          startedSearching = Date.now();
          var counter = 0;
          async.each(
            searchPaths,
            function (randomPath, randomPathCB) {
              client.set(
                randomPath,
                {
                  counter: counter++,
                },
                {
                  noStore: NOSTORE,
                  consistency: CONSISTENCY,
                  onPublished: function () {},
                },
                randomPathCB
              );
            },
            function (e) {
              if (e) return done(e);
              //eslint-disable-next-line no-console
              console.log(
                'handled ' +
                  SEARCH_COUNT +
                  ' parallel sets in ' +
                  ((Date.now() - startedSearching) / 1000).toString() +
                  ' seconds'
              );
              //eslint-disable-next-line no-console
              console.log('handled ' + eventsCount + 'events in total');
              done();
            }
          );
        }
      );
    }
  );

  it(
    'creates ' +
      SUBSCRIPTION_COUNT +
      ' random paths, and randomly selects a wildcard option for each path, subscribes, then loops through the paths and searches ' +
      SEARCH_COUNT +
      ' times in series',
    function (done) {
      var subscriptions = [];

      //eslint-disable-next-line no-console
      console.log('building subscriptions...');

      var randomPaths = random.randomPaths({
        count: SUBSCRIPTION_COUNT,
      });

      randomPaths.forEach(function (path) {
        var possibleSubscriptions = random.getWildcardPermutations(path);

        var subscriptionPath =
          possibleSubscriptions[random.integer(0, possibleSubscriptions.length - 1)];

        subscriptions.push(subscriptionPath);
      });

      var searchPaths = [];

      for (var i = 0; i < SEARCH_COUNT; i++)
        searchPaths.push(randomPaths[random.integer(0, randomPaths.length - 1)]);

      //eslint-disable-next-line no-console
      console.log('built subscriptions...');

      var startedSubscribing = Date.now();
      var setResults = {
        counters: {},
      };

      var eventsCount = 0;
      var startedSearching;

      var handleOn = function (data, meta) {
        if (!setResults[meta.path]) setResults[meta.path] = [];
        setResults[meta.path].push(data);
        setResults.counters[data.counter] = true;
        eventsCount++;
        if (eventsCount === SEARCH_COUNT) {
          //eslint-disable-next-line no-console
          console.log(JSON.stringify(setResults, null, 2));
          //eslint-disable-next-line no-console
          console.log(JSON.stringify(subscriptions, null, 2));
          //eslint-disable-next-line no-console
          console.log(
            'handled ' +
              SEARCH_COUNT +
              ' events in ' +
              ((Date.now() - startedSearching) / 1000).toString() +
              ' seconds'
          );
        }
      };

      async.eachSeries(
        subscriptions,
        function (subscription, subscriptionCB) {
          client.on(
            subscription,
            handleOn.bind({
              path: subscription,
            }),
            subscriptionCB
          );
        },
        function () {
          //eslint-disable-next-line no-console
          console.log(
            'did ' +
              SUBSCRIPTION_COUNT +
              ' subscriptions in ' +
              ((Date.now() - startedSubscribing) / 1000).toString() +
              ' seconds'
          );
          startedSearching = Date.now();
          var counter = 0;
          async.each(
            searchPaths,
            function (randomPath, randomPathCB) {
              client.set(
                randomPath,
                {
                  counter: counter++,
                },
                {
                  noStore: NOSTORE,
                  consistency: CONSISTENCY,
                },
                randomPathCB
              );
            },
            function (e) {
              if (e) return done(e);
              //eslint-disable-next-line no-console
              console.log(
                'handled ' +
                  SEARCH_COUNT +
                  ' consecutive sets in ' +
                  ((Date.now() - startedSearching) / 1000).toString() +
                  ' seconds'
              );
              done();
            }
          );
        }
      );
    }
  );

  it(
    'creates ' +
      SUBSCRIPTION_COUNT +
      ' random paths, subscribes to each path, then loops through the paths and searches ' +
      SEARCH_COUNT +
      ' times in parallel',
    function (done) {
      var subscriptions = [];

      //eslint-disable-next-line no-console
      console.log('building subscriptions...');

      var randomPaths = random.randomPaths({
        count: SUBSCRIPTION_COUNT,
      });

      randomPaths.forEach(function (path) {
        subscriptions.push(path);
      });

      var searchPaths = [];

      for (var i = 0; i < SEARCH_COUNT; i++)
        searchPaths.push(randomPaths[random.integer(0, randomPaths.length - 1)]);

      //eslint-disable-next-line no-console
      console.log('built subscriptions...');

      var startedSubscribing = Date.now();
      var setResults = {
        counters: {},
      };

      var eventsCount = 0;
      var startedSearching;

      var handleOn = function (data, meta) {
        if (!setResults[meta.path]) setResults[meta.path] = [];
        setResults[meta.path].push(data);
        setResults.counters[data.counter] = true;
        eventsCount++;

        if (eventsCount % 1000 === 0) {
          //eslint-disable-next-line no-console
          console.log(JSON.stringify(setResults, null, 2));
          //eslint-disable-next-line no-console
          console.log(JSON.stringify(subscriptions, null, 2));
          //eslint-disable-next-line no-console
          console.log(
            'handled ' +
              eventsCount +
              ' events in ' +
              ((Date.now() - startedSearching) / 1000).toString() +
              ' seconds'
          );
        }
      };

      async.each(
        subscriptions,
        function (subscription, subscriptionCB) {
          client.on(
            subscription,
            handleOn.bind({
              path: subscription,
            }),
            subscriptionCB
          );
        },
        function () {
          //eslint-disable-next-line no-console
          console.log(
            'did ' +
              SUBSCRIPTION_COUNT +
              ' subscriptions in ' +
              ((Date.now() - startedSubscribing) / 1000).toString() +
              ' seconds'
          );
          startedSearching = Date.now();
          var counter = 0;
          async.each(
            searchPaths,
            function (randomPath, randomPathCB) {
              client.set(
                randomPath,
                {
                  counter: counter++,
                },
                {
                  noStore: NOSTORE,
                  consistency: CONSISTENCY,
                },
                randomPathCB
              );
            },
            function (e) {
              if (e) return done(e);
              //eslint-disable-next-line no-console
              console.log(
                'handled ' +
                  SEARCH_COUNT +
                  ' parallel sets in ' +
                  ((Date.now() - startedSearching) / 1000).toString() +
                  ' seconds'
              );
              done();
            }
          );
        }
      );
    }
  );

  it(
    'creates ' +
      SUBSCRIPTION_COUNT +
      ' random paths, subscribes to each path, then loops through the paths and searches ' +
      SEARCH_COUNT +
      ' times in series',
    function (done) {
      var subscriptions = [];

      //eslint-disable-next-line no-console
      console.log('building subscriptions...');

      var randomPaths = random.randomPaths({
        count: SUBSCRIPTION_COUNT,
      });

      randomPaths.forEach(function (path) {
        subscriptions.push(path);
      });

      var searchPaths = [];

      for (var i = 0; i < SEARCH_COUNT; i++)
        searchPaths.push(randomPaths[random.integer(0, randomPaths.length - 1)]);

      //eslint-disable-next-line no-console
      console.log('built subscriptions...');

      var startedSubscribing = Date.now();
      var setResults = {
        counters: {},
      };

      var eventsCount = 0;
      var startedSearching;

      var handleOn = function (data, meta) {
        if (!setResults[meta.path]) setResults[meta.path] = [];
        setResults[meta.path].push(data);
        setResults.counters[data.counter] = true;
        eventsCount++;
        if (eventsCount === SEARCH_COUNT) {
          //eslint-disable-next-line no-console
          console.log(JSON.stringify(setResults, null, 2));
          //eslint-disable-next-line no-console
          console.log(JSON.stringify(subscriptions, null, 2));
          //eslint-disable-next-line no-console
          console.log(
            'handled ' +
              SEARCH_COUNT +
              ' events in ' +
              ((Date.now() - startedSearching) / 1000).toString() +
              ' seconds'
          );
          done();
        }
      };

      async.eachSeries(
        subscriptions,
        function (subscription, subscriptionCB) {
          client.on(
            subscription,
            handleOn.bind({
              path: subscription,
            }),
            subscriptionCB
          );
        },
        function () {
          //eslint-disable-next-line no-console
          console.log(
            'did ' +
              SUBSCRIPTION_COUNT +
              ' subscriptions in ' +
              ((Date.now() - startedSubscribing) / 1000).toString() +
              ' seconds'
          );
          startedSearching = Date.now();
          var counter = 0;
          async.each(
            searchPaths,
            function (randomPath, randomPathCB) {
              client.set(
                randomPath,
                {
                  counter: counter++,
                },
                {
                  noStore: NOSTORE,
                  consistency: CONSISTENCY,
                },
                randomPathCB
              );
            },
            function (e) {
              if (e) return done(e);
              //eslint-disable-next-line no-console
              console.log(
                'handled ' +
                  SEARCH_COUNT +
                  ' consecutive sets in ' +
                  ((Date.now() - startedSearching) / 1000).toString() +
                  ' seconds'
              );
            }
          );
        }
      );
    }
  );

  it(
    'creates ' +
      SUBSCRIPTION_COUNT +
      ' random paths, subscribes to each path, then loops through the paths and searches ' +
      SEARCH_COUNT +
      ' times in series, noPublish',
    function (done) {
      var subscriptions = [];

      //eslint-disable-next-line no-console
      console.log('building subscriptions...');

      var randomPaths = random.randomPaths({
        count: SUBSCRIPTION_COUNT,
      });

      randomPaths.forEach(function (path) {
        subscriptions.push(path);
      });

      var searchPaths = [];

      for (var i = 0; i < SEARCH_COUNT; i++)
        searchPaths.push(randomPaths[random.integer(0, randomPaths.length - 1)]);

      //eslint-disable-next-line no-console
      console.log('built subscriptions...');

      var startedSubscribing = Date.now();
      var setResults = {
        counters: {},
      };

      var eventsCount = 0;
      var startedSearching;

      var handleOn = function (data, meta) {
        if (!setResults[meta.path]) setResults[meta.path] = [];
        setResults[meta.path].push(data);
        setResults.counters[data.counter] = true;
        eventsCount++;
        if (eventsCount === SEARCH_COUNT) {
          //eslint-disable-next-line no-console
          console.log(JSON.stringify(setResults, null, 2));
          //eslint-disable-next-line no-console
          console.log(JSON.stringify(subscriptions, null, 2));
          //eslint-disable-next-line no-console
          console.log(
            'handled ' +
              SEARCH_COUNT +
              ' events in ' +
              ((Date.now() - startedSearching) / 1000).toString() +
              ' seconds'
          );
        }
      };

      async.eachSeries(
        subscriptions,
        function (subscription, subscriptionCB) {
          client.on(
            subscription,
            handleOn.bind({
              path: subscription,
            }),
            subscriptionCB
          );
        },
        function () {
          //eslint-disable-next-line no-console
          console.log(
            'did ' +
              SUBSCRIPTION_COUNT +
              ' subscriptions in ' +
              ((Date.now() - startedSubscribing) / 1000).toString() +
              ' seconds'
          );
          startedSearching = Date.now();
          var counter = 0;
          async.each(
            searchPaths,
            function (randomPath, randomPathCB) {
              client.set(
                randomPath,
                {
                  counter: counter++,
                },
                {
                  noPublish: true,
                },
                randomPathCB
              );
            },
            function (e) {
              if (e) return done(e);
              //eslint-disable-next-line no-console
              console.log(
                'handled ' +
                  SEARCH_COUNT +
                  ' consecutive sets in ' +
                  ((Date.now() - startedSearching) / 1000).toString() +
                  ' seconds'
              );
              done();
            }
          );
        }
      );
    }
  );
});
