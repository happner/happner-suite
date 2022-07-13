const LRUCache = require('happn-3/lib/services/cache/cache-lru');
const ComponentInstance = require('../../../lib/system/component-instance');
const eventEmitter = require('events').EventEmitter;
const ComponentInstanceBoundFactory = require('../../../lib/system/component-instance-bound-factory');
const utilities = require('../../../lib/system/utilities');

require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3, only: true }, (test) => {
  const mockLogObj = {
    info: test.sinon.stub(),
    error: test.sinon.stub(),
    debug: test.sinon.stub(),
    trace: test.sinon.stub(),
    $$TRACE: test.sinon.stub(),
    warn: test.sinon.stub(),
  };

  beforeEach(() => {
    test.sinon.restore();
  });

  it('checks all the getters', function () {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockCallback = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);

    // test all getters
    test.chai.expect(componentInstance.Mesh).to.be.instanceOf(Function);
    test.chai.expect(componentInstance.name).to.equal('mockName');
    test.chai.expect(componentInstance.config).to.equal(config);
    test.chai.expect(componentInstance.info).to.eql({
      happn: {
        address: {
          protocol: 'http',
        },
        options: undefined,
      },
      mesh: {
        domain: undefined,
        name: 'test-mesh-name',
      },
    });
    test.chai.expect(componentInstance.mesh).to.be.instanceOf(ComponentInstance);
    test.chai.expect(componentInstance.mesh.constructor.name).to.equal('ComponentInstance');
    test.chai.expect(componentInstance.module).to.eql({
      instance: {},
      name: 'test-module',
      version: 'mockVersion',
    });

    const loggers = ['info', 'error', 'debug', 'trace', '$$TRACE', 'warn'];
    loggers.forEach((log) => test.chai.expect(componentInstance.log).to.have.ownProperty(log));

    test.chai.expect(componentInstance.localEventEmitter).to.be.instanceOf(eventEmitter);
    test.chai.expect(componentInstance.tools).to.equal('mockTools');
  });

  it('tests isAuthorized method', async function () {
    let componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockCallback = test.sinon.stub();

    (mesh._mesh.happn.server.services.security.authorizeOnBehalfOf = test.sinon
      .stub()
      .withArgs('', '', '', '', test.sinon.match.func)
      .callsArgWith(4, null, false, 'mockReason')),
      componentInstance.initialize('mockName', mesh, module, config, mockCallback);

    const result = componentInstance.isAuthorized('mockUsername', { methods: ['mockMethod'] });

    await test.chai.expect(result).to.eventually.eql({
      forbidden: [
        {
          authorized: false,
          reason: 'mockReason',
          path: '/_exchange/requests/mockMethod',
          action: 'set',
        },
      ],
      authorized: false,
    });
  });

  it('checks all the getters', function () {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockCallback = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);

    // test all getters
    test.chai.expect(componentInstance.Mesh).to.be.instanceOf(Function);
    test.chai.expect(componentInstance.name).to.equal('mockName');
    test.chai.expect(componentInstance.config).to.equal(config);
    test.chai.expect(componentInstance.info).to.eql({
      happn: {
        address: {
          protocol: 'http',
        },
        options: undefined,
      },
      mesh: {
        domain: undefined,
        name: 'test-mesh-name',
      },
    });
    test.chai.expect(componentInstance.mesh).to.be.instanceOf(ComponentInstance);
    test.chai.expect(componentInstance.mesh.constructor.name).to.equal('ComponentInstance');
    test.chai.expect(componentInstance.module).to.eql({
      instance: {},
      name: 'test-module',
      version: 'mockVersion',
    });

    const loggers = ['info', 'error', 'debug', 'trace', '$$TRACE', 'warn'];
    loggers.forEach((log) => test.chai.expect(componentInstance.log).to.have.ownProperty(log));

    test.chai.expect(componentInstance.localEventEmitter).to.be.instanceOf(eventEmitter);
    test.chai.expect(componentInstance.tools).to.equal('mockTools');
  });

  it('describe method', function (done) {
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
          data: 'mockData',
        });
        done();
      }
    );
  });

  it('describe method, without config', function (done) {
    let componentInstance = new ComponentInstance();
    let mesh = mockMesh('test-mesh-name');
    // let config = mockConfig();
    let config = {};
    // delete config.web;
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
        const result = componentInstance.describe(false);
        test.chai.expect(result).to.eql({
          name: 'test-component-instance',
          version: '1.0.0',
          methods: {
            staticHandler: {
              isAsyncMethod: true,
              parameters: [{ name: 'arg1' }, { name: 'arg2' }],
            },
            testMethod1: {
              isAsyncMethod: true,
              parameters: [{ name: 'arg11' }, { name: 'arg12' }],
            },
            testMethod2: {
              isAsyncMethod: true,
              parameters: [{ name: 'arg21' }, { name: 'arg22' }],
            },
            testMethod3: {
              isAsyncMethod: true,
              parameters: [{ name: 'arg31' }, { name: 'arg32' }],
            },
            testMethod4: {
              isAsyncMethod: true,
              parameters: [{ name: 'arg41' }, { name: 'arg42' }],
            },
            testMethod5: {
              isAsyncMethod: true,
              parameters: [{ name: 'arg41' }, { name: 'arg42' }],
            },
            testMethodErrored: { isAsyncMethod: true, parameters: [{ name: '' }] },
            testMethodUnauthorized: { isAsyncMethod: true, parameters: [{ name: '' }] },
          },
          routes: {},
          events: {},
          data: {},
        });
        done();
      }
    );
  });

  it('describe method, with config', function (done) {
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
        const result = componentInstance.describe(false);
        test.chai.expect(result).to.eql({
          name: 'test-component-instance',
          version: '1.0.0',
          methods: {
            testMethod1: {
              isAsyncMethod: true,
              parameters: [{ name: 'arg11' }, { name: 'arg12' }],
            },
            testMethod2: {
              isAsyncMethod: true,
              parameters: [{ name: 'arg21' }, { name: 'arg22' }],
            },
            testMethodErrored: { isAsyncMethod: true, parameters: [{ name: '' }] },
            testMethodUnauthorized: { isAsyncMethod: true, parameters: [{ name: '' }] },
          },
          routes: {
            '/test-component-instance/test/route/1': { type: 'mware' },
            '/test-component-instance/test/route/2': { type: 'mware' },
            '/': { type: 'mware' },
          },
          events: {},
          data: 'mockData',
        });
        done();
      }
    );
  });

  it('describe method - cached', function (done) {
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

  it("tests detatch method - remove this component's middleware from the connect stack.", () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockCallback = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);
    componentInstance.description = {
      methods: {},
    };

    test.sinon
      .stub(ComponentInstanceBoundFactory, 'create')
      .returns({ originBindingNecessary: test.sinon.stub() });

    componentInstance.detatch(mesh._mesh, mockCallback);

    test.chai
      .expect(mockLogObj.trace)
      .to.have.been.calledWithExactly('removing mware at %s', 'mockRoute');
    test.chai.expect(mesh._mesh.happn.server.connect.stack.length).to.equal(1);
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

  it('method operate - returns callback with error ', () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = {
      instance: {
        mockMethod: test.sinon.stub().throws(new Error('mock test')),
        version: 'mockVersion',
      },
    };
    const config = mockConfig();
    const mockMethodName = 'mockMethod';
    const mockParameters = [1, 2];
    const mockCallback = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);
    componentInstance.description = {
      methods: {
        mockMethod: { name: 'mockName' },
      },
    };

    test.sinon
      .stub(ComponentInstanceBoundFactory, 'create')
      .returns({ originBindingNecessary: test.sinon.stub() });

    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback,
      'mockOrigin',
      null,
      'originBindingOverride'
    );
    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback,
      'mockOrigin',
      null,
      'originBindingOverride'
    );
    test.chai
      .expect(mockCallback)
      .to.have.been.calledWithExactly(null, [test.sinon.match.instanceOf(Error)]);
  });

  it('method operate - method has been configured as a promise with a callback ', () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = {
      instance: {
        mockMethod: test.sinon.stub(),
        version: 'mockVersion',
      },
    };
    const config = mockConfig();
    const mockMethodName = 'mockMethod';
    const mockParameters = [1, 2];
    const mockCallback = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);
    componentInstance.description = {
      methods: {
        mockMethod: { parameters: [{ type: 'callback' }] },
      },
    };

    test.sinon
      .stub(ComponentInstanceBoundFactory, 'create')
      .returns({ originBindingNecessary: test.sinon.stub() });

    test.sinon.stub(utilities, 'isPromise').returns('mockResult');

    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback,
      'mockOrigin',
      null,
      'originBindingOverride'
    );

    test.chai
      .expect(mockLogObj.warn)
      .to.have.been.calledWithExactly('method has been configured as a promise with a callback...');
  });

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
      componentInstance.operate('testMethodErrored', [1, 2], (e, response) => {
        if (e) return done(e);
        test.expect(response[0].message).to.be('test error');
        done();
      });
    });
  });

  it('operate method, unauthorized', function (done) {
    const onBehalfOf = { username: 'unknown', override: true };
    initializeComponent(
      {
        onBehalfOf,
        authorize: (_session, _path, _action, callback) => {
          callback(null, false);
        },
      },
      (e, componentInstance) => {
        if (e) return done(e);
        //methodName, parameters, callback, origin, version, originBindingOverride
        componentInstance.operate(
          'testMethodUnauthorized',
          [1, 2],
          (e) => {
            test.expect(e.message).to.be('unauthorized');
            done();
          },
          onBehalfOf
        );
      }
    );
  });

  it('operate method, authorized', function (done) {
    const onBehalfOf = { username: 'found', override: true };
    initializeComponent(
      {
        onBehalfOf,
        authorize: (_session, _path, _action, callback) => {
          callback(null, true);
        },
      },
      (e, componentInstance) => {
        if (e) return done(e);
        //methodName, parameters, callback, origin, version, originBindingOverride
        componentInstance.operate(
          'testMethod1',
          [1, 2],
          (e, response) => {
            if (e) return done(e);
            if (response[0]) return done(response[0]);
            test.expect(response[1]).to.be('method 1 called: 1,2');
            done();
          },
          onBehalfOf
        );
      }
    );
  });

  it('tests operate method, returns if method is not found', () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockMethodName = null;
    const mockParameters = [1, 2];
    const mockCallback = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);
    componentInstance.description = {
      methods: {},
    };

    test.sinon
      .stub(ComponentInstanceBoundFactory, 'create')
      .returns({ originBindingNecessary: test.sinon.stub() });

    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback,
      'mockOrigin',
      'mockVersion',
      'originBindingOverride'
    );

    test.chai
      .expect(mockLogObj.warn)
      .to.have.been.calledWithExactly(
        'Missing method:Call to unconfigured method [mockName.null()]'
      );
    test.chai
      .expect(mockCallback)
      .to.have.been.calledWithExactly(test.sinon.match.instanceOf(Error));
  });

  it('tests operate method, returns if component version does not match module version', () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockMethodName = 'testMethod1';
    const mockParameters = [1, 2];
    const mockCallback = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);
    componentInstance.description = {
      methods: { testMethod1: test.sinon.stub() },
    };

    test.sinon
      .stub(ComponentInstanceBoundFactory, 'create')
      .returns({ originBindingNecessary: test.sinon.stub() });

    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback,
      'mockOrigin',
      'version',
      'originBindingOverride'
    );

    test.chai
      .expect(mockLogObj.warn)
      .to.have.been.calledWithExactly(
        `Component version mismatch:Call to unconfigured method [${'mockName.testMethod1'}]: request version [${'version'}] does not match component version [${'mockVersion'}]`
      );
    test.chai
      .expect(mockCallback)
      .to.have.been.calledWithExactly(test.sinon.match.instanceOf(Error));
  });

  it('test operate method, returns callback with result', async () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = {
      instance: {
        mockMethod: test.sinon.stub().returns('mockResult'),
        version: 'mockVersion',
      },
    };
    const config = mockConfig();
    const mockMethodName = 'mockMethod';
    const mockParameters = [1, 2];
    const mockCallback = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);
    componentInstance.description = {
      methods: {
        mockMethod: { type: 'sync-promise' },
      },
    };

    test.sinon
      .stub(ComponentInstanceBoundFactory, 'create')
      .returns({ originBindingNecessary: test.sinon.stub() });

    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback,
      'mockOrigin',
      null,
      'originBindingOverride'
    );

    test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, [null, 'mockResult']);
  });

  it('test operate method, returns callback with error', async () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = {
      instance: {
        mockMethod: test.sinon.stub().throws(new Error('mockError')),
        version: 'mockVersion',
      },
    };
    const config = mockConfig();
    const mockMethodName = 'mockMethod';
    const mockParameters = [1, 2];
    const mockCallback = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);
    componentInstance.description = {
      methods: {
        mockMethod: { type: 'sync-promise' },
      },
    };

    test.sinon
      .stub(ComponentInstanceBoundFactory, 'create')
      .returns({ originBindingNecessary: test.sinon.stub() });

    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback,
      'mockOrigin',
      null,
      'originBindingOverride'
    );

    test.chai
      .expect(mockCallback)
      .to.have.been.calledWithExactly(null, [test.sinon.match.instanceOf(Error)]);
  });

  it('tests on method, returns event', () => {
    const onStub = test.sinon.stub(eventEmitter.prototype, 'on').returns('test event');

    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockCallback = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);

    const result = componentInstance.on('mockEvent', 'mockHandler');

    test.chai.expect(result).to.equal('test event');
    test.chai
      .expect(mockLogObj.trace)
      .to.have.been.calledWithExactly('component on called', 'mockEvent');

    onStub.restore();
  });

  it('tests on method, catches and logs error', () => {
    const onStub = test.sinon.stub(eventEmitter.prototype, 'on').throws(new Error('test error'));

    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockCallback = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);

    componentInstance.on('mockEvent', 'mockHandler');

    test.chai
      .expect(mockLogObj.trace)
      .to.have.been.calledWithExactly('component on error', test.sinon.match.instanceOf(Error));

    onStub.restore();
  });

  it('tests offEvent method, catches and logs error', () => {
    const offStub = test.sinon.stub(eventEmitter.prototype, 'off').returns('test event');

    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockCallback = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);

    const result = componentInstance.offEvent('mockEvent', 'mockHandler');

    test.chai.expect(result).to.equal('test event');
    test.chai
      .expect(mockLogObj.trace)
      .to.have.been.calledWithExactly('component offEvent called', 'mockEvent');

    offStub.restore();
  });

  it('tests offEvent method, catches and logs error', () => {
    const offStub = test.sinon.stub(eventEmitter.prototype, 'off').throws(new Error('test error'));

    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockCallback = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);

    componentInstance.offEvent('mockEvent', 'mockHandler');

    test.chai
      .expect(mockLogObj.trace)
      .to.have.been.calledWithExactly(
        'component offEvent error',
        test.sinon.match.instanceOf(Error)
      );

    offStub.restore();
  });

  it('tests emitEvent method, returns event', () => {
    const emitStub = test.sinon.stub(eventEmitter.prototype, 'emit').returns('test event');

    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockCallback = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);

    const result = componentInstance.emitEvent('mockEvent', 'mockData');

    test.chai.expect(result).to.equal('test event');
    test.chai
      .expect(mockLogObj.trace)
      .to.have.been.calledWithExactly('component emitEvent called', 'mockEvent');

    emitStub.restore();
  });

  it('tests emitEvent method, catches and logs error', () => {
    const onStub = test.sinon.stub(eventEmitter.prototype, 'emit').throws(new Error('test error'));

    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockCallback = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);

    componentInstance.emitEvent('mockEvent', 'mockData');

    test.chai
      .expect(mockLogObj.trace)
      .to.have.been.calledWithExactly(
        'component emitEvent error',
        test.sinon.match.instanceOf(Error)
      );

    onStub.restore();
  });

  xit('tests #attach method', function () {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockCallback = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);
  });

  it('serving method via connect, authorized', function (done) {
    const onBehalfOf = { username: 'found', override: true };
    initializeComponent(
      {
        onBehalfOf,
        authorize: (_session, _path, _action, callback) => {
          callback(null, true);
        },
        sessionFromRequest: { username: 'found', override: true },
      },
      (e, _componentInstance, mesh) => {
        if (e) return done(e);
        mesh.__middlewares['/test-component-instance/static']('connect1', 'connect2')
          .then(() => {
            test.expect(test.log.lastCall.args[0]).to.be('static method called: connect1,connect2');
            done();
          })
          .catch(done);
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

  function initializeComponent(mocks, callback) {
    if (typeof mocks === 'function') {
      callback = mocks;
      mocks = {};
    }
    let componentInstance = new ComponentInstance();
    let mesh = mockMesh(
      'test-mesh-name',
      mocks.data,
      mocks.peers,
      mocks?.merge?.mesh || undefined,
      mocks.onBehalfOf,
      mocks.authorize,
      mocks.sessionFromRequest
    );
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

  function mockModuleInstance() {
    class MockModule {
      static create() {
        return new MockModule();
      }
      async testMethod1(arg11, arg12) {
        await test.delay(10);
        let message = `method 1 called: ${[arg11, arg12]}`;
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
        let message = `method 4 called: ${[arg41, arg42]}`;
        test.log(message);
        return message;
      }
      async testMethod5(arg41, arg42) {
        await test.delay(10);
        test.log(`method 5 called: ${[arg41, arg42]}`);
      }
      async staticHandler(arg1, arg2) {
        await test.delay(10);
        test.log(`static method called: ${[arg1, arg2]}`);
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
    return mockLogObj;
  }
  function mockMesh(
    name,
    data,
    peers,
    mergeConfig = {},
    onBehalfOf,
    authorize,
    sessionFromRequest
  ) {
    let onHandler;
    let middlewares = {};
    const mockedMesh = {
      tools: 'mockTools',
      __middlewares: middlewares,
      _mesh: {
        config: {
          name,
          happn: {
            secure: true,
          },
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
            server: {
              address: test.sinon.stub().returns({ protocol: null }),
            },
            connect: {
              use: (path, serve) => {
                middlewares[path] = serve;
              },
              stack: [
                {
                  handle: {
                    __tag: 'test-component-instance',
                  },
                },
                {
                  handle: {
                    __tag: 'mockName',
                  },
                  route: 'mockRoute',
                },
              ],
            },
            services: {
              cache: {
                getOrCreate: test.sinon.stub().returns(mockCache()),
              },
              session: {
                getSession: test.sinon.stub(),
              },
              security: {
                authorizeOnBehalfOf: test.sinon.stub(),
                sessionFromRequest: test.sinon.stub().returns(sessionFromRequest),
                on: test.sinon.stub(),
                authorize,
                getOnBehalfOfSession:
                  onBehalfOf?.message != null
                    ? test.sinon.stub().callsArgWith(3, onBehalfOf)
                    : onBehalfOf != null
                    ? test.sinon.stub().callsArgWith(3, null, onBehalfOf)
                    : test.sinon.stub().callsArgWith(3, null, null),
              },
              orchestrator: {
                peers: peers || {},
              },
              error: {
                AccessDeniedError: (message) => {
                  return new Error(message);
                },
              },
            },
          },
        },
        data: {
          session: {
            id: 1,
          },
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
        data: 'mockData',
        schema: {
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
