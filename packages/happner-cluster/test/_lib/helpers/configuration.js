const _ = require('happn-commons')._;
const getSeq = require('./getSeq');
module.exports = class Configuration extends require('./helper') {
  constructor() {
    super();
  }

  static create() {
    return new Configuration();
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

  construct(
    test,
    extendedIndex,
    secure = true,
    minPeers,
    hosts,
    joinTimeout,
    replicate,
    nameSuffix
  ) {
    let [seqIndex, index] = extendedIndex;
    const base = this.base(
      index,
      seqIndex,
      secure,
      minPeers,
      hosts,
      joinTimeout,
      replicate,
      nameSuffix
    );
    return _.defaultsDeep(base, this.get(test, index));
  }

  base(index, seqIndex, secure = true, minPeers, hosts, joinTimeout, replicate, nameSuffix = '') {
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
          orchestrator: {
            config: {
              minimumPeers: minPeers || 3,
              replicate,
              timing: {
                keepAlive: 2e3,
                memberRefresh: 2e3,
                keepAliveThreshold: 3e3,
                stabilisedTimeout: 10e3,
              },
            },
          },
        },
      },
    };
  }
};
