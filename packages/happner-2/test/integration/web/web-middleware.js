const path = require('path');

describe(
  require('../../__fixtures/utils/test_helper').create().testName(__filename, 3),
  function () {
    var Mesh = require('../../..');
    var client;
    var mesh;
    var request = require('request');

    this.timeout(120000);

    var libFolder =
      path.resolve(__dirname, '../../..') +
      path.sep +
      ['test', '__fixtures', 'test', 'integration', 'web'].join(path.sep) +
      path.sep;
    var expect = require('expect.js');

    var singularActive = function (req, res) {
      res.end('ok');
    };
    var multiActive = function (req, res, next) {
      res.write('_2');
      next();
    };

    var config = {
      name: 'middlewareMesh',
      happn: {
        port: 10000,
        secure: true,
        services: {
          connect: {
            config: {
              middleware: {
                security: {
                  // cookieName: 'custom_token',
                  exclusions: ['/index.html'],
                },
              },
            },
          },
        },
      },
      web: {
        routes: {
          '/': 'middlewareTest/root',
          '/testAddRouteInfo': 'middlewareTest/addRouteInfo',
          '/inline': function (req, res) {
            res.end('OK!NESS');
          },
        },
      },
      modules: {
        middlewareTest: {
          path: libFolder + 'web-middleware',
        },
      },
      components: {
        middlewareTest: {
          moduleName: 'middlewareTest',
          web: {
            routes: {
              root: ['checkIndex', 'content'],
              addRouteInfo: ['injectRouteInfo'],
              singular: 'singularMethod',
              multi: ['multiMethod1', 'multiMethod2', 'multiMethod3'],
              singularActive: singularActive,
              multiActive: ['multiMethod1', multiActive, 'multiMethod3'],
              injectHappn: 'injectHappnMethod',
              injectOrigin: [
                'injectOriginMethod',
                function (req, res) {
                  res.end();
                },
              ],
              injectForwardOrder: 'injectForwardOrder',
              injectReverseOrder: 'injectReverseOrder',
            },
          },
        },
      },
    };

    before(function (done) {
      Mesh.create(config)
        .then(function (_mesh) {
          mesh = _mesh;
          done();
        })
        .catch(done);
    });

    before('get session token', function (done) {
      client = new Mesh.MeshClient({
        port: 10000,
      });
      client
        .login({
          username: '_ADMIN',
          password: 'happn',
        })
        .then(function () {
          done();
        })
        .catch(done);
    });

    after('disconnect client', function (done) {
      client.disconnect(done);
    });

    after(function (done) {
      mesh.stop({ reconnect: false }, done);
    });

    var cookieRequest = function (url, callback) {
      var j = request.jar();
      // var cookie = request.cookie('custom_token=' + client.token);
      var cookie = request.cookie('happn_token=' + client.token);
      j.setCookie(cookie, url);
      request({ url: url, jar: j }, callback);
    };

    it('can get from a singular route', function (done) {
      cookieRequest('http://127.0.0.1:10000/middlewareTest/singular', function (e, res) {
        if (e) return done(e);
        try {
          expect(res.statusCode).to.be(200);
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('can get from a multi route', function (done) {
      cookieRequest('http://127.0.0.1:10000/middlewareTest/multi', function (e, res, body) {
        if (e) return done(e);
        try {
          expect(res.statusCode).to.be(200);
          expect(body).to.be('_1_2_3');
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('can get from an singular active route', function (done) {
      cookieRequest(
        'http://127.0.0.1:10000/middlewareTest/singularActive',
        function (e, res, body) {
          if (e) return done(e);
          try {
            expect(res.statusCode).to.be(200);
            expect(body).to.be('ok');
            done();
          } catch (e) {
            done(e);
          }
        }
      );
    });

    it('can get from a multi active route', function (done) {
      cookieRequest('http://127.0.0.1:10000/middlewareTest/multiActive', function (e, res, body) {
        if (e) return done(e);
        try {
          expect(res.statusCode).to.be(200);
          expect(body).to.be('_1_2_3');
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('can inject $happn', function (done) {
      cookieRequest('http://127.0.0.1:10000/middlewareTest/injectHappn', function (e, res, body) {
        if (e) return done(e);
        try {
          expect(res.statusCode).to.be(200);
          expect(body).to.be('middlewareMesh');
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('can inject $origin from cookie', function (done) {
      cookieRequest('http://127.0.0.1:10000/middlewareTest/injectOrigin', function (e, res, body) {
        if (e) return done(e);
        try {
          expect(res.statusCode).to.be(200);
          expect(body).to.be('_ADMIN');
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('can inject $origin from url query', function (done) {
      request(
        'http://127.0.0.1:10000/middlewareTest/injectOrigin?happn_token=' + client.token,
        function (e, res, body) {
          if (e) return done(e);
          try {
            expect(res.statusCode).to.be(200);
            expect(body).to.be('_ADMIN');
            done();
          } catch (e) {
            done(e);
          }
        }
      );
    });

    it('can inject $origin from Bearer token', function (done) {
      var options = {
        url: 'http://127.0.0.1:10000/middlewareTest/injectOrigin',
        headers: {
          Authorization: 'Bearer ' + client.token,
        },
      };

      request(options, function (e, res, body) {
        if (e) return done(e);
        try {
          expect(res.statusCode).to.be(200);
          expect(body).to.be('_ADMIN');
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('can inject $happn and $origin in forward order', function (done) {
      cookieRequest(
        'http://127.0.0.1:10000/middlewareTest/injectForwardOrder',
        function (e, res, body) {
          if (e) return done(e);
          try {
            expect(res.statusCode).to.be(200);
            expect(body).to.be('_ADMIN_middlewareMesh');
            done();
          } catch (e) {
            done(e);
          }
        }
      );
    });

    it('can inject $origin and $happn in reverse order', function (done) {
      cookieRequest(
        'http://127.0.0.1:10000/middlewareTest/injectReverseOrder',
        function (e, res, body) {
          if (e) return done(e);
          try {
            expect(res.statusCode).to.be(200);
            expect(body).to.be('_ADMIN_middlewareMesh');
            done();
          } catch (e) {
            done(e);
          }
        }
      );
    });

    it('does not put web middleware methods onto server exchange', function () {
      var methods = Object.keys(mesh.exchange.middlewareTest);
      //doSomething and doSomethingElse are global middleware methods
      //used in web-middleware-global test
      //which need to be on the exchange
      //__version is a special property
      expect(methods.length).to.equal(3);
    });

    it('does not put web middleware methods onto client exchange', function () {
      var methods = Object.keys(client.exchange.middlewareTest);
      //doSomething and doSomethingElse are global middleware methods
      //used in web-middleware-global test
      //which need to be on the exchange
      //__version is a special property
      expect(methods.length).to.equal(3);
    });

    it('advertises web methods in description', function () {
      expect(mesh._mesh.description.components.middlewareTest.routes).to.eql({
        '/middlewareTest/root': { type: 'mware' },
        '/middlewareTest/addRouteInfo': { type: 'mware' },
        '/middlewareTest/singular': { type: 'mware' },
        '/middlewareTest/multi': { type: 'mware' },
        '/middlewareTest/singularActive': { type: 'mware' },
        '/middlewareTest/multiActive': { type: 'mware' },
        '/middlewareTest/injectHappn': { type: 'mware' },
        '/middlewareTest/injectOrigin': { type: 'mware' },
        '/middlewareTest/injectForwardOrder': { type: 'mware' },
        '/middlewareTest/injectReverseOrder': { type: 'mware' },
      });
    });

    it('can get index.html that middleware renames to index.htm', function (done) {
      request('http://127.0.0.1:10000/index.html', function (e, res) {
        if (e) return done(e);
        try {
          expect(res.statusCode).to.be(200);
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('can get from inline root web route', function (done) {
      cookieRequest('http://127.0.0.1:10000/inline', function (e, res, body) {
        if (e) return done(e);
        try {
          expect(res.statusCode).to.be(200);
          expect(body).to.be('OK!NESS');
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it("should add route info to 'req' for middleware on component to use if request is directed to root web route", function (done) {
      cookieRequest('http://127.0.0.1:10000/testAddRouteInfo', function (e, res, body) {
        if (e) return done(e);
        try {
          expect(res.statusCode).to.be(200);
          expect(body).to.be('/testAddRouteInfo_middlewareTest/addRouteInfo');
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  }
);
