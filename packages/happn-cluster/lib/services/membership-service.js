const commons = require('happn-commons');
const MemberStatuses = require('../constants/member-statuses');
const getAddress = require('../utils/get-address');
const Logger = require('happn-logger');
const { setTimeout } = require('timers/promises');
const PeerInfoBuilder = require('../builders/peer-info-builder');

module.exports = class MembershipService extends require('events').EventEmitter {
  #log;
  #registry;
  #deploymentId;
  #clusterName;
  #serviceName;
  #memberHost;
  #memberName;
  #deployment;
  #discoverTimeoutMs;
  #healthReportIntervalMs;
  #pulseIntervalMs;
  #dependencies;
  #status;
  #peerConnectorFactory;
  #peerConnectors = [];
  #pulseErrors;
  #pulseErrorThreshold;
  constructor(config, registry, peerConnectorFactory) {
    super();

    // configuration settings
    this.#deploymentId = config.deploymentId;
    this.#clusterName = config.clusterName;
    this.#serviceName = config.serviceName;
    this.#memberName = config.memberName || `${config.serviceName}-${commons.uuid.v4()}`;
    this.#deployment = config.deployment;
    this.#discoverTimeoutMs = config.discoverTimeoutMs || 60e3; // 1 minute
    this.#healthReportIntervalMs = config.healthReportIntervalMs || 5e3;
    this.#pulseIntervalMs = config.pulseIntervalMs || 1e3;
    this.#pulseErrorThreshold = config.pulseErrorThreshold || 5; // allow 5 failed pulses in a row before we fail
    this.#dependencies = config.dependencies;

    // injected dependencies
    this.#peerConnectorFactory = peerConnectorFactory;

    // internal state
    this.#registry = registry;
    this.#log = Logger.createLogger(`cluster-member-${this.#memberName}`);
    this.#memberHost = getAddress(this.#log)();
    this.#status = MemberStatuses.STOPPED;

    this.#log.info(`initialized`);
  }
  static create(config, registry) {
    return new MembershipService(config, registry);
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
  get deployment() {
    return this.#deployment;
  }
  get dependencies() {
    return this.#dependencies;
  }
  start() {
    this.#log.info(`starting`);
    this.#startBeating();
    this.#discover();
  }
  stop() {
    this.#statusChanged(MemberStatuses.STOPPED);
  }
  async #discover() {
    this.#statusChanged(MemberStatuses.DISCOVERING);
    setTimeout(() => {
      this.#statusChanged(MemberStatuses.FAILED_DISCOVER_TIMEOUT);
    }, this.#discoverTimeoutMs);
    while (this.#status === MemberStatuses.DISCOVERING) {
      try {
        if (
          (await this.#registry.scan(
            this.#deploymentId,
            this.#clusterName,
            this.#dependencies,
            this.#memberName,
            [MemberStatuses.DISCOVERING, MemberStatuses.CONNECTING, MemberStatuses.STABLE]
          )) === true
        ) {
          this.#statusChanged(MemberStatuses.CONNECTING);
          await this.#connect();
          break;
        }
      } catch (e) {
        //TODO: logging here
        return this.#statusChanged(MemberStatuses.FAILED_DISCOVER);
      }
      await setTimeout(this.#pulseIntervalMs);
    }
  }
  async #connect() {
    try {
      const peers = await this.#registry.list(
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
          .withMemberStatus(peerListItem.memberStatus);
      });
      for (const peerInfo of peerInfoItems) {
        const connectorPeer = this.#peerConnectorFactory.createPeerConnector(peerInfo);
        this.#peerConnectors.push(connectorPeer);
        await connectorPeer.connect();
      }
    } catch (e) {
      return this.#statusChanged(MemberStatuses.FAILED_CONNECTING);
    }
    return this.#statusChanged(MemberStatuses.STABLE);
  }
  async #startBeating() {
    while (this.#status !== MemberStatuses.STOPPED) {
      try {
        await this.#registry.pulse(
          this.#deploymentId,
          this.#clusterName,
          this.#serviceName,
          this.#memberName,
          this.#memberHost,
          this.status
        );
        this.#pulseErrors = 0; // reset our pulse errors
      } catch (e) {
        this.emit('pulse-error', new Error(`pulse error: ${e.message}`));
        this.#pulseErrors++;
        if (this.#pulseErrors === this.#pulseErrorThreshold) {
          this.#statusChanged(MemberStatuses.FAILED_PULSE);
          // TODO: what do we do now - is this a fatal?
          break;
        }
      }
      await setTimeout(this.#pulseIntervalMs);
    }
  }
  #statusChanged(newStatus) {
    this.#log.info(`status changed: ${newStatus}`);
    this.#status = newStatus;
    this.emit('status-changed', newStatus);
  }
};
