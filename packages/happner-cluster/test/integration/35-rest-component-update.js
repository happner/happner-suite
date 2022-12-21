const libDir = require('../_lib/lib-dir');
const baseConfig = require('../_lib/base-config');

require('../_lib/test-helper').describe({ timeout: 120e3 }, (test) => {
  let hooksConfig = {
    cluster: {
      functions: [remoteInstanceConfig, localInstanceConfig],
    },
  };
  test.hooks.standardHooks(test, hooksConfig);

  context('rest', function () {
    it('does a rest call', async function () {
      let axios = test.axios;
      await test.delay(2e3);
      let port = test.proxyPorts[1];
      let credentials = {
        username: '_ADMIN',
        password: 'ADMIN_PASSWORD',
      };
      let token = (await axios.post(`http://127.0.0.1:${port}/rest/login`, credentials)).data.data
        .token;

      let description = (
        await axios.get(`http://127.0.0.1:${port}/rest/describe?happn_token=${token}`)
      ).data.data;
      test.expect(description['/remoteComponent/webMethod1']).to.be.ok();
      test.expect(description['/remoteComponent2/webMethod2']).to.not.be.ok();
      await startInternal2(2, 2);
      await test.delay(3000);
      description = (await axios.get(`http://127.0.0.1:${port}/rest/describe?happn_token=${token}`))
        .data.data;
      test.expect(description['/remoteComponent/webMethod1']).to.be.ok();
      test.expect(description['/remoteComponent2/webMethod2']).to.be.ok();

      //Should still have correct description after component leaves
      await test.servers.pop().stop({ reconnect: false });
      await test.delay(1000);
      description = (await axios.get(`http://127.0.0.1:${port}/rest/describe?happn_token=${token}`))
        .data.data;
      test.expect(description['/remoteComponent/webMethod1']).to.be.ok();
      test.expect(description['/remoteComponent2/webMethod2']).to.be.ok();
    });
  });

  function localInstanceConfig(seq, sync) {
    var config = baseConfig(seq, sync, true);
    config.happn.adminPassword = 'ADMIN_PASSWORD';
    config.authorityDelegationOn = true;
    let brokerComponentPath = libDir + 'integration-35-broker-component';

    config.modules = {
      brokerComponent: {
        path: brokerComponentPath,
      },
    };
    config.components = {
      brokerComponent: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    return config;
  }

  function remoteInstanceConfig(seq, sync) {
    var config = baseConfig(seq, sync, true);
    config.happn.adminPassword = 'ADMIN_PASSWORD';
    config.modules = {
      remoteComponent: {
        path: libDir + 'integration-35-remote-component',
      },
    };
    config.components = {
      remoteComponent: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    return config;
  }

  function remoteInstanceConfig2(seq, sync) {
    var config = baseConfig(seq, sync, true);
    config.happn.adminPassword = 'ADMIN_PASSWORD';
    config.modules = {
      remoteComponent2: {
        path: libDir + 'integration-35-remote-component2',
      },
    };
    config.components = {
      remoteComponent2: {
        startMethod: 'start',
        stopMethod: 'stop',
      },
    };
    return config;
  }

  async function startInternal2(id, clusterMin) {
    const server = await test.HappnerCluster.create(remoteInstanceConfig2(id, clusterMin));
    test.servers.push(server);
    return server;
  }
});
