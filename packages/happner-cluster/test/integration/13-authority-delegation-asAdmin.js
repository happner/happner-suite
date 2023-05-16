const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');

let deploymentId;
require('../_lib/test-helper').describe({ timeout: 20e3 }, (test) => {
  deploymentId = test.newid();
  let hooksConfig = {
    cluster: {
      functions: [
        localInstanceConfig,
        remoteInstanceConfig,
        remoteInstanceConfig,
        remoteInstanceConfig,
      ],
      localInstance: 0,
    },
    clients: [0],
  };
  test.hooks.standardHooks(test, hooksConfig, {}, true);

  it('ensures a happner client without the correct permissions is unable to execute a remote components method', async function () {
    this.timeout(4000);

    await test.users.allowMethod(
      test.localInstance,
      'username',
      'localComponent1',
      'localMethodToRemoteMethod'
    );
    try {
      await test.clients[0].exchange.localComponent1.localMethodToRemoteMethod(
        'remoteComponent2',
        'method1'
      );
      throw new Error('unexpected success');
    } catch (e) {
      test.expect(e.toString()).to.be('AccessDenied: unauthorized');
    }
  });

  it('ensures a happner client without the correct permissions is able to execute a remote components method - asAdmin', async function () {
    this.timeout(4000);

    await test.users.allowMethod(
      test.localInstance,
      'username',
      'localComponent1',
      'localMethodToRemoteMethod'
    );
    await test.clients[0].exchange.localComponent1.localMethodToRemoteMethod(
      'remoteComponent2',
      'method1',
      true
    );
  });

  it('ensures a happner client without the correct permissions is unable to execute a remote components method, 2 levels deep', async function () {
    this.timeout(4000);

    await test.users.allowMethod(
      test.localInstance,
      'username',
      'localComponent1',
      'localMethodToRemoteMethod'
    );
    await test.users.allowMethod(test.localInstance, 'username', 'remoteComponent2', 'method2');

    try {
      await test.clients[0].exchange.localComponent1.localMethodToRemoteMethod(
        'remoteComponent2',
        'method2'
      );

      throw new Error('unexpected success');
    } catch (e) {
      test.expect(e.toString()).to.be('AccessDenied: unauthorized');
    }
  });

  it('ensures a happner client without the correct permissions is able to execute a remote components method, 2 levels deep - asAdmin', async function () {
    this.timeout(4000);

    await test.users.allowMethod(
      test.localInstance,
      'username',
      'localComponent1',
      'localMethodToRemoteMethod'
    );
    await test.users.allowMethod(test.localInstance, 'username', 'remoteComponent2', 'method2');
    await test.clients[0].exchange.localComponent1.localMethodToRemoteMethod(
      'remoteComponent2',
      'method2',
      true
    );
  });

  it('ensures a happner client without the correct permissions is unable to subscribe to a remote components event', async function () {
    this.timeout(4000);

    await test.users.allowMethod(
      test.localInstance,
      'username',
      'localComponent1',
      'localMethodToRemoteEvent'
    );
    try {
      await test.clients[0].exchange.localComponent1.localMethodToRemoteEvent();
      throw new Error('unexpected success');
    } catch (e) {
      test.expect(e.toString()).to.be('AccessDenied: unauthorized');
    }
  });

  it('ensures a happner client without the correct permissions is able to subscribe to a remote components event - asAdmin', async function () {
    this.timeout(4000);

    await test.users.allowMethod(
      test.localInstance,
      'username',
      'localComponent1',
      'localMethodToRemoteEvent'
    );
    await test.clients[0].exchange.localComponent1.localMethodToRemoteEvent(true);
  });

  it('ensures a happner client without the correct permissions is unable to subscribe to a remote components event, 2 levels deep', async function () {
    this.timeout(4000);

    await test.users.allowMethod(
      test.localInstance,
      'username',
      'localComponent1',
      'localMethodToRemoteMethod'
    );
    await test.users.allowMethod(test.localInstance, 'username', 'remoteComponent2', 'method3');
    try {
      await test.clients[0].exchange.localComponent1.localMethodToRemoteMethod(
        'remoteComponent2',
        'method3'
      );
      throw new Error('unexpected success');
    } catch (e) {
      test.expect(e.toString()).to.be('AccessDenied: unauthorized');
    }
  });

  it('ensures a happner client without the correct permissions is able to subscribe to a remote components event, 2 levels deep - asAdmin', async function () {
    this.timeout(4000);

    await test.users.allowMethod(
      test.localInstance,
      'username',
      'localComponent1',
      'localMethodToRemoteMethod'
    );
    await test.users.allowMethod(test.localInstance, 'username', 'remoteComponent2', 'method3');
    await test.clients[0].exchange.localComponent1.localMethodToRemoteMethod(
      'remoteComponent2',
      'method3',
      true
    );
  });

  it('ensures a happner client without the correct permissions is unable to modify a remote components data', async function () {
    this.timeout(6000);
    await test.users.allowMethod(
      test.localInstance,
      'username',
      'localComponent1',
      'localMethodToData'
    );
    try {
      await test.clients[0].exchange.localComponent1.localMethodToData();

      throw new Error('unexpected success');
    } catch (e) {
      test.expect(e.toString()).to.be('AccessDenied: unauthorized');
    }
  });

  function localInstanceConfig(seq) {
    var config = baseConfig(seq, undefined, true);
    config.happn.services.membership.config.serviceName = 'remote-service';
    config.happn.services.membership.config.deploymentId = deploymentId;
    config.authorityDelegationOn = true;
    config.modules = {
      localComponent1: {
        path: libDir + 'integration-10-local-component1',
      },
    };
    config.components = {
      localComponent1: {},
    };
    return config;
  }

  function remoteInstanceConfig(seq) {
    var config = baseConfig(seq, undefined, true);
    config.happn.services.membership.config.serviceName = 'remote-service';
    config.happn.services.membership.config.deploymentId = deploymentId;
    config.authorityDelegationOn = true;
    config.modules = {
      remoteComponent2: {
        path: libDir + 'integration-10-remote-component2',
      },
      remoteComponent3: {
        path: libDir + 'integration-10-remote-component3',
      },
    };
    config.components = {
      remoteComponent2: {},
      remoteComponent3: {},
    };
    return config;
  }
});
