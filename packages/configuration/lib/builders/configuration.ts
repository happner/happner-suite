import CacheConfigBuilder from './security/security-config-builder';
import ConnectConfigBuilder from './connect/connect-config-builder';
import DataConfigBuilder from './data/data-config-builder';
import ProtocolConfigBuilder from './protocol/protocol-config-builder';
import PublisherConfigBuilder from './publisher/publisher-config-builder';
import SecurityConfigBuilder from './security/security-config-builder';

class Configuration {
  #securityConfigBuilder: SecurityConfigBuilder;
  #cacheConfigBuilder: CacheConfigBuilder;
  #connectConfigBuilder: ConnectConfigBuilder;
  #dataConfigBuilder: DataConfigBuilder;
  #protocolConfigBuilder: ProtocolConfigBuilder;
  #publisherConfigBuilder: PublisherConfigBuilder;

  constructor(
    cacheConfigBuilder: CacheConfigBuilder,
    connectConfigBuilder: ConnectConfigBuilder,
    dataConfigBuilder: DataConfigBuilder,
    protocolConfigBuilder: ProtocolConfigBuilder,
    publisherConfigBuilder: PublisherConfigBuilder,
    securityConfigBuilder: SecurityConfigBuilder
  ) {
    this.#cacheConfigBuilder = cacheConfigBuilder;
    this.#connectConfigBuilder = connectConfigBuilder;
    this.#dataConfigBuilder = dataConfigBuilder;
    this.#protocolConfigBuilder = protocolConfigBuilder;
    this.#publisherConfigBuilder = publisherConfigBuilder;
    this.#securityConfigBuilder = securityConfigBuilder;
  }

  /*
  PROTOCOLS
   */

  setProtocolAllowNestedPermissions(isAllowed: boolean) {
    this.#protocolConfigBuilder.withAllowNestedPermissions(isAllowed);
  }

  setProtocolHappnProtocol(
    version: number,
    successFunc?: Function,
    transformOutFunc?: Function,
    transformSystemFunc?: Function,
    emitFunc?: Function
  ) {
    this.#protocolConfigBuilder.withHappnProtocol(
      version,
      successFunc,
      transformOutFunc,
      transformSystemFunc,
      emitFunc
    );
  }

  setProtocolInboundLayer(layer: string) {
    this.#protocolConfigBuilder.withInboundLayer(layer);
  }

  setProtocolIsSecure(isSecure: boolean) {
    this.#protocolConfigBuilder.withSecure(isSecure);
  }

  setProtocolOutboundLayer(layer: string) {
    this.#protocolConfigBuilder.withOutboundLayer(layer);
  }

  /*
  SECURITY
   */

  setSecurityActivateSessionManagement(activate: boolean) {
    this.#securityConfigBuilder.withActivateSessionManagement(activate);
  }

  setSecurityAccountLockoutEnabled(enabled: boolean) {
    this.#securityConfigBuilder.withAccountLockoutEnabled(enabled);
  }

  setSecurityAccountLockoutAttempts(attempts: number) {
    this.#securityConfigBuilder.withAccountLockoutAttempts(attempts);
  }

  setSecurityAccountLockoutRetryInterval(retryInterval: number) {
    this.#securityConfigBuilder.withAccountLockoutRetryInterval(retryInterval);
  }

  setSecurityAdminUsername(username: string) {
    this.#securityConfigBuilder.withAdminUsername(username);
  }

  setSecurityAdminPassword(password: string) {
    this.#securityConfigBuilder.withAdminPassword(password);
  }

  setSecurityAdminPublicKey(publicKey: string) {
    this.#securityConfigBuilder.withAdminPublicKey(publicKey);
  }

  setSecurityAdminGroupName(groupName: string) {
    this.#securityConfigBuilder.withAdminGroupName(groupName);
  }

  // repeatable using same key and different path
  setSecurityAdminGroupPermission(permissionKey: string, actionPath: string): void {
    this.#securityConfigBuilder.withAdminGroupPermission(permissionKey, actionPath);
  }

  setSecurityAllowAnonymousAccess(allowAnonymous: boolean) {
    this.#securityConfigBuilder.withAllowAnonymousAccess(allowAnonymous);
  }

  setSecurityAuditPath(path: string): void {
    this.#securityConfigBuilder.withAuditPath(path);
  }

  setSecurityAuthProvider(name: string, instance: any): void {
    this.#securityConfigBuilder.withAuthProvider(name, instance);
  }

  setSecurityCookie(name: string, domain: string, cookie: string) {
    this.#securityConfigBuilder.withHttpsCookie(name, domain, cookie);
  }

  setSecurityLogSessionActivity(shouldLog: boolean) {
    this.#securityConfigBuilder.withLogSessionActivity(shouldLog);
  }

  setSecurityLockTokenToLoginType(shouldLock: boolean) {
    this.#securityConfigBuilder.withLockTokenToLoginType(shouldLock);
  }

  setSecurityLockTokenToUserId(shouldLock: boolean) {
    this.#securityConfigBuilder.withLockTokenToUserId(shouldLock);
  }

  //TODO: lookups

  setSecurityPbkdf2Iterations(iterations: number) {
    this.#securityConfigBuilder.withPbkdf2Iterations(iterations);
  }

  setSecurityProfile(
    name: string,
    sessionKey: string,
    sessionMatchOn: any,
    policyTTL: number,
    policyInactiveThreshold: number
  ) {
    this.#securityConfigBuilder.withProfile(
      name,
      sessionKey,
      sessionMatchOn,
      policyTTL,
      policyInactiveThreshold
    );
  }

  setSecurityIsSecure(isSecure: boolean) {
    this.#securityConfigBuilder.withSecure(isSecure);
  }

  setSessionActivityTTL(ttl: number) {
    this.#securityConfigBuilder.withSessionActivityTTL(ttl);
  }

  setSessionTokenSecret(secret: string) {
    this.#securityConfigBuilder.withSessionTokenSecret(secret);
  }
}
