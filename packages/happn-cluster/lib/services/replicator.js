const SecurityDirectoryEvents = require('happn-3').constants.SECURITY_DIRECTORY_EVENTS;
module.exports = class Replicator extends require('events').EventEmitter {
  #log;
  #securityChangeSet = [];
  #localClient;
  #config;
  #stopped;
  constructor(opts) {
    super();
    this.#log = opts.logger.createLogger('Replicator');
  }
  get securityChangeSet() {
    return this.#securityChangeSet;
  }
  get localClient() {
    return this.#localClient;
  }
  send(topic, payload, callback) {
    if (!this.#localClient) return callback(new Error('Replicator not ready'));
    if (topic === '/security/dataChanged') {
      this.#securityChangeSet.push(payload);
      return callback();
    }
    this.replicate(topic, payload, callback);
  }
  replicate(topic, payload, callback) {
    this.#localClient.set(
      '/__REPLICATE',
      {
        topic,
        payload,
        origin: this.happn.name,
      },
      { noStore: true },
      function (err) {
        if (err) return callback(err);
        callback();
      }
    );
  }
  initialize(config, callback) {
    this.#config = config;
    this.#defaults(callback);
  }
  async start() {
    this.#localClient = this.happn.services.orchestrator.localClient;
    this.securityChangeSetReplicate();
    await this.#localClient.on('/__REPLICATE', (data) => {
      var topic = data.topic;
      var payload = data.payload;
      var origin = data.origin;
      var isLocal = origin === this.happn.name;

      if (topic === '/security/dataChanged')
        return this.emitSecurityDataChanged(payload, isLocal, origin);
      this.emit(topic, payload, isLocal, origin);
    });
  }
  stop(options, callback) {
    if (typeof options === 'function') callback = options;
    this.#stopped = true;
    if (this.securityChangeSetReplicateTimeout) {
      clearTimeout(this.securityChangeSetReplicateTimeout);
      //flush the replication changeset
      this.securityChangeSetReplicate(true);
    }
    this.#log.info('stopped');
    callback();
  }
  failSecurityChangesetReplicate(e, endingProcess) {
    const errorMessage = `unable to replicate security data: ${e.message}`;
    if (!endingProcess) this.#log.fatal(errorMessage);
    this.#log.error(errorMessage);
  }

  securityChangeSetReplicate(endingProcess) {
    if (this.#securityChangeSet.length > 0) {
      try {
        this.replicate('/security/dataChanged', this.batchSecurityUpdate(), (e) => {
          if (e) this.failSecurityChangesetReplicate(e, endingProcess);
        });
      } catch (e) {
        this.failSecurityChangesetReplicate(e, endingProcess);
      }
    }

    if (!this.#stopped) {
      this.securityChangeSetReplicateTimeout = setTimeout(
        this.securityChangeSetReplicate.bind(this),
        this.#config.securityChangeSetReplicateInterval
      );
    }
  }

  getChangedKey(whatHappnd, changedData) {
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

  batchSecurityUpdate() {
    return this.#securityChangeSet.splice(0).reduce((reduced, change) => {
      if (!reduced[change.whatHappnd]) reduced[change.whatHappnd] = {};
      reduced[change.whatHappnd][this.getChangedKey(change.whatHappnd, change.changedData)] = {
        changedData: change.changedData,
        additionalInfo: change.additionalInfo,
      };
      return reduced;
    }, {});
  }

  unpackBywhatHappnd(payload, whatHappnd) {
    if (payload[whatHappnd] == null) return [];
    return Object.keys(payload[whatHappnd]).map((changedKey) => {
      return { whatHappnd, ...payload[whatHappnd][changedKey] };
    });
  }

  unbatchSecurityUpdate(payload) {
    let unbatched = [];
    unbatched = unbatched.concat(
      this.unpackBywhatHappnd(payload, SecurityDirectoryEvents.TOKEN_REVOKED)
    );
    unbatched = unbatched.concat(
      this.unpackBywhatHappnd(payload, SecurityDirectoryEvents.TOKEN_RESTORED)
    );
    unbatched = unbatched.concat(
      this.unpackBywhatHappnd(payload, SecurityDirectoryEvents.LINK_GROUP)
    );
    unbatched = unbatched.concat(
      this.unpackBywhatHappnd(payload, SecurityDirectoryEvents.UNLINK_GROUP)
    );
    unbatched = unbatched.concat(
      this.unpackBywhatHappnd(payload, SecurityDirectoryEvents.UPSERT_GROUP)
    );
    unbatched = unbatched.concat(
      this.unpackBywhatHappnd(payload, SecurityDirectoryEvents.UPSERT_USER)
    );
    unbatched = unbatched.concat(
      this.unpackBywhatHappnd(payload, SecurityDirectoryEvents.PERMISSION_REMOVED)
    );
    unbatched = unbatched.concat(
      this.unpackBywhatHappnd(payload, SecurityDirectoryEvents.PERMISSION_UPSERTED)
    );
    unbatched = unbatched.concat(
      this.unpackBywhatHappnd(payload, SecurityDirectoryEvents.DELETE_USER)
    );
    unbatched = unbatched.concat(
      this.unpackBywhatHappnd(payload, SecurityDirectoryEvents.DELETE_GROUP)
    );
    unbatched = unbatched.concat(
      this.unpackBywhatHappnd(payload, SecurityDirectoryEvents.LOOKUP_TABLE_CHANGED)
    );
    unbatched = unbatched.concat(
      this.unpackBywhatHappnd(payload, SecurityDirectoryEvents.LOOKUP_PERMISSION_CHANGED)
    );
    return unbatched;
  }

  emitSecurityDataChanged(payload, isLocal, origin) {
    this.unbatchSecurityUpdate(payload).forEach((update) => {
      this.emit('/security/dataChanged', update, isLocal, origin);
    });
  }

  #defaults(callback) {
    if (!this.#config.securityChangeSetReplicateInterval) {
      this.#config.securityChangeSetReplicateInterval = 3e3;
    }
    callback();
  }
};
