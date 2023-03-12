const PeerConnectorStatuses = require('../constants/peer-connector-statuses');
module.exports = class PeerConnectorBase extends require('events').EventEmitter {
  #status;
  constructor() {
    super();
    this.#status = PeerConnectorStatuses.DISCONNECTED;
  }
  async connectInternal() {
    throw new Error(`connectInternal not implemented`);
  }
  async connect() {
    try {
      this.#status = PeerConnectorStatuses.CONNECTING;
      await this.connectInternal();
      this.#status = PeerConnectorStatuses.STABLE;
    } catch (e) {
      this.#status = PeerConnectorStatuses.ERROR;
    }
  }
};
