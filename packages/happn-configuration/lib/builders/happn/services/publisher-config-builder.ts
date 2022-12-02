/* eslint-disable @typescript-eslint/no-var-requires */
const BaseBuilder = require('happn-commons/lib/base-builder');

export class PublisherConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withAcknowledgeTimeout(acknowledge: number): PublisherConfigBuilder {
    this.set(
      'config.publicationOptions.acknowledgeTimeout',
      acknowledge,
      BaseBuilder.Types.NUMERIC
    );
    return this;
  }

  withTimeout(timeout: number): PublisherConfigBuilder {
    this.set('config.timeout', timeout, BaseBuilder.Types.NUMERIC);
    return this;
  }
}
