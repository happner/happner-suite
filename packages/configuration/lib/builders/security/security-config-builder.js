const BaseBuilder = require('happn-commons/lib/base-builder');
const ROOT = 'security.config';

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
      `${ROOT}.updateSubscriptionsOnSecurityDirectoryChanged`,
      shouldUpdate,
      BaseBuilder.Types.BOOLEAN
    );
    return this;
  }

  withDisableDefaultAdminNetworkConnections(shouldDisable) {
    this.set(
      `${ROOT}.disableDefaultAdminNetworkConnections`,
      shouldDisable,
      BaseBuilder.Types.BOOLEAN
    );
    return this;
  }

  withDefaultNonceTTL(ttl) {
    this.set(`${ROOT}.defaultNonceTTL`, ttl, BaseBuilder.Types.INTEGER);
    return this;
  }

  withLogSessionActivity(shouldLog) {
    this.set(`${ROOT}.logSessionActivity`, shouldLog, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withSessionActivityTTL(ttl) {
    this.set(`${ROOT}.sessionActivityTTL`, ttl, BaseBuilder.Types.INTEGER);
    return this;
  }

  withPbkdf2Iterations(iterations) {
    this.set(`${ROOT}.pbkdf2Iterations`, iterations, BaseBuilder.Types.INTEGER);
    return this;
  }

  withLockTokenToLoginType(shouldLock) {
    this.set(`${ROOT}.lockTokenToLoginType`, shouldLock, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withLockTokenToUserId(shouldLock) {
    this.set(`${ROOT}.lockTokenToUserId`, shouldLock, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withHttpsCookie(name, domain, cookie) {
    this.set(`${ROOT}.cookieName`, name, BaseBuilder.Types.STRING);
    this.set(`${ROOT}.cookieDomain`, domain, BaseBuilder.Types.STRING);
    this.set(`${ROOT}.httpsCookie`, cookie, BaseBuilder.Types.STRING);
    return this;
  }

  withSecure(isSecure) {
    this.set(`${ROOT}.secure`, isSecure, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withAllowAnonymousAccess(allow) {
    this.set(`${ROOT}.allowAnonymousAccess`, allow, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  // TODO: do we need a builder here?
  withLookup(lookup) {
    this.set(`${ROOT}.lookup`, lookup, BaseBuilder.Types.OBJECT);
    return this;
  }

  withSessionTokenSecret(secret) {
    this.set(`${ROOT}.sessionTokenSecret`, secret, BaseBuilder.Types.STRING);
    return this;
  }

  withActivateSessionManagement(activate) {
    this.set(`${ROOT}.activateSessionManagement`, activate, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withAccountLockoutEnabled(enabled) {
    this.set(`${ROOT}.accountLockout.enabled`, enabled, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withAccountLockoutAttempts(attempts) {
    this.set(`${ROOT}.accountLockout.attempts`, attempts, BaseBuilder.Types.INTEGER);
    return this;
  }

  withAccountLockoutRetryInterval(interval) {
    this.set(`${ROOT}.accountLockout.retryInterval`, interval, BaseBuilder.Types.INTEGER);
    return this;
  }

  withAuditPath(path) {
    this.push(`${ROOT}.auditPaths`, path, BaseBuilder.Types.STRING);
    return this;
  }

  withAdminUsername(username) {
    this.set(`${ROOT}.adminUser.username`, username, BaseBuilder.Types.STRING);
    return this;
  }

  withAdminPassword(password) {
    this.set(`${ROOT}.adminUser.password`, password, BaseBuilder.Types.STRING);
    return this;
  }

  withAdminPublicKey(publicKey) {
    this.set(`${ROOT}.adminUser.publicKey`, publicKey, BaseBuilder.Types.STRING);
    return this;
  }

  withAdminGroupName(name) {
    this.set(`${ROOT}.adminGroup.name`, name, BaseBuilder.Types.STRING);
    return this;
  }

  withAdminGroupPermission(permission, path, action) {
    this.push(`${ROOT}.adminGroup.permissions.${path}`, action, BaseBuilder.Types.STRING);
    return this;
  }

  withAuthProvider(providerName, providerInstance) {
    this.set(`${ROOT}.authProviders.${providerName}`, providerInstance, BaseBuilder.Types.OBJECT);
    return this;
  }

  withDefaultAuthProvider(providerName) {
    this.set(`${ROOT}.defaultAuthProvider`, providerName, BaseBuilder.Types.String);
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
    let obj = builder.build();

    this.push(`${ROOT}.profiles`, obj, BaseBuilder.Types.OBJECT);
    return this;
  }
};
