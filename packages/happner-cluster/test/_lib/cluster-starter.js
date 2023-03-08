module.exports = class ClusterStarter {
  constructor(test, internalConfigurator, externalConfigurator) {
    this.test = test;
    this.test.servers = [];
    this.internalConfigurator = internalConfigurator;
    this.externalConfigurator = externalConfigurator;
  }
  static create(test, internalConfigurator, externalConfigurator) {
    return new ClusterStarter(test, internalConfigurator, externalConfigurator);
  }

  async startInternal(id, clusterMin, replicate) {
    let server = await this.test.HappnerCluster.create(
      this.internalConfigurator(id, clusterMin, replicate)
    );
    this.test.servers.push(server);
    return server;
  }

  async startEdge(id, clusterMin, replicate) {
    let server = await this.test.HappnerCluster.create(
      this.externalConfigurator(id, clusterMin, replicate)
    );
    this.test.servers.push(server);
    return server;
  }

  async startClusterInternalFirst(flag) {
    // What the flag means is dependant on the internalConfigurator and externalConfigurator,
    // but will commonly be either 'replicate' or 'dynamic'
    await this.startInternal(0, 1, flag);
    await this.startEdge(1, 2, flag);
    await this.test.delay(2000);
    [this.test.localInstance, this.test.edgeInstance] = this.test.servers;
    await this.test.users.add(this.test.servers[0], 'username', 'password');
    this.test.proxyPorts = this.test.servers.map(
      (server) => server._mesh.happn.server.config.services.proxy.port
    );

    return this.test.proxyPorts;
  }

  async startClusterEdgeFirst(flag, delay = 2e3) {
    await this.startEdge(0, 1, flag);
    await this.startInternal(1, 2, flag);
    await this.test.delay(delay);
    await this.test.users.add(this.test.servers[1], 'username', 'password');
    [this.test.edgeInstance, this.test.localInstance] = this.test.servers;
    this.test.proxyPorts = this.test.servers.map(
      (server) => server._mesh.happn.server.config.services.proxy.port
    );
    return this.test.proxyPorts;
  }

  async startClusterEdgeFirstHighAvailable(flag, delay = 2e3) {
    await this.startEdge(0, 1, flag);
    await this.startInternal(1, 2, flag);
    await this.startInternal(2, 3, flag);
    await this.test.delay(delay);
    await this.test.users.add(this.test.servers[1], 'username', 'password');
    this.test.proxyPorts = this.test.servers.map(
      (server) => server._mesh.happn.server.config.services.proxy.port
    );
    return this.test.proxyPorts;
  }
};
