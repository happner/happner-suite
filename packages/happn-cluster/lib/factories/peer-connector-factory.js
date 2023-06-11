module.exports = class PeerConnectorFactory extends require('./base-factory') {
  constructor(makeables) {
    super(
      makeables || {
        'peer-connector': require('../connectors/peer-connector-happn'),
      }
    );
  }
  createPeerConnector(logger, peerInfo, disconnectHandler) {
    return this.create('peer-connector', logger, peerInfo, disconnectHandler);
  }
};