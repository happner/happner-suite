const BaseBuilder = require('happn-commons/lib/base-builder');

module.exports = class PublisherConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withAcknowledgeTimeout(acknowledge) {
    this.set(
      'config.publicationOptions.acknowledgeTimeout',
      acknowledge,
      BaseBuilder.Types.BOOLEAN
    );
    return this;
  }

  withTimeout(timeout) {
    this.set('config.timeout', timeout, BaseBuilder.Types.INTEGER);
    return this;
  }
};
