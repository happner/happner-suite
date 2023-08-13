const Constants = require('../constants/all-constants');
const SecurityDirectoryEvents = require('happn-3').constants.SECURITY_DIRECTORY_EVENTS;
module.exports = class ClusterReplicator extends require('events').EventEmitter {
  #config;
  #log;
  #happnService;
  #securityChangeSet = [];
  #processManager;
  #securityChangeSetReplicateTimeout;
  constructor(config, logger, happnService, processManager) {
    super();
    this.#config = config;
    this.#config.securityChangeSetReplicateInterval =
      config?.services?.membership?.config?.securityChangeSetReplicateInterval || 3e3;
    this.#log = logger;
    this.#happnService = happnService;
    this.#processManager = processManager;
    this.securityChangeSetReplicate = this.securityChangeSetReplicate.bind(this);
    this.securityChangeSetReplicateBounce = this.securityChangeSetReplicateBounce.bind(this);
    this.#happnService.on(Constants.EVENT_KEYS.HAPPN_SERVICE_STARTED, () => {
      this.#start();
    });
    this.#happnService.on(
      Constants.EVENT_KEYS.HAPPN_SECURITY_DIRECTORY_CHANGED,
      (securityDirectoryChanges) => {
        this.#replicate(securityDirectoryChanges);
      }
    );
  }

  static create(config, logger, happnService, processManager) {
    return new ClusterReplicator(config, logger, happnService, processManager);
  }

  get securityChangeSet() {
    return this.#securityChangeSet;
  }

  #replicate(securityDirectoryChanges) {
    const { whatHappnd, changedData, additionalInfo } = securityDirectoryChanges;
    // don't re-replicate or attempt to replicate before we have a local client
    if (changedData.replicated || !this.#happnService.localClient) {
      return;
    }
    this.#securityChangeSet.push({ whatHappnd, changedData, additionalInfo });
  }

  async #start() {
    await this.#happnService.localClient.on(
      Constants.EVENT_KEYS.SYSTEM_CLUSTER_SECURITY_DIRECTORY_REPLICATE,
      (data) => {
        if (data.origin === this.#happnService.name) {
          // dont replicate changes that originated here
          return;
        }
        this.writeSecurityDirectoryChange(data.payload);
      }
    );

    // kick off replication cycle
    this.securityChangeSetReplicateBounce();
    this.#log.info('started');
  }

  async stop() {
    clearTimeout(this.#securityChangeSetReplicateTimeout);
    //flush the replication changeset
    await this.securityChangeSetReplicate(true);
    this.#log.info('stopped');
  }

  securityChangeSetReplicateBounce(endingProcess) {
    this.securityChangeSetReplicate(endingProcess).then(() => {
      if (!endingProcess) {
        // bounce another replication after securityChangeSetReplicateInterval
        this.#securityChangeSetReplicateTimeout = setTimeout(
          this.securityChangeSetReplicateBounce,
          this.#config.securityChangeSetReplicateInterval
        );
      }
    });
  }

  async securityChangeSetReplicate(endingProcess) {
    let error;
    try {
      if (this.#securityChangeSet.length > 0) {
        const batchedSecurityUpdates = this.#batchSecurityUpdate();
        await this.#happnService.localClient.set(
          Constants.EVENT_KEYS.SYSTEM_CLUSTER_SECURITY_DIRECTORY_REPLICATE,
          {
            payload: batchedSecurityUpdates,
            origin: this.#happnService.name,
          },
          { noStore: true }
        );
      }
    } catch (e) {
      error = e;
    } finally {
      if (error) {
        const errorMessage = `unable to replicate security data: ${error.message}`;
        if (!endingProcess) {
          // we need to fatal out
          this.#processManager.fatal(errorMessage);
        } else this.#log.warn(`ending process and ${errorMessage}`);
      }
    }
  }

  async writeSecurityDirectoryChange(payload) {
    for (const update of this.#unbatchSecurityUpdate(payload)) {
      const { whatHappnd, changedData, additionalInfo } = update;
      // flag as learned from replication - to not replicate again
      changedData.replicated = true;
      await this.#happnService.securityDirectoryChanged(whatHappnd, changedData, additionalInfo);
    }
  }

  #getChangedKey(whatHappnd, changedData) {
    switch (whatHappnd) {
      case SecurityDirectoryEvents.TOKEN_REVOKED:
      case SecurityDirectoryEvents.TOKEN_RESTORED:
        return changedData;
      case SecurityDirectoryEvents.LINK_GROUP:
        return changedData._meta.path.split('/').pop();
      case SecurityDirectoryEvents.UNLINK_GROUP:
        return changedData.path.split('/').pop();
      case SecurityDirectoryEvents.DELETE_USER:
        return changedData.obj._meta.path.replace('/_SYSTEM/_SECURITY/_USER/', '');
      case SecurityDirectoryEvents.DELETE_GROUP:
        return changedData.obj.name;
      case SecurityDirectoryEvents.UPSERT_GROUP:
        return changedData.name;
      case SecurityDirectoryEvents.PERMISSION_REMOVED:
      case SecurityDirectoryEvents.PERMISSION_UPSERTED:
        return changedData.groupName;
      case SecurityDirectoryEvents.UPSERT_USER:
        return changedData.username;
      case SecurityDirectoryEvents.LOOKUP_TABLE_CHANGED:
      case SecurityDirectoryEvents.LOOKUP_PERMISSION_CHANGED:
        return changedData.table;
      default:
        throw new Error(`unknown security data changed event: ${whatHappnd}`);
    }
  }

  #batchSecurityUpdate() {
    // splicing clears the changeset, the result is then reduced into a batch
    return this.#securityChangeSet.splice(0).reduce((reduced, change) => {
      if (!reduced[change.whatHappnd]) reduced[change.whatHappnd] = {};
      reduced[change.whatHappnd][this.#getChangedKey(change.whatHappnd, change.changedData)] = {
        changedData: change.changedData,
        additionalInfo: change.additionalInfo,
      };
      return reduced;
    }, {});
  }

  #unbatchSecurityUpdate(payload) {
    return Object.values(SecurityDirectoryEvents).reduce((unbatched, securityDirectoryEvent) => {
      return unbatched.concat(this.#unpackBywhatHappnd(payload, securityDirectoryEvent));
    }, []);
  }

  #unpackBywhatHappnd(payload, whatHappnd) {
    if (payload[whatHappnd] == null) return [];
    return Object.keys(payload[whatHappnd]).map((changedKey) => {
      return { whatHappnd, ...payload[whatHappnd][changedKey] };
    });
  }
};
