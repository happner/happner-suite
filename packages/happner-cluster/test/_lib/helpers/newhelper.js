const TestHelper = require('happn-commons-test/lib/base-test-helper');
const users = require('../users');
module.exports.basic = function (startInternal, startEdge) {
  return {
    startClusterInternalFirst: async function (replicate) {
      let servers = [];
      localInstance = await startInternal(0, 1, replicate);
      servers.push(localInstance);
      servers.push(await startEdge(1, 2, replicate));
      await TestHelper.delay(2e3)
      await users.add(localInstance, 'username', 'password');
      let proxyPorts = servers.map(
        (server) => server._mesh.happn.server.config.services.proxy.port
      );
      return { servers, proxyPorts };
    },

    startClusterEdgeFirst: async function (replicate) {
      servers = [];
      servers.push(await startEdge(0, 1, replicate));
      localInstance = await startInternal(1, 2, replicate);
      servers.push(localInstance);
      await users.add(localInstance, 'username', 'password');
      proxyPorts = servers.map((server) => server._mesh.happn.server.config.services.proxy.port);
      return { servers, proxyPorts };
    },
  };
};
