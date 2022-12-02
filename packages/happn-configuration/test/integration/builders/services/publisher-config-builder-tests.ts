/* eslint-disable no-console */
import { PublisherConfigBuilder } from '../../../../lib/builders/happn/services/publisher-config-builder';
import { expect } from 'chai';

describe('publisher configuration builder tests', function () {
  it('builds a publisher config object', () => {
    const mockTimeout = 2000;
    const mockAcknowledge = 1000;

    const builder = new PublisherConfigBuilder();
    const result = builder.withTimeout(mockTimeout).withAcknowledgeTimeout(mockAcknowledge).build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    expect(result.config.timeout).to.equal(mockTimeout);
    expect(result.config.publicationOptions.acknowledgeTimeout).to.equal(mockAcknowledge);
  });
});
