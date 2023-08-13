const constants = require('../constants/all-constants');
module.exports = class MessageBusFactory extends require('./base-factory') {
  constructor() {
    super({
      'message-bus-kafka': require('../message-buses/message-bus-kafka'),
    });
  }
  static create(makeables) {
    return new MessageBusFactory(makeables);
  }
  createMessageBus(messageBusType, ...args) {
    if (messageBusType === constants.MESSAGE_BUS_TYPES.KAFKA)
      return this.create('message-bus-kafka', ...args);
    throw new Error(`unknown message bus type: ${messageBusType}`);
  }
};
