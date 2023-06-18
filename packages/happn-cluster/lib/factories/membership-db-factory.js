module.exports = class PeerConnectorFactory extends require('./base-factory') {
  constructor(makeables) {
    super(
      makeables || {
        'membership-db-provider': require('../providers/membership-db-happn-provider'),
      }
    );
  }
  createMembershipDb(...args) {
    return this.create('membership-db-provider', ...args);
  }
};
