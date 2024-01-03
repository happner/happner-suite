module.exports = function(
  mongoUrl,
  mongoDatabase,
  mongoCollection,
  deploymentId,
  port,
  secure,
  activateSessionManagement,
  securityProfiles
) {
  let config = {
    port,
    services: {
      data: {
        config: {
          datastores: [
            {
              name: 'mongo',
              provider: 'happn-db-provider-mongo',
              isDefault: true,
              settings: {
                collection: mongoCollection,
                database: mongoDatabase,
                url: mongoUrl
              }
            }
          ]
        }
      },
      membership: {
        config: {
          deploymentId,
        }
      },
      proxy: {
        config: {
          allowSelfSignedCerts: true
        }
      }
    }
  };

  if (secure) {
    config.secure = true;
    config.services.security = {
      config: {
        profiles: securityProfiles,
        activateSessionManagement: activateSessionManagement,
        sessionTokenSecret: 'sessionTokenSecret',
        adminUser: {
          username: '_ADMIN',
          password: 'secret'
        }
      }
    };
  }

  return config;
};
