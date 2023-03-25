const PeerConnectorFactory = require('./factories/peer-connector-factory');
const MembershipDbFactory = require('./factories/membership-db-factory');
const Logger = require('happn-logger');

module.exports = class Container {
  #dependencies = {};
  #config = {};
  constructor(config) {
    this.#config = config;
  }
  static create(config) {
    return new Container(config);
  }
  get dependencies() {
    return this.#dependencies;
  }
  configure() {
    this.#config = require('./configurators/cluster-configurator').create().configure(this.#config);
    this.#config = require('./configurators/database-configurator')
      .create()
      .configure(this.#config);
    Logger.configure();
  }
  registerDependencies() {
    const logger = Logger.createLogger();
    const peerConnectorFactory = new PeerConnectorFactory();
    const happnService = require('./services/happn-service').create(this.#config, logger);
    const membershipDbFactory = new MembershipDbFactory();
    const membershipDbProvider = membershipDbFactory.createMembershipDb(happnService);
    const membershipRegistryRepository =
      require('./repositories/membership-registry-repository').create(membershipDbProvider);
    const registryService = require('./services/registry-service').create(
      this.#config.services.membership.config,
      membershipRegistryRepository,
      logger
    );
    const proxyService = require('./services/proxy-service').create(this.#config, logger);
    const membershipService = require('./services/membership-service').create(
      this.#config,
      logger,
      registryService,
      happnService,
      proxyService,
      peerConnectorFactory
    );

    this.#dependencies['happnService'] = happnService;
    this.#dependencies['proxyService'] = proxyService;
    this.#dependencies['membershipService'] = membershipService;
  }
  async start() {
    await this.#dependencies['membershipService'].start();
  }
  async stop() {
    await this.#dependencies['membershipService'].stop();
  }
};
