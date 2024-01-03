const baseConfig = require('../_lib/base-config');
const users = require('../_lib/user-permissions');

require('../_lib/test-helper').describe({ timeout: 60e3 }, (test) => {
  let deploymentId = test.newid();
  let testClient, savedUser, savedGroup;

  let hooksConfig = {
    cluster: {
      functions: [serverConfig, serverConfig],
    },
  };
  let timing = { all: 'before/after' };
  test.hooks.standardHooks(test, hooksConfig, timing);

  before('Create user, group and lookup table', createSecurityResources);
  before('start client', async () => {
    test.clients.push(
      (testClient = await test.client.create('lookupUser', 'password', test.proxyPorts[1]))
    ); //Second server
  });

  it('can fetch data if lookup tables and permissions are configured correctly (Lookup table and permission upserted on server[0], client on server[1]', async () => {
    test
      .expect(
        await testClient.exchange.component.isCombinationAuthorized({
          methods: [`DOMAIN_NAME/component/method`],
          events: [`/DOMAIN_NAME/component/test/*`],
          data: {
            '/_data/historianStore/SPECIAL_DEVICE_ID_1': { actions: ['get'] },
          },
        })
      )
      .to.eql({
        authorized: true,
        forbidden: [],
      });

    test
      .expect(
        await trySomething(async () => {
          await testClient.data.get('/_data/historianStore/SPECIAL_DEVICE_ID_1');
        })
      )
      .to.be(true);

    await test.servers[0].exchange.security.deleteLookupTable('STANDARD_ABC');
    await test.delay(2000);

    test
      .expect(
        await trySomething(async () => {
          await testClient.data.get('/_data/historianStore/SPECIAL_DEVICE_ID_1');
        })
      )
      .to.be('unauthorized');

    test
      .expect(
        await testClient.exchange.component.isCombinationAuthorized({
          methods: [`DOMAIN_NAME/component/method`],
          events: [`/DOMAIN_NAME/component/test/*`],
          data: {
            '/_data/historianStore/SPECIAL_DEVICE_ID_1': { actions: ['get'] },
          },
        })
      )
      .to.eql({
        authorized: false,
        forbidden: [
          {
            authorized: false,
            path: '/_data/historianStore/SPECIAL_DEVICE_ID_1',
            action: 'get',
          },
        ],
      });
  });

  async function createSecurityResources() {
    savedUser = await users.add(test.servers[0], 'lookupUser', 'password', null, {
      company: 'COMPANY_ABC',
      oem: 'OEM_ABC',
    });
    let testGroup = {
      name: 'LOOKUP_TABLES_GRP',
      permissions: {
        methods: {
          '/DOMAIN_NAME/component/method': { authorized: true },
          '/DOMAIN_NAME/component/isCombinationAuthorized': { authorized: true },
        },
        events: {
          '/DOMAIN_NAME/component/test/*': { authorized: true },
        },
        data: {
          'test/data/{{user.username}}/*': { actions: ['*'] },
        },
      },
    };
    savedGroup = await test.servers[0].exchange.security.addGroup(testGroup);
    let testTable = {
      name: 'STANDARD_ABC',
      paths: [
        'device/OEM_ABC/COMPANY_ABC/SPECIAL_DEVICE_ID_1',
        'device/OEM_ABC/COMPANY_ABC/SPECIAL_DEVICE_ID_2',
      ],
    };
    await test.servers[0].exchange.security.upsertLookupTable(testTable);
    await test.servers[0].exchange.security.upsertLookupPermission('LOOKUP_TABLES_GRP', {
      regex: '^/_data/historianStore/(.*)',
      actions: ['get'],
      table: 'STANDARD_ABC',
      path: '/device/{{user.custom_data.oem}}/{{user.custom_data.company}}/{{$1}}',
    });
    await test.servers[0].exchange.data.set('/_data/historianStore/SPECIAL_DEVICE_ID_1', {
      test: 'data',
    });

    await test.servers[0].exchange.security.linkGroup(savedGroup, savedUser);
  }

  async function trySomething(methodToTry) {
    try {
      await methodToTry();
      return true;
    } catch (e) {
      return e.message;
    }
  }

  function serverConfig(seq, minPeers) {
    var config = baseConfig(seq, minPeers, true);
    config.modules = {
      component: {
        instance: {
          isCombinationAuthorized: async function ($happn, $origin, combination, username) {
            return await $happn.isAuthorized(username || $origin.username, combination);
          },
          method: async function ($happn, data) {
            $happn.emit('method', { data });
          },
        },
      },
    };
    config.components = {
      data: {},
      component: {},
    };
    config.happn.services.membership = {
      config: {
        deploymentId,
        securityChangeSetReplicateInterval: 1e3,
      },
    };
    return config;
  }
});
