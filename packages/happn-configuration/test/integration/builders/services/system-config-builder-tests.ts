/* eslint-disable no-console */
import { SystemConfigBuilder } from '../../../../lib/builders/happn/services/system-config-builder';
import { expect } from 'chai';

describe('system configuration builder tests', function () {
  it('builds a subscription config object', () => {
    const mockName = 'testName';

    const builder = new SystemConfigBuilder();
    const result = builder.withName(mockName).build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    expect(result.config.name).to.equal(mockName);
  });
});
