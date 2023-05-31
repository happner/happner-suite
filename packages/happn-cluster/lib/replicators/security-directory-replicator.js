const Constants = require('../constants/all-constants');
const SecurityDirectoryEvents = require('happn-3').constants.SECURITY_DIRECTORY_EVENTS;
module.exports = class ClusterReplicator extends require('events').EventEmitter {
  #config;
  #log;
  #happnService;
  #securityChangeSet = [];
  #processManager;
  constructor(config, logger, happnService, processManager) {
    super();
    this.#config = config;
    this.#config.securityChangeSetReplicateInterval =
      config?.services?.membership?.config?.securityChangeSetReplicateInterval || 3e3;
    this.#log = logger;
    this.#happnService = happnService;
    this.#processManager = processManager;
    this.#happnService.on(Constants.EVENT_KEYS.HAPPN_SERVICE_STARTED, () => {
      this.#start();
    });
    this.#happnService.on(Constants.EVENT_KEYS.HAPPN_SERVICE_STOPPED, () => {
      this.#stop();
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
    if (!this.#happnService.localClient) {
      this.#log.warn(`attempt to replicate when not ready`);
      return;
    }
    const { whatHappnd, changedData, additionalInfo } = securityDirectoryChanges;
    if (changedData.replicated) return; // don't re-replicate
    this.#securityChangeSet.push({ whatHappnd, changedData, additionalInfo });
  }

  async #start() {
    await this.#happnService.localClient.on(
      Constants.EVENT_KEYS.SYSTEM_CLUSTER_SECURITY_DIRECTORY_REPLICATE,
      (data) => {
        const payload = data.payload;
        if (data.origin === this.#happnService.name) {
          // dont replicate changes that originated here
          return;
        }
        return this.writeSecurityDirectoryChange(payload);
      }
    );
    // kick off replication cycle
    this.securityChangeSetReplicate();
    this.#log.info('started');
  }

  async #stop() {
    if (this.securityChangeSetReplicateTimeout) {
      clearTimeout(this.securityChangeSetReplicateTimeout);
      //flush the replication changeset
      this.securityChangeSetReplicate(true);
    }
    this.#log.info('stopped');
  }

  securityChangeSetReplicate(endingProcess) {
    if (this.#securityChangeSet.length > 0) {
      const batchedSecurityUpdates = this.#batchSecurityUpdate();

      this.#happnService.localClient.set(
        Constants.EVENT_KEYS.SYSTEM_CLUSTER_SECURITY_DIRECTORY_REPLICATE,
        {
          payload: batchedSecurityUpdates,
          origin: this.#happnService.name,
        },
        { noStore: true },
        (e) => {
          if (!e) {
            return;
          }
          const errorMessage = `unable to replicate security data: ${e.message}`;
          if (!endingProcess) {
            // we need to fatal out
            return this.#processManager.fatal(errorMessage);
          }
          this.#log.error(errorMessage);
        }
      );
    }

    if (!endingProcess) {
      // bounce another replication after securityChangeSetReplicateInterval
      this.securityChangeSetReplicateTimeout = setTimeout(
        this.securityChangeSetReplicate.bind(this),
        this.#config.securityChangeSetReplicateInterval
      );
    }
  }

  async writeSecurityDirectoryChange(payload) {
    for (const update of this.#unbatchSecurityUpdate(payload)) {
      const whatHappnd = update.whatHappnd;
      const changedData = update.changedData;
      const additionalInfo = update.additionalInfo;

      // flag as learned from replication - to not replicate again
      changedData.replicated = true;
      await this.#happnService.securityDirectoryChanged(whatHappnd, changedData, additionalInfo);
    }
  }

  #getChangedKey(whatHappnd, changedData) {
    switch (whatHappnd) {
      case SecurityDirectoryEvents.TOKEN_REVOKED:
        return changedData;
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
        return changedData.groupName;
      case SecurityDirectoryEvents.PERMISSION_UPSERTED:
        return changedData.groupName;
      case SecurityDirectoryEvents.UPSERT_USER:
        return changedData.username;
      case SecurityDirectoryEvents.LOOKUP_TABLE_CHANGED:
        return changedData.table;
      case SecurityDirectoryEvents.LOOKUP_PERMISSION_CHANGED:
        return changedData.table;
      default:
        throw new Error(`unknown security data changed event: ${whatHappnd}`);
    }
  }

  #batchSecurityUpdate() {
    return this.#securityChangeSet.splice(0).reduce((reduced, change) => {
      if (!reduced[change.whatHappnd]) reduced[change.whatHappnd] = {};
      reduced[change.whatHappnd][this.#getChangedKey(change.whatHappnd, change.changedData)] = {
        changedData: change.changedData,
        additionalInfo: change.additionalInfo,
      };
      return reduced;
    }, {});
  }

  #unpackBywhatHappnd(payload, whatHappnd) {
    if (payload[whatHappnd] == null) return [];
    return Object.keys(payload[whatHappnd]).map((changedKey) => {
      return { whatHappnd, ...payload[whatHappnd][changedKey] };
    });
  }

  #unbatchSecurityUpdate(payload) {
    let unbatched = [];
    unbatched = unbatched.concat(
      this.#unpackBywhatHappnd(payload, SecurityDirectoryEvents.TOKEN_REVOKED)
    );
    unbatched = unbatched.concat(
      this.#unpackBywhatHappnd(payload, SecurityDirectoryEvents.TOKEN_RESTORED)
    );
    unbatched = unbatched.concat(
      this.#unpackBywhatHappnd(payload, SecurityDirectoryEvents.LINK_GROUP)
    );
    unbatched = unbatched.concat(
      this.#unpackBywhatHappnd(payload, SecurityDirectoryEvents.UNLINK_GROUP)
    );
    unbatched = unbatched.concat(
      this.#unpackBywhatHappnd(payload, SecurityDirectoryEvents.UPSERT_GROUP)
    );
    unbatched = unbatched.concat(
      this.#unpackBywhatHappnd(payload, SecurityDirectoryEvents.UPSERT_USER)
    );
    unbatched = unbatched.concat(
      this.#unpackBywhatHappnd(payload, SecurityDirectoryEvents.PERMISSION_REMOVED)
    );
    unbatched = unbatched.concat(
      this.#unpackBywhatHappnd(payload, SecurityDirectoryEvents.PERMISSION_UPSERTED)
    );
    unbatched = unbatched.concat(
      this.#unpackBywhatHappnd(payload, SecurityDirectoryEvents.DELETE_USER)
    );
    unbatched = unbatched.concat(
      this.#unpackBywhatHappnd(payload, SecurityDirectoryEvents.DELETE_GROUP)
    );
    unbatched = unbatched.concat(
      this.#unpackBywhatHappnd(payload, SecurityDirectoryEvents.LOOKUP_TABLE_CHANGED)
    );
    unbatched = unbatched.concat(
      this.#unpackBywhatHappnd(payload, SecurityDirectoryEvents.LOOKUP_PERMISSION_CHANGED)
    );
    return unbatched;
  }
};
