/* eslint-disable @typescript-eslint/no-var-requires */
const BaseBuilder = require('happn-commons/lib/base-builder');

export class PublisherConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  withAcknowledgeTimeout(acknowledge: boolean): PublisherConfigBuilder {
    this.set(
      'config.publicationOptions.acknowledgeTimeout',
      acknowledge,
      BaseBuilder.Types.BOOLEAN
    );
    return this;
  }

  withTimeout(timeout: number): PublisherConfigBuilder {
    this.set('config.timeout', timeout, BaseBuilder.Types.INTEGER);
    return this;
  }
}
