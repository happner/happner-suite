Cache Service Configuration
---------------------------
*The cache service manages a set of security and optimisation caches, it can be configured as follows:*
- in a clustered environment, the security caches are eventually consistent
- the following configuration example shows how to emit structured logs of the cache statistics periodically
- the following configuration also shows how to override the defaults for specific security related LRU caches
### happn-3 configuration:
```javascript
const config = {
    secure: true,
    services: {
        cache: {
            config: {
                statisticsInterval: 2e3, // setting a stats interval in milliseconds will print cache statistics to stdout for the interval
                overrides: {
                  // for LRU caches, these are what you can control in terms of cache sizes, and ttl's
                  // these configurations show the defaults
                  checkpoint_cache_authorization: {
                    // this cache holds authorization results by user session and path, it speeds up authorization lookups
                    max: 10000,
                    maxAge: 0,
                  },
                  checkpoint_cache_authorization_token: {
                    // this cache holds authorization results by user session and path for token based requests, it speeds up authorization lookups
                    max: 10000,
                    maxAge: 0,
                  },
                  cache_security_groups: {
                    // security groups cache, speeds up group lookups
                    max: 5000,
                    maxAge: 0,
                  },
                  cache_security_users: {
                    // security users cache, speeds up user lookups
                    max: 10000,
                    maxAge: 0,
                  },
                  cache_security_group_permissions: {
                    // group permissions cache, speeds up group permission lookups
                    max: 10000,
                    maxAge: 0,
                  },
                  cache_security_user_permissions: {
                    // user permissions cache, speeds up user permission lookups
                    max: 10000,
                    maxAge: 0,
                  },
                  cache_security_passwords: {
                    // user passwords (hashed) by username cache, speeds up password lookups
                    max: 10000,
                    maxAge: 0,
                  },
                }
            }
        }
    }
}
```

### happner-2 configuration:
```javascript
const config = {
    //happn configuration simply nested in happner-2 configuration
    happn: {
        secure: true,
        services: {
            cache: {
                config: {
                    statisticsInterval: 2e3, // setting a stats interval in milliseconds will print cache statistics to stdout for the interval
                    overrides: {
                      // for LRU caches, these are what you can control in terms of cache sizes, and ttl's
                      // these configurations show the defaults
                      checkpoint_cache_authorization: {
                        // this cache holds authorization results by user session and path, it speeds up authorization lookups
                        max: 10000,
                        maxAge: 0,
                      },
                      checkpoint_cache_authorization_token: {
                        // this cache holds authorization results by user session and path for token based requests, it speeds up authorization lookups
                        max: 10000,
                        maxAge: 0,
                      },
                      cache_security_groups: {
                        // security groups cache, speeds up group lookups
                        max: 5000,
                        maxAge: 0,
                      },
                      cache_security_users: {
                        // security users cache, speeds up user lookups
                        max: 10000,
                        maxAge: 0,
                      },
                      cache_security_group_permissions: {
                        // group permissions cache, speeds up group permission lookups
                        max: 10000,
                        maxAge: 0,
                      },
                      cache_security_user_permissions: {
                        // user permissions cache, speeds up user permission lookups
                        max: 10000,
                        maxAge: 0,
                      },
                      cache_security_passwords: {
                        // user passwords (hashed) by username cache, speeds up password lookups
                        max: 10000,
                        maxAge: 0,
                      },
                    }
                }
            }
        }
    }
}
```

### cache statistics (outputted every 2 seconds): 
```json
{
  "timestamp": 1653392580921,
  "level": "info",
  "tag": "cache-service-statistics",
  "data": {
    "service_session_active_sessions": {
      "hits": 0,
      "misses": 0,
      "size": 5,
      "type": "static",
      "hitsPerSec": 0,
      "missesPerSec": 0
    },
    "cache_security_group_permissions": {
      "hits": 1,
      "misses": 2,
      "size": 2,
      "type": "lru",
      "hitsPerSec": 0,
      "missesPerSec": 0
    },
    "cache_security_groups": {
      "hits": 1,
      "misses": 8,
      "size": 2,
      "type": "lru",
      "hitsPerSec": 0,
      "missesPerSec": 0
    },
    "checkpoint_cache_authorization": {
      "hits": 23,
      "misses": 112,
      "size": 12,
      "type": "lru",
      "hitsPerSec": 0,
      "missesPerSec": 0.3333333333333333
    },
    "checkpoint_cache_authorization_token": {
      "hits": 0,
      "misses": 0,
      "size": 0,
      "type": "lru",
      "hitsPerSec": 0,
      "missesPerSec": 0
    },
    "checkpoint_usage_limit": {
      "hits": 0,
      "misses": 0,
      "size": 0,
      "type": "static",
      "hitsPerSec": 0,
      "missesPerSec": 0
    },
    "checkpoint_inactivity_threshold": {
      "hits": 0,
      "misses": 0,
      "size": 0,
      "type": "static",
      "hitsPerSec": 0,
      "missesPerSec": 0
    },
    "cache_security_user_permissions": {
      "hits": 2,
      "misses": 0,
      "size": 1,
      "type": "lru",
      "hitsPerSec": 0,
      "missesPerSec": 0
    },
    "cache_security_users": {
      "hits": 6,
      "misses": 0,
      "size": 0,
      "type": "lru",
      "hitsPerSec": 0,
      "missesPerSec": 0
    },
    "cache_security_passwords": {
      "hits": 4,
      "misses": 0,
      "size": 0,
      "type": "lru",
      "hitsPerSec": 0,
      "missesPerSec": 0
    },
    "security_cache_usersbygroup": {
      "hits": 0,
      "misses": 0,
      "size": 0,
      "type": "lru",
      "hitsPerSec": 0,
      "missesPerSec": 0
    },
    "cache_revoked_tokens": {
      "hits": 0,
      "misses": 73,
      "size": 0,
      "type": "persist",
      "hitsPerSec": 0,
      "missesPerSec": 0.3333333333333333
    },
    "cache_session_on_behalf_of": {
      "hits": 0,
      "misses": 0,
      "size": 0,
      "type": "static",
      "hitsPerSec": 0,
      "missesPerSec": 0
    },
    "security_account_lockout": {
      "hits": 0,
      "misses": 8,
      "size": 0,
      "type": "static",
      "hitsPerSec": 0,
      "missesPerSec": 0
    },
    "security_authentication_nonce": {
      "hits": 0,
      "misses": 0,
      "size": 0,
      "type": "static",
      "hitsPerSec": 0,
      "missesPerSec": 0
    },
    "happner-bound-exchange-security": {
      "hits": 0,
      "misses": 0,
      "size": 0,
      "type": "lru",
      "hitsPerSec": 0,
      "missesPerSec": 0
    },
    "happner-bound-exchange-api": {
      "hits": 0,
      "misses": 0,
      "size": 0,
      "type": "lru",
      "hitsPerSec": 0,
      "missesPerSec": 0
    },
    "happner-bound-exchange-system": {
      "hits": 0,
      "misses": 0,
      "size": 0,
      "type": "lru",
      "hitsPerSec": 0,
      "missesPerSec": 0
    },
    "happner-bound-exchange-rest": {
      "hits": 0,
      "misses": 0,
      "size": 0,
      "type": "lru",
      "hitsPerSec": 0,
      "missesPerSec": 0
    },
    "happner-bound-exchange-localComponent": {
      "hits": 0,
      "misses": 0,
      "size": 0,
      "type": "lru",
      "hitsPerSec": 0,
      "missesPerSec": 0
    },
    "happner-bound-exchange-brokerComponent": {
      "hits": 0,
      "misses": 0,
      "size": 0,
      "type": "lru",
      "hitsPerSec": 0,
      "missesPerSec": 0
    },
    "happner-bound-exchange-data": {
      "hits": 0,
      "misses": 0,
      "size": 0,
      "type": "lru",
      "hitsPerSec": 0,
      "missesPerSec": 0
    },
    "happner-bound-exchange-remoteComponent": {
      "hits": 0,
      "misses": 0,
      "size": 0,
      "type": "lru",
      "hitsPerSec": 0,
      "missesPerSec": 0
    },
    "happner-bound-exchange-remoteComponent1": {
      "hits": 0,
      "misses": 0,
      "size": 0,
      "type": "lru",
      "hitsPerSec": 0,
      "missesPerSec": 0
    },
    "logType": "statistics",
    "area": "happn-3 cache service",
    "timestamp": 1653392580921
  }
}
```

