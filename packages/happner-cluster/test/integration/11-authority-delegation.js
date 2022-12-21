const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');

require('../_lib/test-helper').describe({ timeout: 30e3 }, (test) => {
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
    this.timeout(6000);
    await test.users.allowMethod(
      test.localInstance,
      'username',
      'localComponent1',
      'localMethodToRemoteMethod'
    );
    //first test our broker components methods are directly callable
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

  it('ensures a happner client without the correct permissions is unable to execute a remote components method, 2 levels deep', async function () {
    this.timeout(6000);
    await test.users.allowMethod(
      test.localInstance,
      'username',
      'localComponent1',
      'localMethodToRemoteMethod'
    );
    await test.users.allowMethod(test.localInstance, 'username', 'remoteComponent2', 'method2');
    //first test our broker components methods are directly callable
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

  it('ensures a happner client without the correct permissions is unable to subscribe to a remote components event', async function () {
    this.timeout(6000);
    await test.users.allowMethod(
      test.localInstance,
      'username',
      'localComponent1',
      'localMethodToRemoteEvent'
    );
    //first test our broker components methods are directly callable
    try {
      await test.clients[0].exchange.localComponent1.localMethodToRemoteEvent();
      throw new Error('unexpected success');
    } catch (e) {
      test.expect(e.toString()).to.be('AccessDenied: unauthorized');
    }
  });

  it('ensures a happner client without the correct permissions is unable to subscribe to a remote components event, 2 levels deep', async function () {
    this.timeout(6000);
    await test.users.allowMethod(
      test.localInstance,
      'username',
      'localComponent1',
      'localMethodToRemoteMethod'
    );
    await test.users.allowMethod(test.localInstance, 'username', 'remoteComponent2', 'method3');

    //first test our broker components methods are directly callable
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

  it('ensures a happner client without the correct permissions is unable to modify a remote components data', async function () {
    this.timeout(6000);
    await test.users.allowMethod(
      test.localInstance,
      'username',
      'localComponent1',
      'localMethodToData'
    );
    try {
      //first test our broker components methods are directly callable
      await test.clients[0].exchange.localComponent1.localMethodToData();

      throw new Error('unexpected success');
    } catch (e) {
      test.expect(e.toString()).to.be('AccessDenied: unauthorized');
    }
  });

  function localInstanceConfig(seq) {
    var config = baseConfig(seq, undefined, true);
    config.modules = {
      localComponent1: {
        path: libDir + 'integration-10-local-component1',
      },
    };
    config.components = {
      localComponent1: {
        security: {
          authorityDelegationOn: true,
        },
      },
    };
    return config;
  }

  function remoteInstanceConfig(seq) {
    var config = baseConfig(seq, undefined, true);
    config.modules = {
      remoteComponent2: {
        path: libDir + 'integration-10-remote-component2',
      },
      remoteComponent3: {
        path: libDir + 'integration-10-remote-component3',
      },
    };
    config.components = {
      remoteComponent2: {
        security: {
          authorityDelegationOn: true,
        },
      },
      remoteComponent3: {
        security: {
          authorityDelegationOn: true,
        },
      },
    };
    return config;
  }
});
