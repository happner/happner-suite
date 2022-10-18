/* eslint-disable no-console,no-unused-vars */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const ConfigValidator = require('../../../lib/validators/config-validator');

describe(helper.testName(), function () {
  it('validates full security config', () => {
    const validator = new ConfigValidator();
    const config = createValidSecurityConfig();

    const result = validator.validateSecurityConfig(config);

    helper.expect(result.valid).to.equal(true);
  });
});

function createValidSecurityConfig() {
  return {
    config: {
      activateSessionManagement: true,
      accountLockout: {
        attempts: 5,
        enabled: true,
        retryInterval: 2000,
      },
      adminGroup: {
        custom_data: {
          description: 'test description',
        },
      },
      adminUser: {
        password: 'password123',
        custom_data: {
          description: 'test description custom data',
        },
        publicKey: 'rqwetriyqeriyqweroq',
      },
      allowAnonymousAccess: false,
      authProviders: {
        testProvider: {},
      },
      cookieName: 'testCookie',
      cookieDomain: 'cookie.domain',
      httpsCookie: 'b654adef8979ceef21123',
      defaultAuthProvider: 'testProvider',
      defaultNonceTTL: 60000,
      disableDefaultAdminNetworkConnections: false,
      logSessionActivity: true,
      lockTokenToLoginType: true,
      lockTokenToUserId: true,
      pbkdf2Iterations: 5,
      profiles: [
        {
          name: 'testProfile',
          policy: {
            ttl: 1000,
            inactivity_threshold: 60000,
          },
          session: {
            type: {
              $eq: 1,
            },
          },
        },
      ],
      sessionActivityTTL: 100,
      sessionTokenSecret: 'sessionTokenSecret123',
      updateSubscriptionsOnSecurityDirectoryChanged: true,
    },
  };
}
