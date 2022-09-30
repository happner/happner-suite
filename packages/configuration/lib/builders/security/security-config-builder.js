const BaseBuilder = require('happn-commons/lib/base-builder');

module.exports = class SecurityConfigBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  /*
  security:{
  updateSubscriptionsOnSecurityDirectoryChanged:[bool],
  disableDefaultAdminNetworkConnections:[bool],
  defaultNonceTTL:[int],
  logSessionActivity:[bool],
  sessionActivityTTL:[int],
  pbkdf2Iterations:[int],
  lockTokenToLoginType:[bool],
  lockTokenToUserId:[bool],
  cookieName:[string],
  httpsCookie:[string],
  cookieDomain:[string],
  secure:[bool],
  allowAnonymousAccess:[bool],
  lookup:{},
  sessionTokenSecret:[string],
  activateSessionManagement:[bool],
  accountLockout:{
    enabled:[bool],
    attempts:[int],
    retryInterval:[int]
  },
  audit:{
    paths:[],
  },
  adminUser:{
    username:[string],
    password:[string],
    publicKey:[string]
  },
  adminGroup:{
    name:[string],
    permissions: {
    [path]:{
      actions:[
        [path],
        [path]
      ]
    }
  },
  authProviders:{},
  defaultAuthProvider:[string],
  profiles:[
    {
      name:[string],
      session:{
        type:{}
      },
      policy:{
        ttl:[int],
        inactivity_threshold:[int]
      }
    }
  ]
}
   */

  withUpdateSubscriptionsOnSecurityDirectoryChanged(shouldUpdate) {
    this.set(
      'updateSubscriptionsOnSecurityDirectoryChanged',
      shouldUpdate,
      BaseBuilder.Types.BOOLEAN
    );
    return this;
  }

  withDisableDefaultAdminNetworkConnections(shouldDisable) {
    this.set('disableDefaultAdminNetworkConnections', shouldDisable, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withDefaultNonceTTL(ttl) {
    this.set('defaultNonceTTL', ttl, BaseBuilder.Types.INTEGER);
    return this;
  }

  withLogSessionActivity(shouldLog) {
    this.set('logSessionActivity', shouldLog, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withSessionActivityTTL(ttl) {
    this.set('sessionActivityTTL', ttl, BaseBuilder.Types.INTEGER);
    return this;
  }

  withPbkdf2Iterations(iterations) {
    this.set('pbkdf2Iterations', iterations, BaseBuilder.Types.INTEGER);
    return this;
  }

  withLockTokenToLoginType(shouldLock) {
    this.set('lockTokenToLoginType', shouldLock, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withLockTokenToUserId(shouldLock) {
    this.set('lockTokenToUserId', shouldLock, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withHttpsCookie(name, domain, cookie) {
    this.set('cookieName', name, BaseBuilder.Types.STRING);
    this.set('cookieDomain', domain, BaseBuilder.Types.STRING);
    this.set('httpsCookie', cookie, BaseBuilder.Types.STRING);
    return this;
  }

  withSecure(isSecure) {
    this.set('secure', isSecure, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withAllowAnonymousAccess(allow) {
    this.set('allowAnonymousAccess', allow, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  // TODO: do we need a builder here?
  withLookup(lookup) {
    this.set('lookup', lookup, BaseBuilder.Types.OBJECT);
    return this;
  }

  withSessionTokenSecret(secret) {
    this.set('sessionTokenSecret', secret, BaseBuilder.Types.STRING);
    return this;
  }

  withActivateSessionManagement(activate) {
    this.set('activateSessionManagement', activate, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withAccountLockoutEnabled(enabled) {
    this.set('accountLockout.enabled', enabled, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withAccountLockoutAttempts(attempts) {
    this.set('accountLockout.attempts', attempts, BaseBuilder.Types.INTEGER);
    return this;
  }

  withAccountLockoutRetryInterval(interval) {
    this.set('accountLockout.retryInterval', interval, BaseBuilder.Types.INTEGER);
    return this;
  }

  withAuditPath(path) {
    this.push('auditPaths', path, BaseBuilder.Types.STRING);
    return this;
  }

  withAdminUsername(username) {
    this.set('adminUser.username', username, BaseBuilder.Types.STRING);
    return this;
  }

  withAdminPassword(password) {
    this.set('adminUser.password', password, BaseBuilder.Types.STRING);
    return this;
  }

  withAdminPublicKey(publicKey) {
    this.set('adminUser.publicKey', publicKey, BaseBuilder.Types.STRING);
    return this;
  }

  withAdminGroupName(name) {
    this.set('adminGroup.name', name, BaseBuilder.Types.STRING);
    return this;
  }

  withAdminGroupPermission(permissionKey, action) {
    this.push(`adminGroup.permissions.${permissionKey}`, action, BaseBuilder.Types.STRING);
    return this;
  }

  withAuthProvider(providerName, providerInstance) {
    this.set(`authProviders.${providerName}`, providerInstance, BaseBuilder.Types.OBJECT);
    return this;
  }

  withDefaultAuthProvider(providerName) {
    this.set('defaultAuthProvider', providerName, BaseBuilder.Types.String);
    return this;
  }

  withProfile(name, sessionKey, sessionMatchOn, policyTTL, policyInactiveThreshold) {
    let builder = new BaseBuilder();
    builder.set('name', name, BaseBuilder.Types.STRING);
    builder.set('policy.ttl', policyTTL, BaseBuilder.Types.INTEGER);
    builder.set('policy.inactivity_threshold', policyInactiveThreshold, BaseBuilder.Types.NUMERIC);

    let matchType;

    switch (typeof sessionMatchOn) {
      case 'boolean':
        matchType = BaseBuilder.Types.BOOLEAN;
        break;
      case 'string':
        matchType = BaseBuilder.Types.STRING;
        break;
      case 'number':
        matchType = BaseBuilder.Types.NUMERIC;
        break;
      default:
    }
    builder.set(`session.${sessionKey}.$eq`, sessionMatchOn, matchType);

    this.push(`profiles`, builder, BaseBuilder.Types.OBJECT);
    return this;
  }
};
