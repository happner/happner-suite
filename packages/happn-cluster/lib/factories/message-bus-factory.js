module.exports = class PeerConnectorFactory extends require('./base-factory') {
  constructor(makeables) {
    super(
      makeables || {
        'message-bus': require('../message-buses/message-bus-kafka'),
      }
    );
  }
  static create(makeables) {
    return new PeerConnectorFactory(makeables);
  }
  createMessageBusKafka(...args) {
    return this.create('message-bus', ...args);
  }
};
