/* eslint-disable no-console */
const helper = require('../../../happn-commons-test/lib/base-test-helper').create();
const ConnectConfigBuilder = require('../../lib/builders/connect-config-builder');

describe(helper.testName(), function () {
  it('builds a connect config object', () => {
    const testCookieName = 'testCookie';
    const testCookieDomain = 'test.domain';
    const testExclusion = '/exclusion/path/*';
    const testForbiddenResponsePath = '/forbidden';
    const testUnauthorizedResponsePath = '/unauthorized';

    const builder = new ConnectConfigBuilder();
    const result = builder
      .withCookieName(testCookieName)
      .withCookieDomain(testCookieDomain)
      .withExclusion(testExclusion)
      .withForbiddenResponsePath(testForbiddenResponsePath)
      .withUnauthorizedResponsePath(testUnauthorizedResponsePath)
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    helper.expect(result.connect.config.middleware.security.cookieName).to.equal(testCookieName);
    helper
      .expect(result.connect.config.middleware.security.cookieDomain)
      .to.equal(testCookieDomain);
    helper.expect(result.connect.config.middleware.security.exclusions[0]).to.equal(testExclusion);
    helper
      .expect(result.connect.config.middleware.security.forbiddenResponsePath)
      .to.equal(testForbiddenResponsePath);
    helper
      .expect(result.connect.config.middleware.security.unauthorizedResponsePath)
      .to.equal(testUnauthorizedResponsePath);
  });
});
