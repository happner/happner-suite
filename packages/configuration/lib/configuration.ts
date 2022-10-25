import HappnConfigBuilder from './builders/happn-config-builder';
import CacheConfigBuilder from './builders/services/cache-config-builder';
import ConnectConfigBuilder from './builders/services/connect-config-builder';
import DataConfigBuilder from './builders/services/data-config-builder';
import HealthConfigBuilder from './builders/services/health-config-builder';
import MembershipConfigBuilder from './builders/services/membership-config-builder';
import OrchestratorConfigBuilder from './builders/services/orchestrator-config-builder';
import ProtocolConfigBuilder from './builders/services/protocol-config-builder';
import ProxyConfigBuilder from './builders/services/proxy-config-builder';
import PublisherConfigBuilder from './builders/services/publisher-config-builder';
import ReplicatorConfigBuilder from './builders/services/replicator-config-builder';
import SecurityConfigBuilder from './builders/services/security-config-builder';
import SubscriptionConfigBuilder from './builders/services/subscription-config-builder';
import SystemConfigBuilder from './builders/services/system-config-builder';
import TransportConfigBuilder from './builders/services/transport-config-builder';

export class Configuration {
  #happnConfigBuilder: HappnConfigBuilder;
  #cacheConfigBuilder: CacheConfigBuilder;
  #connectConfigBuilder: ConnectConfigBuilder;
  #dataConfigBuilder: DataConfigBuilder;
  #healthConfigBuilder: HealthConfigBuilder;
  #membershipConfigBuilder: MembershipConfigBuilder;
  #orchestratorConfigBuilder: OrchestratorConfigBuilder;
  #protocolConfigBuilder: ProtocolConfigBuilder;
  #proxyConfigBuilder: ProxyConfigBuilder;
  #publisherConfigBuilder: PublisherConfigBuilder;
  #replicatorConfigBuilder: ReplicatorConfigBuilder;
  #securityConfigBuilder: SecurityConfigBuilder;
  #subscriptionConfigBuilder: SubscriptionConfigBuilder;
  #systemConfigBuilder: SystemConfigBuilder;
  #transportConfigBuilder: TransportConfigBuilder;

  constructor(
    happnConfigBuilder: HappnConfigBuilder,
    cacheConfigBuilder: CacheConfigBuilder,
    connectConfigBuilder: ConnectConfigBuilder,
    dataConfigBuilder: DataConfigBuilder,
    healthConfigBuilder: HealthConfigBuilder,
    membershipConfigBuilder: MembershipConfigBuilder,
    orchestratorConfigBuilder: OrchestratorConfigBuilder,
    protocolConfigBuilder: ProtocolConfigBuilder,
    proxyConfigBuilder: ProxyConfigBuilder,
    publisherConfigBuilder: PublisherConfigBuilder,
    replicatorConfigBuilder: ReplicatorConfigBuilder,
    securityConfigBuilder: SecurityConfigBuilder,
    subscriptionConfigBuilder: SubscriptionConfigBuilder,
    systemConfigBuilder: SystemConfigBuilder,
    transportConfigBuilder: TransportConfigBuilder
  ) {
    this.#happnConfigBuilder = happnConfigBuilder;
    this.#cacheConfigBuilder = cacheConfigBuilder;
    this.#connectConfigBuilder = connectConfigBuilder;
    this.#dataConfigBuilder = dataConfigBuilder;
    this.#healthConfigBuilder = healthConfigBuilder;
    this.#membershipConfigBuilder = membershipConfigBuilder;
    this.#orchestratorConfigBuilder = orchestratorConfigBuilder;
    this.#protocolConfigBuilder = protocolConfigBuilder;
    this.#proxyConfigBuilder = proxyConfigBuilder;
    this.#publisherConfigBuilder = publisherConfigBuilder;
    this.#replicatorConfigBuilder = replicatorConfigBuilder;
    this.#securityConfigBuilder = securityConfigBuilder;
    this.#subscriptionConfigBuilder = subscriptionConfigBuilder;
    this.#systemConfigBuilder = systemConfigBuilder;
    this.#transportConfigBuilder = transportConfigBuilder;
  }

  /*
  CACHE
   */

  setCacheStatisticsCheckPointAuthOverride(max: number, maxAge: number): void {
    this.#cacheConfigBuilder.withStatisticsCheckoutPointCacheAuthOverride(max, maxAge);
  }

  setCacheStatisticsCheckPointAuthTokenOverride(max: number, maxAge: number): void {
    this.#cacheConfigBuilder.withStatisticsCheckoutPointCacheAuthTokenOverride(max, maxAge);
  }

  setCacheStatisticsInterval(interval: number): void {
    this.#cacheConfigBuilder.withStatisticsInterval(interval);
  }

  setCacheStatisticsSecurityGroupPermissionsOverride(max: number, maxAge: number): void {
    this.#cacheConfigBuilder.withStatisticsCacheSecurityGroupPermissionsOverride(max, maxAge);
  }

  setCacheStatisticsSecurityGroupsOverride(max: number, maxAge: number): void {
    this.#cacheConfigBuilder.withStatisticsCacheSecurityGroupsOverride(max, maxAge);
  }

  setCacheStatisticsSecurityPasswordsOverride(max: number, maxAge: number): void {
    this.#cacheConfigBuilder.withStatisticsCacheSecurityPasswordsOverride(max, maxAge);
  }

  setCacheStatisticsSecurityUserPermissionsOverride(max: number, maxAge: number): void {
    this.#cacheConfigBuilder.withStatisticsCacheSecurityUserPermissionsOverride(max, maxAge);
  }

  setCacheStatisticsSecurityUsersOverride(max: number, maxAge: number): void {
    this.#cacheConfigBuilder.withStatisticsCacheSecurityUsersOverride(max, maxAge);
  }

  /*
  CONNECT
   */
  setConnectSecurityCookie(name: string, domain: string): void {
    this.#connectConfigBuilder.withSecurityCookieDomain(domain).withSecurityCookieName(name);
  }

  /***
   * Can be invoked multiple times to add more than 1 exclusion
   * @param exclusion
   */
  setConnectSecurityExclusion(exclusion: string): void {
    this.#connectConfigBuilder.withSecurityExclusion(exclusion);
  }

  setConnectSecurityForbiddenResponsePath(path: string): void {
    this.#connectConfigBuilder.withSecurityForbiddenResponsePath(path);
  }

  setConnectSecurityUnauthorizedResponsePath(path: string): void {
    this.#connectConfigBuilder.withSecurityUnauthorizedResponsePath(path);
  }

  /*
  DATA
   */

  /***
   * Adds a new datastore - can be invoked multiple times, if more than one datastore is to be configured.
   * @param name
   * @param provider
   * @param isDefault
   * @param isFsync
   * @param dbFile
   * @param fileName
   */
  setDataStore(
    name: string,
    provider: string,
    isDefault: boolean,
    isFsync: boolean,
    dbFile: string,
    fileName: string
  ): void {
    this.#dataConfigBuilder.withDataStore(name, provider, isDefault, isFsync, dbFile, fileName);
  }

  setDataIsSecure(isSecure: boolean): void {
    this.#dataConfigBuilder.withSecure(isSecure);
  }

  /*
  HEALTH - happn-cluster specific
   */

  setHealthInterval(interval: number): void {
    this.#healthConfigBuilder.withHealthInterval(interval);
  }

  setHealthWarmupLimit(limit: number): void {
    this.#healthConfigBuilder.withHealthWarmupLimit(limit);
  }

  /*
  MEMBERSHIP - happn-cluster specific
   */

  setMembershipClusterName(name: string): void {
    this.#membershipConfigBuilder.withMembershipClusterName(name);
  }

  setMembershipDisseminationFactor(factor: number): void {
    this.#membershipConfigBuilder.withMembershipDisseminationFactor(factor);
  }

  setMembershipHost(host: string, port: number): void {
    this.#membershipConfigBuilder.withMembershipHost(host);
    this.#membershipConfigBuilder.withMembershipPort(port);
  }

  setMembershipJoinTimeout(timeout: number): void {
    this.#membershipConfigBuilder.withMembershipJoinTimeout(timeout);
  }

  setMembershipJoinType(type: string): void {
    this.#membershipConfigBuilder.withMembershipJoinType(type);
  }

  setMembershipMemberHost(host: string): void {
    this.#membershipConfigBuilder.withMembershipMemberHost(host);
  }

  setMembershipPing(
    interval: number,
    pingTimeout?: number,
    requestTimeout?: number,
    requestGroupSize?: number
  ): void {
    this.#membershipConfigBuilder.withMembershipPingInterval(interval);
    if (pingTimeout !== undefined)
      this.#membershipConfigBuilder.withMembershipPingTimeout(pingTimeout);
    if (requestTimeout !== undefined)
      this.#membershipConfigBuilder.withMembershipPingReqTimeout(requestTimeout);
    if (requestGroupSize !== undefined)
      this.#membershipConfigBuilder.withMembershipPingReqGroupSize(requestGroupSize);
  }

  setMembershipRandomWait(wait: number): void {
    this.#membershipConfigBuilder.withMembershipRandomWait(wait);
  }

  setMembershipIsSeed(isSeed: boolean): void {
    this.#membershipConfigBuilder.withMembershipIsSeed(isSeed);
  }

  setMembershipSeedWait(wait: boolean): void {
    this.#membershipConfigBuilder.withMembershipSeedWait(wait);
  }

  setMembershipUdpMaxDgramSize(size: boolean): void {
    this.#membershipConfigBuilder.withMembershipUdpMaxDgramSize(size);
  }

  /*
  ORCHESTRATOR - happn-cluster specific
   */

  setOrchestratorMinimumPeers(minimum: number): void {
    this.#orchestratorConfigBuilder.withOrchestratorMinimumPeers(minimum);
  }

  setOrchestratorReplicatePath(path: string): void {
    this.#orchestratorConfigBuilder.withOrchestratorReplicatePath(path);
  }

  setOrchestratorStableReportInterval(interval: string): void {
    this.#orchestratorConfigBuilder.withOrchestratorStableReportInterval(interval);
  }

  setOrchestratorStabiliseTimeout(timeout: string): void {
    this.#orchestratorConfigBuilder.withOrchestratorStabiliseTimeout(timeout);
  }

  /*
  PROTOCOLS
   */

  setProtocolAllowNestedPermissions(isAllowed: boolean): void {
    this.#protocolConfigBuilder.withAllowNestedPermissions(isAllowed);
  }

  setProtocolInboundLayer(layer: Function): void {
    this.#protocolConfigBuilder.withInboundLayer(layer);
  }

  setProtocolIsSecure(isSecure: boolean): void {
    this.#protocolConfigBuilder.withSecure(isSecure);
  }

  setProtocolOutboundLayer(layer: Function): void {
    this.#protocolConfigBuilder.withOutboundLayer(layer);
  }

  /*
  PROXY - happn-cluster specific
   */

  setProxyAllowSelfSignedCerts(allow: boolean): void {
    this.#proxyConfigBuilder.withProxyAllowSelfSignedCerts(allow);
  }

  setProxyCertPath(path: string): void {
    this.#proxyConfigBuilder.withProxyCertPath(path);
  }

  setProxyHost(host: string, port: number): void {
    this.#proxyConfigBuilder.withProxyHost(host);
    this.#proxyConfigBuilder.withProxyPort(port);
  }

  setProxyKeyPath(path: string): void {
    this.#proxyConfigBuilder.withProxyKeyPath(path);
  }

  setProxyTimeout(timeout: number): void {
    this.#proxyConfigBuilder.withProxyTimeout(timeout);
  }

  /*
  PUBLISHER
   */

  setPublisherAcknowledgeTimeout(acknowledge: boolean): void {
    this.#publisherConfigBuilder.withAcknowledgeTimeout(acknowledge);
  }

  setPublisherTimeout(timeout: number): void {
    this.#publisherConfigBuilder.withTimeout(timeout);
  }

  /*
  REPLICATOR - happn-cluster specific
   */

  setReplicatorSecurityChangeSetReplicateInterval(interval: number): void {
    this.#replicatorConfigBuilder.withReplicatorSecurityChangeSetReplicateInterval(interval);
  }

  /*
  SECURITY
   */

  setSecurityActivateSessionManagement(activate: boolean): void {
    this.#securityConfigBuilder.withActivateSessionManagement(activate);
  }

  setSecurityAccountLockoutEnabled(enabled: boolean): void {
    this.#securityConfigBuilder.withAccountLockoutEnabled(enabled);
  }

  setSecurityAccountLockoutAttempts(attempts: number): void {
    this.#securityConfigBuilder.withAccountLockoutAttempts(attempts);
  }

  setSecurityAccountLockoutRetryInterval(retryInterval: number): void {
    this.#securityConfigBuilder.withAccountLockoutRetryInterval(retryInterval);
  }

  setSecurityAdminUsername(username: string): void {
    this.#securityConfigBuilder.withAdminUsername(username);
  }

  setSecurityAdminPassword(password: string): void {
    this.#securityConfigBuilder.withAdminPassword(password);
  }

  setSecurityAdminPublicKey(publicKey: string): void {
    this.#securityConfigBuilder.withAdminPublicKey(publicKey);
  }

  setSecurityAdminGroupName(groupName: string): void {
    this.#securityConfigBuilder.withAdminGroupName(groupName);
  }

  // repeatable using same key and different path
  setSecurityAdminGroupPermission(permissionKey: string, actionPath: string): void {
    this.#securityConfigBuilder.withAdminGroupPermission(permissionKey, actionPath);
  }

  setSecurityAllowAnonymousAccess(allowAnonymous: boolean): void {
    this.#securityConfigBuilder.withAllowAnonymousAccess(allowAnonymous);
  }

  setSecurityAuditPath(path: string): void {
    this.#securityConfigBuilder.withAuditPath(path);
  }

  setSecurityAuthProvider(name: string, instance: any): void {
    this.#securityConfigBuilder.withAuthProvider(name, instance);
  }

  setSecurityCookie(name: string, domain: string, cookie: string): void {
    this.#securityConfigBuilder.withHttpsCookie(name, domain, cookie);
  }

  setSecurityLogSessionActivity(shouldLog: boolean): void {
    this.#securityConfigBuilder.withLogSessionActivity(shouldLog);
  }

  setSecurityLockTokenToLoginType(shouldLock: boolean): void {
    this.#securityConfigBuilder.withLockTokenToLoginType(shouldLock);
  }

  setSecurityLockTokenToUserId(shouldLock: boolean): void {
    this.#securityConfigBuilder.withLockTokenToUserId(shouldLock);
  }

  //TODO: lookups

  setSecurityPbkdf2Iterations(iterations: number): void {
    this.#securityConfigBuilder.withPbkdf2Iterations(iterations);
  }

  setSecurityProfile(
    name: string,
    sessionKey: string,
    sessionMatchOn: any,
    policyTTL: number,
    policyInactiveThreshold: number
  ): void {
    this.#securityConfigBuilder.withProfile(
      name,
      sessionKey,
      sessionMatchOn,
      policyTTL,
      policyInactiveThreshold
    );
  }

  setSecurityIsSecure(isSecure: boolean): void {
    this.#securityConfigBuilder.withSecure(isSecure);
  }

  setSessionActivityTTL(ttl: number): void {
    this.#securityConfigBuilder.withSessionActivityTTL(ttl);
  }

  setSessionTokenSecret(secret: string): void {
    this.#securityConfigBuilder.withSessionTokenSecret(secret);
  }

  /*
  SUBSCRIPTION
   */
  setSubscriptionAllowNestedPermissions(shouldAllow: boolean): void {
    this.#subscriptionConfigBuilder.withAllowNestedPermissions(shouldAllow);
  }

  setSubscriptionTreeSearchCacheSize(size: number): void {
    this.#subscriptionConfigBuilder.withSubscriptionTreeSearchCacheSize(size);
  }

  setSubscriptionTreePermutationCacheSize(size: number): void {
    this.#subscriptionConfigBuilder.withSubscriptionTreePermutationCacheSize(size);
  }

  setSubscriptionTreeTimeout(timeout: number): void {
    this.#subscriptionConfigBuilder.withSubscriptionTreeTimeout(timeout);
  }

  setSubscriptionTreeFilterFunction(func: Function): void {
    this.#subscriptionConfigBuilder.withSubscriptionTreeFilterFunc(func);
  }

  /*
  SYSTEM
   */

  setSystemName(name: string): void {
    this.#systemConfigBuilder.withName(name);
  }

  /*
  TRANSPORT
   */

  setTransportCert(cert: string): void {
    this.#transportConfigBuilder.withCert(cert);
  }

  setTransportCertPath(certPath: string): void {
    this.#transportConfigBuilder.withCertPath(certPath);
  }

  setTransportKeepAliveTimout(timeout: number): void {
    this.#transportConfigBuilder.withKeepAliveTimeout(timeout);
  }

  setTransportKey(key: string): void {
    this.#transportConfigBuilder.withKey(key);
  }

  setTransportKeyPath(keyPath: string): void {
    this.#transportConfigBuilder.withKeyPath(keyPath);
  }

  setTransportMode(mode: string): void {
    this.#transportConfigBuilder.withMode(mode);
  }

  /*
  HAPPN
   */

  buildHappnConfig() {
    return this.#happnConfigBuilder
      .withCacheConfigBuilder(this.#cacheConfigBuilder)
      .withConnectConfigBuilder(this.#connectConfigBuilder)
      .withDataConfigBuilder(this.#dataConfigBuilder)
      .withProtocolConfigBuilder(this.#protocolConfigBuilder)
      .withPublisherConfigBuilder(this.#publisherConfigBuilder)
      .withSecurityConfigBuilder(this.#securityConfigBuilder)
      .withSubscriptionConfigBuilder(this.#subscriptionConfigBuilder)
      .withSystemConfigBuilder(this.#systemConfigBuilder)
      .withTransportConfigBuilder(this.#transportConfigBuilder)
      .build();
  }
}
