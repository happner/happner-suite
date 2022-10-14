/* eslint-disable no-console */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const ConnectConfigBuilder = require('../../../lib/builders/connect-config-builder');
const ConfigValidator = require('../../../lib/validators/config-validator');

describe(helper.testName(), function () {
  it('builds a connect config object', () => {
    const mockCookieName = 'testCookie';
    const mockCookieDomain = 'test.domain';
    const mockExclusion = '/exclusion/path/*';
    const mockForbiddenResponsePath = '/forbidden';
    const mockUnauthorizedResponsePath = '/unauthorized';

    const builder = new ConnectConfigBuilder();
    const result = builder
      .withSecurityCookieName(mockCookieName)
      .withSecurityCookieDomain(mockCookieDomain)
      .withSecurityExclusion(mockExclusion)
      .withSecurityForbiddenResponsePath(mockForbiddenResponsePath)
      .withSecurityUnauthorizedResponsePath(mockUnauthorizedResponsePath)
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    //assertions
    helper.expect(result.config.middleware.security.cookieName).to.equal(mockCookieName);
    helper
      .expect(result.config.middleware.security.cookieDomain)
      .to.equal(mockCookieDomain);
    helper.expect(result.config.middleware.security.exclusions[0]).to.equal(mockExclusion);
    helper
      .expect(result.config.middleware.security.forbiddenResponsePath)
      .to.equal(mockForbiddenResponsePath);
    helper
      .expect(result.config.middleware.security.unauthorizedResponsePath)
      .to.equal(mockUnauthorizedResponsePath);
  });
});
