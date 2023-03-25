const Happn = require('happn-3');
module.exports = class HappnService extends require('events').EventEmitter {
  #happn;
  #config;
  #database;
  #log;
  #externalPort;
  constructor(config, logger) {
    super();
    this.#config = config;
    // external port
    this.#externalPort = this.#config?.port;
    // internal inter-cluster port
    this.#config.port = this.#config?.services?.membership?.config?.port || 0;
    this.#log = logger;
  }
  static create(config, logger) {
    return new HappnService(config, logger);
  }
  get config() {
    return this.#config;
  }
  get database() {
    return this.#database;
  }
  async start(membershipService, proxyService) {
    proxyService.externalPort = this.#externalPort;
    this.#config.services.membership = { instance: membershipService };
    this.#config.services.proxy = { instance: proxyService };
    // we defer listening so we dont miss authentic and disconnect events
    this.#config.deferListen = true;
    this.#happn = await Happn.service.create(this.#config);
    this.#happn.services.session.on('authentic', this.#onConnectionFrom.bind(this));
    this.#happn.services.session.on('disconnect', this.#onDisconnectionFrom.bind(this));
    this.#database = this.#happn.services.data;
    await this.#happn.listen();
  }

  async stop() {
    await this.#happn.stop();
  }

  #onConnectionFrom(data) {
    if (!data?.info?.clusterName || data.info.clusterName !== this.clusterName) return;
    this.#log.debug('connect from (<-) %s/%s', data.info.clusterName, data.info.name);
    this.emit('peer-connected', data.info);
  }

  #onDisconnectionFrom(data) {
    if (!data?.info?.clusterName || data.info.clusterName !== this.clusterName) return;
    this.#log.debug('disconnect from (<-) %s/%s', data.info.clusterName, data.info.name);
    this.emit('peer-disconnected', data.info);
  }
};
