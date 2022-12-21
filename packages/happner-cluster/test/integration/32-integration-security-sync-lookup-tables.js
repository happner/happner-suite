require('../_lib/test-helper').describe({ timeout: 60e3 }, (test) => {
  const baseConfig = require('../_lib/base-config');
  const users = require('../_lib/user-permissions');
  let testClient, savedUsers, savedGroups;
  let hooksConfig = {
    cluster: {
      functions: [serverConfig, serverConfig],
      localInstance: 0,
    },
  };
  let timing = { all: 'before/after' };
  test.hooks.standardHooks(test, hooksConfig, timing);

  before('setup security users and groups', async () => {
    savedUsers = await Promise.all(
      ['lookupUser1', 'lookupUser2', 'lookupUser3'].map((userName) =>
        users.add(test.servers[0], userName, 'password', null, {
          company: 'COMPANY_ABC',
          oem: 'OEM_ABC',
        })
      )
    );

    let testGroups = ['LOOKUP_TABLES_GRP1', 'LOOKUP_TABLES_GRP2', 'LOOKUP_TABLES_GRP3'].map(
      (name) => ({
        name,
        permissions: {},
      })
    );

    savedGroups = await Promise.all(
      testGroups.map((testGroup) => test.servers[0].exchange.security.addGroup(testGroup))
    );
  });

  it('can fetch data if lookup tables and permissions are configured correctly, tests removing and adding paths to table (Lookup table and permission upserted on server[0], client on server[1]', async () => {
    test.clients.push(
      (testClient = await test.client.create(
        savedUsers[0].username,
        'password',
        test.proxyPorts[1]
      ))
    ); //Second server
    let testTable1 = {
      name: 'STANDARD_ABC1',
      paths: ['device/OEM_ABC/COMPANY_ABC/SPECIAL_DEVICE_ID_1'],
    };
    let permission1 = {
      regex: '^/_data/historianStore/(.*)',
      actions: ['get'],
      table: 'STANDARD_ABC1',
      path: '/device/{{user.custom_data.oem}}/{{user.custom_data.company}}/{{$1}}',
    };

    await test.servers[0]._mesh.data.set('/_data/historianStore/SPECIAL_DEVICE_ID_1', {
      test: 'data',
    });
    await test.servers[0]._mesh.data.set('/_data/historianStore/SPECIAL_DEVICE_ID_2', {
      test: 'data2',
    });
    await test.servers[0].exchange.security.upsertLookupTable(testTable1);
    await test.servers[0].exchange.security.upsertLookupPermission(
      'LOOKUP_TABLES_GRP1',
      permission1
    );
    try {
      await testClient.data.get('/_data/historianStore/SPECIAL_DEVICE_ID_1');
      throw new Error('Test Error : Should not be authorized');
    } catch (e) {
      test.expect(e.toString()).to.be('AccessDenied: unauthorized');
    }

    await test.servers[0].exchange.security.linkGroup(savedGroups[0], savedUsers[0]);
    await test.delay(1000);

    let data = await testClient.data.get('/_data/historianStore/SPECIAL_DEVICE_ID_1');
    test.expect(data).to.be.ok();

    await test.servers[0].exchange.security.removeLookupPath(
      'STANDARD_ABC1',
      'device/OEM_ABC/COMPANY_ABC/SPECIAL_DEVICE_ID_1'
    );
    await test.delay(1000);

    try {
      await testClient.data.get('/_data/historianStore/SPECIAL_DEVICE_ID_1');
      throw new Error('Test Error : Should not be authorized');
    } catch (e) {
      test.expect(e.toString()).to.be('AccessDenied: unauthorized');
    }

    await test.servers[0].exchange.security.insertLookupPath(
      'STANDARD_ABC1',
      'device/OEM_ABC/COMPANY_ABC/SPECIAL_DEVICE_ID_2'
    );
    await test.delay(1000);
    data = await testClient.data.get('/_data/historianStore/SPECIAL_DEVICE_ID_2');
    test.expect(data).to.be.ok();
  });

  it('tests removing a permission, makes sure we can only access data when properly configured', async () => {
    test.clients.push(
      (testClient = await test.client.create(
        savedUsers[1].username,
        'password',
        test.proxyPorts[1]
      ))
    ); //Second server
    let testTable = {
      name: 'STANDARD_ABC2',
      paths: ['device/OEM_ABC/COMPANY_ABC/SPECIAL_DEVICE_ID_2'],
    };
    let permission1 = {
      regex: '^/_data/historianStore/(.*)',
      actions: ['get'],
      table: 'STANDARD_ABC2',
      path: '/device/{{user.custom_data.oem}}/{{user.custom_data.company}}/{{$1}}',
    };

    await test.servers[0]._mesh.data.set('/_data/historianStore/SPECIAL_DEVICE_ID_2', {
      test: 'data2',
    });
    await test.servers[0].exchange.security.upsertLookupTable(testTable);
    let data;
    try {
      data = await testClient.data.get('/_data/historianStore/SPECIAL_DEVICE_ID_2');
      throw new Error('Test Error : Should not be authorized');
    } catch (e) {
      test.expect(e.toString()).to.be('AccessDenied: unauthorized');
    }
    await test.servers[0].exchange.security.upsertLookupPermission(
      'LOOKUP_TABLES_GRP2',
      permission1
    );

    await test.servers[0].exchange.security.linkGroup(savedGroups[1], savedUsers[1]);
    await test.delay(1000);

    data = await testClient.data.get('/_data/historianStore/SPECIAL_DEVICE_ID_2');
    test.expect(data).to.be.ok();

    await test.servers[0].exchange.security.removeLookupPermission(
      'LOOKUP_TABLES_GRP2',
      permission1
    );
    await test.delay(1000);
    try {
      data = await testClient.data.get('/_data/historianStore/SPECIAL_DEVICE_ID_2');
      throw new Error('Test Error : Should not be authorized');
    } catch (e) {
      test.expect(e.toString()).to.be('AccessDenied: unauthorized');
    }
  });

  it('tests unlinking a table from a group, makes sure we can only access data when properly configured', async () => {
    test.clients.push(
      (testClient = await test.client.create(
        savedUsers[2].username,
        'password',
        test.proxyPorts[1]
      ))
    ); //Second server
    let testTable = {
      name: 'STANDARD_ABC3',
      paths: ['device/OEM_ABC/COMPANY_ABC/SPECIAL_DEVICE_ID_2'],
    };
    let permission1 = {
      regex: '^/_data/historianStore/(.*)',
      actions: ['get'],
      table: 'STANDARD_ABC3',
      path: '/device/{{user.custom_data.oem}}/{{user.custom_data.company}}/{{$1}}',
    };

    await test.servers[0]._mesh.data.set('/_data/historianStore/SPECIAL_DEVICE_ID_2', {
      test: 'data2',
    });
    await test.servers[0].exchange.security.upsertLookupTable(testTable);

    let data;
    try {
      data = await testClient.data.get('/_data/historianStore/SPECIAL_DEVICE_ID_2');
      throw new Error('Test Error : Should not be authorized');
    } catch (e) {
      test.expect(e.toString()).to.be('AccessDenied: unauthorized');
    }
    await test.servers[0].exchange.security.upsertLookupPermission(
      'LOOKUP_TABLES_GRP3',
      permission1
    );

    await test.servers[0].exchange.security.linkGroup(savedGroups[2], savedUsers[2]);
    await test.delay(1000);

    data = await testClient.data.get('/_data/historianStore/SPECIAL_DEVICE_ID_2');
    test.expect(data).to.be.ok();

    await test.servers[0].exchange.security.unlinkLookupTable(
      'LOOKUP_TABLES_GRP3',
      'STANDARD_ABC3'
    );
    await test.delay(1000);
    try {
      data = await testClient.data.get('/_data/historianStore/SPECIAL_DEVICE_ID_2');
      throw new Error('Test Error : Should not be authorized');
    } catch (e) {
      test.expect(e.toString()).to.be('AccessDenied: unauthorized');
    }
  });

  function serverConfig(seq, minPeers) {
    var config = baseConfig(seq, minPeers, true);
    config.modules = {};
    config.components = {
      data: {},
    };
    config.happn.services.replicator = {
      config: {
        securityChangesetReplicateInterval: 100, // 10 per second
      },
    };
    return config;
  }
});
