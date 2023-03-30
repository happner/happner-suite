const PeerConnectorFactory = require('./factories/peer-connector-factory');
const MembershipDbFactory = require('./factories/membership-db-factory');
const Logger = require('happn-logger');
module.exports = class Container {
  #dependencies = {};
  #config = {};
  #serviceAndMemberName;
  #log;
  constructor(config) {
    Logger.configure();
    this.#config = require('./configurators/cluster-configurator').create().configure(config);
    this.#config = require('./configurators/database-configurator')
      .create()
      .configure(this.#config);
    this.#serviceAndMemberName = `${this.#config.services.membership.config.serviceName}-${
      this.#config.services.membership.config.memberName
    }`;
    this.#log = Logger.createLogger(`${this.#serviceAndMemberName}-container`);
  }
  static create(config) {
    return new Container(config);
  }
  get dependencies() {
    return this.#dependencies;
  }
  registerDependencies() {
    const processManagerService = require('./services/process-manager-service').create(
      Logger.createLogger(`${this.#serviceAndMemberName}-process-manager-service`),
      process
    );
    const proxyService = require('./services/proxy-service').create(
      this.#config,
      Logger.createLogger(`${this.#serviceAndMemberName}-cluster-proxy-service`)
    );
    const happnService = require('./services/happn-service').create(
      this.#config,
      Logger.createLogger(`${this.#serviceAndMemberName}-cluster-happn-service`)
    );

    // membership scanning
    const membershipDbFactory = new MembershipDbFactory();
    const membershipDbProvider = membershipDbFactory.createMembershipDb(happnService);
    const membershipRegistryRepository =
      require('./repositories/membership-registry-repository').create(membershipDbProvider);
    const registryService = require('./services/registry-service').create(
      this.#config.services.membership.config,
      membershipRegistryRepository,
      Logger.createLogger(`${this.#serviceAndMemberName}-cluster-registry-service`)
    );

    // health reporting
    const clusterHealthService = require('./services/cluster-health-service').create(
      Logger.createLogger(`${this.#serviceAndMemberName}-cluster-health-service`)
    );

    // peer management
    const localReplicator = require('./replicators/local-replicator').create();
    const clusterReplicator = require('./replicators/cluster-replicator').create();
    const peerConnectorFactory = new PeerConnectorFactory();
    const clusterPeerService = require('./services/cluster-peer-service').create(
      this.#config,
      Logger.createLogger(`${this.#serviceAndMemberName}-cluster-peer-service`),
      peerConnectorFactory,
      localReplicator,
      clusterReplicator
    );
    const membershipService = require('./services/membership-service').create(
      this.#config,
      Logger.createLogger(`${this.#serviceAndMemberName}-cluster-membership-service`),
      registryService,
      happnService,
      proxyService,
      clusterPeerService,
      clusterHealthService,
      processManagerService
    );

    this.#dependencies['happnService'] = happnService;
    this.#dependencies['proxyService'] = proxyService;
    this.#dependencies['clusterPeerService'] = clusterPeerService;
    this.#dependencies['membershipService'] = membershipService;
  }
  async start() {
    try {
      await this.#dependencies['membershipService'].start();
    } catch (e) {
      this.#log.info(`failed starting container: ${e.message}`);
      await this.stop();
      throw e;
    }
  }
  async stop(opts = {}) {
    this.#log.info('stopping container');
    await this.#dependencies['happnService'].stop(opts);
    this.#log.info(`stopped container successfully`);
  }
};
