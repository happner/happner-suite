const Constants = require('../constants/all-constants');
const ReplicatedMessageBuilder = require('../builders/replicated-message-builder');
const commons = require('happn-commons');
module.exports = class EventReplicator extends require('events').EventEmitter {
  #log;
  #happnService;
  #stopped;
  #config;
  constructor(config, logger, happnService) {
    super();
    this.#log = logger;
    this.#happnService = happnService;
    this.#config = this.#defaults(config);
    this.handleReplicationSubscription = this.handleReplicationSubscription.bind(this);
    this.#happnService.on(Constants.EVENT_KEYS.HAPPN_SERVICE_STARTED, () => {
      this.#start();
    });
  }

  static create(config, logger, happnService, processManager) {
    return new EventReplicator(config, logger, happnService, processManager);
  }

  async #start() {
    this.#stopped = false;
    this.#log.info('started');
  }

  stop() {
    this.#stopped = true;
    this.#log.info('stopped');
  }

  async attachPeerConnector(peerConnector) {
    // eslint-disable-next-line no-useless-catch
    try {
      await peerConnector.subscribe(
        this.#config.replicationPaths,
        this.handleReplicationSubscription
      );
    } catch (e) {
      //TODO: what now
      throw e;
    }
  }

  async handleReplicationSubscription(data, meta) {
    if (this.#stopped) {
      return;
    }
    const replicatedMessage = ReplicatedMessageBuilder.create().withDataAndMeta(data, meta).build();

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
    if (!cloned.replicationPaths) {
      cloned.replicationPaths = ['**'];
    }
    cloned.replicationPaths.push(Constants.EVENT_KEYS.SYSTEM_CLUSTER_SECURITY_DIRECTORY_REPLICATE);
    return cloned;
  }
};
