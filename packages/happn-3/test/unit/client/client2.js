describe(
  require('../../__fixtures/utils/test_helper').create().testName(__filename, 3),
  function () {
    this.timeout(5000);

    var expect = require('expect.js');
    var HappnClient = require('../../../lib/client');
    var Constants = require('../../../lib/constants');

    function mockHappnClient(log, state, session, serverInfo, socket, clientOptions) {
      var happnClient = new HappnClient();

      happnClient.__initializeEvents();
      happnClient.__initializeState();
      happnClient.log = log || {
        error: function () {},
      };

      happnClient.status = state != null ? state : Constants.CLIENT_STATE.ACTIVE;
      happnClient.session = session || {
        id: 'test',
      };
      happnClient.serverInfo = serverInfo || {};

      happnClient.socket = socket || {
        removeAllListeners: function () {},
        write: function () {},
        on: function () {},
        destroy: function () {},
        end: function () {},
      };

      happnClient.options = clientOptions || {
        callTimeout: 5000,
      };

      return happnClient;
    }

    it('tests that the initialize function calls authenticate and login if there is a socket', function (done) {
      var happnClient = mockHappnClient();
      happnClient.socket = true;
      happnClient.login = function (callback) {
        return callback(null, 'done');
      };
      happnClient.initialize(function (err, results) {
        expect(err).to.be(null);
        expect(results.status).to.equal(Constants.CLIENT_STATE.ACTIVE);
        expect(results.session).to.be(null);
        done();
      });
    });

    it('tests the __prepareSecurityOptions function', function (done) {
      var happnClient = mockHappnClient();
      var options = {
        keyPair: {
          publicKey: 123,
          privateKey: 456,
        },
      };
      happnClient.__prepareSecurityOptions(options);
      expect(options.publicKey).to.eql(123);
      expect(options.privateKey).to.eql(456);
      done();
    });

    it('tests the __prepareSocketOptions function, defaults', function (done) {
      var happnClient = mockHappnClient();
      var opts = {};
      happnClient.__prepareSocketOptions(opts);
      var expectedOpts = {
        socket: {
          reconnect: {
            retries: Infinity,
            max: 180000,
          },
          timeout: 30000,
          strategy: 'disconnect,online',
          pingTimeout: 45e3,
        },
      };
      expect(opts).to.eql(expectedOpts);
      done();
    });

    it('tests the __prepareSocketOptions function', function (done) {
      var happnClient = mockHappnClient();
      var opts = {
        connectTimeout: 40e3,
        socket: {
          reconnect: {
            retries: 10,
            max: 120e3,
          },
          strategy: 'disconnect',
          pingTimeout: 30e3,
        },
      };
      happnClient.__prepareSocketOptions(opts);
      var expectedOpts = {
        connectTimeout: 40e3,
        socket: {
          reconnect: {
            retries: 10,
            max: 120e3,
          },
          timeout: 40e3,
          strategy: 'disconnect',
          pingTimeout: 30e3,
        },
      };
      expect(opts).to.eql(expectedOpts);
      done();
    });

    it('tests the __prepareConnectionOptions function.', function (done) {
      var happnClient = mockHappnClient();

      const opts = happnClient.__prepareConnectionOptions({}, {});
      expect(opts).to.eql({
        host: '127.0.0.1',
        port: 55000,
        protocol: 'http',
        url: 'http://127.0.0.1:55000',
      });
      done();
    });

    it('tests the __prepareConnectionOptions function with defaults.', function (done) {
      var happnClient = mockHappnClient();
      var defaults = {
        protocol: 'ssh',
        allowSelfSignedCerts: true,
        username: 'Janco',
        password: 'private',
      };
      const opts = happnClient.__prepareConnectionOptions({}, defaults);
      expect(opts).to.eql({
        allowSelfSignedCerts: true,
        username: 'Janco',
        password: 'private',
        host: '127.0.0.1',
        port: 55000,
        protocol: 'ssh',
        url: 'ssh://127.0.0.1:55000',
      });
      done();
    });

    it('tests the __prepareInstanceOptions function with blank options', function (done) {
      var happnClient = mockHappnClient();
      happnClient.__prepareInstanceOptions({});
      expect(happnClient.options).to.eql({
        callTimeout: 60000,
        defaultVariableDepth: 5,
        host: '127.0.0.1',
        port: 55000,
        protocol: 'http',
        url: 'http://127.0.0.1:55000',
        socket: {
          reconnect: {
            retries: Infinity,
            max: 180000,
          },
          timeout: 30000,
          strategy: 'disconnect,online',
          pingTimeout: 45e3,
        },
        info: {
          _browser: false,
        },
        loginRetry: 4,
        loginRetryInterval: 5000,
        loginTimeout: 60000,
      });
      done();
    });

    it('tests the __prepareInstanceOptions function with mostly blank options, including keyPair(security) object', function (done) {
      var happnClient = mockHappnClient();
      happnClient.__prepareInstanceOptions({
        keyPair: {
          publicKey: 123,
          privateKey: 456,
        },
      });
      expect(happnClient.options).to.eql({
        keyPair: {
          publicKey: 123,
          privateKey: 456,
        },
        callTimeout: 60000,
        defaultVariableDepth: 5,
        host: '127.0.0.1',
        port: 55000,
        protocol: 'http',
        url: 'http://127.0.0.1:55000',
        publicKey: 123,
        privateKey: 456,
        socket: {
          reconnect: {
            retries: Infinity,
            max: 180000,
          },
          timeout: 30000,
          strategy: 'disconnect,online',
          pingTimeout: 45e3,
        },
        info: {
          _browser: false,
        },
        loginRetry: 4,
        loginRetryInterval: 5000,
        loginTimeout: 60000,
      });
      done();
    });

    it('tests the __updateOptions function', function (done) {
      var happnClient = mockHappnClient();
      var possibility = {
        url: '1.0.0.127',
        host: 'local',
        port: 8000,
        protocol: 'http',
        allowSelfSignedCerts: false,
        username: 'Janco',
        password: 'Private',
        publicKey: 123,
        privateKey: 456,
        token: 'None',
        someRubbish: 'rubbish',
        moreRubbish: 'rubbish',
      };
      var possibility2 = {
        callTimeout: 5000,
        url: '1.0.0.127',
        host: 'local',
        port: 8000,
        protocol: 'http',
        allowSelfSignedCerts: false,
        username: 'Janco',
        password: 'Private',
        publicKey: 123,
        privateKey: 456,
        token: 'None',
      };

      happnClient.__updateOptions(possibility);
      expect(happnClient.options).to.eql(possibility2);
      done();
    });

    xit('tests the __initializeConnectivity function.', function (done) {
      var happnClient = mockHappnClient();
      var opts = happnClient.__prepareConnectionOptions({}, {});
      //TODO Mock socket function?
      happnClient.__initializeConnectivity(opts, function (err, data) {
        //eslint-disable-next-line no-console
        console.log(data);
        //eslint-disable-next-line no-console
        console.log(err);
        //TODO::: Can't Timing out
        done();
      });
    });

    xit('tests the __connectSocket function.', function (done) {
      var happnClient = mockHappnClient();

      happnClient.__connectSocket(function () {
        //TODO::: This test passes, but causes the client and test framework to hang
        done();
      });
    });

    it('tests the __initializeState function', function (done) {
      var happnClient = mockHappnClient();
      happnClient.__initializeState();
      expect(happnClient.state.events).to.eql({});

      expect(happnClient.state.requestEvents).to.eql({});
      expect(happnClient.state.currentEventId).to.eql(0);
      expect(happnClient.state.currentListenerId).to.eql(0);
      expect(happnClient.state.errors).to.eql([]);
      expect(happnClient.state.clientType).to.eql('socket');
      expect(happnClient.state.systemMessageHandlers).to.eql([]);
      expect(happnClient.status).to.eql(Constants.CLIENT_STATE.UNINITIALIZED);
      expect(happnClient.state.ackHandlers).to.eql({});
      expect(happnClient.state.eventHandlers).to.eql({});
      done();
    });

    it("tests the __initializeEvents function creates functions for 'onEvent', 'offEvent' and 'emit'", function (done) {
      var happnClient = mockHappnClient();
      happnClient.__initializeEvents();
      expect(typeof happnClient.onEvent).to.eql('function');
      expect(typeof happnClient.offEvent).to.eql('function');
      expect(typeof happnClient.emit).to.eql('function');
      done();
    });

    it("tests the 'onEvent' function created by __initializeEvents throws an error if no event_name is supplied", function (done) {
      var happnClient = mockHappnClient();
      happnClient.__initializeEvents();
      try {
        happnClient.onEvent();
      } catch (e) {
        expect(e.toString()).to.eql('Error: event name cannot be blank or null');
        done();
      }
    });

    it("tests the 'onEvent' function created by __initializeEvents throws an error if event_handler isn't a function", function (done) {
      var happnClient = mockHappnClient();
      happnClient.__initializeEvents();
      try {
        happnClient.onEvent('MyEvent', 'MyHandler');
      } catch (e) {
        expect(e.toString()).to.eql('Error: event handler must be a function');
        done();
      }
    });

    it("tests the 'onEvent' function created by __initializeEvents returns the correct information", function (done) {
      var happnClient = mockHappnClient();
      happnClient.__initializeEvents();
      expect(
        happnClient.onEvent('MyEvent', function (x) {
          //eslint-disable-next-line no-console
          console.log(x);
        })
      ).to.eql('MyEvent|0');
      expect(
        happnClient.onEvent('MyEvent', function (x) {
          //eslint-disable-next-line no-console
          console.log(typeof x);
        })
      ).to.eql('MyEvent|1');
      expect(
        happnClient.onEvent('MyNewEvent', function (x) {
          //eslint-disable-next-line no-console
          console.log(typeof x);
        })
      ).to.eql('MyNewEvent|0');
      expect(typeof happnClient.state.eventHandlers['MyEvent'][0]).to.eql('function');
      expect(typeof happnClient.state.eventHandlers['MyEvent'][1]).to.eql('function');
      expect(typeof happnClient.state.eventHandlers['MyNewEvent'][0]).to.eql('function');
      done();
    });

    it("tests the 'offEvent' function created by __initializeEvents removes an event handler", function (done) {
      var happnClient = mockHappnClient();
      happnClient.__initializeEvents();
      happnClient.onEvent('MyEvent', function () {
        //do nothing
      });
      happnClient.onEvent('MyEvent', function () {
        //do nothing
      });
      happnClient.offEvent('MyEvent|0');

      expect(happnClient.state.eventHandlers['MyEvent'][0]).to.be(null);
      expect(typeof happnClient.state.eventHandlers['MyEvent'][1]).to.eql('function');
      done();
    });

    it('tests the getScript function returns an error when not called from a browser', function (done) {
      var happnClient = mockHappnClient();
      happnClient.getScript('http://www.google.com', function (err) {
        expect(err.toString()).to.eql('Error: only for browser');
        done();
      });
    });

    xit('tests the getScript function when called from a browser', function () {
      //TODO::: Not sure how to test this!
    });

    it('tests the getResources function returns a callback.', function (done) {
      var happnClient = mockHappnClient();

      happnClient.getResources(function () {
        done();
      });
    });

    xit('tests the stop function.', function (done) {
      var happnClient = mockHappnClient();

      happnClient.stop(function () {
        //TODO::: Can't test: Socket issues
        done();
      });
    });

    it('tests the __ensureCryptoLibrary function returns a callback.', function (done) {
      var happnClient = mockHappnClient();

      happnClient.__ensureCryptoLibrary(function () {
        done();
      });
    });

    it('tests the __attachSession function.', function (done) {
      var happnClient = mockHappnClient();
      happnClient.__attachSession('This is a session');
      expect(happnClient.session).to.eql('This is a session');
      done();
    });

    it('tests the __payloadToError function.', function (done) {
      var happnClient = mockHappnClient();
      var payload = 'This is an error';
      const e = happnClient.__payloadToError(payload);
      expect(e.toString()).to.eql('Error: This is an error');
      done();
    });

    it('tests the __payloadToError function when payload contains a message.', function (done) {
      var happnClient = mockHappnClient();
      var payload = {
        message: 'This is an error',
      };
      const e = happnClient.__payloadToError(payload);
      expect(e.toString()).to.eql('Error: This is an error');
      done();
    });

    it('tests the __doLogin function will attach a session with mocked systemRequest.', function (done) {
      var happnClient = mockHappnClient();
      happnClient.__performSystemRequest = function (action, data, options, callback) {
        callback(null, {
          session: 'This is a session',
          _meta: {
            status: 'ok',
          },
        });
      };
      happnClient.__doLogin({}, function () {
        expect(happnClient.session).to.eql({
          session: 'This is a session',
        });
        done();
      });
    });

    it('tests the __doLogin function will return an error with mocked systemRequest if _meta.status is not ok.', function (done) {
      var happnClient = mockHappnClient();
      happnClient.__performSystemRequest = function (action, data, options, callback) {
        callback(null, {
          _meta: {},
          payload: 'this is an error',
        });
      };
      happnClient.__doLogin({}, function (e) {
        expect(e.toString()).to.eql('Error: this is an error');
        done();
      });
    });

    it('tests the __doLogin function will return an error with mocked systemRequest if system Request returns an error', function (done) {
      var happnClient = mockHappnClient();
      happnClient.__performSystemRequest = function (action, data, options, callback) {
        callback(new Error('system request failed'), null);
      };
      happnClient.__doLogin({}, function (e) {
        expect(e.toString()).to.eql('Error: system request failed');
        done();
      });
    });

    xit('tests the __signNonce function.', function (done) {
      //TODO::: NEEDS A 32-bit buffer for nonce???
      var happnClient = mockHappnClient();

      happnClient.__prepareInstanceOptions({
        keyPair: {
          privateKey: 'pqPVklZ9kdANfeEZhNFYYznGKKh/cz3qI7JUfVEJRwg=',
          publicKey: 'AwKAM+xrypUPLMMKgQBJ6oSpg2+9szVLlL5u7yjM8XlG',
        },
      });

      happnClient.__ensureCryptoLibrary();

      const a = happnClient.__signNonce(':::32 Bit buffer???');
      //eslint-disable-next-line no-console
      console.log(a);
      done();
    });

    it('tests the __prepareLogin function will calback login paramaters if not digest.', function (done) {
      var happnClient = mockHappnClient();
      var loginParameters = {
        name: 'Janco',
        password: 'private',
        loginType: 'password',
      };
      happnClient.__prepareLogin(loginParameters, function (e, data) {
        expect(data).to.eql(loginParameters);
        done();
      });
    });

    it('tests the login function calls doLogin and request callback.', function (done) {
      var happnClient = mockHappnClient();

      happnClient.__doLogin = function (options, callback) {
        callback(options);
      };

      happnClient.__requestCallback = function (message, callback) {
        callback(message);
      };

      happnClient.__prepareInstanceOptions({
        username: 'Janco',
      });

      happnClient.socket.write = function () {};

      var happnPackage = require('../../../package.json');

      happnClient.login(function (data) {
        expect(data).to.eql({
          action: 'configure-session',
          eventId: 1,
          data: { protocol: 'happn_4', version: happnPackage.version, browser: false },
          sessionId: 'test',
        });
        done();
      });
    });

    it('tests that the authenticate function calls the login function when there is a socket.', function (done) {
      var happnClient = mockHappnClient();
      happnClient.socket = true;
      happnClient.login = function (callback) {
        return callback(null, 'done');
      };
      happnClient.authenticate(function (err, data) {
        expect(err).to.be(null);
        expect(data).to.be('done');
        done();
      });
    });

    it('tests the handle_end function emits a "connection-ended" event and sets status to disconnected.', function (done) {
      var happnClient = mockHappnClient();
      happnClient.__attachSession({
        id: 'This is a session',
      });

      happnClient.emit = function (event_type, data) {
        expect(event_type).to.eql('connection-ended');
        expect(data).to.eql('This is a session');
        expect(this.status).to.eql(Constants.CLIENT_STATE.DISCONNECTED);
        done();
      };
      happnClient.handle_end();
    });

    it('tests the handle_reconnect_timeout function emits a reconnect-timeout event.', function (done) {
      var happnClient = mockHappnClient();

      happnClient.emit = function (event_type, data) {
        expect(event_type).to.eql('reconnect-timeout');
        expect(data).to.eql({
          err: {},
          opts: {},
        });
        expect(this.status).to.eql(Constants.CLIENT_STATE.DISCONNECTED);
        done();
      };

      happnClient.handle_reconnect_timeout({}, {});
    });

    it('tests the handle_reconnect_scheduled function emits a reconnect scheduled event.', function (done) {
      var happnClient = mockHappnClient();
      happnClient.emit = function (event_type) {
        expect(event_type).to.eql('reconnect-scheduled');
        expect(this.status).to.eql(Constants.CLIENT_STATE.RECONNECTING);
        done();
      };
      happnClient.handle_reconnect_scheduled();
    });

    it('tests the getEventId function.', function (done) {
      var happnClient = mockHappnClient();
      expect(happnClient.getEventId()).to.eql(1);
      expect(happnClient.getEventId()).to.eql(2);
      done();
    });

    it('tests the __requestCallback function.', function (done) {
      var happnClient = mockHappnClient();
      happnClient.__requestCallback(
        {
          eventId: 'MyEvent|1',
        },
        function (e, response) {
          return response;
        },
        {
          timeout: 100,
        },
        'MyEvent|1'
      );
      expect(typeof happnClient.state.requestEvents['MyEvent|1'].handleResponse).to.eql('function');
      done();
    });

    it('tests the __performSystemRequest function writes a message to the socket with null options.', function (done) {
      var happnClient = mockHappnClient();
      happnClient.socket.write = function (message) {
        expect(message).to.eql({
          action: 'login',
          eventId: 1,
          data: {
            username: 'Janco1',
            password: 'private',
          },
          sessionId: 'test',
        });
        done();
      };

      happnClient.__performSystemRequest(
        'login',
        {
          username: 'Janco1',
          password: 'private',
        },
        null,
        function () {}
      );
    });

    it('tests the __performSystemRequest function writes a message to the socket with timeout options.', function (done) {
      this.timeout(20000);
      var happnClient = mockHappnClient();
      happnClient.socket.write = function (message) {
        expect(message).to.eql({
          action: 'login',
          eventId: 1,
          data: {
            username: 'Janco2',
            password: 'private',
          },
          options: {
            timeout: 100,
          },
          sessionId: 'test',
        });
        done();
      };

      happnClient.__performSystemRequest(
        'login',
        {
          username: 'Janco2',
          password: 'private',
        },
        {
          timeout: 100,
        },
        function () {}
      );
    });

    it('tests the __performSystemRequest function will return a callback if one is passed to it.', function (done) {
      var happnClient = mockHappnClient();

      happnClient.socket.write = function () {};

      happnClient.__performSystemRequest(
        'login',
        {
          username: 'Janco3',
          password: 'private',
        },
        {
          timeout: 50,
        },
        function (error) {
          expect(error.toString()).to.eql('Error: api request timed out');
          done();
        }
      );
    });

    it('tests the getChannel function.', function (done) {
      var happnClient = mockHappnClient();
      expect(happnClient.getChannel('test', 'test_action')).to.eql('/TEST_ACTION@test');
      done();
    });

    it('tests that the get function will call __getDataRequest and returns a callback ', function (done) {
      var happnClient = mockHappnClient();

      happnClient.__requestCallback = function (message, callback) {
        callback();
      };

      happnClient.get('/test/path', function (e) {
        if (e) return done(e);
        done();
      });
    });

    it('tests that the getPaths function will call __getDataRequest and returns a callback ', function (done) {
      var happnClient = mockHappnClient();

      happnClient.__requestCallback = function (message, callback) {
        callback();
      };

      happnClient.getPaths('/test/path', function (e) {
        if (e) return done(e);
        done();
      });
    });

    it('tests that the increment function will call __getDataRequest and returns a callback ', function (done) {
      var happnClient = mockHappnClient();

      happnClient.__requestCallback = function (message, callback) {
        callback();
      };

      happnClient.increment('/test/path', 1, 1, function (e) {
        if (e) return done(e);
        done();
      });
    });

    it('tests that the increment function will call __getdatarequest and returns a callback when increment property is not specified (i.e. replaced by callback function) ', function (done) {
      var happnClient = mockHappnClient();

      happnClient.__requestCallback = function (message, callback) {
        callback();
      };

      happnClient.increment('/test/path', 1, function (e) {
        if (e) return done(e);
        done();
      });
    });

    it('tests that the increment function will call __getdatarequest and returns a callback when increment and gauge properties are not specified (i.e. replaced by callback function) ', function (done) {
      var happnClient = mockHappnClient();

      happnClient.__requestCallback = function (message, callback) {
        callback();
      };

      happnClient.increment('/test/path', function (e) {
        if (e) return done(e);
        done();
      });
    });

    it('tests that the increment function will return an error callback if the increment is NAN ', function (done) {
      var happnClient = mockHappnClient();

      happnClient.__requestCallback = function (message, callback) {
        callback();
      };

      happnClient.increment('/test/path', 1, 'string', function (e) {
        expect(e.toString()).to.eql('Error: increment must be a number');
        done();
      });
    });

    it('tests that the set function calls __getdatarequest and returns a callback', function (done) {
      var happnClient = mockHappnClient();

      happnClient.__requestCallback = function (message, callback) {
        callback();
      };

      happnClient.set(
        '/test/path',
        {
          test: 'data',
        },
        function (e) {
          if (e) return done(e);
          done();
        }
      );
    });

    it('tests that the set function will return an error callback if a wildcard "*" is used in path', function (done) {
      var happnClient = mockHappnClient();

      happnClient.__requestCallback = function (message, callback) {
        callback();
      };

      happnClient.set(
        '/test/*/path',
        {
          test: 'data',
        },
        function (e) {
          expect(e.toString()).to.eql(
            "Error: Bad path, if the action is 'set' the path cannot contain the * wildcard character"
          );
          done();
        }
      );
    });

    it('tests that the set function will return an error callback if an illegal character is used in path', function (done) {
      var happnClient = mockHappnClient();

      happnClient.__requestCallback = function (message, callback) {
        callback();
      };

      happnClient.set(
        '/test/^/path',
        {
          test: 'data',
        },
        function (e) {
          expect(e.toString()).to.eql(
            'Error: Bad path, can only contain characters a-z A-Z 0-9 / & + = : @ % * ( ) _ -, ie: factory1@I&J(western-cape)/plant1:conveyer_2/stats=true/capacity=10%/*'
          );
          done();
        }
      );
    });

    it('tests that the remove function will call the  __getDataRequest function and so return a callback', function (done) {
      var happnClient = mockHappnClient();

      happnClient.__requestCallback = function (message, callback) {
        callback();
      };

      happnClient.remove('/test/path', null, function () {
        done();
      });
    });

    it('tests that the remove function will call the  __getDataRequest function and return a callback when parameters are ommitted', function (done) {
      var happnClient = mockHappnClient();

      happnClient.__requestCallback = function (message, callback) {
        callback();
      };

      happnClient.remove('/test/path', function () {
        done();
      });
    });

    it('tests the __reattachListeners function returns a callback', function (done) {
      var happnClient = mockHappnClient();

      happnClient.__reattachListeners(function () {
        done();
      });
    });

    it('tests the reconnect function emits a reconnect event', function (done) {
      const happnClient = mockHappnClient();
      happnClient.__prepareInstanceOptions({});

      happnClient.onEvent('reconnect', function (data) {
        expect(data).to.eql(options);
        happnClient.disconnect({}, function () {
          done();
        });
      });

      var options = {
        Name: 'Options',
      };

      happnClient.reconnect(options);
    });

    it('tests the reconnect function calls authenticate', function (done) {
      var happnClient = mockHappnClient();

      happnClient.authenticate = function (cb) {
        expect(typeof cb).to.eql('function');
        done();
      };
      happnClient.onEvent('reconnect', function () {});
      var options = {
        Name: 'Options',
      };

      happnClient.reconnect(options);
    });

    it('tests the handle_error function with a non fatal error', function (done) {
      var happnClient = mockHappnClient();

      happnClient.onEvent('error', function (e, response) {
        expect(e.toString()).to.eql('Error: This is an error');
        expect(response).to.be(undefined);
      });

      happnClient.handle_error(new Error('This is an error'), false);
      expect(happnClient.state.errors[0].error.toString()).to.eql('Error: This is an error');
      done();
    });

    it("tests that the __attachpublishedAck function will callback an error if options aren't correct", function (done) {
      var happnClient = mockHappnClient();

      try {
        happnClient.__attachPublishedAck({}, {});
      } catch (err) {
        expect(err.toString()).to.eql('Error: onPublished handler in options is missing');
        done();
      }
    });

    it('tests that the __attachpublishedAck function will callback with an error if timed out  ', function (done) {
      const options = {
        onPublished: function (e) {
          expect(e.toString()).to.eql('Error: publish timed out');
          done();
        },
        onPublishedTimeout: 10,
      };
      var happnClient = mockHappnClient();
      happnClient.__attachPublishedAck(options, {});
    });

    it('tests the handle_ack function works when __attachPublishedAck has been called', function (done) {
      var happnClient = mockHappnClient();

      var message = {
        sessionId: '1',
        eventId: '1',
      };
      var message2 = {
        id: '1-1',
        result: 'Good',
        status: 'good',
      };
      var options = {
        onPublished: function (e, results) {
          expect(results).to.eql('Good');
          done();
        },
        onPublishedTimeout: 1000,
      };
      happnClient.__attachPublishedAck(options, message);
      happnClient.handle_ack(message2);
    });

    it("tests the handle_ack function throws an error on a message with status: 'error' after __attachPublishedAck has been called", function (done) {
      var happnClient = mockHappnClient();

      var message = {
        sessionId: '1',
        eventId: '1',
      };
      var message2 = {
        id: '1-1',
        error: 'Bad',
        status: 'error',
        result: 'Bad',
      };
      var options = {
        onPublished: function (e, results) {
          expect(e.toString()).to.eql('Error: Bad');
          expect(results).to.eql('Bad');
          done();
        },
        onPublishedTimeout: 100,
      };
      happnClient.__attachPublishedAck(options, message);
      happnClient.handle_ack(message2);
    });

    it('tests the handle_publication function', function (done) {
      var happnClient = mockHappnClient();
      happnClient.__requestCallback(
        {
          eventId: 'MyEvent|1',
        },
        function (e, data) {
          expect(data).to.eql(message);
          done();
        },
        {},
        'MyEvent|1'
      );
      var message = {
        _meta: {
          eventId: 'MyEvent|1',
        },
        message: 'Hello',
      };
      happnClient.handle_publication(message);
    });

    it("tests the handle_publication function calls __handleSystemMessage if _meta.type = 'system'", function (done) {
      var happnClient = mockHappnClient();
      happnClient.__handleSystemMessage = function (data) {
        expect(data).to.eql(message);
        done();
      };
      var message = {
        _meta: {
          type: 'system',
          eventId: 'MyEvent|1',
        },
        message: 'Hello',
      };
      happnClient.handle_publication(message);
    });

    it("tests the handle_publication function calls handle_data if _meta.type = 'data'", function (done) {
      var happnClient = mockHappnClient();
      happnClient.handle_data = function (channel, data) {
        expect(channel).to.eql('test');
        expect(data).to.eql(message);
        done();
      };
      var message = {
        _meta: {
          channel: 'test',
          type: 'data',
          eventId: 'MyEvent|1',
        },
        message: 'Hello',
      };
      happnClient.handle_publication(message);
    });

    it("tests the handle_publication function calls handle_ack if _meta.type = 'ack'", function (done) {
      var happnClient = mockHappnClient();
      happnClient.handle_ack = function (data) {
        expect(data).to.eql(message);
        done();
      };
      var message = {
        _meta: {
          type: 'ack',
          eventId: 'MyEvent|1',
        },
        message: 'Hello',
      };
      happnClient.handle_publication(message);
    });

    it('tests the handle_publication function works when message is an array', function (done) {
      var happnClient = mockHappnClient();
      happnClient.__requestCallback(
        {
          eventId: 'MyEvent|1',
        },
        function (e, data) {
          expect(data).to.eql(['Hello']);
          done();
        },
        {},
        'MyEvent|1'
      );
      var message = [
        'Hello',
        {
          eventId: 'MyEvent|1',
        },
      ];
      happnClient.handle_publication(message);
    });

    it('tests the handle_publication function can handle an error', function (done) {
      var happnClient = mockHappnClient();
      happnClient.__requestCallback(
        {
          eventId: 'MyEvent|1',
        },
        function (e, data) {
          expect(e.toString()).to.eql('Error: This is an error');
          expect(data).to.eql(message);
          done();
        },
        {},
        'MyEvent|1'
      );

      var message = {
        _meta: {
          status: 'error',
          error: {
            name: 'Error',
            message: 'This is an error',
          },
          eventId: 'MyEvent|1',
        },
        message: 'Bad message with error',
      };
      happnClient.handle_publication(message);
    });

    it('tests the handle_response_array function', function (done) {
      var happnClient = mockHappnClient();
      happnClient.__requestCallback(
        {
          eventId: 'MyEvent|1',
        },
        function (e, data) {
          expect(data).to.eql('Hello');
          done();
        },
        {},
        'MyEvent|1'
      );
      var response = 'Hello';
      const meta = {
        eventId: 'MyEvent|1',
      };
      happnClient.handle_response_array(null, response, meta);
    });

    it('tests the handle_response function', function (done) {
      var happnClient = mockHappnClient();
      happnClient.__requestCallback(
        {
          eventId: 'MyEvent|1',
        },
        function (e, data) {
          expect(data).to.eql(response);
          done();
        },
        {},
        'MyEvent|1'
      );
      var response = {
        _meta: {
          eventId: 'MyEvent|1',
        },
        message: 'Hello',
      };
      happnClient.handle_response(null, response);
    });

    it('tests the handle_response function, passing a timeout', function (done) {
      var happnClient = mockHappnClient();
      happnClient.__requestCallback(
        {
          eventId: 'MyEvent|1',
        },
        function (e, data) {
          expect(data).to.eql(response);
          done();
        },
        {
          timeout: 100,
        },
        'MyEvent|1'
      );
      var response = {
        _meta: {
          eventId: 'MyEvent|1',
        },
        message: 'Hello',
      };
      happnClient.handle_response(null, response);
    });

    it('tests the __acknowledge function', function (done) {
      var happnClient = mockHappnClient();
      happnClient.__requestCallback = function (message, callback) {
        callback();
      };
      var message = {
        _meta: {
          consistency: Constants.CONSISTENCY.ACKNOWLEDGED,
          acknowledged: false,
        },
      };
      happnClient.__acknowledge(message, function (result) {
        expect(result._meta.acknowledged).to.eql(true);
        done();
      });
    });

    it('tests that the __acknowledge function will return an error in the message and not acknowledge if an error occurs in the __getDataRequest', function (done) {
      var happnClient = mockHappnClient();
      happnClient.__requestCallback = function (message, callback) {
        callback(new Error('Bad'));
      };
      var message = {
        _meta: {
          consistency: Constants.CONSISTENCY.ACKNOWLEDGED,
          acknowledged: true,
        },
      };
      happnClient.__acknowledge(message, function (result) {
        expect(result._meta.acknowledged).to.eql(false);
        expect(result._meta.acknowledgedError.toString()).to.eql('Error: Bad');
        done();
      });
    });

    it('tests the delegate_handover function when delegate runcount > count', function (done) {
      this.timeout(5000);

      var happnClient = mockHappnClient();

      var delegate = {
        count: 1,
        runcount: 2,
        handler: function () {
          done(new Error('unexpected'));
        },
      };

      var message = JSON.stringify({
        message: 'test',
      });
      happnClient.delegate_handover(message, {}, delegate);
      setTimeout(done, 2000);
    });

    it('tests the delegate_handover function when delegate runcount == count', function (done) {
      this.timeout(5000);
      let tm = setTimeout(() => {
        done(new Error('unexpected'));
      }, 3000);
      var happnClient = mockHappnClient();
      happnClient._offListener = (_id, cb) => cb();
      var delegate = {
        count: 1,
        runcount: 0,
        handler: () => {
          clearTimeout(tm);
          done();
        },
      };
      var message = JSON.stringify({
        message: 'test',
      });
      happnClient.delegate_handover(message, {}, delegate);
    });

    it('tests the delegate_handover function when runcount will equal count after 1 iteration', function (done) {
      var happnClient = mockHappnClient();

      happnClient.__acknowledge = function (data, cb) {
        cb(data);
      };

      var delegate = {
        count: 2,
        runcount: 1,
        handler: function (data, meta) {
          expect(data).to.eql(message.data);
          expect(meta).to.eql(message._meta);
          done();
        },
      };
      var message = {
        data: 'This is a message',
        _meta: 'Meta',
      };
      happnClient.delegate_handover(JSON.stringify(message.data), message._meta, delegate);
    });

    it('tests the delegate_handover function when count >> runcount', function (done) {
      var happnClient = mockHappnClient();
      happnClient.__acknowledge = function (data, cb) {
        cb(data);
      };

      var delegate = {
        count: 10,
        runcount: 1,
        handler: function (data, meta) {
          expect(data).to.eql(message.data);
          expect(meta).to.eql(message._meta);
          done();
        },
      };
      var message = {
        data: 'This is a message',
        _meta: 'Meta',
      };
      happnClient.delegate_handover(JSON.stringify(message.data), message._meta, delegate);
    });

    it('tests the handle_data function with one event handler', function (done) {
      var happnClient = mockHappnClient();

      happnClient.state.events = {
        'MyEvent|1': [
          {
            handler: function (data, meta) {
              expect(data).to.eql(message.data);
              expect(meta).to.eql(message._meta);
              done();
            },
          },
        ],
      };
      happnClient.__acknowledge = function (data, cb) {
        cb(data);
      };

      var message = {
        _meta: {
          eventId: 'MyEvent|1',
        },
        data: 'Hello',
      };
      happnClient.handle_data('MyEvent|1', message);
    });

    it('tests the handle_data function with multiple handlers', function (done) {
      var happnClient = mockHappnClient();
      var n = 0;
      var testDone = function () {
        n++;
        if (n === 2) done();
      };
      happnClient.state.events = {
        'MyEvent|1': [
          {
            handler: function (data, meta) {
              expect(data).to.eql(message.data);
              expect(meta).to.eql(message._meta);
              testDone();
            },
          },
          {
            handler: function (data, meta) {
              expect(data).to.eql(message.data);
              expect(meta).to.eql(message._meta);
              testDone();
            },
          },
        ],
      };
      happnClient.__acknowledge = function (data, cb) {
        cb(data);
      };

      var message = {
        _meta: {
          eventId: 'MyEvent|1',
        },
        data: 'Hello',
      };
      happnClient.handle_data('MyEvent|1', message);
    });

    it('tests the __handleSystemMessage function will set status to disconnected if message event key is server-side-disconnect', function (done) {
      var happnClient = mockHappnClient();
      var message = {
        eventKey: 'server-side-disconnect',
      };
      happnClient.__handleSystemMessage(message);
      expect(happnClient.status).to.eql(Constants.CLIENT_STATE.DISCONNECTED);
      done();
    });

    it('tests the offSystemMessage function', function (done) {
      var happnClient = mockHappnClient();
      expect(
        happnClient.onSystemMessage(function (x) {
          //eslint-disable-next-line no-console
          console.log(x);
        })
      ).to.eql(0);
      happnClient.offSystemMessage(0);
      expect(happnClient.state.systemMessageHandlers.length).to.eql(0);
      done();
    });

    it('tests the onSystemMessage function', function (done) {
      var happnClient = mockHappnClient();
      expect(
        happnClient.onSystemMessage(function (x) {
          //eslint-disable-next-line no-console
          console.log(x);
        })
      ).to.eql(0);
      expect(
        happnClient.onSystemMessage(function (x) {
          //eslint-disable-next-line no-console
          console.log(x);
        })
      ).to.eql(1);
      done();
    });

    it('tests the _remoteOn function calls request callback', function (done) {
      var happnClient = mockHappnClient();

      happnClient.__requestCallback = function (message, callback) {
        callback();
      };
      happnClient._remoteOn('test/path', null, function () {
        done();
      });
    });

    it('tests the on function returns will create a callbackHandler and that handle_data will call it', function (done) {
      var happnClient = mockHappnClient();
      var parameters = {
        event_type: 'Call',
        meta: {},
      };
      var response = {
        _meta: {
          eventId: 1,
        },
        data: 'This is a message',
        status: 'OK',
      };

      happnClient.socket.write = function () {
        happnClient.handle_response(null, response);
      };

      happnClient.on(
        'MyEvent',
        parameters,
        function (data, meta) {
          expect(data).to.eql('This is a message');
          expect(meta).to.eql({
            eventId: 1,
          });
          done();
        },
        function () {
          happnClient.handle_data('/CALL@MyEvent', response);
        }
      );
    });

    it('tests the on function throws an error if not called with a callback', function (done) {
      var happnClient = mockHappnClient();
      happnClient
        .on()
        .then(function () {
          done(new Error('this should not have happened'));
        })
        .catch(function (error) {
          expect(error.toString()).to.eql(
            'Error: you cannot subscribe without passing in a subscription callback'
          );
          done();
        });
    });

    it('tests the on function throws an error if using onPublished handler (mocking handler) without a callback', function (done) {
      var happnClient = mockHappnClient();
      var parameters = {
        onPublished: function (x) {
          //eslint-disable-next-line no-console
          console.log(x);
        },
      };
      happnClient.on('test/path', parameters, 'string', undefined).catch(function (error) {
        expect(error.toString()).to.eql(
          'Error: callback cannot be null when using the onPublished event handler'
        );
        done();
      });
    });

    it('tests the onAll function', function (done) {
      var happnClient = mockHappnClient();

      var response = {
        status: 'OK',
        _meta: {
          eventId: '1',
        },
      };

      happnClient.socket.write = function () {
        happnClient.handle_response(null, response);
      };

      happnClient.onAll(
        function (data, meta) {
          expect(data).to.eql('This is data');
          expect(meta).to.eql('This is meta');
          done();
        },
        function () {
          happnClient.handle_data('/ALL@*', {
            data: 'This is data',
            _meta: 'This is meta',
          });
        }
      );
    });

    it('tests the _remoteOff function', function (done) {
      var happnClient = mockHappnClient();
      happnClient.socket.write = function () {};

      var channel = '/THIS@that';
      var message1 = {
        action: 'off',
        eventId: 1,
        options: {
          referenceId: 0,
          timeout: 5000,
        },
        path: channel,
        data: null,
        sessionId: 'test',
      };

      happnClient.__requestCallback = function (message, callback, options, eventId, path, action) {
        expect(path).to.equal(channel);
        expect(options).to.eql({
          referenceId: 0,
          timeout: 5000,
        });
        expect(message).to.eql(message1);
        expect(eventId).to.eql(1);
        expect(action).to.eql('off');

        callback(null, {
          status: 'OK',
        });
      };

      happnClient._remoteOff('/THIS@that', function () {
        done();
      });
    });

    it('tests the _offListener function', function (done) {
      var happnClient = mockHappnClient();
      var path;
      happnClient._remoteOff = function (channel, listenerRef, cb) {
        if (typeof listenerRef === 'function') cb = listenerRef;
        path = channel;
        cb();
      };

      happnClient.state.refCount = {
        A: 1,
        B: 1,
        C: 1,
        D: 1,
      };

      happnClient.state.events = {
        event1: [
          {
            id: 1,
            eventKey: 'A',
          },
          {
            id: 2,
            eventKey: 'B',
          },
          {
            id: 3,
            eventKey: 'C',
          },
        ],
        event2: [
          {
            id: 5,
            eventKey: 'D',
          },
        ],
      };

      happnClient._offListener(5, function () {
        expect(path).to.eql('event2');
        expect(happnClient.state.events['event2']).to.be(undefined);
        done();
      });
    });

    it('tests the _offPath function', function (done) {
      var happnClient = mockHappnClient();
      happnClient._remoteOff = function (channel, listenerRef, callback) {
        if (typeof listenerRef === 'function') {
          callback = listenerRef;
          listenerRef = 0;
        }
        callback();
      };
      happnClient.state.events = {
        '/EVENT1@SOMEWHERE': [
          {
            id: 1,
            referenceId: 'A',
          },
          {
            id: 2,
            referenceId: 'B',
          },
          {
            id: 3,
            referenceId: 'C',
          },
        ],
        '/EVENT2@SOMEWHERE': [
          {
            id: 1,
            referenceId: 'A',
          },
          {
            id: 2,
            referenceId: 'B',
          },
          {
            id: 3,
            referenceId: 'C',
          },
        ],
        event2: [
          {
            id: 4,
            referenceId: 'D',
          },
          {
            id: 5,
            referenceId: 'E',
          },
          {
            id: 6,
            referenceId: 'F',
          },
        ],
      };
      happnClient.offPath('SOMEWHERE', function () {
        expect(happnClient.state.events).to.eql({
          event2: [
            {
              id: 4,
              referenceId: 'D',
            },
            {
              id: 5,
              referenceId: 'E',
            },
            {
              id: 6,
              referenceId: 'F',
            },
          ],
        });
        done();
      });
    });

    it('tests the offAll function', function (done) {
      var happnClient = mockHappnClient();
      happnClient._remoteOff = function (channel, callback) {
        expect(channel).to.eql('*');
        callback();
      };
      happnClient.state.events = {
        '/EVENT1@SOMEWHERE': [
          {
            id: 1,
            referenceId: 'A',
          },
          {
            id: 2,
            referenceId: 'B',
          },
          {
            id: 3,
            referenceId: 'C',
          },
        ],
        event2: [
          {
            id: 4,
            referenceId: 'D',
          },
          {
            id: 5,
            referenceId: 'E',
          },
          {
            id: 6,
            referenceId: 'F',
          },
        ],
      };
      happnClient.offAll(function () {
        expect(happnClient.state.events).to.eql({});
        done();
      });
    });

    it('tests the off function returns a callback', function (done) {
      var happnClient = mockHappnClient();
      happnClient.off(1, function () {
        done();
      });
    });

    it('tests the off function returns an error if the handle is null', function (done) {
      var happnClient = mockHappnClient();
      happnClient.off(null, function (err) {
        expect(err.toString()).to.eql('Error: handle cannot be null');
        done();
      });
    });

    it('tests the off function returns an error if the handle is NAN', function (done) {
      var happnClient = mockHappnClient();
      happnClient.off('string', function (err) {
        expect(err.toString()).to.eql('Error: handle must be a number');
        done();
      });
    });

    it('tests the __connectionCleanup function will call socket.end correctly if it is mocked.', function (done) {
      var happnClient = mockHappnClient();
      happnClient.socket.end = function () {
        done();
      };
      happnClient.log.warn = function () {};
      happnClient.__connectionCleanup((e) => {
        if (e) return done(e);
      });
    });

    it('tests the revokeSession function calls a perform system request with revoke-session', function (done) {
      var happnClient = mockHappnClient();
      happnClient.__performSystemRequest = function (action, data, options, callback) {
        expect(action).to.equal('revoke-token');
        callback();
      };
      happnClient.revokeToken(function () {
        done();
      });
    });

    xit('tests the disconnect function', function (done) {
      // TODO::: ADDED A CALLBACK AT THE END OF THE FUNCTION IN client.js PASSES BUT HANGS
      // Socket issues again?
      var happnClient = mockHappnClient();
      happnClient.__performSystemRequest = function (action) {
        expect(action).to.eql('disconnect');
        // TODO: needs work to pass before done() is called
      };

      happnClient.socket = null;
      happnClient.disconnect({}, function () {
        done();
      });
    });

    // after('shows why node is still running', function(){
    //   log();
    // });
  }
);
