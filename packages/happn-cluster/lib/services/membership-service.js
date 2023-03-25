const commons = require('happn-commons');
const MemberStatuses = require('../constants/member-statuses');
const getAddress = require('../utils/get-address');
const PeerInfoBuilder = require('../builders/peer-info-builder');

module.exports = class MembershipService extends require('events').EventEmitter {
  #log;
  #registryService;
  #deploymentId;
  #clusterName;
  #serviceName;
  #memberHost;
  #memberName;
  #discoverTimeoutMs;
  #healthReportIntervalMs;
  #pulseIntervalMs;
  #dependencies;
  #status;
  #peerConnectorFactory;
  #peerConnectors = [];
  #pulseErrors;
  #pulseErrorThreshold;
  #happnService;
  #proxyService;
  #config;

  constructor(config, logger, registryService, happnService, proxyService, peerConnectorFactory) {
    super();

    // configuration settings
    this.#config = config;
    this.#deploymentId = config?.services?.membership?.config?.deploymentId;
    this.#clusterName = config?.services?.membership?.config?.clusterName;
    this.#serviceName = config?.services?.membership?.config?.serviceName;
    this.#memberName = config.name || `${this.#serviceName}-${commons.uuid.v4()}`;
    this.#discoverTimeoutMs = config?.services?.membership?.config?.discoverTimeoutMs || 60e3; // 1 minute
    this.#healthReportIntervalMs =
      config?.services?.membership?.config?.healthReportIntervalMs || 5e3;
    this.#pulseIntervalMs = config?.services?.membership?.config?.pulseIntervalMs || 1e3;
    this.#pulseErrorThreshold = config?.services?.membership?.config?.pulseErrorThreshold || 5; // allow 5 failed pulses in a row before we fail
    this.#dependencies = config?.services?.membership?.config?.dependencies;

    // injected dependencies
    this.#peerConnectorFactory = peerConnectorFactory;
    this.#log = logger;
    this.#registryService = registryService;
    this.#happnService = happnService;
    this.#proxyService = proxyService;

    // internal state
    this.#memberHost = getAddress(this.#log)();
    this.#status = MemberStatuses.STOPPED;

    this.stop = commons.maybePromisify(this.stop);
    this.#log.info(`initialized`);
  }
  static create(config, logger, registryService, happnService, proxyService, peerConnectorFactory) {
    return new MembershipService(
      config,
      logger,
      registryService,
      happnService,
      proxyService,
      peerConnectorFactory
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
    this.#startHealthReporting();
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
    if (this.status === MemberStatuses.STOPPED) {
      // because stop gets called again when happn service stops
      this.#log.info(`stopped membership service`);
      return cb();
    }
    this.#statusChanged(MemberStatuses.STOPPED);
    this.#happnService.stop(cb);
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
        this.stop();
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
    const peerInfoItems = peers.map((peerListItem) => {
      return PeerInfoBuilder.create()
        .withDeploymentId(this.#deploymentId)
        .withClusterName(this.#clusterName)
        .withServiceName(peerListItem.serviceName)
        .withMemberName(peerListItem.memberName)
        .withMemberHost(peerListItem.memberHost)
        .withMemberStatus(peerListItem.status)
        .build();
    });
    for (const peerInfo of peerInfoItems) {
      const connectorPeer = this.#peerConnectorFactory.createPeerConnector(peerInfo);
      this.#peerConnectors.push(connectorPeer);
      await connectorPeer.connect();
    }

    this.#startHealthReporting(); // we can start reporting health
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
  async #startHealthReporting() {
    while (this.#status !== MemberStatuses.STOPPED) {
      try {
        const scanResult = await this.#registryService.scan(
          this.#deploymentId,
          this.#clusterName,
          this.#dependencies,
          this.#memberName,
          [MemberStatuses.STABLE]
        );
        if (scanResult === true) {
          this.#log.info('healthy');
        } else {
          // TODO: go into more detail
          this.#log.warn('unhealthy');
        }
      } catch (e) {
        this.#log.error(`failed health report: ${e.message}`);
      }
      await commons.delay(this.#healthReportIntervalMs);
    }
  }
  #statusChanged(newStatus) {
    this.#log.info(`status changed: ${newStatus}`);
    this.#status = newStatus;
    this.emit('status-changed', newStatus);
  }
  #peerConnected(origin) {

  }
  #peerDisconnected(origin) {

  }
};
