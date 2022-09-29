const BaseBuilder = require('happn-commons/lib/base-builder');
const ROOT = 'publisher.config';

module.exports = class PublisherConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withAcknowledgeTimeout(acknowledge) {
    this.set(
      `${ROOT}.publicationOptions.acknowledgeTimeout`,
      acknowledge,
      BaseBuilder.Types.BOOLEAN
    );
    return this;
  }

  withTimeout(timeout) {
    this.set(`${ROOT}.timeout`, timeout, BaseBuilder.Types.INTEGER);
    return this;
  }
};
