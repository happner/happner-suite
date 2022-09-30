const Permissions = require('../../../lib/services/security/permissions');
const test = require('../../__fixtures/utils/test_helper').create();
const sinon = test.sinon;
describe.only(test.testName(__filename, 3), function () {
  this.timeout(10000);
  var Logger = require('happn-logger');
  const util = require('util');
  var Services = {};
  Services.SecurityService = require('../../../lib/services/security/service');
  Services.CacheService = require('../../../lib/services/cache/service');
  Services.DataService = require('../../../lib/services/data/service');
  Services.CryptoService = require('../../../lib/services/crypto/service');
  Services.ProtocolService = require('../../../lib/services/protocol/service');
  Services.SubscriptionService = require('../../../lib/services/subscription/service');
  Services.PublisherService = require('../../../lib/services/publisher/service');
  Services.UtilsService = require('../../../lib/services/utils/service');
  Services.SessionService = require('../../../lib/services/session/service');
  Services.SystemService = require('../../../lib/services/system/service');
  Services.ErrorService = require('../../../lib/services/error/service');
  Services.LogService = require('../../../lib/services/log/service');

  var mockService = util.promisify(function (happn, serviceName, config, callback) {
    if (typeof config === 'function') {
      callback = config;
      if (config !== false) config = {};
    }

    try {
      var serviceClass = Services[serviceName + 'Service'];

      var serviceInstance = new serviceClass({
        logger: Logger,
      });

      serviceInstance.happn = happn;

      serviceInstance.config = config;

      happn.services[serviceName.toLowerCase()] = serviceInstance;

      if (typeof serviceInstance.initialize !== 'function' || config === false) return callback();

      serviceInstance.initialize(config, callback);
    } catch (e) {
      callback(e);
    }
  });

  var mockServices = function (callback) {
    var happn = {
      services: {},
      config: {},
    };

    mockService(happn, 'Crypto')
      .then(mockService(happn, 'Utils'))
      .then(mockService(happn, 'Log'))
      .then(mockService(happn, 'Error'))
      .then(mockService(happn, 'Session', false))
      .then(mockService(happn, 'Protocol'))
      .then(mockService(happn, 'Publisher'))
      .then(mockService(happn, 'Data'))
      .then(mockService(happn, 'Cache'))
      .then(mockService(happn, 'System'))
      .then(mockService(happn, 'Security'))
      .then(mockService(happn, 'Subscription'))
      .then(function () {
        happn.services.session.initializeCaches.bind(happn.services.session)(function (e) {
          if (e) return callback(e);
          callback(null, happn);
        });
      })
      .catch(callback);
  };
  it('tests creating a permission Manager (constructor)', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);
      let pm = new Permissions(null, 'test', happn);
      test.expect(pm.type).to.be('test');
      done();
    });
  });

  it('tests creating a permission Manager (create method)', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);
      let pm = Permissions.create(null, 'test', happn);
      test.expect(pm.type).to.be('test');

      done();
    });
  });

  it('tests the defaults method', function (done) {
    mockServices(function (e, happn) {
      if (e) return done(e);
      let pm = new Permissions(null, 'test', happn);
      let config = pm.defaults();
      test.expect(config).to.eql({
        __cache_permissions: {
          max: 10000,
          maxAge: 0,
        },
        __userPermissionsPrefix: '_USER/',
      });
      let newConfig = pm.defaults(config);
      test.expect(config).to.eql(newConfig);
      test.expect(config).not.to.be(newConfig);

      let config1 = {
        __cache_permissions: {
          max: 20,
          maxAge: 20,
        },
      };
      test.expect(pm.defaults(config1)).to.eql({ ...config, ...config1 });

      let config2 = {
        __userPermissionsPrefix: 'RANDOM',
      };
      test.expect(pm.defaults(config2)).to.eql({ ...config, ...config2 });

      let config3 = {
        __cache_permissions: {
          max: 20,
          maxAge: 20,
        },
        __userPermissionsPrefix: 'RANDOM',
        some: { other: 'stuff' },
      };
      test.expect(pm.defaults(config3)).to.eql(config3);
      test.expect(pm.defaults(config3)).not.to.be(config3);
      done();
    });
  });

  it('tests the listPermissions method', function (done) {
    mockServices(async (e, happn) => {
      try {
        if (e) return done(e);
        let pm = new Permissions(null, 'test', happn);
        let permissionsObj = { some: 'data' };
        pm.cache.set('name', permissionsObj);
        let perms = await pm.listPermissions('name');
        test.expect(perms).to.eql(permissionsObj);
        test.expect(perms).not.to.be(permissionsObj);

        await happn.services.data.upsert(
          '/_SYSTEM/_SECURITY/_PERMISSIONS/testName/set//some/test/path',
          { action: 'set', authorized: true, path: '/some/test/path' }
        );
        await happn.services.data.upsert(
          '/_SYSTEM/_SECURITY/_PERMISSIONS/testName/get//another/test/path',
          { action: 'get', authorized: true, path: '/another/test/path' }
        );
        perms = await pm.listPermissions('testName');
        test.expect(perms).to.eql([
          { action: 'get', authorized: true, path: '/another/test/path' },
          { action: 'set', authorized: true, path: '/some/test/path' },
        ]);
        test.expect(await pm.cache.get('testName')).to.eql(perms);
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('tests the attachPermissions method', function (done) {
    mockServices(async (e, happn) => {
      try {
        if (e) return done(e);
        let pm = new Permissions(null, 'test', happn);
        let testEntity = { name: 'testName' };

        let attached = await pm.attachPermissions(testEntity);
        test.expect(attached).to.eql({ ...testEntity, permissions: {} });

        await upsertTestPermissions(happn);

        pm.cache.remove('testName');
        attached = await pm.attachPermissions(testEntity);
        test.expect(attached).to.eql({
          name: 'testName',
          permissions: {
            '/another/test/path': {
              actions: ['get'],
            },
            '/some/test/path': {
              actions: ['on', 'set'],
            },
          },
        });
        await removeTestPermissions(happn);
        pm.cache.remove('testName');
        attached = await pm.attachPermissions(testEntity);
        test.expect(attached).to.eql({ ...testEntity, permissions: {} });
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('tests the __removePermission method', function (done) {
    mockServices(async (e, happn) => {
      try {
        if (e) return done(e);
        let pm = new Permissions(null, 'test', happn);
        let testEntity = { name: 'testName' };
        await upsertTestPermissions(happn);

        await pm.__removePermission('testName', '/some/test/path', 'on');
        test.expect(
          await happn.services.data.get(
            '/_SYSTEM/_SECURITY/_PERMISSIONS/testName/on//some/test/path'
          )
        ).to.be.undefined;
        let attached = await pm.attachPermissions(testEntity);
        test.expect(attached).to.eql({
          name: 'testName',
          permissions: {
            '/another/test/path': {
              actions: ['get'],
            },
            '/some/test/path': {
              actions: ['set'],
            },
          },
        });
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('tests the removePermission method', function (done) {
    mockServices(async (e, happn) => {
      try {
        if (e) return done(e);
        let securityService = {};
        securityService.dataChanged = sinon.stub();
        securityService.dataChanged.callsArgWith(3, null);
        let pm = new Permissions(null, 'test', happn, securityService);
        let testEntity = { name: 'testName' };
        await upsertTestPermissions(happn);
        await pm.removePermission('testName', '/some/test/path', 'on');
        test.expect(
          await happn.services.data.get(
            '/_SYSTEM/_SECURITY/_PERMISSIONS/testName/on//some/test/path'
          )
        ).to.be.undefined;
        let attached = await pm.attachPermissions(testEntity);
        test.expect(attached).to.eql({
          name: 'testName',
          permissions: {
            '/another/test/path': {
              actions: ['get'],
            },
            '/some/test/path': {
              actions: ['set'],
            },
          },
        });

        sinon.assert.calledOnce(securityService.dataChanged);
        sinon.assert.calledWith(
          securityService.dataChanged,
          'permission-removed',
          { testName: 'testName', path: '/some/test/path', action: 'on' },
          null
        );
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('tests the __upsertPermission method', function (done) {
    mockServices(async (e, happn) => {
      try {
        if (e) return done(e);
        let securityService = {};
        let pm = new Permissions(null, 'test', happn, securityService);
        let testEntity = { name: 'testName' };

        await pm.__upsertPermission('testName', '/some/test/path', 'on');
        let pathData = await happn.services.data.get(
          '/_SYSTEM/_SECURITY/_PERMISSIONS/testName/on//some/test/path'
        );
        test
          .expect(pathData.data)
          .to.eql({ action: 'on', authorized: true, path: '/some/test/path' });
        let attached = await pm.attachPermissions(testEntity);
        test.expect(attached).to.eql({
          name: 'testName',
          permissions: {
            '/some/test/path': {
              actions: ['on'],
            },
          },
        });
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('tests the upsertPermission method', function (done) {
    mockServices(async (e, happn) => {
      try {
        if (e) return done(e);
        let securityService = {};
        securityService.dataChanged = sinon.stub();
        securityService.dataChanged.callsArgWith(2, null);
        let pm = new Permissions(null, 'test', happn, securityService);
        let testEntity = { name: 'testName' };

        await pm.upsertPermission('testName', '/some/test/path', 'on');
        let pathData = await happn.services.data.get(
          '/_SYSTEM/_SECURITY/_PERMISSIONS/testName/on//some/test/path'
        );
        test
          .expect(pathData.data)
          .to.eql({ action: 'on', authorized: true, path: '/some/test/path' });
        let attached = await pm.attachPermissions(testEntity);
        test.expect(attached).to.eql({
          name: 'testName',
          permissions: {
            '/some/test/path': {
              actions: ['on'],
            },
          },
        });
        sinon.assert.calledOnce(securityService.dataChanged);
        sinon.assert.calledWith(securityService.dataChanged, 'permission-upserted', {
          testName: 'testName',
          path: '/some/test/path',
          action: 'on',
          authorized: true,
        });
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('tests the validatePermissions method, valid permissions', function (done) {
    mockServices(async (e, happn) => {
      try {
        if (e) return done(e);
        let pm = new Permissions(null, 'test', happn);
        test.expect(pm.validatePermissions({})).to.be(true);
        let validPermissions = {
          '/path1': { actions: ['set', 'get', 'on'] },
          '/path2': { prohibit: ['delete', 'post', 'options'] },
          '/path3': { actions: ['set', 'get', 'on'], prohibit: ['delete', 'post', 'options'] },
        };
        test.expect(pm.validatePermissions(validPermissions)).to.be(true);
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('tests the validatePermissions method, invalid permissions', function (done) {
    mockServices(async (e, happn) => {
      try {
        if (e) return done(e);
        let pm = new Permissions(null, 'test', happn);
        let badPermissions1 = { '/path1': {} };
        let error1 = 'missing allowed actions or prohibit rules: /path1';

        let badPermissions2 = { '/path2': { actions: ['notAnAction'] } };
        let error2 = 'unknown action: notAnAction for path: /path2';

        let badPermissions3 = { '/path3': { prohibit: ['alsoNotAnAction'] } };
        let error3 = 'unknown prohibit action: alsoNotAnAction for path: /path3';
        test.expect(pm.validatePermissions(badPermissions1)).to.eql([error1]);
        test.expect(pm.validatePermissions(badPermissions2)).to.eql([error2]);
        test.expect(pm.validatePermissions(badPermissions3)).to.eql([error3]);

        let badPermissions4 = { ...badPermissions1, ...badPermissions2, ...badPermissions3 };
        test.expect(pm.validatePermissions(badPermissions4)).to.eql([error1, error2, error3]);
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('tests the upsertMultiplePermissions method', function (done) {
    mockServices(async (e, happn) => {
      try {
        if (e) return done(e);
        let pm = new Permissions(null, 'test', happn);

        let validPermissions = {
          '/path1': { actions: ['set', 'get', 'on'] },
          '/path2': { prohibit: ['delete', 'post', 'options'] },
          '/path3': { actions: ['set', 'get', 'on'], prohibit: ['delete', 'post', 'options'] },
        };
        await pm.upsertMultiplePermissions('testName', validPermissions);
        let permissionList = await pm.listPermissions('testName');
        test.expect(permissionList).to.eql([
          { action: 'delete', authorized: false, path: '/path2' },
          { action: 'delete', authorized: false, path: '/path3' },
          { action: 'get', authorized: true, path: '/path1' },
          { action: 'get', authorized: true, path: '/path3' },
          { action: 'on', authorized: true, path: '/path1' },
          { action: 'on', authorized: true, path: '/path3' },
          { action: 'options', authorized: false, path: '/path2' },
          { action: 'options', authorized: false, path: '/path3' },
          { action: 'post', authorized: false, path: '/path2' },
          { action: 'post', authorized: false, path: '/path3' },
          { action: 'set', authorized: true, path: '/path1' },
          { action: 'set', authorized: true, path: '/path3' },
        ]);
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('tests the upsertMultiplePermissions method, removing permissions', function (done) {
    mockServices(async (e, happn) => {
      try {
        if (e) return done(e);
        let pm = new Permissions(null, 'test', happn);
        let validPermissions = {
          '/path1': { actions: ['set', 'get', 'on'] },
          '/path2': { prohibit: ['delete', 'post'] },
        };
        await pm.upsertMultiplePermissions('testName', validPermissions);
        let permissionList = await pm.listPermissions('testName');
        test.expect(permissionList).to.eql([
          { action: 'delete', authorized: false, path: '/path2' },
          { action: 'get', authorized: true, path: '/path1' },
          { action: 'on', authorized: true, path: '/path1' },
          { action: 'post', authorized: false, path: '/path2' },
          { action: 'set', authorized: true, path: '/path1' },
        ]);
        let removePermissions = {
          '/path1': { remove: true, actions: ['set', 'get'] },
          '/path2': { remove: true, actions: ['delete'] }, //Should not remove anything as this is a prohibition, not a permission
        };
        await pm.upsertMultiplePermissions('testName', removePermissions);
        permissionList = await pm.listPermissions('testName');
        test.expect(permissionList).to.eql([
          { action: 'delete', authorized: false, path: '/path2' }, //Still here
          { action: 'on', authorized: true, path: '/path1' },
          { action: 'post', authorized: false, path: '/path2' },
        ]);
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('tests the upsertMultiplePermissions method, removing prohibitions]', function (done) {
    mockServices(async (e, happn) => {
      try {
        if (e) return done(e);
        let pm = new Permissions(null, 'test', happn);
        let validPermissions = {
          '/path1': { actions: ['set', 'get', 'on'] },
          '/path2': { prohibit: ['delete', 'post'] },
        };
        await pm.upsertMultiplePermissions('testName', validPermissions);
        let permissionList = await pm.listPermissions('testName');
        test.expect(permissionList).to.eql([
          { action: 'delete', authorized: false, path: '/path2' },
          { action: 'get', authorized: true, path: '/path1' },
          { action: 'on', authorized: true, path: '/path1' },
          { action: 'post', authorized: false, path: '/path2' },
          { action: 'set', authorized: true, path: '/path1' },
        ]);
        let removePermissions = {
          '/path1': { remove: true, prohibit: ['get'] }, //Should not remove anything as this is a permission, not a prohibition
          '/path2': { remove: true, prohibit: ['delete'] },
        };
        await pm.upsertMultiplePermissions('testName', removePermissions);
        permissionList = await pm.listPermissions('testName');
        test.expect(permissionList).to.eql([
          { action: 'get', authorized: true, path: '/path1' }, //Still here
          { action: 'on', authorized: true, path: '/path1' },
          { action: 'post', authorized: false, path: '/path2' },
          { action: 'set', authorized: true, path: '/path1' },
        ]);
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('tests the removeAllUserPermissions method', function (done) {
    mockServices(async (_e, happn) => {
      let pm = new Permissions(null, 'test', happn);
      pm.type = 'user';
      try {
        await pm.removeAllUserPermissions();
      } catch (e) {
        test.expect(e.message).to.be('please supply a username');
        pm.dataService.remove = (path) => {
          test.expect(path).to.be('/_SYSTEM/_SECURITY/_PERMISSIONS/_USER/test/*');
          done();
        };
        await pm.removeAllUserPermissions('test');
      }
    });
  });

  it('tests attachPermissions - checks if permission.authorized is not a boolean and returns', async () => {
    const mockConfig = {};
    const mockType = 'mockType';
    const mockHappn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
      },
      data: 'mockData',
    };
    const mockSecurityService = {};
    const mockEntity = { username: 'mockUsername' };
    const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

    permissions.listPermissions = test.sinon.stub().resolves([
      {
        authorized: null,
      },
    ]);

    const result = permissions.attachPermissions(mockEntity);

    test.chai.expect(permissions.listPermissions).to.have.been.calledWithExactly('mockUsername');
    await test.chai.expect(result).to.eventually.eql({ username: 'mockUsername', permissions: {} });
  });

  it('tests attachPermissions - checks if permission.authorized is false and returns', async () => {
    const mockConfig = {};
    const mockType = 'mockType';
    const mockHappn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
      },
      data: 'mockData',
    };
    const mockSecurityService = {};
    const mockEntity = { username: 'mockUsername' };
    const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

    permissions.listPermissions = test.sinon.stub().resolves([
      {
        authorized: false,
        path: 'mockPath',
        action: 'mockAction',
      },
    ]);

    const result = permissions.attachPermissions(mockEntity);

    test.chai.expect(permissions.listPermissions).to.have.been.calledWithExactly('mockUsername');
    await test.chai.expect(result).to.eventually.eql({
      username: 'mockUsername',
      permissions: {
        mockPath: {
          prohibit: ['mockAction'],
        },
      },
    });
  });

  it('tests attachPermissions - checks if entity.permissions[permission.path] is truthy and returns', async () => {
    const mockConfig = {};
    const mockType = 'mockType';
    const mockHappn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
      },
      data: 'mockData',
    };
    const mockSecurityService = {};
    const mockEntity = { username: 'mockUsername' };
    const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

    permissions.listPermissions = test.sinon.stub().resolves([
      {
        authorized: false,
        path: 'mockPath',
        action: 'mockAction',
      },
      {
        authorized: false,
        path: 'mockPath',
        action: 'mockAction',
      },
    ]);

    const result = permissions.attachPermissions(mockEntity);

    test.chai.expect(permissions.listPermissions).to.have.been.calledWithExactly('mockUsername');
    await test.chai.expect(result).to.eventually.eql({
      username: 'mockUsername',
      permissions: {
        mockPath: {
          prohibit: ['mockAction', 'mockAction'],
        },
      },
    });
  });

  it('tests listPermissions - throws new Error', async () => {
    const mockSecurityService = {};
    const mockName = null;
    const mockConfig = {};
    const mockType = 'mockType';
    const mockHappn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
      },
      data: 'mockData',
    };
    const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

    const result = permissions.listPermissions(mockName);
    await test.chai.expect(result).to.eventually.rejectedWith(`please supply a mockTypeName`);
  });

  it('tests removePermission - promise rejected with new Error', async () => {
    const mockSecurityService = {};
    const mockConfig = {};
    const mockType = 'mockType';
    const mockHappn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
      },
      data: 'mockData',
    };
    const mockName = null;
    const mockPath = 'mockPath';
    const mockAction = 'mockAction';
    const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

    const result = permissions.removePermission(mockName, mockPath, mockAction);

    await test.chai
      .expect(result)
      .to.have.eventually.been.rejectedWith(`please supply a mockTypeName`);
  });

  it('tests removePermission - it calls __removePermissions. It resolves promise if stored.data is falsy.', async () => {
    const mockSecurityService = {};
    const mockConfig = {};
    const mockType = 'mockType';
    const mockHappn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          get: test.sinon.stub().returns([{ data: null }]),
        },
      },
    };
    const mockName = 'mockName';
    const mockPath = null;
    const mockAction = null;
    const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

    const result = permissions.removePermission(mockName, mockPath, mockAction);

    test.chai
      .expect(mockHappn.services.data.get)
      .to.have.been.calledWithExactly('/_SYSTEM/_SECURITY/_PERMISSIONS/mockName/*/{{w}}');
    await test.chai.expect(result).to.eventually.be.undefined;
  });

  it('tests removePermission - it calls __removePermissions. It resolves promise if storedData is falsy.', async () => {
    const mockSecurityService = {};
    const mockConfig = {};
    const mockType = 'mockType';
    const mockHappn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          get: test.sinon.stub().returns(null),
        },
      },
    };
    const mockName = 'mockName';
    const mockPath = null;
    const mockAction = null;
    const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

    const result = permissions.removePermission(mockName, mockPath, mockAction);

    test.chai
      .expect(mockHappn.services.data.get)
      .to.have.been.calledWithExactly('/_SYSTEM/_SECURITY/_PERMISSIONS/mockName/*/{{w}}');
    await test.chai.expect(result).to.eventually.be.undefined;
  });

  it('tests removePermission - it calls __removePermissions. It resolves promise if data.removed is falsy.', async () => {
    const mockSecurityService = {};
    const mockConfig = {};
    const mockType = 'mockType';
    const mockHappn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          get: test.sinon.stub().returns({ data: 'mockData' }),
          remove: test.sinon.stub().returns({ data: { removed: false } }),
        },
      },
    };
    const mockName = 'mockName';
    const mockPath = null;
    const mockAction = null;
    const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

    const result = permissions.removePermission(mockName, mockPath, mockAction);

    await require('timers/promises').setTimeout(50);
    test.chai
      .expect(mockHappn.services.data.get)
      .to.have.been.calledWithExactly('/_SYSTEM/_SECURITY/_PERMISSIONS/mockName/*/{{w}}');
    test.chai
      .expect(mockHappn.services.data.remove)
      .to.have.been.calledWithExactly('/_SYSTEM/_SECURITY/_PERMISSIONS/mockName/*/{{w}}');
    await test.chai.expect(result).to.eventually.eql({
      data: {
        removed: false,
      },
    });
  });

  it('tests upsertPermission - authorized is not null. __upsertPermission throws error.', async () => {
    const mockSecurityService = {};
    const mockConfig = {};
    const mockType = 'mockType';
    const mockHappn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          get: test.sinon.stub().returns({ data: 'mockData' }),
          remove: test.sinon.stub().returns({ data: { removed: false } }),
        },
      },
    };
    const mockName = null;
    const mockPath = null;
    const mockAction = null;
    const mockAuthorized = false;
    const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

    const result = permissions.upsertPermission(mockName, mockPath, mockAction, mockAuthorized);

    await test.chai
      .expect(result)
      .to.have.eventually.been.rejectedWith('please supply a mockTypeName');
  });

  it('tests upsertMultiplePermissions - if name is falsy it rejects promise with new error', async () => {
    const mockSecurityService = {};
    const mockConfig = {};
    const mockType = 'mockType';
    const mockHappn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {},
      },
    };
    const mockName = null;
    const mockPermissions = {};

    const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

    const result = permissions.upsertMultiplePermissions(mockName, mockPermissions);

    await test.chai.expect(result).to.eventually.been.rejectedWith(`please supply a mockTypeName`);
  });

  it('tests upsertMultiplePermissions - rejects promise when permissionValidation is not equal to true.', async () => {
    const mockSecurityService = {};
    const mockConfig = {};
    const mockType = 'mockType';
    const mockHappn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {},
      },
    };
    const mockName = 'mockName';
    const mockPermissions = { pathOne: { actions: null, prohibit: null } };
    const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

    const result = permissions.upsertMultiplePermissions(mockName, mockPermissions);

    await test.chai
      .expect(result)
      .to.have.eventually.been.rejectedWith(
        'mockType permissions invalid: missing allowed actions or prohibit rules: pathOne'
      );
  });

  it('tests __upsertPermissions - throw new error when __validatePermissionsPath is called and returns validPath not equal to true', async () => {
    const mockSecurityService = {};
    const mockConfig = {};
    const mockType = 'mockType';
    const mockHappn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {},
      },
    };
    const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);
    const mockName = 'mockName';
    const mockPermissionsPath = null;
    const mockActions = [{}];
    const mockAuthorized = {};

    const result = permissions.__upsertPermissions(
      mockName,
      mockPermissionsPath,
      mockActions,
      mockAuthorized
    );

    await test.chai.expect(result).to.eventually.have.rejectedWith('permission path is null');
  });

  it('tests __upsertPermissions - actions is falsy', async () => {
    const mockSecurityService = {};
    const mockConfig = {};
    const mockType = 'mockType';
    const mockHappn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {},
      },
    };
    const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);
    const mockName = 'mockName';
    const mockPermissionsPath = null;
    const mockActions = null;
    const mockAuthorized = {};

    permissions.__upsertPermission = test.sinon.stub();

    const result = permissions.__upsertPermissions(
      mockName,
      mockPermissionsPath,
      mockActions,
      mockAuthorized
    );

    test.chai.expect(permissions.__upsertPermission).to.have.callCount(0);
  });

  it('tests __upsertPermissions - action is falsy and returns this.dataService.upsert', async () => {
    const mockSecurityService = {};
    const mockConfig = {};
    const mockType = 'mockType';
    const mockHappn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          upsert: test.sinon.stub(),
        },
      },
    };
    const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);
    const mockName = 'mockName';
    const mockPermissionsPath = 'mockPath';
    const mockActions = [null];
    const mockAuthorized = {};

    const result = permissions.__upsertPermissions(
      mockName,
      mockPermissionsPath,
      mockActions,
      mockAuthorized
    );

    test.chai
      .expect(mockHappn.services.data.upsert)
      .to.have.been.calledWithExactly('/_SYSTEM/_SECURITY/_PERMISSIONS/mockName/*/mockPath', {
        action: '*',
        authorized: true,
        path: 'mockPath',
      });
  });

  it('tests __validatePermissionsPath -returns if path.indexOf returns greater then -1', async () => {
    const mockSecurityService = {};
    const mockConfig = {};
    const mockType = 'mockType';
    const mockHappn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {},
      },
    };
    const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);
    const mockName = 'mockName';
    const mockPermissionsPath = '{{w}}';
    const mockActions = [{}];
    const mockAuthorized = {};

    const result = permissions.__upsertPermissions(
      mockName,
      mockPermissionsPath,
      mockActions,
      mockAuthorized
    );

    await test.chai
      .expect(result)
      .to.eventually.have.rejectedWith(
        'invalid permission path, cannot contain special string {{w}}'
      );
  });

  it('tests __unescapePermissionsPath', () => {
    const mockSecurityService = {};
    const mockConfig = {};
    const mockType = 'mockType';
    const mockHappn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          upsert: test.sinon.stub(),
        },
      },
    };
    const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);
    const mockPath = '{{w}}';

    const result = permissions.__unescapePermissionsPath(mockPath);

    test.chai.expect(result).to.equal('*');
  });

  it('tests __getNameObj - this.type is equal to user .', async () => {
    const mockSecurityService = {
      dataChanged: test.sinon.stub().callsFake((_, __, ___, callback) => {
        callback();
      }),
    };
    const mockConfig = {};
    const mockType = 'user';
    const mockHappn = {
      services: {
        cache: {
          create: test.sinon.stub(),
        },
        data: {
          get: test.sinon.stub().returns({ data: 'mockData' }),
          remove: test.sinon.stub().returns({ data: { removed: true } }),
        },
      },
    };
    const mockName = 'mockName';
    const mockPath = null;
    const mockAction = null;
    const permissions = new Permissions(mockConfig, mockType, mockHappn, mockSecurityService);

    const result = permissions.removePermission(mockName, mockPath, mockAction);

    await require('timers/promises').setTimeout(50);

    test.chai
      .expect(mockHappn.services.data.get)
      .to.have.been.calledWithExactly('/_SYSTEM/_SECURITY/_PERMISSIONS/_USER/mockName/*/{{w}}');
    test.chai
      .expect(mockHappn.services.data.remove)
      .to.have.been.calledWithExactly('/_SYSTEM/_SECURITY/_PERMISSIONS/_USER/mockName/*/{{w}}');
    await test.chai.expect(result).to.eventually.eql({
      data: {
        removed: true,
      },
    });
  });

  async function upsertTestPermissions(happn) {
    await happn.services.data.upsert(
      '/_SYSTEM/_SECURITY/_PERMISSIONS/testName/set//some/test/path',
      { action: 'set', authorized: true, path: '/some/test/path' }
    );
    await happn.services.data.upsert(
      '/_SYSTEM/_SECURITY/_PERMISSIONS/testName/on//some/test/path',
      { action: 'on', authorized: true, path: '/some/test/path' }
    );
    await happn.services.data.upsert(
      '/_SYSTEM/_SECURITY/_PERMISSIONS/testName/get//another/test/path',
      { action: 'get', authorized: true, path: '/another/test/path' }
    );
  }

  async function removeTestPermissions(happn) {
    await happn.services.data.remove(
      '/_SYSTEM/_SECURITY/_PERMISSIONS/testName/set//some/test/path'
    );
    await happn.services.data.remove(
      '/_SYSTEM/_SECURITY/_PERMISSIONS/testName/on//some/test/path',
      null
    );
    await happn.services.data.remove(
      '/_SYSTEM/_SECURITY/_PERMISSIONS/testName/get//another/test/path',
      null
    );
  }
});
