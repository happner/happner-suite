/* eslint-disable no-console,no-unused-vars,@typescript-eslint/no-var-requires */
import { expect } from 'chai';
import { ConfigValidator } from '../../../../lib/validators/config-validator';

import mockLogger from '../../../__fixtures/logger';

describe('security configuration validation tests', function () {
  it('validates full security config', () => {
    const validator = new ConfigValidator(mockLogger);
    const config = createValidSecurityConfig();

    const result = validator.validateSecurityConfig(config);

    expect(result.valid).to.equal(true);
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
      httpsCookie: true,
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
