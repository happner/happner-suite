const Happn = require('happn-3');
module.exports = class PeerConnectorHappn extends require('./peer-connector-base') {
  #client;
  constructor(logger, peerInfo) {
    super(logger, peerInfo);
  }
  async connectInternal(clusterCredentials) {
    this.#client = await Happn.client.create({
      host: this.peerInfo.memberHost,
      port: this.peerInfo.memberPort,
      username: clusterCredentials.username,
      password: clusterCredentials.password,
      publicKey: clusterCredentials.publicKey,
      privateKey: clusterCredentials.privateKey,
      info: clusterCredentials.info,
    });
  }
  async disconnectInternal() {
    if (this.#client) {
      await this.#client.disconnect();
    }
  }
};
