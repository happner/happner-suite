const LRUCache = require('happn-3/lib/services/cache/cache-lru');
const ComponentInstance = require('../../../lib/system/component-instance');
const eventEmitter = require('events').EventEmitter;
const ComponentInstanceBoundFactory = require('../../../lib/system/component-instance-bound-factory');
const utilities = require('../../../lib/system/utilities');

require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
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

  it('tests initialize method, config.accessLevel equal to root, creates _mesh variable', function () {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    config.accessLevel = 'root';
    const mockCallback = test.sinon.stub();

    const getBoundComponentStub = test.sinon
      .stub(ComponentInstanceBoundFactory, 'create')
      .returns({ getBoundComponent: test.sinon.stub().returns('mockComponent') });

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);

    test.expect(componentInstance._mesh).to.eql(mesh._mesh);

    getBoundComponentStub.restore();
  });

  it('tests as method', function () {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockCallback = test.sinon.stub();

    const getBoundComponentStub = test.sinon
      .stub(ComponentInstanceBoundFactory, 'create')
      .returns({ getBoundComponent: test.sinon.stub().returns('mockComponent') });

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);

    const result = componentInstance.as(
      'mockUserName',
      'mockComponentName',
      'mockMethodName',
      'mockSessionType'
    );

    test.chai.expect(result).to.equal('mockComponent');

    getBoundComponentStub.restore();
  });

  it('tests #default method', function () {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    module.instance.$happner.config.component.events = 'mockEvent';
    const config = mockConfig();
    config.events = 'mockEvent';
    const mockCallback = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);

    test.chai.expect(config).to.have.ownProperty('keyOne').that.equals('keyOne');
    test.chai.expect(config).to.have.ownProperty('keyTwo').that.equals('keyTwo');
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
        domain: 'mockDomain',
        name: 'test-mesh-name',
      },
    });
    test.chai.expect(componentInstance.mesh).to.be.instanceOf(ComponentInstance);
    test.chai.expect(componentInstance.mesh.constructor.name).to.equal('ComponentInstance');
    test.chai.expect(componentInstance.module).to.eql({
      instance: {
        $happner: {
          config: {
            component: {
              keyOne: 'keyOne',
              keyTwo: 'keyTwo',
            },
          },
        },
      },
      name: 'test-module',
      version: 'mockVersion',
    });

    const loggers = ['info', 'error', 'debug', 'trace', '$$TRACE', 'warn'];
    loggers.forEach((log) => test.chai.expect(componentInstance.log).to.have.ownProperty(log));

    test.chai.expect(componentInstance.localEventEmitter).to.be.instanceOf(eventEmitter);
    test.chai.expect(componentInstance.tools).to.equal('mockTools');
  });

  it('tests #inject method - parameters.length is less then methodDefn.$argumentsLength', () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const mockModule = {
      instance: {
        mockMethodName: test.sinon.stub().returns('mockResult'),
        version: 'mockVersion',
      },
    };
    const config = mockConfig();
    const mockMethodName = 'mockMethodName';
    const mockParameters = [1, 2];
    const mockCallback1 = test.sinon.stub();
    const mockCallback2 = test.sinon.stub();

    const origin = 'mockOrigin';
    const verion = null;
    const originBindingOverride = 'mockBinding';

    componentInstance.description = { methods: { mockMethodName: { type: 'sync-promise' } } };

    componentInstance.initialize('mockName', mesh, mockModule, config, mockCallback1);

    mockModule.instance.mockMethodName.$argumentsLength = 3;

    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback2,
      origin,
      verion,
      originBindingOverride
    );

    test.chai.expect(mockCallback2).to.have.been.calledWithExactly(null, [null, 'mockResult']);
    test.chai.expect(mockModule.instance.mockMethodName).to.have.been.calledWith(1, 2);
  });

  it('tests #inject method - methodDefn.$happnSeq is less then methodDefn.$originSeq', () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const mockModule = {
      instance: {
        mockMethodName: test.sinon.stub().returns('mockResult'),
        version: 'mockVersion',
      },
    };
    const config = mockConfig();
    const mockMethodName = 'mockMethodName';
    const mockParameters = [1, 2];
    const mockCallback1 = test.sinon.stub();
    const mockCallback2 = test.sinon.stub();

    const origin = 'mockOrigin';
    const verion = null;
    const originBindingOverride = 'mockBinding';

    componentInstance.description = { methods: { mockMethodName: { type: 'sync-promise' } } };

    componentInstance.initialize('mockName', mesh, mockModule, config, mockCallback1);

    mockModule.instance.mockMethodName.$happnSeq = 3;
    mockModule.instance.mockMethodName.$originSeq = 4;

    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback2,
      origin,
      verion,
      originBindingOverride
    );

    test.chai.expect(mockCallback2).to.have.been.calledWithExactly(null, [null, 'mockResult']);
    test.chai
      .expect(mockModule.instance.mockMethodName)
      .to.have.been.calledWithExactly(
        1,
        2,
        test.sinon.match.instanceOf(ComponentInstance),
        'mockOrigin'
      );
  });

  it('tests #inject method - methodDefn.$happnSeq is greater then methodDefn.$originSeq', () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const mockModule = {
      instance: {
        mockMethodName: test.sinon.stub().returns('mockResult'),
        version: 'mockVersion',
      },
    };
    const config = mockConfig();
    const mockMethodName = 'mockMethodName';
    const mockParameters = [1, 2];
    const mockCallback1 = test.sinon.stub();
    const mockCallback2 = test.sinon.stub();

    const origin = 'mockOrigin';
    const verion = null;
    const originBindingOverride = 'mockBinding';

    componentInstance.description = { methods: { mockMethodName: { type: 'sync-promise' } } };

    componentInstance.initialize('mockName', mesh, mockModule, config, mockCallback1);

    mockModule.instance.mockMethodName.$happnSeq = 5;
    mockModule.instance.mockMethodName.$originSeq = 4;

    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback2,
      origin,
      verion,
      originBindingOverride
    );

    test.chai.expect(mockCallback2).to.have.been.calledWithExactly(null, [null, 'mockResult']);
    test.chai
      .expect(mockModule.instance.mockMethodName)
      .to.have.been.calledWithExactly(
        1,
        2,
        'mockOrigin',
        test.sinon.match.instanceOf(ComponentInstance)
      );
  });

  it('tests #inject method - methodDefn.$originSeq is not equal to null', () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const mockModule = {
      instance: {
        mockMethodName: test.sinon.stub().returns('mockResult'),
        version: 'mockVersion',
      },
    };
    const config = mockConfig();
    const mockMethodName = 'mockMethodName';
    const mockParameters = [1, 2];
    const mockCallback = test.sinon.stub();

    const origin = 'mockOrigin';
    const verion = null;
    const originBindingOverride = 'mockBinding';

    componentInstance.description = { methods: { mockMethodName: { type: 'sync-promise' } } };
    componentInstance.initialize('mockName', mesh, mockModule, config, mockCallback);

    mockModule.instance.mockMethodName.$originSeq = 4;

    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback,
      origin,
      verion,
      originBindingOverride
    );

    test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, [null, 'mockResult']);
    test.chai
      .expect(mockModule.instance.mockMethodName)
      .to.have.been.calledWithExactly(1, 2, 'mockOrigin');
  });

  it('tests #inject method - methodDefn.$happnSeq is not equal to null', () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const mockModule = {
      instance: {
        mockMethodName: test.sinon.stub().returns('mockResult'),
        version: 'mockVersion',
      },
    };
    const config = mockConfig();
    const mockMethodName = 'mockMethodName';
    const mockParameters = [1, 2];
    const mockCallback1 = test.sinon.stub();
    const mockCallback2 = test.sinon.stub();

    const origin = 'mockOrigin';
    const verion = null;
    const originBindingOverride = 'mockBinding';

    componentInstance.description = { methods: { mockMethodName: { type: 'sync-promise' } } };
    componentInstance.initialize('mockName', mesh, mockModule, config, mockCallback1);

    mockModule.instance.mockMethodName.$happnSeq = 3;

    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback2,
      origin,
      verion,
      originBindingOverride
    );

    test.chai.expect(mockCallback2).to.have.been.calledWithExactly(null, [null, 'mockResult']);
    test.chai
      .expect(mockModule.instance.mockMethodName)
      .to.have.been.calledWithExactly(1, 2, test.sinon.match.instanceOf(ComponentInstance));
  });

  it('tests describe method', function (done) {
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

  it('tests describe method - loops over methods and returns this.describe method', () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = {
      instance: {
        method1: { $happner: { ignore: 'mockIgnore' } },
        _method2: {
          $happner: {},
        },
        testMethod1: {},
        testMethod2: {},
        testMethod3: {},
      },
    };
    const config = mockConfig();
    const mockCallback = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);

    const getAllMethodNameslStub = test.sinon
      .stub(utilities, 'getAllMethodNames')
      .returns(['method1', '_method2', 'testMethod1', 'testMethod2', 'testMethod3']);
    const getFunctionParametersStub = test.sinon
      .stub(utilities, 'getFunctionParameters')
      .returns([{ argName: 'mock' }]);

    config.schema = {
      methods: {
        testMethod1: { isAsyncMethod: 'mockIsAsyncMethod' },
        testMethod2: { isAsyncMethod: 'mockIsAsyncMethod', parameters: 'mockParameters' },
      },
      exclusive: 'mockExclusive',
    };

    componentInstance.describe(false);

    test.chai.expect(componentInstance.description).to.eql({
      name: 'mockName',
      version: undefined,
      methods: {
        testMethod1: { isAsyncMethod: false, parameters: [{ name: { argName: 'mock' } }] },
        testMethod2: { isAsyncMethod: false, parameters: 'mockParameters' },
      },
      routes: {
        '/mockName/test/route/1': { type: 'mware' },
        '/mockName/test/route/2': { type: 'mware' },
        '/': { type: 'mware' },
      },
      events: {},
      data: 'mockData',
    });

    getAllMethodNameslStub.restore();
    getFunctionParametersStub.restore();
  });

  it("tests describe method - methods doesn't exist inside config and returns description", () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = {
      instance: {},
    };
    const config = mockConfig();
    const mockCallback = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);

    config.schema = {};

    componentInstance.describe(false);

    test.chai.expect(componentInstance.description).to.eql({
      name: 'mockName',
      version: undefined,
      methods: {},
      routes: {
        '/mockName/test/route/1': { type: 'mware' },
        '/mockName/test/route/2': { type: 'mware' },
        '/': { type: 'mware' },
      },
      events: {},
      data: 'mockData',
    });
  });

  it('tests describe method, without config', function (done) {
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

  it('tests describe method, with config', function (done) {
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

  it('tests describe method - cached', function (done) {
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

  it('tests #authorizeOriginMethod - return callback when there is an error when authorize is called', () => {
    const mockAuthorize = test.sinon.stub();
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name', null, null, null, null, mockAuthorize, null);
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockCallback1 = test.sinon.stub();
    const mockCallback2 = test.sinon.stub().returns('test error');
    const mockMethodName = 'mockMethodName';
    const mockParameters = [1, 2];

    test.sinon
      .stub(ComponentInstanceBoundFactory.prototype, 'originBindingNecessary')
      .returns(true);

    mesh._mesh.happn.server.services.security.authorize.callsFake((_, __, ___, callback) => {
      callback('mockError', null);
    });

    componentInstance.initialize('mockName', mesh, module, config, mockCallback1);
    componentInstance.description = { methods: { mockMethodName: 'mockMethodName' } };
    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback2,
      'mockOrigin',
      null,
      'originBindingOverride'
    );

    test.chai.expect(mockCallback2).to.have.been.calledWithExactly('mockError');
  });

  it('tests #authorizeOriginMethod -  return callback when there is an error when getOnBehalfOfSession is called', () => {
    const mockAuthorize = test.sinon.stub();
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name', null, null, null, null, mockAuthorize, null);
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockCallback1 = test.sinon.stub();
    // const mockCallback2 = test.sinon.stub().returns('test error');
    const mockMethodName = 'mockMethodName';
    const mockParameters = [1, 2];

    test.sinon
      .stub(ComponentInstanceBoundFactory.prototype, 'originBindingNecessary')
      .returns(true);

    mesh._mesh.happn.server.services.security.getOnBehalfOfSession = test.sinon
      .stub()
      .callsFake((_, __, ___, callback) => {
        callback('mockError', null);
      });

    componentInstance.initialize('mockName', mesh, module, config, mockCallback1);
    componentInstance.description = { methods: { mockMethodName: 'mockMethodName' } };
    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback1,
      'mockOrigin',
      null,
      'originBindingOverride'
    );

    test.chai.expect(mockCallback1).to.have.been.calledWithExactly('mockError');
  });

  it('tests #parseWebRoutes - returns when name equals www and routePath equals global', () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = {
      instance: {},
    };
    const config = mockConfig();
    const mockCallback = test.sinon.stub();
    componentInstance.initialize('www', mesh, module, config, mockCallback);

    config.schema = {};
    config.web.routes.global = test.sinon.stub();
    config.web.routes.static = 'static';

    componentInstance.describe(false);

    test.chai.expect(componentInstance.description).to.eql({
      data: 'mockData',
      events: {},
      name: 'www',
      version: undefined,
      methods: {},
      routes: {
        '/test/route/1': { type: 'mware' },
        '/test/route/2': { type: 'mware' },
        '/': { type: 'static' },
      },
    });
  });

  it('tests #parseWebRoutes - name equals resources and routePath equals resources', () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = {
      instance: {},
    };
    const config = mockConfig();
    const mockCallback = test.sinon.stub();
    componentInstance.initialize('resources', mesh, module, config, mockCallback);

    config.schema = {};
    config.web.routes.resources = test.sinon.stub();

    componentInstance.describe(false);
    test.chai.expect(componentInstance.description).to.eql({
      data: 'mockData',
      events: {},
      name: 'resources',
      version: undefined,
      methods: {},
      routes: {
        '/resources/test/route/1': { type: 'mware' },
        '/resources/test/route/2': { type: 'mware' },
        '/': { type: 'mware' },
        '/resources': { type: 'mware' },
      },
    });
  });

  it('tests #createSetOptions method', () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const mockModule = { instance: { $happner: { config: { component: 'mock' } } } };
    const config = mockConfig();
    config.directResponses = 'directResponses';
    const mockCallback = test.sinon.stub();

    const e = new Error('mock Error');
    e.mockProperty = 'mockProperty';
    const mockArray = [e];

    config.web.routes = {
      'test/route/1': test.sinon.stub(),
      'test/route/2': test.sinon.stub(),
      static: test.sinon.stub(),
    };
    mesh._mesh.data.on.callsFake((subscribeMask, eventType, testFunc, cb) => {
      testFunc(
        {
          callbackAddress: '/callback/address',
          origin: {
            id: 'mockId',
          },
        },
        {
          path: "'mockPath'",
        }
      );
      cb(null, {});
    });
    mesh._mesh.data.publish = test.sinon
      .stub()
      .callsFake((callbackAddress, response, options, cb) => {
        cb();
      });

    componentInstance.operate = (method, args, cb) => {
      cb(null, mockArray);
    };
    componentInstance.initialize('mockName', mesh, mockModule, config, mockCallback);

    test.chai.expect(mesh._mesh.data.publish).to.have.been.calledWithExactly(
      '/callback/address',
      {
        status: 'error',
        args: [
          {
            message: 'mock Error',
            name: 'Error',
            mockProperty: 'mockProperty',
          },
        ],
      },
      { targetClients: ['mockId'] },
      test.sinon.match.func
    );
  });

  it('tests #reply method - publish ok', function (done) {
    let componentInstance = new ComponentInstance();
    let mesh = mockMesh('test-mesh-name');
    let config = mockConfig();
    componentInstance.name = 'test-component-instance';
    mesh._mesh.data.on.callsFake((subscribeMask, eventType, testFunc, cb) => {
      testFunc(
        {
          callbackAddress: '/callback/address',
          origin: {
            id: 'mockId',
          },
        },
        {
          path: 'mockPath',
        }
      );
      cb();
    });
    mesh._mesh.data.publish = (callbackAddress, response, options, cb) => {
      test.expect(callbackAddress).to.be('/callback/address');
      test.expect(response).to.eql({ status: 'ok', args: {} });
      test.chai.expect(options).to.eql(undefined);
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
          { path: '/test/path' },
          () => {}
        );
      }
    );
  });

  it('tests #reply method - publish failed', function (done) {
    let componentInstance = new ComponentInstance();
    let mesh = mockMesh('test-mesh-name');
    let config = mockConfig();
    componentInstance.name = 'test-component-instance';
    mesh._mesh.data.on.callsFake((subscribeMask, eventType, testFunc, cb) => {
      testFunc(
        {
          callbackAddress: '/callback/address',
          origin: {
            id: 'mockId',
          },
        },
        {
          path: 'mockPath',
        }
      );
      cb();
    });
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
          { path: '/test/path' },
          null,
          test.sinon.stub()
        );
      }
    );
  });

  it('tests #reply method - no client', function (done) {
    let componentInstance = new ComponentInstance();
    let mesh = mockMesh('test-mesh-name');
    let config = mockConfig();
    componentInstance.name = 'test-component-instance';
    mesh._mesh.data.on.callsFake((subscribeMask, eventType, testFunc, cb) => {
      testFunc(
        {
          callbackAddress: '/callback/address',
          origin: {
            id: 'mockId',
          },
        },
        {
          path: 'mockPath',
        }
      );
      cb();
    });
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
          { path: '/test/path' },
          null,
          test.sinon.stub()
        );
      }
    );
  });

  it('tests #reply method - missing peer', function (done) {
    let componentInstance = new ComponentInstance();
    let mesh = mockMesh('test-mesh-name');
    let config = mockConfig();
    componentInstance.name = 'test-component-instance';
    componentInstance.operate = (method, args, cb) => {
      cb(null, {});
    };
    mesh._mesh.data.on.callsFake((subscribeMask, eventType, testFunc, cb) => {
      testFunc(
        {
          callbackAddress: '/callback/address',
          callbackPeer: 'test-peer',
          origin: {
            id: 'mockId',
          },
        },
        {
          path: 'mockPath',
        }
      );
      cb();
    });
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
          { path: '/test/path' },
          null,
          test.sinon.stub()
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
          .to.be('/_exchange/requests/mockDomain/test-component-instance/*');
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
            'half detatched, failed to remove request listener: /_exchange/requests/mockDomain/test-component-instance/*, error: test-error'
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

    const createStub = test.sinon
      .stub(ComponentInstanceBoundFactory, 'create')
      .returns({ originBindingNecessary: test.sinon.stub() });

    componentInstance.detatch(mesh._mesh, mockCallback);

    test.chai
      .expect(mockLogObj.trace)
      .to.have.been.calledWithExactly('removing mware at %s', 'mockRoute');
    test.chai.expect(mesh._mesh.happn.server.connect.stack.length).to.equal(1);

    createStub.restore();
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

  it('tests operate method - returns callback with error ', () => {
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
    const mockCallback1 = test.sinon.stub();
    const mockCallback2 = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback1);
    componentInstance.description = {
      methods: {
        mockMethod: { name: 'mockName' },
      },
    };

    const createStub = test.sinon
      .stub(ComponentInstanceBoundFactory, 'create')
      .returns({ originBindingNecessary: test.sinon.stub() });

    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback2,
      'mockOrigin',
      null,
      'originBindingOverride'
    );
    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback2,
      'mockOrigin',
      null,
      'originBindingOverride'
    );
    test.chai
      .expect(mockCallback2)
      .to.have.been.calledWithExactly(null, [test.sinon.match.instanceOf(Error)]);

    createStub.restore();
  });

  it('tests operate method - method has been configured as a promise with a callback ', () => {
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
    const mockCallback1 = test.sinon.stub();
    const mockCallback2 = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback1);
    componentInstance.description = {
      methods: {
        mockMethod: { parameters: [{ type: 'callback' }] },
      },
    };

    const createStub = test.sinon
      .stub(ComponentInstanceBoundFactory, 'create')
      .returns({ originBindingNecessary: test.sinon.stub() });

    const isPromiseStub = test.sinon.stub(utilities, 'isPromise').returns('mockResult');

    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback2,
      'mockOrigin',
      null,
      'originBindingOverride'
    );

    test.chai
      .expect(mockLogObj.warn)
      .to.have.been.calledWithExactly(
        'method [mockName.mockMethod] has been configured as a promise with a callback'
      );

    isPromiseStub.restore();
    createStub.restore();
  });

  it('tests operate method - callbackProxy', async () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = {
      instance: {
        mockMethod: test.sinon.stub().resolves(),
        version: 'mockVersion',
      },
    };
    const config = mockConfig();
    const mockMethodName = 'mockMethod';
    const mockParameters = [1, 2];
    const mockCallback1 = test.sinon.stub();
    const mockCallback2 = test.sinon.stub();
    mockCallback2.onCall(0).throws(new Error());

    componentInstance.initialize('mockName', mesh, module, config, mockCallback1);
    componentInstance.description = {
      methods: {
        mockMethod: { name: 'mockName' },
      },
    };

    const createStub = test.sinon
      .stub(ComponentInstanceBoundFactory, 'create')
      .returns({ originBindingNecessary: test.sinon.stub() });

    const isPromiseStub = test.sinon.stub(utilities, 'isPromise').returns('mockResult');

    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback2,
      'mockOrigin',
      null,
      'originBindingOverride'
    );

    await require('node:timers/promises').setTimeout(50);

    test.chai
      .expect(mockLogObj.error)
      .to.have.been.calledWithExactly(
        'Callback invoked more than once for method %s',
        'mockMethod',
        'stub'
      );

    isPromiseStub.restore();
    createStub.restore();
  });

  it('tests operate method, blue sky, no auth necessary', function (done) {
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

  it('tests operate method, errored, no auth necessary', function (done) {
    initializeComponent((e, componentInstance) => {
      if (e) return done(e);
      componentInstance.operate('testMethodErrored', [1, 2], (e, response) => {
        if (e) return done(e);
        test.expect(response[0].message).to.be('test error');
        done();
      });
    });
  });

  it('tests operate method, unauthorized', function (done) {
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

  it('tests operate method, authorized', function (done) {
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
    const mockCallback1 = test.sinon.stub();
    const mockCallback2 = test.sinon.stub();

    componentInstance.description = {
      methods: {},
    };

    componentInstance.initialize('mockName', mesh, module, config, mockCallback1);

    const createStub = test.sinon
      .stub(ComponentInstanceBoundFactory, 'create')
      .returns({ originBindingNecessary: test.sinon.stub() });

    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback2,
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
      .expect(mockCallback2)
      .to.have.been.calledWithExactly(test.sinon.match.instanceOf(Error));

    createStub.restore();
  });

  it('tests operate method, returns if component version does not match module version', () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockMethodName = 'testMethod1';
    const mockParameters = [1, 2];
    const mockCallback1 = test.sinon.stub();
    const mockCallback2 = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback1);
    componentInstance.description = {
      methods: { testMethod1: test.sinon.stub() },
    };

    const createStub = test.sinon
      .stub(ComponentInstanceBoundFactory, 'create')
      .returns({ originBindingNecessary: test.sinon.stub() });

    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback2,
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
      .expect(mockCallback2)
      .to.have.been.calledWithExactly(test.sinon.match.instanceOf(Error));

    createStub.restore();
  });

  it('tests operate method, returns callback with result', async () => {
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
    const mockCallback1 = test.sinon.stub();
    const mockCallback2 = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback1);
    componentInstance.description = {
      methods: {
        mockMethod: { type: 'sync-promise' },
      },
    };

    const createStub = test.sinon
      .stub(ComponentInstanceBoundFactory, 'create')
      .returns({ originBindingNecessary: test.sinon.stub() });

    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback2,
      'mockOrigin',
      null,
      'originBindingOverride'
    );

    test.chai.expect(mockCallback2).to.have.been.calledWithExactly(null, [null, 'mockResult']);
    createStub.restore();
  });

  it('tests operate method, returns callback with error', async () => {
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
    const mockCallback1 = test.sinon.stub();
    const mockCallback2 = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback1);
    componentInstance.description = {
      methods: {
        mockMethod: { type: 'sync-promise' },
      },
    };

    const createStub = test.sinon
      .stub(ComponentInstanceBoundFactory, 'create')
      .returns({ originBindingNecessary: test.sinon.stub() });

    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback2,
      'mockOrigin',
      null,
      'originBindingOverride'
    );

    test.chai
      .expect(mockCallback2)
      .to.have.been.calledWithExactly(null, [test.sinon.match.instanceOf(Error)]);

    createStub.restore();
  });

  it('tests operate method , isPromise returns false', async () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = {
      instance: {
        testMethod3: test.sinon.stub().resolves('mockResult'),
        testMethod4: test.sinon.stub().resolves('mockResult'),
        testMethod5: test.sinon.stub().resolves('mockResult'),
        staticHandler: test.sinon.stub().resolves('mockResult'),
        version: 'mockVersion',
      },
    };
    const config = mockConfig();
    const mockMethodName = 'testMethod3';
    const mockParameters = [1, 2];
    const mockCallback1 = test.sinon.stub();
    const mockCallback2 = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback1);
    componentInstance.description = {
      methods: {
        testMethod3: {},
        testMethod4: {},
        testMethod5: {},
        staticHandler: {},
      },
    };

    const createStub = test.sinon
      .stub(ComponentInstanceBoundFactory, 'create')
      .returns({ originBindingNecessary: test.sinon.stub() });

    const isPromisedStub = test.sinon.stub(utilities, 'isPromise').returns(false);

    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback2,
      'mockOrigin',
      null,
      'originBindingOverride'
    );

    test.chai.expect(mockCallback2).to.not.have.been.called;

    isPromisedStub.restore();
    createStub.restore();
  });

  it('tests #getWebOrigin - returns sessionFromRequest ', async () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = {
      instance: {
        testMethod3: test.sinon.stub(),
        testMethod4: test.sinon.stub(),
      },
    };

    const config = mockConfig();
    const mockMethodName = 'testMethod3';
    const mockParameters = [1, 2];
    const mockCallback1 = test.sinon.stub();
    const mockCallback2 = test.sinon.stub();

    module.instance.testMethod3.$happnSeq = 3;
    mesh._mesh.config.web.routes[0] = 'mockName/test/route/1';

    mesh._mesh.happn.server.connect.use = test.sinon.stub();
    mesh._mesh.happn.server.connect.use.callsFake((_, cb) => {
      cb({ rootWebRoute: 'mockRootWebRoute' }, 'mockRes', 'mockNext');
    });

    componentInstance.initialize('mockName', mesh, module, config, mockCallback1);
    componentInstance.description = {
      methods: {
        testMethod3: {},
        testMethod4: {},
      },
    };

    const createStub = test.sinon
      .stub(ComponentInstanceBoundFactory, 'create')
      .returns({ originBindingNecessary: test.sinon.stub() });

    const isPromisedStub = test.sinon.stub(utilities, 'isPromise').returns(false);

    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback2,
      'mockOrigin',
      null,
      'originBindingOverride'
    );

    test.chai
      .expect(mesh._mesh.happn.server.services.security.sessionFromRequest)
      .to.have.been.calledWithExactly(
        { rootWebRoute: '0', componentWebRoute: 'mockName/test/route/1' },
        { cookieName: null }
      );

    test.chai
      .expect(module.instance.testMethod3)
      .to.have.been.calledWithExactly(
        { rootWebRoute: '0', componentWebRoute: 'mockName/test/route/1' },
        'mockRes',
        'mockNext',
        test.sinon.match.instanceOf(ComponentInstance)
      );

    isPromisedStub.restore();
    createStub.restore();
  });

  it('tests #attachRouteTarget - checks if mesh.config.web does not exist', async () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = {
      instance: {
        testMethod3: test.sinon.stub(),
        testMethod4: test.sinon.stub(),
        testMethod5: test.sinon.stub(),
        staticHandler: test.sinon.stub(),
      },
    };

    module.instance.testMethod3.$happnSeq = 3;
    delete mesh._mesh.config.web;

    const config = mockConfig();
    const mockMethodName = 'testMethod3';
    const mockParameters = [1, 2];
    const mockCallback1 = test.sinon.stub();
    const mockCallback2 = test.sinon.stub();

    mesh._mesh.happn.server.connect.use = test.sinon.stub();
    mesh._mesh.happn.server.connect.use.callsFake((_, cb) => {
      cb({ rootWebRoute: 'mockRootWebRoute' }, 'mockRes', 'mockNext');
    });

    componentInstance.initialize('mockName', mesh, module, config, mockCallback1);
    componentInstance.description = {
      methods: {
        testMethod3: {},
        testMethod4: {},
        testMethod5: {},
        staticHandler: {},
      },
    };

    const createStub = test.sinon
      .stub(ComponentInstanceBoundFactory, 'create')
      .returns({ originBindingNecessary: test.sinon.stub() });

    const isPromisedStub = test.sinon.stub(utilities, 'isPromise').returns(false);

    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback2,
      'mockOrigin',
      null,
      'originBindingOverride'
    );

    test.chai.expect(mesh._mesh.config).to.not.have.ownProperty('web');

    isPromisedStub.restore();
    createStub.restore();
  });

  it('tests #attachRouteTarget - checks if mesh.config.web.routes does not exist', async () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = {
      instance: {
        testMethod3: test.sinon.stub(),
        testMethod4: test.sinon.stub(),
        testMethod5: test.sinon.stub(),
        staticHandler: test.sinon.stub(),
      },
    };

    module.instance.testMethod3.$happnSeq = 3;
    delete mesh._mesh.config.web.routes;

    const config = mockConfig();
    const mockMethodName = 'testMethod3';
    const mockParameters = [1, 2];
    const mockCallback1 = test.sinon.stub();
    const mockCallback2 = test.sinon.stub();

    mesh._mesh.happn.server.connect.use = test.sinon.stub();
    mesh._mesh.happn.server.connect.use.callsFake((_, cb) => {
      cb({ rootWebRoute: 'mockRootWebRoute' }, 'mockRes', 'mockNext');
    });

    componentInstance.initialize('mockName', mesh, module, config, mockCallback1);
    componentInstance.description = {
      methods: {
        testMethod3: {},
        testMethod4: {},
        testMethod5: {},
        staticHandler: {},
      },
    };

    const createStub = test.sinon
      .stub(ComponentInstanceBoundFactory, 'create')
      .returns({ originBindingNecessary: test.sinon.stub() });

    const isPromisedStub = test.sinon.stub(utilities, 'isPromise').returns(false);

    componentInstance.operate(
      mockMethodName,
      mockParameters,
      mockCallback2,
      'mockOrigin',
      null,
      'originBindingOverride'
    );

    test.chai.expect(mesh._mesh.config.web).to.not.have.ownProperty('routes');

    isPromisedStub.restore();
    createStub.restore();
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

  it('tests #attach method - calling emit function and raises errors', function () {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockCallback = test.sinon.stub();
    const mockOnPublished = test.sinon.stub();
    const mockOptions = { consistency: 1, onPublished: mockOnPublished };

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);
    componentInstance.emit(1, 'mockData', mockOptions, mockCallback);

    test.chai
      .expect(mockLogObj.trace)
      .to.have.been.calledWithExactly('component emitEvent called', 'on-emit-error');
    test.chai
      .expect(mockLogObj.trace)
      .to.have.been.calledWithExactly('component emitEvent called', 'on-publish-error');
  });

  it('tests #attach method - calling emit function and raises ok', function () {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockCallback = test.sinon.stub();
    const mockOnPublished = test.sinon.stub();
    const mockOptions = { consistency: 1, onPublished: mockOnPublished };

    mesh._mesh.data.set.callsFake((key, data, options, callback) => {
      options.onPublished(null, 'mockResult');
      callback(null, 'mockResponse');
    });

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);
    componentInstance.emit(1, 'mockData', mockOptions, mockCallback);

    test.chai
      .expect(mockLogObj.trace)
      .to.have.been.calledWithExactly('component emitEvent called', 'on-emit-ok');
    test.chai
      .expect(mockLogObj.trace)
      .to.have.been.calledWithExactly('component emitEvent called', 'on-publish-ok');
  });

  it('tests #attach method - calls emit when options is null', function () {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockCallback = test.sinon.stub();
    const mockOptions = null;

    mesh._mesh.data.set.callsFake((key, data, options, callback) => {
      callback(null, 'mockResponse');
    });

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);
    componentInstance.emit(1, 'mockData', mockOptions);

    test.chai
      .expect(mesh._mesh.data.set)
      .to.have.been.calledWithExactly(
        '/_events/mockDomain/mockName/1',
        'mockData',
        { noStore: true, meta: { componentVersion: 'mockVersion' } },
        test.sinon.match.func
      );
  });

  it('tests #attach method - calls emit when options.noStore is false', function () {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockCallback = test.sinon.stub();
    const mockOptions = { noStore: false };

    mesh._mesh.data.set.callsFake((key, data, options, callback) => {
      callback(null, 'mockResponse');
    });

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);
    componentInstance.emit(1, 'mockData', mockOptions);

    test.chai
      .expect(mesh._mesh.data.set)
      .to.have.been.calledWithExactly(
        '/_events/mockDomain/mockName/1',
        'mockData',
        { noStore: false, meta: { componentVersion: 'mockVersion' } },
        test.sinon.match.func
      );
  });

  it('tests #attach method -  calls emitLocal ', () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockCallback = test.sinon.stub();

    mesh._mesh.data.set.callsFake((key, data, options, callback) => {
      callback(null, 'mockResponse');
    });

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);
    componentInstance.emitLocal(1, 'mockData', mockCallback);

    test.chai.expect(mesh._mesh.data.set).to.have.been.calledWithExactly(
      '/_events/mockDomain/mockName/1',
      'mockData',
      {
        noStore: true,
        noCluster: true,
        meta: { componentVersion: 'mockVersion' },
      },
      mockCallback
    );
  });

  it('tests #attach method - calls operate and calls the callback with error.', () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockCallback = test.sinon.stub();

    mesh._mesh.data.on.callsFake((subscribeMask, eventType, testFunc, cb) => {
      testFunc(
        {
          callbackAddress: '/callback/address',
          origin: {
            id: 'mockId',
          },
        },
        {
          path: "'mockPath'",
        }
      );
      cb(null, {});
    });
    mesh._mesh.data.publish = (callbackAddress, response, options, cb) => {
      cb();
    };

    componentInstance.operate = (method, args, cb) => {
      cb('mockError', {});
    };
    componentInstance.initialize('mockName', mesh, module, config, mockCallback);

    test.chai
      .expect(mockLogObj.trace)
      .to.have.been.calledWithExactly('operate( reply( ERROR %s', '/callback/address');
  });

  it('tests #attach method, message.args as array', () => {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockCallback = test.sinon.stub();

    mesh._mesh.data.on.callsFake((subscribeMask, eventType, testFunc, cb) => {
      testFunc(
        {
          args: ['test'],
          callbackAddress: '/callback/address',
          origin: {
            id: 'mockId',
          },
        },
        {
          path: "'mockPath'",
        }
      );
      cb(null, {});
    });
    mesh._mesh.data.publish = (callbackAddress, response, options, cb) => {
      cb();
    };

    componentInstance.operate = test.sinon.stub().callsFake((method, args, cb) => {
      cb('mockError', {});
    });
    componentInstance.initialize('mockName', mesh, module, config, mockCallback);

    test.chai.expect(componentInstance.operate.args[0][1]).to.eql(['test']);
    test.chai
      .expect(mockLogObj.trace)
      .to.have.been.calledWithExactly('operate( reply( ERROR %s', '/callback/address');
  });

  it('tests #attach method - discards message if there is no callback addresss', function () {
    const componentInstance = new ComponentInstance();
    const mesh = mockMesh('test-mesh-name');
    const module = mockModule('test-module', 'mockVersion');
    const config = mockConfig();
    const mockCallback = test.sinon.stub();
    const mockOptions = test.sinon.stub();

    componentInstance.initialize('mockName', mesh, module, config, mockCallback);
    componentInstance.emit(1, 'mockData', mockOptions);

    test.chai
      .expect(mockLogObj.warn)
      .to.have.been.calledWithExactly('message discarded: %s', 'No callback address', {
        origin: { id: 'mockId' },
      });
    test.chai
      .expect(mockLogObj.trace)
      .to.have.been.calledWithExactly(
        'received request at %s',
        '/_exchange/requests/mockDomain/mockName/*'
      );
    test.chai
      .expect(mockLogObj.trace)
      .to.have.been.calledWithExactly('data.on( /_exchange/requests/mockDomain/mockName/*');
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

  it('tests README', () => {
    const componentInstance = new ComponentInstance();
    const readMeSpy = test.sinon.spy(componentInstance, 'README');
    componentInstance.README();

    test.chai.expect(readMeSpy).to.have.been.called;
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
      $happner = {
        config: {
          component: {
            keyOne: 'keyOne',
            keyTwo: 'keyTwo',
          },
        },
      };

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
    let middlewares = {};
    const mockedMesh = {
      tools: 'mockTools',
      __middlewares: middlewares,
      _mesh: {
        config: {
          domain: 'mockDomain',
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
          set: test.sinon.stub().callsFake((eventKey, data, options, cb) => {
            if (typeof options === 'function') {
              cb = options;
              options = null;
            }
            if (options && options.onPublished) options.onPublished('mockError', 'mockResult');
            cb('mockError', 'mockResponse');
          }),
          offPath: test.sinon.stub().callsArg(1),
          on: test.sinon.stub().callsFake((subscribeMask, eventType, testFunc, cb) => {
            testFunc(
              {
                origin: {
                  id: 'mockId',
                },
              },
              {
                path: 'mockPath',
              }
            );
            cb();
          }),
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
