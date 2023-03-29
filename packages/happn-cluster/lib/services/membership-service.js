const commons = require('happn-commons');
const MemberStatuses = require('../constants/member-statuses');
const getAddress = require('../utils/get-address');
const ClusterCredentialsBuilder = require('../builders/cluster-member-credentials-builder');
const ClusterMemberInfoBuilder = require('../builders/cluster-member-builder');
const ClusterPeerBuilder = require('../builders/cluster-peer-builder');
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
  #clusterCredentials;
  #memberScanningErrors;
  #memberScanningErrorThreshold;
  #processManagerService;
  constructor(
    config,
    logger,
    registryService,
    happnService,
    proxyService,
    clusterPeerService,
    clusterHealthService,
    processManagerService
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
    this.#memberScanningErrorThreshold =
      this.#membershipServiceConfig.memberScanningErrorThreshold || 3; // allow 3 failed list errors in a row before we fail
    this.#dependencies = this.#membershipServiceConfig.dependencies || {};
    this.#clusterCredentials = this.#getClusterCredentials();

    // injected dependencies
    this.#log = logger;
    this.#clusterPeerService = clusterPeerService;
    this.#registryService = registryService;
    this.#clusterHealthService = clusterHealthService;
    this.#happnService = happnService;
    this.#proxyService = proxyService;
    this.#processManagerService = processManagerService;

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
    clusterHealthService,
    processManagerService
  ) {
    return new MembershipService(
      config,
      logger,
      registryService,
      happnService,
      proxyService,
      clusterPeerService,
      clusterHealthService,
      processManagerService
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

  #getClusterCredentials() {
    const credentials = ClusterCredentialsBuilder.create().withClusterMemberInfo(
      ClusterMemberInfoBuilder.create()
        .withDeploymentId(this.#deploymentId)
        .withClusterName(this.#clusterName)
        .withServiceName(this.#serviceName)
        .withMemberName(this.#memberName)
    );
    if (!this.secure) {
      return credentials.build();
    }
    const adminUser = this.#happnService.services.security.config.adminUser;
    return credentials
      .withUsername(adminUser.username)
      .withPassword(adminUser.password)
      .withPublicKey(adminUser.publicKey)
      .withPrivateKey(adminUser.privateKey)
      .build();
  }

  async start() {
    this.#log.info(`starting`);
    this.#happnService.on('peer-connected', this.#peerConnected.bind(this));
    this.#happnService.on('peer-disconnected', this.#peerDisconnected.bind(this));
    await this.#happnService.start(this, this.#proxyService);
    await this.#statusChanged(MemberStatuses.DISCOVERING);
    this.#startBeating();
    await this.#initialDiscovery();
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
    this.#statusChanged(MemberStatuses.STOPPED)
      .then(() => {
        return this.#clusterPeerService.disconnect();
      })
      .then(() => {
        this.#log.info(`stopped membership service`);
        cb();
      });
  }

  async #initialDiscovery() {
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
      if (scanResult.dependenciesFulfilled === true) {
        await this.#statusChanged(MemberStatuses.CONNECTING);
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
    await this.#clusterPeerService.connect(this.#clusterCredentials, peers);
    await this.#statusChanged(MemberStatuses.STABLE);
    this.#startMemberScanning();
  }

  async #pulse() {
    try {
      await this.#registryService.pulse(
        ClusterPeerBuilder.create()
          .withDeploymentId(this.#deploymentId)
          .withClusterName(this.#clusterName)
          .withServiceName(this.#serviceName)
          .withMemberName(this.#memberName)
          .withMemberHost(this.#proxyService.internalHost)
          .withMemberPort(this.#proxyService.internalPort)
          .withMemberStatus(this.#status)
          .withTimestamp(Date.now())
          .build()
      );
      this.#pulseErrors = 0; // reset our pulse errors
    } catch (e) {
      this.#log.error(`failed pulse: ${e.message}`);
      this.#pulseErrors++;
      if (this.#pulseErrors === this.#pulseErrorThreshold) {
        // fatal as we are no longer cluster relevant
        // TODO: inject process manager here for testing
        process.exit(1);
      }
    }
  }

  async #startBeating() {
    while (this.#status !== MemberStatuses.STOPPED) {
      try {
        await this.#pulse();
        this.#pulseErrors = 0; // reset our pulse errors
      } catch (e) {
        this.#log.error(`failed pulse: ${e.message}`);
        this.#pulseErrors++;
        if (this.#pulseErrors === this.#pulseErrorThreshold) {
          return this.#processManagerService.fatal(
            `pulseErrorThreshold exceeded, shutting down cluster member`
          );
        }
      }
      await commons.delay(this.#pulseIntervalMs);
    }
  }

  async #startMemberScanning() {
    while (this.#status !== MemberStatuses.STOPPED) {
      try {
        const memberScanResult = await this.#registryService.scan(
          this.#deploymentId,
          this.#clusterName,
          this.#dependencies,
          this.#memberName,
          [MemberStatuses.STABLE]
        );
        this.#clusterHealthService.reportHealth(memberScanResult);
        await this.#clusterPeerService.parseMemberScanResult(memberScanResult);
        this.#memberScanningErrors = 0; // reset our pulse errors
      } catch (e) {
        this.#log.error(`failed member scan: ${e.message}`);
        this.#memberScanningErrors++;
        if (this.#memberScanningErrors === this.#memberScanningErrorThreshold) {
          return this.#processManagerService.fatal(
            `memberScanningErrorThreshold exceeded, shutting down cluster member`
          );
        }
      }
      await commons.delay(this.#pulseIntervalMs);
    }
  }

  async #statusChanged(newStatus) {
    this.#log.info(`status changed: ${newStatus}`);
    this.#status = newStatus;
    await this.#pulse();
    this.emit('status-changed', newStatus);
  }
  // eslint-disable-next-line no-unused-vars
  #peerConnected(origin) {
    //TODO
  }
  // eslint-disable-next-line no-unused-vars
  #peerDisconnected(origin) {
    //TODO
  }
};
