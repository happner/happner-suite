const commons = require('happn-commons');
const MemberStatuses = require('../constants/member-statuses');
const getAddress = require('../utils/get-address');

module.exports = class MembershipService extends require('events').EventEmitter {
  #log;
  #registryService;
  #deploymentId;
  #clusterName;
  #serviceName;
  #memberHost;
  #memberName;
  #discoverTimeoutMs;
  #pulseIntervalMs;
  #dependencies;
  #status;
  #pulseErrors;
  #pulseErrorThreshold;
  #happnService;
  #proxyService;
  #clusterPeerService;
  #clusterHealthService;
  #config;
  #membershipServiceConfig;

  constructor(
    config,
    logger,
    registryService,
    happnService,
    proxyService,
    clusterPeerService,
    clusterHealthService
  ) {
    super();

    // configuration settings
    this.#config = config;
    this.#membershipServiceConfig = this.#config.services.membership.config;
    this.#deploymentId = this.#membershipServiceConfig.deploymentId;
    this.#clusterName = this.#membershipServiceConfig.clusterName;
    this.#serviceName = this.#membershipServiceConfig.serviceName;
    this.#memberName = this.#membershipServiceConfig.memberName;
    this.#discoverTimeoutMs = this.#membershipServiceConfig.discoverTimeoutMs || 60e3; // 1 minute
    this.#pulseIntervalMs = this.#membershipServiceConfig.pulseIntervalMs || 1e3;
    this.#pulseErrorThreshold = this.#membershipServiceConfig.pulseErrorThreshold || 5; // allow 5 failed pulses in a row before we fail
    this.#dependencies = this.#membershipServiceConfig.dependencies || {};

    // injected dependencies
    this.#log = logger;
    this.#clusterPeerService = clusterPeerService;
    this.#registryService = registryService;
    this.#clusterHealthService = clusterHealthService;
    this.#happnService = happnService;
    this.#proxyService = proxyService;

    // internal state
    this.#memberHost = getAddress(this.#log)();
    this.#status = MemberStatuses.STOPPED;

    this.#log.info(`initialized`);
  }
  static create(
    config,
    logger,
    registryService,
    happnService,
    proxyService,
    clusterPeerService,
    clusterHealthService
  ) {
    return new MembershipService(
      config,
      logger,
      registryService,
      happnService,
      proxyService,
      clusterPeerService,
      clusterHealthService
    );
  }
  get status() {
    return this.#status;
  }
  get clusterName() {
    return this.#clusterName;
  }
  get serviceName() {
    return this.#serviceName;
  }
  get memberName() {
    return this.#memberName;
  }
  get deploymentId() {
    return this.#deploymentId;
  }
  get dependencies() {
    return this.#dependencies;
  }
  async start() {
    this.#log.info(`starting`);
    this.#happnService.on('peer-connected', this.#peerConnected.bind(this));
    this.#happnService.on('peer-disconnected', this.#peerDisconnected.bind(this));
    await this.#happnService.start(this, this.#proxyService);
    this.#statusChanged(MemberStatuses.DISCOVERING);
    this.#startBeating();
    await this.#discover();
    this.#log.info(`starting proxy`);
    if (this.#config.services.proxy.config.defer) {
      return;
    }
    await this.#proxyService.start();
    this.#log.info(`started`);
  }
  stop(opts, cb) {
    if (typeof opts === 'function') {
      cb = opts;
    }
    this.#statusChanged(MemberStatuses.STOPPED);
    this.#clusterHealthService.stopHealthReporting();
    this.#log.info(`stopped membership service`);
    cb();
  }
  async #discover() {
    const startedDiscovering = Date.now();
    while (this.#status === MemberStatuses.DISCOVERING) {
      this.#log.info(`scanning deployment: ${this.#deploymentId}, cluster: ${this.#clusterName}`);
      const scanResult = await this.#registryService.scan(
        this.#deploymentId,
        this.#clusterName,
        this.#dependencies,
        this.#memberName,
        [MemberStatuses.DISCOVERING, MemberStatuses.CONNECTING, MemberStatuses.STABLE]
      );
      if (scanResult === true) {
        this.#statusChanged(MemberStatuses.CONNECTING);
        await this.#connect();
        break;
      }
      if (Date.now() - startedDiscovering > this.#discoverTimeoutMs) {
        this.#log.error('discover timeout');
        throw new Error('discover timeout');
      }
      await commons.delay(this.#pulseIntervalMs);
    }
  }
  async #connect() {
    const peers = await this.#registryService.list(
      this.#deploymentId,
      this.#clusterName,
      this.#memberName,
      [MemberStatuses.DISCOVERING, MemberStatuses.CONNECTING, MemberStatuses.STABLE]
    );
    await this.#clusterPeerService.connect(this.#deploymentId, this.#clusterName, peers);
    this.#clusterHealthService.startHealthReporting(
      this.#deploymentId,
      this.#clusterName,
      this.#dependencies,
      this.#memberName
    );
    return this.#statusChanged(MemberStatuses.STABLE);
  }
  async #startBeating() {
    while (this.#status !== MemberStatuses.STOPPED) {
      try {
        await this.#registryService.pulse(
          this.#deploymentId,
          this.#clusterName,
          this.#serviceName,
          this.#memberName,
          this.#memberHost,
          this.status
        );
        this.#pulseErrors = 0; // reset our pulse errors
      } catch (e) {
        this.#log.error(`failed pulse: ${e.message}`);
        this.#pulseErrors++;
        if (this.#pulseErrors === this.#pulseErrorThreshold) {
          this.#statusChanged(MemberStatuses.FAILED_PULSE);
          // TODO: what do we do now - is this a fatal?
          break;
        }
      }
      await commons.delay(this.#pulseIntervalMs);
    }
  }
  #statusChanged(newStatus) {
    this.#log.info(`status changed: ${newStatus}`);
    this.#status = newStatus;
    this.emit('status-changed', newStatus);
  }
  #peerConnected(origin) {}
  #peerDisconnected(origin) {}
};
