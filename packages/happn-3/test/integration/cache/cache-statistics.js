require('../../__fixtures/utils/test_helper').describe({ timeout: 60e3 }, (test) => {
  const happn = require('../../../lib/index');
  let serviceInstance;
  let adminClient;
  let logs = [];

  before('it starts secure service with caching statistics activated', async () => {
    serviceInstance = await getService({
      secure: true,
      services: {
        cache: {
          config: {
            statisticsInterval: 2e3,
          },
        },
      },
    });
    serviceInstance.services.cache.log.json = {
      info: (data) => {
        logs.push(data);
      },
    };

    adminClient = await getClient({
      username: '_ADMIN',
      password: 'happn',
    });
  });

  after('stop the services', async () => {
    if (adminClient)
      await adminClient.disconnect({
        reconnect: false,
      });
    await serviceInstance.stop();
  });

  it('tests the statistics output of the caching service', async () => {
    serviceInstance.services.cache.log.json = {
      info: (data) => {
        logs.push(data);
      },
    };
    test.log('producing stats, please wait...');
    await test.delay(8e3);
    test.expect(logs.length >= 1).to.be(true);
    test.expect(logs[0].name.length > 0).to.be(true);
    test.expect(test.commons._.omit(logs[0], 'timestamp', 'name')).to.eql({
      service_session_active_sessions: {
        hits: 0,
        misses: 0,
        size: 1,
        type: 'static',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      cache_security_group_permissions: {
        hits: 0,
        misses: 1,
        size: 0,
        type: 'lru',
        hitsPerSec: 0,
        missesPerSec: 0.5,
      },
      cache_security_groups: {
        hits: 0,
        misses: 1,
        size: 0,
        type: 'lru',
        hitsPerSec: 0,
        missesPerSec: 0.5,
      },
      checkpoint_cache_authorization: {
        hits: 0,
        misses: 0,
        size: 0,
        type: 'lru',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      checkpoint_cache_authorization_token: {
        hits: 0,
        misses: 0,
        size: 0,
        type: 'lru',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      checkpoint_usage_limit: {
        hits: 0,
        misses: 0,
        size: 0,
        type: 'static',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      checkpoint_inactivity_threshold: {
        hits: 0,
        misses: 0,
        size: 0,
        type: 'static',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      cache_security_user_permissions: {
        hits: 0,
        misses: 0,
        size: 1,
        type: 'lru',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      cache_security_users: {
        hits: 0,
        misses: 0,
        size: 1,
        type: 'lru',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      cache_security_passwords: {
        hits: 1,
        misses: 0,
        size: 1,
        type: 'lru',
        hitsPerSec: 0.5,
        missesPerSec: 0,
      },
      security_cache_usersbygroup: {
        hits: 0,
        misses: 0,
        size: 0,
        type: 'lru',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      cache_revoked_tokens: {
        hits: 0,
        misses: 0,
        size: 0,
        type: 'persist',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      cache_session_on_behalf_of: {
        hits: 0,
        misses: 0,
        size: 0,
        type: 'static',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      security_account_lockout: {
        hits: 0,
        misses: 2,
        size: 0,
        type: 'static',
        hitsPerSec: 0,
        missesPerSec: 1,
      },
      security_authentication_nonce: {
        hits: 0,
        misses: 0,
        size: 0,
        type: 'static',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
    });

    test.expect(test.commons._.omit(logs[1], 'timestamp', 'name')).to.eql({
      service_session_active_sessions: {
        hits: 0,
        misses: 0,
        size: 1,
        type: 'static',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      cache_security_group_permissions: {
        hits: 0,
        misses: 1,
        size: 0,
        type: 'lru',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      cache_security_groups: {
        hits: 0,
        misses: 1,
        size: 0,
        type: 'lru',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      checkpoint_cache_authorization: {
        hits: 0,
        misses: 0,
        size: 0,
        type: 'lru',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      checkpoint_cache_authorization_token: {
        hits: 0,
        misses: 0,
        size: 0,
        type: 'lru',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      checkpoint_usage_limit: {
        hits: 0,
        misses: 0,
        size: 0,
        type: 'static',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      checkpoint_inactivity_threshold: {
        hits: 0,
        misses: 0,
        size: 0,
        type: 'static',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      cache_security_user_permissions: {
        hits: 0,
        misses: 0,
        size: 1,
        type: 'lru',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      cache_security_users: {
        hits: 0,
        misses: 0,
        size: 1,
        type: 'lru',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      cache_security_passwords: {
        hits: 1,
        misses: 0,
        size: 1,
        type: 'lru',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      security_cache_usersbygroup: {
        hits: 0,
        misses: 0,
        size: 0,
        type: 'lru',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      cache_revoked_tokens: {
        hits: 0,
        misses: 0,
        size: 0,
        type: 'persist',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      cache_session_on_behalf_of: {
        hits: 0,
        misses: 0,
        size: 0,
        type: 'static',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      security_account_lockout: {
        hits: 0,
        misses: 2,
        size: 0,
        type: 'static',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
      security_authentication_nonce: {
        hits: 0,
        misses: 0,
        size: 0,
        type: 'static',
        hitsPerSec: 0,
        missesPerSec: 0,
      },
    });
  });

  function getClient(config) {
    return happn.client.create(config);
  }

  function getService(config) {
    return new Promise((resolve, reject) => {
      happn.service.create(config, (e, instance) => {
        if (e) return reject(e);
        resolve(instance);
      });
    });
  }
});
