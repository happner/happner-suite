const Constants = require('../constants/all-constants');
const ReplicatedMessageBuilder = require('../builders/replicated-message-builder');
const commons = require('happn-commons');
module.exports = class EventReplicator extends require('events').EventEmitter {
  #log;
  #happnService;
  #messageBus;
  #replicationSubscriptionLookup;
  #processManager;
  #stopped;
  #config;
  #replicationTopic;
  constructor(
    config,
    logger,
    happnService,
    messageBus,
    replicationSubscriptionLookup,
    processManager
  ) {
    super();
    this.#log = logger;
    this.#happnService = happnService;
    this.#messageBus = messageBus;
    this.#replicationSubscriptionLookup = replicationSubscriptionLookup;
    this.#processManager = processManager;
    this.#config = this.#defaults(config);
    this.#happnService.on(Constants.EVENT_KEYS.HAPPN_SERVICE_STARTED, () => {
      this.#start();
    });
  }

  static create(config, logger, happnService, messageBus, processManager) {
    return new EventReplicator(config, logger, happnService, messageBus, processManager);
  }

  async #start() {
    this.#stopped = false;
    this.#log.info('started');
    await this.#initializeAndStartMessageBus();
    // attach to all local events
    await this.#happnService.localClient.onAll(this.#handleLocalClientEvent.bind(this));
  }

  async stop() {
    this.#stopped = true;
    await this.#messageBus.stop();
    this.#log.info('stopped');
  }

  async #initializeAndStartMessageBus() {
    this.#replicationTopic = this.#getReplicationTopic();
    await this.#messageBus.initialize();
    this.#log.info(`subscribing to replication topic: ${this.#replicationTopic}`);
    await this.#messageBus.subscribe(
      this.#replicationTopic,
      { fromBeginning: false },
      this.#handleReplicationSubscription.bind(this)
    );
    await this.#messageBus.start();
  }

  async #handleLocalClientEvent(data, meta) {
    // this is a replicated event, replicated: true prevents infinite recursion
    if (this.#stopped || meta.replicated) {
      return;
    }
    const replicationPayload = { data, meta: { ...meta, replicated: true } }; // shallow clone of meta with replicated: true
    const replicationTopics = this.#replicationSubscriptionLookup.lookupTopics(meta.path);
    for (let topic of replicationTopics) {
      // this.#log.info(`publishing to replication topic: ${topic}`, replicationPayload);
      await this.#messageBus.publish(topic, replicationPayload);
    }
  }

  #getReplicationTopic() {
    const replicationPathsHash = this.#replicationSubscriptionLookup.getReplicationPathsHash(
      this.#config.replicationPaths
    );
    return `${this.#config.deploymentId}-${this.#config.clusterName}-${replicationPathsHash}-${
      this.#config.memberName
    }`;
  }

  async detachPeerConnector(peerConnector) {
    try {
      this.#replicationSubscriptionLookup.removeReplicationPaths(peerConnector.peerInfo.memberName);
      this.#log.info('peer detached: ', peerConnector.peerInfo.memberName);
    } catch (e) {
      // bounce the process as the cluster is now broken
      this.#processManager.fatal(
        `failed attaching peer ${peerConnector.peerInfo.memberName}: ${e.messsage}`
      );
    }
  }

  async attachPeerConnector(peerConnector) {
    try {
      // await peerConnector.subscribe(
      //   this.#config.replicationPaths,
      //   this.#handleReplicationSubscription.bind(this)
      // );
      this.#replicationSubscriptionLookup.addReplicationPaths(
        peerConnector.peerInfo.memberName,
        peerConnector.peerInfo.replicationPaths
      );
      this.#log.info('peer attached: ', peerConnector.peerInfo.memberName);
    } catch (e) {
      // bounce the process as the cluster is now broken
      this.#processManager.fatal(
        `failed attaching peer ${peerConnector.peerInfo.memberName}: ${e.messsage}`
      );
    }
  }

  async #handleReplicationSubscription(payload) {
    if (this.#stopped) {
      return;
    }
    const { data, meta } = payload;
    const replicatedMessage = ReplicatedMessageBuilder.create().withDataAndMeta(data, meta).build();

    // this.#log.info(`received replicated message:::`, JSON.stringify(payload, null, 2));

    replicatedMessage.recipients =
      this.#happnService.subscriptionService.getRecipients(replicatedMessage);

    this.#happnService.publisherService.processPublish(replicatedMessage, function (error) {
      if (error) {
        this.#log.error(`event replication error: ${error.message}`);
        return this.emit(Constants.EVENT_KEYS.REPLICATOR_PUBLISH_ERROR, { error });
      }
    });
  }

  #defaults(config) {
    const cloned = commons._.cloneDeep(config?.services?.membership?.config || {});
    return cloned;
  }
};
