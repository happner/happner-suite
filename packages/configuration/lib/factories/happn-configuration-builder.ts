import HappnConfigBuilder from '../builders/happn-config-builder';
import CacheConfigBuilder from '../builders/services/cache-config-builder';
import ConnectConfigBuilder from '../builders/services/connect-config-builder';
import DataConfigBuilder from '../builders/services/data-config-builder';
import ProtocolConfigBuilder from '../builders/services/protocol-config-builder';
import PublisherConfigBuilder from '../builders/services/publisher-config-builder';
import SecurityConfigBuilder from '../builders/services/security-config-builder';
import SubscriptionConfigBuilder from '../builders/services/subscription-config-builder';
import SystemConfigBuilder from '../builders/services/system-config-builder';
import TransportConfigBuilder from '../builders/services/transport-config-builder';

export class HappnConfigurationBuilder {
  #happnConfigBuilder: HappnConfigBuilder;
  #cacheConfigBuilder: CacheConfigBuilder;
  #connectConfigBuilder: ConnectConfigBuilder;
  #dataConfigBuilder: DataConfigBuilder;
  #protocolConfigBuilder: ProtocolConfigBuilder;
  #publisherConfigBuilder: PublisherConfigBuilder;
  #securityConfigBuilder: SecurityConfigBuilder;
  #subscriptionConfigBuilder: SubscriptionConfigBuilder;
  #systemConfigBuilder: SystemConfigBuilder;
  #transportConfigBuilder: TransportConfigBuilder;

  constructor(
    happnConfigBuilder: HappnConfigBuilder,
    cacheConfigBuilder: CacheConfigBuilder,
    connectConfigBuilder: ConnectConfigBuilder,
    dataConfigBuilder: DataConfigBuilder,
    protocolConfigBuilder: ProtocolConfigBuilder,
    publisherConfigBuilder: PublisherConfigBuilder,
    securityConfigBuilder: SecurityConfigBuilder,
    subscriptionConfigBuilder: SubscriptionConfigBuilder,
    systemConfigBuilder: SystemConfigBuilder,
    transportConfigBuilder: TransportConfigBuilder
  ) {
    this.#happnConfigBuilder = happnConfigBuilder;
    this.#cacheConfigBuilder = cacheConfigBuilder;
    this.#connectConfigBuilder = connectConfigBuilder;
    this.#dataConfigBuilder = dataConfigBuilder;
    this.#protocolConfigBuilder = protocolConfigBuilder;
    this.#publisherConfigBuilder = publisherConfigBuilder;
    this.#securityConfigBuilder = securityConfigBuilder;
    this.#subscriptionConfigBuilder = subscriptionConfigBuilder;
    this.#systemConfigBuilder = systemConfigBuilder;
    this.#transportConfigBuilder = transportConfigBuilder;
  }

  /*
  CACHE
   */

  withCacheStatisticsCheckPointAuthOverride(
    max: number,
    maxAge: number
  ): HappnConfigurationBuilder {
    this.#cacheConfigBuilder.withStatisticsCheckoutPointCacheAuthOverride(max, maxAge);
    return this;
  }

  withCacheStatisticsCheckPointAuthTokenOverride(
    max: number,
    maxAge: number
  ): HappnConfigurationBuilder {
    this.#cacheConfigBuilder.withStatisticsCheckoutPointCacheAuthTokenOverride(max, maxAge);
    return this;
  }

  withCacheStatisticsInterval(interval: number): HappnConfigurationBuilder {
    this.#cacheConfigBuilder.withStatisticsInterval(interval);
    return this;
  }

  withCacheStatisticsSecurityGroupPermissionsOverride(
    max: number,
    maxAge: number
  ): HappnConfigurationBuilder {
    this.#cacheConfigBuilder.withStatisticsCacheSecurityGroupPermissionsOverride(max, maxAge);
    return this;
  }

  withCacheStatisticsSecurityGroupsOverride(
    max: number,
    maxAge: number
  ): HappnConfigurationBuilder {
    this.#cacheConfigBuilder.withStatisticsCacheSecurityGroupsOverride(max, maxAge);
    return this;
  }

  withCacheStatisticsSecurityPasswordsOverride(
    max: number,
    maxAge: number
  ): HappnConfigurationBuilder {
    this.#cacheConfigBuilder.withStatisticsCacheSecurityPasswordsOverride(max, maxAge);
    return this;
  }

  withCacheStatisticsSecurityUserPermissionsOverride(
    max: number,
    maxAge: number
  ): HappnConfigurationBuilder {
    this.#cacheConfigBuilder.withStatisticsCacheSecurityUserPermissionsOverride(max, maxAge);
    return this;
  }

  withCacheStatisticsSecurityUsersOverride(max: number, maxAge: number): HappnConfigurationBuilder {
    this.#cacheConfigBuilder.withStatisticsCacheSecurityUsersOverride(max, maxAge);
    return this;
  }

  /*
  CONNECT
   */
  withConnectSecurityCookie(name: string, domain: string): HappnConfigurationBuilder {
    this.#connectConfigBuilder.withSecurityCookieDomain(domain).withSecurityCookieName(name);
    return this;
  }

  /***
   * Can be invoked multiple times to add more than 1 exclusion
   * @param exclusion
   */
  withConnectSecurityExclusion(exclusion: string): HappnConfigurationBuilder {
    this.#connectConfigBuilder.withSecurityExclusion(exclusion);
    return this;
  }

  withConnectSecurityForbiddenResponsePath(path: string): HappnConfigurationBuilder {
    this.#connectConfigBuilder.withSecurityForbiddenResponsePath(path);
    return this;
  }

  withConnectSecurityUnauthorizedResponsePath(path: string): HappnConfigurationBuilder {
    this.#connectConfigBuilder.withSecurityUnauthorizedResponsePath(path);
    return this;
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
  withDataStore(
    name: string,
    provider: string,
    isDefault: boolean,
    isFsync: boolean,
    dbFile: string,
    fileName: string
  ): HappnConfigurationBuilder {
    this.#dataConfigBuilder.withDataStore(name, provider, isDefault, isFsync, dbFile, fileName);
    return this;
  }

  withDataIsSecure(isSecure: boolean): HappnConfigurationBuilder {
    this.#dataConfigBuilder.withSecure(isSecure);
    return this;
  }

  /*
  HEALTH - happn-cluster specific
   */

  // withHealthInterval(interval: number): HappnConfigurationBuilder {
  //   this.#healthConfigBuilder.withHealthInterval(interval);
  //   return this;
  // }
  //
  // withHealthWarmupLimit(limit: number): HappnConfigurationBuilder {
  //   this.#healthConfigBuilder.withHealthWarmupLimit(limit);
  //   return this;
  // }

  /*
  MEMBERSHIP - happn-cluster specific
   */

  // withMembershipClusterName(name: string): HappnConfigurationBuilder {
  //   this.#membershipConfigBuilder.withMembershipClusterName(name);
  //   return this;
  // }
  //
  // withMembershipDisseminationFactor(factor: number): HappnConfigurationBuilder {
  //   this.#membershipConfigBuilder.withMembershipDisseminationFactor(factor);
  //   return this;
  // }
  //
  // withMembershipHost(host: string, port: number): HappnConfigurationBuilder {
  //   this.#membershipConfigBuilder.withMembershipHost(host);
  //   this.#membershipConfigBuilder.withMembershipPort(port);
  //   return this;
  // }
  //
  // withMembershipJoinTimeout(timeout: number): HappnConfigurationBuilder {
  //   this.#membershipConfigBuilder.withMembershipJoinTimeout(timeout);
  //   return this;
  // }
  //
  // withMembershipJoinType(type: string): HappnConfigurationBuilder {
  //   this.#membershipConfigBuilder.withMembershipJoinType(type);
  //   return this;
  // }
  //
  // withMembershipMemberHost(host: string): HappnConfigurationBuilder {
  //   this.#membershipConfigBuilder.withMembershipMemberHost(host);
  //   return this;
  // }
  //
  // withMembershipPing(
  //   interval: number,
  //   pingTimeout?: number,
  //   requestTimeout?: number,
  //   requestGroupSize?: number
  // ): HappnConfigurationBuilder {
  //   this.#membershipConfigBuilder.withMembershipPingInterval(interval);
  //   if (pingTimeout !== undefined)
  //     this.#membershipConfigBuilder.withMembershipPingTimeout(pingTimeout);
  //   if (requestTimeout !== undefined)
  //     this.#membershipConfigBuilder.withMembershipPingReqTimeout(requestTimeout);
  //   if (requestGroupSize !== undefined)
  //     this.#membershipConfigBuilder.withMembershipPingReqGroupSize(requestGroupSize);
  //   return this;
  // }
  //
  // withMembershipRandomWait(wait: number): HappnConfigurationBuilder {
  //   this.#membershipConfigBuilder.withMembershipRandomWait(wait);
  //   return this;
  // }
  //
  // withMembershipIsSeed(isSeed: boolean): HappnConfigurationBuilder {
  //   this.#membershipConfigBuilder.withMembershipIsSeed(isSeed);
  //   return this;
  // }
  //
  // withMembershipSeedWait(wait: boolean): HappnConfigurationBuilder {
  //   this.#membershipConfigBuilder.withMembershipSeedWait(wait);
  //   return this;
  // }
  //
  // withMembershipUdpMaxDgramSize(size: boolean): HappnConfigurationBuilder {
  //   this.#membershipConfigBuilder.withMembershipUdpMaxDgramSize(size);
  //   return this;
  // }

  /*
  ORCHESTRATOR - happn-cluster specific
   */

  // withOrchestratorMinimumPeers(minimum: number): HappnConfigurationBuilder {
  //   this.#orchestratorConfigBuilder.withOrchestratorMinimumPeers(minimum);
  //   return this;
  // }
  //
  // withOrchestratorReplicatePath(path: string): HappnConfigurationBuilder {
  //   this.#orchestratorConfigBuilder.withOrchestratorReplicatePath(path);
  //   return this;
  // }
  //
  // withOrchestratorStableReportInterval(interval: string): HappnConfigurationBuilder {
  //   this.#orchestratorConfigBuilder.withOrchestratorStableReportInterval(interval);
  //   return this;
  // }
  //
  // withOrchestratorStabiliseTimeout(timeout: string): HappnConfigurationBuilder {
  //   this.#orchestratorConfigBuilder.withOrchestratorStabiliseTimeout(timeout);
  //   return this;
  // }

  /*
  PROTOCOLS
   */

  withProtocolAllowNestedPermissions(isAllowed: boolean): HappnConfigurationBuilder {
    this.#protocolConfigBuilder.withAllowNestedPermissions(isAllowed);
    return this;
  }

  withProtocolInboundLayer(layer: Function): HappnConfigurationBuilder {
    this.#protocolConfigBuilder.withInboundLayer(layer);
    return this;
  }

  withProtocolIsSecure(isSecure: boolean): HappnConfigurationBuilder {
    this.#protocolConfigBuilder.withSecure(isSecure);
    return this;
  }

  withProtocolOutboundLayer(layer: Function): HappnConfigurationBuilder {
    this.#protocolConfigBuilder.withOutboundLayer(layer);
    return this;
  }

  /*
  PROXY - happn-cluster specific
   */

  // withProxyAllowSelfSignedCerts(allow: boolean): HappnConfigurationBuilder {
  //   this.#proxyConfigBuilder.withProxyAllowSelfSignedCerts(allow);
  //   return this;
  // }
  //
  // withProxyCertPath(path: string): HappnConfigurationBuilder {
  //   this.#proxyConfigBuilder.withProxyCertPath(path);
  //   return this;
  // }
  //
  // withProxyHost(host: string, port: number): HappnConfigurationBuilder {
  //   this.#proxyConfigBuilder.withProxyHost(host);
  //   this.#proxyConfigBuilder.withProxyPort(port);
  //   return this;
  // }
  //
  // withProxyKeyPath(path: string): HappnConfigurationBuilder {
  //   this.#proxyConfigBuilder.withProxyKeyPath(path);
  //   return this;
  // }
  //
  // withProxyTimeout(timeout: number): HappnConfigurationBuilder {
  //   this.#proxyConfigBuilder.withProxyTimeout(timeout);
  //   return this;
  // }

  /*
  PUBLISHER
   */

  withPublisherAcknowledgeTimeout(acknowledge: boolean): HappnConfigurationBuilder {
    this.#publisherConfigBuilder.withAcknowledgeTimeout(acknowledge);
    return this;
  }

  withPublisherTimeout(timeout: number): HappnConfigurationBuilder {
    this.#publisherConfigBuilder.withTimeout(timeout);
    return this;
  }

  /*
  REPLICATOR - happn-cluster specific
   */

  // withReplicatorSecurityChangeSetReplicateInterval(interval: number): HappnConfigurationBuilder {
  //   this.#replicatorConfigBuilder.withReplicatorSecurityChangeSetReplicateInterval(interval);
  //   return this;
  // }

  /*
  SECURITY
   */

  withSecurityActivateSessionManagement(activate: boolean): HappnConfigurationBuilder {
    this.#securityConfigBuilder.withActivateSessionManagement(activate);
    return this;
  }

  withSecurityAccountLockoutEnabled(enabled: boolean): HappnConfigurationBuilder {
    this.#securityConfigBuilder.withAccountLockoutEnabled(enabled);
    return this;
  }

  withSecurityAccountLockoutAttempts(attempts: number): HappnConfigurationBuilder {
    this.#securityConfigBuilder.withAccountLockoutAttempts(attempts);
    return this;
  }

  withSecurityAccountLockoutRetryInterval(retryInterval: number): HappnConfigurationBuilder {
    this.#securityConfigBuilder.withAccountLockoutRetryInterval(retryInterval);
    return this;
  }

  withSecurityAdminUsername(username: string): HappnConfigurationBuilder {
    this.#securityConfigBuilder.withAdminUsername(username);
    return this;
  }

  withSecurityAdminPassword(password: string): HappnConfigurationBuilder {
    this.#securityConfigBuilder.withAdminPassword(password);
    return this;
  }

  withSecurityAdminPublicKey(publicKey: string): HappnConfigurationBuilder {
    this.#securityConfigBuilder.withAdminPublicKey(publicKey);
    return this;
  }

  withSecurityAdminGroupName(groupName: string): HappnConfigurationBuilder {
    this.#securityConfigBuilder.withAdminGroupName(groupName);
    return this;
  }

  // repeatable using same key and different path
  withSecurityAdminGroupPermission(
    permissionKey: string,
    actionPath: string
  ): HappnConfigurationBuilder {
    this.#securityConfigBuilder.withAdminGroupPermission(permissionKey, actionPath);
    return this;
  }

  withSecurityAllowAnonymousAccess(allowAnonymous: boolean): HappnConfigurationBuilder {
    this.#securityConfigBuilder.withAllowAnonymousAccess(allowAnonymous);
    return this;
  }

  withSecurityAuditPath(path: string): HappnConfigurationBuilder {
    this.#securityConfigBuilder.withAuditPath(path);
    return this;
  }

  withSecurityAuthProvider(name: string, instance: any): HappnConfigurationBuilder {
    this.#securityConfigBuilder.withAuthProvider(name, instance);
    return this;
  }

  withSecurityCookie(name: string, domain: string, cookie: string): HappnConfigurationBuilder {
    this.#securityConfigBuilder.withHttpsCookie(name, domain, cookie);
    return this;
  }

  withSecurityLogSessionActivity(shouldLog: boolean): HappnConfigurationBuilder {
    this.#securityConfigBuilder.withLogSessionActivity(shouldLog);
    return this;
  }

  withSecurityLockTokenToLoginType(shouldLock: boolean): HappnConfigurationBuilder {
    this.#securityConfigBuilder.withLockTokenToLoginType(shouldLock);
    return this;
  }

  withSecurityLockTokenToUserId(shouldLock: boolean): HappnConfigurationBuilder {
    this.#securityConfigBuilder.withLockTokenToUserId(shouldLock);
    return this;
  }

  //TODO: lookups

  withSecurityPbkdf2Iterations(iterations: number): HappnConfigurationBuilder {
    this.#securityConfigBuilder.withPbkdf2Iterations(iterations);
    return this;
  }

  withSecurityProfile(
    name: string,
    sessionKey: string,
    sessionMatchOn: any,
    policyTTL: number,
    policyInactiveThreshold: number
  ): HappnConfigurationBuilder {
    this.#securityConfigBuilder.withProfile(
      name,
      sessionKey,
      sessionMatchOn,
      policyTTL,
      policyInactiveThreshold
    );
    return this;
  }

  withSecurityIsSecure(isSecure: boolean): HappnConfigurationBuilder {
    this.#securityConfigBuilder.withSecure(isSecure);
    return this;
  }

  withSessionActivityTTL(ttl: number): HappnConfigurationBuilder {
    this.#securityConfigBuilder.withSessionActivityTTL(ttl);
    return this;
  }

  withSessionTokenSecret(secret: string): HappnConfigurationBuilder {
    this.#securityConfigBuilder.withSessionTokenSecret(secret);
    return this;
  }

  /*
  SUBSCRIPTION
   */
  withSubscriptionAllowNestedPermissions(shouldAllow: boolean): HappnConfigurationBuilder {
    this.#subscriptionConfigBuilder.withAllowNestedPermissions(shouldAllow);
    return this;
  }

  withSubscriptionTreeSearchCacheSize(size: number): HappnConfigurationBuilder {
    this.#subscriptionConfigBuilder.withSubscriptionTreeSearchCacheSize(size);
    return this;
  }

  withSubscriptionTreePermutationCacheSize(size: number): HappnConfigurationBuilder {
    this.#subscriptionConfigBuilder.withSubscriptionTreePermutationCacheSize(size);
    return this;
  }

  withSubscriptionTreeTimeout(timeout: number): HappnConfigurationBuilder {
    this.#subscriptionConfigBuilder.withSubscriptionTreeTimeout(timeout);
    return this;
  }

  withSubscriptionTreeFilterFunction(func: Function): HappnConfigurationBuilder {
    this.#subscriptionConfigBuilder.withSubscriptionTreeFilterFunc(func);
    return this;
  }

  /*
  SYSTEM
   */

  withSystemName(name: string): HappnConfigurationBuilder {
    this.#systemConfigBuilder.withName(name);
    return this;
  }

  /*
  TRANSPORT
   */

  withTransportCert(cert: string): HappnConfigurationBuilder {
    this.#transportConfigBuilder.withCert(cert);
    return this;
  }

  withTransportCertPath(certPath: string): HappnConfigurationBuilder {
    this.#transportConfigBuilder.withCertPath(certPath);
    return this;
  }

  withTransportKeepAliveTimout(timeout: number): HappnConfigurationBuilder {
    this.#transportConfigBuilder.withKeepAliveTimeout(timeout);
    return this;
  }

  withTransportKey(key: string): HappnConfigurationBuilder {
    this.#transportConfigBuilder.withKey(key);
    return this;
  }

  withTransportKeyPath(keyPath: string): HappnConfigurationBuilder {
    this.#transportConfigBuilder.withKeyPath(keyPath);
    return this;
  }

  withTransportMode(mode: string): HappnConfigurationBuilder {
    this.#transportConfigBuilder.withMode(mode);
    return this;
  }

  /*
  HAPPN
   */

  build() {
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
