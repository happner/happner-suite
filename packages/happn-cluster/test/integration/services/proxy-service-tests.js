/**
 * Created by grant on 2016/09/26.
 */
var assert = require('assert');
var Proxy = require('../../../lib/services/proxy-service');
var MockHappn = require('../../mocks/mock-happn');
const ProxyStatuses = require('../../../lib/constants/proxy-states');

require('../../lib/test-helper').describe({ timeout: 30e3 }, function (test) {
  // test.printOpenHandlesAfter(5e3);
  const mockLogger = test.mockLogger();
  before(function () {
    this.logLevel = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = 'off';
  });

  before('create mock happn', function () {
    Object.defineProperty(Proxy.prototype, 'happn', {
      get: function () {
        return new MockHappn('http', 9000);
      },
    });
  });

  it('can start and stop the proxy', function (done) {
    var proxy = new Proxy({}, mockLogger);
    test.expect(proxy.status).to.equal(ProxyStatuses.UNINITIALIZED);
    proxy
      .start()
      .then(function () {
        test.expect(proxy.status).to.equal(ProxyStatuses.STARTED);
        proxy.stop(function (err) {
          if (err) done(err);
          test.expect(proxy.status).to.equal(ProxyStatuses.STOPPED);
          done();
        });
      })
      .catch(function (err) {
        return done(err);
      });
  });

  it('listens on the specified address', function (done) {
    var proxy = new Proxy(
      {
        host: '127.0.0.1',
      },
      mockLogger
    );
    proxy.setupAddressesAndPorts(8015);
    proxy
      .start()
      .then(function () {
        var address = proxy.server.address();
        test.expect(address.port).to.equal(8015);
        test.expect(address.address).to.equal('127.0.0.1');
        proxy.stop(done);
      })
      .catch(function (err) {
        proxy.stop(function () {
          return done(err);
        });
      });
  });

  it('fails to start on bad address', function (done) {
    var proxy = new Proxy(
      {
        host: '99.99.99.99',
      },
      mockLogger
    );
    proxy.setupAddressesAndPorts(8015);
    proxy
      .start()
      .catch(function (err) {
        test.expect(err.code).to.equal('EADDRNOTAVAIL');
        done();
      })
      .catch(done);
  });

  it('can proxy an http server', function (done) {
    var proxy = new Proxy({}, mockLogger);
    proxy.externalPort = 8015;
    var http = require('http');

    var proxyHost = proxy.happn.services.proxy.config.host;
    var proxyPort = proxy.happn.services.proxy.config.port;
    var targetPort = proxy.happn.config.port;

    var EXPECTED = 'request successfully proxied!';

    // set up independent http server
    var proxiedServer = http.createServer(function (req, res) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.write(EXPECTED);
      res.end();
    });

    // the proxied server is set up as the target in happn (the mock in this case)
    // console.log('Target port: ' + targetPort);
    proxiedServer.listen(targetPort);

    proxy.setupAddressesAndPorts(8015);
    proxy
      .start()
      .then(function () {
        // send GET request to proxy - this should pass the request to the target
        http
          .request({ port: proxyPort, host: proxyHost }, function (res) {
            var result = '';

            res.on('data', function (chunk) {
              result += chunk;
            });

            res.on('end', function () {
              assert.equal(result, EXPECTED);
              proxy.stop(done);
              proxiedServer.close();
            });
          })
          .end();
      })
      .catch(function (err) {
        return done(err);
      });
  });

  after(function () {
    process.env.LOG_LEVEL = this.logLevel;
  });
});
