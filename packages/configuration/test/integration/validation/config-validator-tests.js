/* eslint-disable no-console,no-unused-vars */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const ConfigValidator = require('../../../lib/validators/config-validator');

describe(helper.testName(), function () {
  /*
  CACHE
   */
  it('validates VALID cache config', () => {
    const validator = new ConfigValidator();
    const config = createValidCacheConfig();

    const result = validator.validateCacheConfig(config);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates cache config with incorrect security_group_permissions', () => {
    const validator = new ConfigValidator();
    const cacheConfig = createValidCacheConfig();
    cacheConfig.config.overrides[0].cache_security_group_permissions.max = null;

    // validate
    let result = validator.validateCacheConfig(cacheConfig);

    //assert
    helper.expect(result.valid).to.equal(false);
    helper
      .expect(result.errors[0].instancePath)
      .to.equal('/config/overrides/0/cache_security_group_permissions/max');
    helper.expect(result.errors[0].message).to.equal('must be integer');

    //modify
    cacheConfig.config.overrides[0].cache_security_group_permissions.max = 500;
    cacheConfig.config.overrides[0].cache_security_group_permissions.maxAge = 'invalid type';

    // revalidate
    result = validator.validateCacheConfig(cacheConfig);

    // reassert
    helper.expect(result.valid).to.equal(false);
    helper
      .expect(result.errors[0].instancePath)
      .to.equal('/config/overrides/0/cache_security_group_permissions/maxAge');
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  // it('validates VALID connect config', () => {
  //   const validator = new ConfigValidator();
  //   const config = createValidConnectConfig();
  //
  //   const result = validator.validateConnectConfig(config);
  //
  //   helper.expect(result).to.equal(true);
  // });
  //
  // it('validates VALID data config', () => {
  //   const validator = new ConfigValidator();
  //   const config = createValidDataConfig();
  //
  //   const result = validator.validateDataConfig(config);
  //
  //   helper.expect(result).to.equal(true);
  // });
  //
  // it('validates VALID protocol config', () => {
  //   const validator = new ConfigValidator();
  //   const config = createValidProtocolConfig();
  //
  //   const result = validator.validateProtocolConfig(config);
  //
  //   helper.expect(result).to.equal(true);
  // });
  //
  // it('validates VALID publisher config', () => {
  //   const validator = new ConfigValidator();
  //   const config = createValidPublisherConfig();
  //
  //   const result = validator.validatePublisherConfig(config);
  //
  //   helper.expect(result).to.equal(true);
  // });
  //
  // it('validates VALID security config', () => {
  //   const validator = new ConfigValidator();
  //   const config = createValidSecurityConfig();
  //
  //   const result = validator.validateSecurityConfig(config);
  //
  //   helper.expect(result).to.equal(true);
  // });
  //
  // it('validates VALID subscription config', () => {
  //   const validator = new ConfigValidator();
  //   const config = createValidSecurityConfig();
  //
  //   const result = validator.validateSecurityConfig(config);
  //
  //   helper.expect(result).to.equal(true);
  // });
  //
  // it('validates VALID transport config', () => {
  //   const validator = new ConfigValidator();
  //   const config = createValidTransportConfig();
  //
  //   const result = validator.validateTransportConfig(config);
  //
  //   helper.expect(result).to.equal(true);
  // });
});

function createValidCacheConfig() {
  return {
    config: {
      overrides: [
        {
          cache_security_group_permissions: {
            max: 5,
            maxAge: 1000,
          },
        },
        {
          cache_security_groups: {
            max: 6,
            maxAge: 2000,
          },
        },
        {
          cache_security_passwords: {
            max: 7,
            maxAge: 3000,
          },
        },
        {
          cache_security_user_permissions: {
            max: 8,
            maxAge: 4000,
          },
        },
        {
          cache_security_users: {
            max: 9,
            maxAge: 5000,
          },
        },
        {
          checkpoint_cache_authorization: {
            max: 10,
            maxAge: 6000,
          },
        },
        {
          checkpoint_cache_authorization_token: {
            max: 11,
            maxAge: 7000,
          },
        },
      ],
      statisticsInterval: 5000,
    },
  };
}

function createValidConnectConfig() {
  return {
    config: {
      middleware: {
        security: {
          cookieName: 'testCookie',
          cookieDomain: 'test.domain',
          exclusions: ['/exclusion/path/*'],
          forbiddenResponsePath: '/forbidden',
          unauthorizedResponsePath: '/unauthorized',
        },
      },
    },
  };
}

function createValidDataConfig() {
  return {
    config: {
      secure: true,
      datastores: [
        {
          name: 'testName',
          provider: 'testProvider',
          isDefault: true,
          settings: {
            fsync: true,
          },
          dbfile: '/testDbFile',
          filename: 'testDataFile',
        },
      ],
    },
  };
}

function createValidProtocolConfig() {
  return {
    config: {
      allowNestedPermissions: true,
      inboundLayers: [null],
      outboundLayers: [null],
      secure: true,
    },
  };
}

function createValidPublisherConfig() {
  return {
    config: {
      timeout: 2000,
      publicationOptions: {
        acknowledgeTimeout: true,
      },
    },
  };
}

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
        name: 'adminGroup1',
        permissions: {
          '/test': ['testAction1', 'testAction2'],
        },
      },
      adminUser: {
        username: 'testUser',
        password: 'password123',
        publicKey: 'publicKey3445',
      },
      allowAnonymousAccess: false,
      auditPaths: ['/audit/path'],
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
      secure: true,
      sessionActivityTTL: 100,
      sessionTokenSecret: 'sessionTokenSecret123',
      updateSubscriptionsOnSecurityDirectoryChanged: true,
    },
  };
}

function createValidSubscriptionConfig() {
  return {
    config: {
      allowNestedPermissions: true,
      subscriptionTree: {
        permutationCache: 5000,
        searchCache: 10000,
        timeout: 20000,
      },
    },
  };
}

function createValidTransportConfig() {
  return {
    config: {
      mode: 'testMode',
      key: 'test12af4ed629g',
      cert: 'cert123g123iurf132ui12df3t12',
      keyPath: '/key/path',
      certPath: '/cert/path',
      keepAliveTimeout: 60000,
    },
  };
}
