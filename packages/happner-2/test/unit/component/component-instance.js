const LRUCache = require('happn-3/lib/services/cache/cache-lru');

require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  it('describe method', function (done) {
    let ComponentInstance = require('../../../lib/system/component-instance');
    let componentInstance = new ComponentInstance();
    let mesh = mockMesh('test-mesh-name');
    let config = mockConfig();
    componentInstance.name = 'test-component-instance';
    componentInstance.initialize(
      'test-component-instance',
      mesh,
      mockModule('test-name-module', '1.0.0'),
      config,
      (e) => {
        if (e) return done(e);
        componentInstance.description = {
          test: 'description',
        };
        test.expect(componentInstance.describe(false)).to.eql({
          name: 'test-component-instance',
          version: '1.0.0',
          methods: {
            testMethod1: {
              isAsyncMethod: true,
              parameters: [
                {
                  name: 'arg11',
                },
                {
                  name: 'arg12',
                },
              ],
            },
            testMethod2: {
              isAsyncMethod: true,
              parameters: [
                {
                  name: 'arg21',
                },
                {
                  name: 'arg22',
                },
              ],
            },
            testMethodErrored: {
              isAsyncMethod: true,
              parameters: [
                {
                  name: '',
                },
              ],
            },
            testMethodUnauthorized: {
              isAsyncMethod: true,
              parameters: [
                {
                  name: '',
                },
              ],
            },
          },
          routes: {
            '/test-component-instance/test/route/1': {
              type: 'mware',
            },
            '/test-component-instance/test/route/2': {
              type: 'mware',
            },
            '/': {
              type: 'mware',
            },
          },
          events: {},
          data: {},
        });
        done();
      }
    );
  });

  it('describe method - cached', function (done) {
    let ComponentInstance = require('../../../lib/system/component-instance');
    let componentInstance = new ComponentInstance();
    let mesh = mockMesh('test-mesh-name');
    let config = mockConfig();
    componentInstance.name = 'test-component-instance';
    componentInstance.initialize(
      'test-component-instance',
      mesh,
      mockModule('test-name-module', '1.0.0'),
      config,
      (e) => {
        if (e) return done(e);
        componentInstance.description = {
          test: 'description',
        };
        test.expect(componentInstance.describe(true)).to.eql({
          test: 'description',
        });
        done();
      }
    );
  });

  it('#reply method - publish ok', function (done) {
    let ComponentInstance = require('../../../lib/system/component-instance');
    let componentInstance = new ComponentInstance();
    let mesh = mockMesh('test-mesh-name');
    let config = mockConfig();
    componentInstance.name = 'test-component-instance';
    mesh._mesh.data.publish = (callbackAddress, response, options, cb) => {
      test.expect(callbackAddress).to.be('/callback/address');
      test.expect(response).to.eql({ status: 'ok', args: {} });
      test.expect(options).to.be(undefined);
      cb();
      done();
    };
    componentInstance.operate = (method, args, cb) => {
      cb(null, {});
    };
    componentInstance.initialize(
      'test-component-instance',
      mesh,
      mockModule('test-name-module', '1.0.0'),
      config,
      (e) => {
        if (e) return done(e);
        mesh._mesh.data.set(
          {
            callbackAddress: '/callback/address',
            origin: {
              id: 1,
            },
          },
          { path: '/test/path' }
        );
      }
    );
  });

  it('#reply method - publish failed', function (done) {
    let ComponentInstance = require('../../../lib/system/component-instance');
    let componentInstance = new ComponentInstance();
    let mesh = mockMesh('test-mesh-name');
    let config = mockConfig();
    componentInstance.name = 'test-component-instance';
    mesh._mesh.data.publish = (_callbackAddress, _response, _options, cb) => {
      cb(new Error('test error'));
      setTimeout(() => {
        test
          .expect(componentInstance.log.error.lastCall.args[0])
          .to.be('Failure to set callback data on address /callback/address');
        done();
      }, 1e3);
    };
    componentInstance.operate = (method, args, cb) => {
      cb(null, {});
    };
    componentInstance.initialize(
      'test-component-instance',
      mesh,
      mockModule('test-name-module', '1.0.0'),
      config,
      (e) => {
        if (e) return done(e);
        mesh._mesh.data.set(
          {
            callbackAddress: '/callback/address',
            origin: {
              id: 1,
            },
          },
          { path: '/test/path' }
        );
      }
    );
  });

  it('#reply method - no client', function (done) {
    let ComponentInstance = require('../../../lib/system/component-instance');
    let componentInstance = new ComponentInstance();
    let mesh = mockMesh('test-mesh-name');
    let config = mockConfig();
    componentInstance.name = 'test-component-instance';
    mesh._mesh.data.publish = (_callbackAddress, _response, _options, cb) => {
      cb(new Error('client is disconnected'));
      setTimeout(() => {
        test
          .expect(componentInstance.log.warn.lastCall.args[0])
          .to.be(
            'Failure to set callback data on address /callback/address:client is disconnected'
          );
        done();
      }, 1e3);
    };
    componentInstance.operate = (method, args, cb) => {
      cb(null, {});
    };
    componentInstance.initialize(
      'test-component-instance',
      mesh,
      mockModule('test-name-module', '1.0.0'),
      config,
      (e) => {
        if (e) return done(e);
        mesh._mesh.data.set(
          {
            callbackAddress: '/callback/address',
            origin: {
              id: 1,
            },
          },
          { path: '/test/path' }
        );
      }
    );
  });

  it('#reply method - missing peer', function (done) {
    let ComponentInstance = require('../../../lib/system/component-instance');
    let componentInstance = new ComponentInstance();
    let mesh = mockMesh('test-mesh-name');
    let config = mockConfig();
    componentInstance.name = 'test-component-instance';
    componentInstance.operate = (method, args, cb) => {
      cb(null, {});
    };
    componentInstance.initialize(
      'test-component-instance',
      mesh,
      mockModule('test-name-module', '1.0.0'),
      config,
      (e) => {
        if (e) return done(e);
        mesh._mesh.data.set(
          {
            callbackAddress: '/callback/address',
            callbackPeer: 'test-peer',
            origin: {
              id: 1,
            },
          },
          { path: '/test/path' }
        );
        setTimeout(() => {
          test
            .expect(componentInstance.log.warn.lastCall.args[0])
            .to.be(`Failure on callback, missing peer: test-peer`);
          done();
        }, 1e3);
      }
    );
  });

  it('can detatch', function (done) {
    initializeComponent((e, componentInstance, mesh) => {
      if (e) return done(e);
      componentInstance.detatch(mesh._mesh, (e) => {
        if (e) return done(e);
        test
          .expect(mesh._mesh.data.offPath.lastCall.args[0])
          .to.be('/_exchange/requests/undefined/test-component-instance/*');
        done();
      });
    });
  });

  it('fails to detatch', function (done) {
    initializeComponent((e, componentInstance, mesh) => {
      if (e) return done(e);
      mesh._mesh.data.offPath = test.sinon.stub().callsArgWith(1, new Error('test-error'));
      componentInstance.detatch(mesh._mesh, (e) => {
        test.expect(e.message).to.be('test-error');
        test
          .expect(componentInstance.log.warn.lastCall.args[0])
          .to.be(
            'half detatched, failed to remove request listener: /_exchange/requests/undefined/test-component-instance/*, error: test-error'
          );
        done();
      });
    });
  });

  it('attach web route: bad target method', function (done) {
    initializeComponent(
      {
        merge: {
          config: {
            web: {
              routes: {
                'test/routebad': 'testMethodBad',
              },
            },
          },
        },
      },
      (e) => {
        test
          .expect(e.message)
          .to.be(
            'Middleware target test-component-instance:testMethodBad not a function or null, check your happner web routes config'
          );
        done();
      }
    );
  });

  function initializeComponent(mocks, callback) {
    if (typeof mocks === 'function') {
      callback = mocks;
      mocks = {};
    }
    let ComponentInstance = require('../../../lib/system/component-instance');
    let componentInstance = new ComponentInstance();
    let mesh = mockMesh('test-mesh-name', mocks.data, mocks.peers, mocks?.merge?.mesh || undefined);
    let config = mockConfig(mocks?.merge?.config || undefined);
    componentInstance.name = 'test-component-instance';
    componentInstance.initialize(
      'test-component-instance',
      mesh,
      mockModule('test-name-module', '1.0.0'),
      config,
      (e) => {
        if (e) return callback(e);
        componentInstance.describe();
        callback(null, componentInstance, mesh, config);
      }
    );
  }

  it('operate method, blue sky, no auth necessary', function (done) {
    initializeComponent((e, componentInstance) => {
      if (e) return done(e);
      //methodName, parameters, callback, origin, version, originBindingOverride
      componentInstance.operate('testMethod1', [1, 2], (e, response) => {
        if (e) return done(e);
        if (response[0]) return done(response[0]);
        test.expect(response[1]).to.be('method 1 called: 1,2');
        done();
      });
    });
  });

  it('operate method, errored, no auth necessary', function (done) {
    initializeComponent((e, componentInstance) => {
      if (e) return done(e);
      //methodName, parameters, callback, origin, version, originBindingOverride
      componentInstance.operate('testMethodErrored', [1, 2], (e, response) => {
        if (e) return done(e);
        test.expect(response[0].message).to.be('test error');
        done();
      });
    });
  });

  xit('operate method, authorized', function (done) {
    initializeComponent((e, componentInstance) => {
      if (e) return done(e);
      //methodName, parameters, callback, origin, version, originBindingOverride
      componentInstance.operate('testMethodUnauthorized', [1, 2], (e, response) => {
        if (e) return done(e);
        if (response[0]) return done(response[0]);
        test.expect(response[1]).to.be('method 1 called: 1,2');
        done();
      });
    });
  });

  xit('operate method, unauthorized', function (done) {
    initializeComponent((e, componentInstance) => {
      if (e) return done(e);
      //methodName, parameters, callback, origin, version, originBindingOverride
      componentInstance.operate('testMethodUnauthorized', [1, 2], (e, response) => {
        if (e) return done(e);
        if (response[0]) return done(response[0]);
        test.expect(response[1]).to.be('method 1 called: 1,2');
        done();
      });
    });
  });

  it('tests the semver component', () => {
    let semver = require('happner-semver');
    test.expect(semver.satisfies('1.0.1', '^1.0.0')).to.be(true);
    test.expect(semver.satisfies('2.0.0', '^1.0.0')).to.be(false);
    test.expect(semver.satisfies('1.0.0-prerelease-1', '^1.0.0')).to.be(false);
    test.expect(semver.coercedSatisfies('1.0.0-prerelease-1', '^1.0.0')).to.be(true);
    test.expect(semver.coercedSatisfies('2.0.0-prerelease-1', '^1.0.0')).to.be(false);
    test.expect(semver.satisfies('1.0.1', '*')).to.be(true);
    test.expect(semver.coercedSatisfies('2.0.0-prerelease-1', '*')).to.be(true);
    test.expect(semver.satisfies('1.0.1', '*')).to.be(true);
    test.expect(semver.coercedSatisfies('1.0.3-smc-842-1', '^1.0.0')).to.be(true);
    test.expect(semver.coercedSatisfies('16.1.4-prerelease-9', '16.1.4-prerelease-9')).to.be(true);
  });

  function mockModuleInstance() {
    class MockModule {
      static create() {
        return new MockModule();
      }
      async testMethod1(arg11, arg12) {
        await test.delay(10);
        let message = `method 1 called: ${[arg11, arg12].join(',')}`;
        test.log(message);
        return message;
      }
      async testMethod2(arg21, arg22) {
        await test.delay(10);
        test.log(`method 2 called, ${[arg21, arg22]}`);
      }
      async testMethod3(arg31, arg32) {
        await test.delay(10);
        test.log(`method 3 called, ${[arg31, arg32]}`);
      }
      async testMethod4(arg41, arg42) {
        await test.delay(10);
        test.log(`method 4 called, ${[arg41, arg42]}`);
      }
      async testMethod5(arg41, arg42) {
        await test.delay(10);
        test.log(`method 4 called, ${[arg41, arg42]}`);
      }
      async staticHandler(arg41, arg42) {
        await test.delay(10);
        test.log(`method 4 called, ${[arg41, arg42]}`);
      }
      async testMethodUnauthorized() {
        await test.delay(10);
        test.log('should not have happened');
      }
      async testMethodErrored() {
        await test.delay(10);
        throw new Error('test error');
      }
    }
    return MockModule.create();
  }
  function mockLogger() {
    return {
      info: test.sinon.stub(),
      error: test.sinon.stub(),
      debug: test.sinon.stub(),
      trace: test.sinon.stub(),
      $$TRACE: test.sinon.stub(),
      warn: test.sinon.stub(),
    };
  }
  function mockMesh(name, data, peers, mergeConfig = {}) {
    let onHandler;
    const mockedMesh = {
      _mesh: {
        config: {
          name,
          happn: {},
          web: {
            routes: ['test-component-instance/static'],
          },
        },
        log: {
          createLogger: () => {
            return mockLogger();
          },
        },
        happn: {
          server: {
            connect: {
              use: test.sinon.stub(),
              stack: [
                {
                  handle: {
                    __tag: 'test-component-instance',
                  },
                },
              ],
            },
            services: {
              cache: {
                getOrCreate: test.sinon.stub().returns(mockCache()),
              },
              security: {
                on: test.sinon.stub(),
              },
              orchestrator: {
                peers: peers || {},
              },
            },
          },
        },
        data: {
          set: (publication, meta) => {
            onHandler(publication, meta);
          },
          offPath: test.sinon.stub().callsArg(1),
          on: (_event, _options, handler, cb) => {
            onHandler = handler;
            cb();
          },
        },
      },
    };
    return test.commons._.merge(mockedMesh, mergeConfig);
  }
  function mockModule(name, version) {
    return {
      name,
      version,
      instance: mockModuleInstance(),
    };
  }
  function mockConfig(mergeConfig = {}) {
    return test.commons._.merge(
      {
        methods: {
          testMethod1: {
            parameters: [
              {
                name: 'arg11',
              },
              {
                name: 'arg12',
              },
            ],
          },
          testMethod2: {},
        },
        events: {},
        web: {
          routes: {
            'test/route/1': ['testMethod3', 'testMethod4'],
            'test/route/2': 'testMethod5',
            static: 'staticHandler',
          },
        },
      },
      mergeConfig
    );
  }
  function mockCache() {
    return new LRUCache('test', {
      cache: {
        max: 5,
      },
    });
  }
});
