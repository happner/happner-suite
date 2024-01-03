const Constants = require('../constants/all-constants');
const PeerConnectorStatuses = Constants.PEER_CONNECTOR_STATUSES;
const commons = require('happn-commons');
module.exports = class PeerConnectorBase extends require('events').EventEmitter {
  #status;
  #peerInfo;
  #log;
  #queue;
  constructor(logger, peerInfo) {
    super();
    this.#log = logger;
    this.#peerInfo = peerInfo;
    this.#status = PeerConnectorStatuses.DISCONNECTED;
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

  async connectInternal() {
    throw new Error(`connectInternal not implemented`);
  }

  async disconnectInternal() {
    throw new Error(`disconnectInternal not implemented`);
  }

  async subscribeInternal() {
    throw new Error(`subscribeInternal not implemented`);
  }

  async connect(clusterCredentials) {
    await this.queue.lock(async () => {
      this.#status = PeerConnectorStatuses.CONNECTING;
      await this.connectInternal(clusterCredentials);
      this.#status = PeerConnectorStatuses.STABLE;
      this.#log.info(`connected to peer: ${this.#peerInfo.memberName}`);
    });
  }

  async disconnect() {
    await this.queue.lock(async () => {
      this.#status = PeerConnectorStatuses.DISCONNECTING;
      await this.disconnectInternal();
      this.#status = PeerConnectorStatuses.DISCONNECTED;
      this.#log.info(`disconnected from peer: ${this.#peerInfo.memberName}`);
    });
  }

  async subscribe(paths, handler) {
    await this.queue.lock(async () => {
      for (let path of paths) {
        await this.subscribeInternal(path, handler);
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
      await this.onDisconnectedInternal();
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
