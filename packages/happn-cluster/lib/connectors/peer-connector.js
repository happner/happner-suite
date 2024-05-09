const Constants = require('../constants/all-constants');
const PeerConnectorStatuses = Constants.PEER_CONNECTOR_STATUSES;
const commons = require('happn-commons');
const Happn = require('happn-3');
module.exports = class PeerConnector extends require('events').EventEmitter {
  #status;
  #peerInfo;
  #log;
  #queue;
  #disconnectHandler;
  #client;
  constructor(logger, peerInfo, disconnectHandler) {
    super();
    this.#log = logger;
    this.#peerInfo = peerInfo;
    this.#status = PeerConnectorStatuses.DISCONNECTED;
    this.#disconnectHandler = disconnectHandler;
    // replication, connection and disconnection happen 1 at a time
    this.#queue = commons.AsyncQueue.create({
      concurrency: 1,
    });
    this.onReconnectScheduled = this.onReconnectScheduled.bind(this);
    this.onReconnected = this.onReconnected.bind(this);
    this.onServerSideDisconnect = this.onServerSideDisconnect.bind(this);
    this.onPulseMissed = this.onPulseMissed.bind(this);
    this.onDisconnected = this.onDisconnected.bind(this);
  }
  get peerInfo() {
    return this.#peerInfo;
  }
  get status() {
    return this.#status;
  }
  get log() {
    return this.#log;
  }
  get queue() {
    return this.#queue;
  }

  async #attachHappnClient(clusterCredentials) {
    this.#client = await Happn.client.create({
      host: this.peerInfo.memberHost,
      port: this.peerInfo.memberPort,
      username: clusterCredentials.username,
      password: clusterCredentials.password,
      publicKey: clusterCredentials.publicKey,
      privateKey: clusterCredentials.privateKey,
      info: clusterCredentials.info,
      socket: {
        strategy: 'online',
      },
    });
    this.#client.onEvent(
      Constants.EVENT_KEYS.HAPPN_CLIENT_RECONNECT_SCHEDULED,
      this.onReconnectScheduled
    );
    this.#client.onEvent(Constants.EVENT_KEYS.HAPPN_CLIENT_RECONNECTED, this.onReconnected);
    this.#client.onEvent(
      Constants.EVENT_KEYS.HAPPN_CLIENT_SESSION_ENDED,
      this.onServerSideDisconnect
    );
    this.#client.onEvent(Constants.EVENT_KEYS.HAPPN_CLIENT_CONNECTION_ENDED, this.onDisconnected);
  }

  async connect(clusterCredentials) {
    await this.queue.lock(async () => {
      this.#status = PeerConnectorStatuses.CONNECTING;
      await this.#attachHappnClient(clusterCredentials);
      this.#status = PeerConnectorStatuses.STABLE;
      this.#log.info(`connected to peer: ${this.#peerInfo.memberName}`);
    });
  }

  async disconnect() {
    await this.queue.lock(async () => {
      this.#status = PeerConnectorStatuses.DISCONNECTING;
      if (this.#client) {
        await this.#client.disconnect();
      }
      this.#status = PeerConnectorStatuses.DISCONNECTED;
      this.#log.info(`disconnected from peer: ${this.#peerInfo.memberName}`);
    });
  }

  async subscribe(paths, handler) {
    await this.queue.lock(async () => {
      for (let path of paths) {
        await this.#client.on(path, handler);
      }
    });
  }

  async onReconnectScheduled() {
    await this.queue.lock(async () => {
      this.#log.warn(`peer connector reconnect scheduled: ${this.#peerInfo.memberName}`);
    });
  }

  async onReconnected() {
    await this.queue.lock(async () => {
      this.#log.info(`peer connector reconnected: ${this.#peerInfo.memberName}`);
    });
  }

  async onServerSideDisconnect() {
    await this.queue.lock(async () => {
      this.#log.info(`peer connector server side disconnect: ${this.#peerInfo.memberName}`);
    });
  }

  async onDisconnected() {
    await this.queue.lock(async () => {
      if (
        this.#status === PeerConnectorStatuses.DISCONNECTING ||
        this.#status === PeerConnectorStatuses.DISCONNECTED
      ) {
        return;
      }

      this.#status = PeerConnectorStatuses.DISCONNECTING;
      await this.#disconnectHandler();
      this.#status = PeerConnectorStatuses.DISCONNECTED;
      this.#log.info(`peer connector disconnect: ${this.#peerInfo.memberName}`);
    });
  }

  async onPulseMissed() {
    await this.queue.lock(async () => {
      this.#log.info(`peer connector pulse missed: ${this.#peerInfo.memberName}`);
    });
  }
};
