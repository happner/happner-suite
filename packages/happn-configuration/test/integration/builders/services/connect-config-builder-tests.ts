/* eslint-disable no-console */
import { ConnectConfigBuilder } from '../../../../lib/builders/happn/services/connect-config-builder';
import { expect } from 'chai';

describe('connect configuration builder tests', function () {
  it('builds a connect config object', () => {
    const mockExclusion = '/exclusion/path/*';
    const mockForbiddenResponsePath = '/forbidden';
    const mockUnauthorizedResponsePath = '/unauthorized';

    const builder = new ConnectConfigBuilder();
    const result = builder
      .withSecurityExclusion(mockExclusion)
      .withSecurityForbiddenResponsePath(mockForbiddenResponsePath)
      .withSecurityUnauthorizedResponsePath(mockUnauthorizedResponsePath)
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    //assertions
    expect(result.config.middleware.security.exclusions[0]).to.equal(mockExclusion);
    expect(result.config.middleware.security.forbiddenResponsePath).to.equal(
      mockForbiddenResponsePath
    );
    expect(result.config.middleware.security.unauthorizedResponsePath).to.equal(
      mockUnauthorizedResponsePath
    );
  });
});
