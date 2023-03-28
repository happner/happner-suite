const PeerConnectorStatuses = require('../constants/peer-connector-statuses');
module.exports = class PeerConnectorBase extends require('events').EventEmitter {
  #status;
  #peerInfo;
  #log;
  constructor(logger, peerInfo) {
    super();
    this.#log = logger;
    this.#peerInfo = peerInfo;
    this.#status = PeerConnectorStatuses.DISCONNECTED;
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
  async connectInternal() {
    throw new Error(`connectInternal not implemented`);
  }
  async disconnectInternal() {
    throw new Error(`disconnectInternal not implemented`);
  }
  async connect(clusterCredentials) {
    this.#log.info(`connecting to peer: ${clusterCredentials.info.memberName}`);
    this.#status = PeerConnectorStatuses.CONNECTING;
    await this.connectInternal(clusterCredentials);
    this.#status = PeerConnectorStatuses.STABLE;
    this.#log.info(`connected to peer: ${clusterCredentials.info.memberName}`);
  }
  async disconnect() {
    this.#log.info(`disconnecting from peer: ${this.#peerInfo.memberName}`);
    this.#status = PeerConnectorStatuses.DISCONNECTING;
    await this.disconnectInternal();
    this.#status = PeerConnectorStatuses.DISCONNECTED;
    this.#log.info(`disconnected from peer: ${this.#peerInfo.memberName}`);
  }
};
