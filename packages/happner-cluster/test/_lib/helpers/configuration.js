const _ = require('happn-commons')._;
module.exports = class Configuration extends require('./helper') {
  constructor() {
    super();
  }

  static create() {
    return new Configuration();
  }

  getExternalPorts(cluster) {
    return cluster.instances
      .sort((a, b) => {
        if (a._mesh.config.name < b._mesh.config.name) return -1;
        return 1;
      })
      .map((server) => server._mesh.happn.server.config.services.proxy.port);
  }

  extract(test, index, name) {
    const configuration = this.get(test, index);
    return {
      module: {
        name,
        config: configuration.modules[name],
      },
      component: {
        name,
        config: configuration.components[name],
      },
    };
  }

  get(test, index) {
    return require(`../configurations/${test}/${index}`);
  }

  construct(deploymentId, test, index, secure = true, replicate, nameSuffix) {
    const base = this.base(index, secure, replicate, nameSuffix);
    base.happn.services.membership = {
      config: {
        deploymentId,
        securityChangeSetReplicateInterval: 20, // 50 per second
      },
    };
    return _.defaultsDeep(base, this.get(test, index));
  }

  base(index, secure = true, replicate, nameSuffix = '') {
    replicate = replicate || ['*'];

    return {
      name: 'MESH_' + index + nameSuffix,
      domain: 'DOMAIN_NAME',
      port: 0,
      cluster: {
        requestTimeout: 10000,
        responseTimeout: 20000,
      },
      happn: {
        secure,
        services: {
          security: {
            config: {
              sessionTokenSecret: 'TEST-SESSION-TOKEN-SECRET',
            },
          },
          data: {
            config: {
              autoUpdateDBVersion: true,
            },
          },
          proxy: {
            config: {
              port: 0,
            },
          },
        },
      },
    };
  }
};
