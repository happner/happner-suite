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

  xit('operate method', function (done) {
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
        test.log(`method 1 called, ${[arg11, arg12]}`);
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
  function mockMesh(name, data, peers) {
    let onHandler;
    const mockMesh = {
      _mesh: {
        config: {
          name,
          happn: {},
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
            },
            services: {
              cache: {
                getOrCreate: test.sinon.stub().returns(mockCache()),
              },
              security: {
                on: test.sinon.stub(),
              },
              orchestrator: {
                peers,
              },
            },
          },
        },
        data: {
          set: (publication, meta) => {
            onHandler(publication, meta);
          },
          on: (_event, _options, handler, cb) => {
            onHandler = handler;
            cb();
          },
        },
      },
    };
    return mockMesh;
  }
  function mockModule(name, version) {
    return {
      name,
      version,
      instance: mockModuleInstance(),
    };
  }
  function mockConfig() {
    return {
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
    };
  }
  function mockCache() {
    return new LRUCache('test', {
      cache: {
        max: 5,
      },
    });
  }
});
