const PeerConnectorFactory = require('./factories/peer-connector-factory');
const MembershipDbFactory = require('./factories/membership-db-factory');
const Logger = require('happn-logger');
const commons = require('happn-commons');
module.exports = class Container {
  #dependencies = {};
  #config = {};
  #serviceAndMemberName;
  #log;

  get config() {
    return commons.clone(this.#config);
  }

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
    // testable process management
    const processManagerService = require('./services/process-manager-service').create(
      Logger.createLogger(`${this.#serviceAndMemberName}-process-manager-service`),
      process
    );

    //proxy service (listens for external connections when cluster member is stable)
    const proxyService = require('./services/proxy-service').create(
      this.#config,
      Logger.createLogger(`${this.#serviceAndMemberName}-cluster-proxy-service`)
    );

    // wraps and controls happn-3
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

    // replication - security directory changes
    const securityDirectoryReplicator =
      require('./replicators/security-directory-replicator').create(
        this.#config,
        Logger.createLogger(`${this.#serviceAndMemberName}-security-directory-replicator`),
        happnService,
        processManagerService
      );
    // replication - event propagation
    const eventReplicator = require('./replicators/event-replicator').create(
      this.#config,
      Logger.createLogger(`${this.#serviceAndMemberName}-event-replicator`),
      happnService
    );

    // peer management
    const peerConnectorFactory = new PeerConnectorFactory();
    const clusterPeerService = require('./services/cluster-peer-service').create(
      this.#config,
      Logger.createLogger(`${this.#serviceAndMemberName}-cluster-peer-service`),
      peerConnectorFactory,
      eventReplicator
    );

    // membership and cluster control
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
    this.#dependencies['securityDirectoryReplicator'] = securityDirectoryReplicator;
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
