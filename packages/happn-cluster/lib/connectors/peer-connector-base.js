const PeerConnectorStatuses = require('../constants/peer-connector-statuses');
module.exports = class PeerConnectorBase extends require('events').EventEmitter {
  #status;
  #peerInfo;
  constructor(peerInfo) {
    super();
    this.#peerInfo = peerInfo;
    this.#status = PeerConnectorStatuses.DISCONNECTED;
  }
  get peerInfo() {
    return this.#peerInfo;
  }
  get status() {
    return this.#status;
  }
  async connectInternal() {
    throw new Error(`connectInternal not implemented`);
  }
  async connect() {
    this.#status = PeerConnectorStatuses.CONNECTING;
    await this.connectInternal();
    this.#status = PeerConnectorStatuses.STABLE;
  }
};
