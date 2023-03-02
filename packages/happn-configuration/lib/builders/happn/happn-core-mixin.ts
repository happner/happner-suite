/* eslint-disable @typescript-eslint/ban-types,@typescript-eslint/no-var-requires,@typescript-eslint/no-explicit-any */
const BaseBuilder = require('happn-commons/lib/base-builder');
import { Constructor } from '../../types/mixin-types';
import { CacheConfigBuilder } from './services/cache-config-builder';
import { ConnectConfigBuilder } from './services/connect-config-builder';
import { DataConfigBuilder } from './services/data-config-builder';
import { ProtocolConfigBuilder } from './services/protocol-config-builder';
import { PublisherConfigBuilder } from './services/publisher-config-builder';
import { SecurityConfigBuilder } from './services/security-config-builder';
import { SubscriptionConfigBuilder } from './services/subscription-config-builder';
import { SystemConfigBuilder } from './services/system-config-builder';
import { TransportConfigBuilder } from './services/transport-config-builder';
import constants from '../../constants/config-constants';

const SERVICES_ROOT = constants.HAPPN_SERVICES_ROOT;

export function HappnCoreBuilder<TBase extends Constructor>(Base: TBase) {
  return class HappnBuilder extends Base {
    #cacheConfigBuilder: CacheConfigBuilder;
    #connectConfigBuilder: ConnectConfigBuilder;
    #dataConfigBuilder: DataConfigBuilder;
    #protocolConfigBuilder: ProtocolConfigBuilder;
    #publisherConfigBuilder: PublisherConfigBuilder;
    #securityConfigBuilder: SecurityConfigBuilder;
    #subscriptionConfigBuilder: SubscriptionConfigBuilder;
    #systemConfigBuilder: SystemConfigBuilder;
    #transportConfigBuilder: TransportConfigBuilder;

    constructor(...args: any[]) {
      super(...args);

      const container = args[0];

      this.#cacheConfigBuilder = container.cacheConfigBuilder;
      this.#connectConfigBuilder = container.connectConfigBuilder;
      this.#dataConfigBuilder = container.dataConfigBuilder;
      this.#protocolConfigBuilder = container.protocolConfigBuilder;
      this.#publisherConfigBuilder = container.publisherConfigBuilder;
      this.#securityConfigBuilder = container.securityConfigBuilder;
      this.#subscriptionConfigBuilder = container.subscriptionConfigBuilder;
      this.#systemConfigBuilder = container.systemConfigBuilder;
      this.#transportConfigBuilder = container.transportConfigBuilder;

      this.set(`${SERVICES_ROOT}.cache`, this.#cacheConfigBuilder, BaseBuilder.Types.OBJECT);
      this.set(`${SERVICES_ROOT}.connect`, this.#connectConfigBuilder, BaseBuilder.Types.OBJECT);
      this.set(`${SERVICES_ROOT}.data`, this.#dataConfigBuilder, BaseBuilder.Types.OBJECT);
      this.set(`${SERVICES_ROOT}.protocol`, this.#protocolConfigBuilder, BaseBuilder.Types.OBJECT);
      this.set(
        `${SERVICES_ROOT}.publisher`,
        this.#publisherConfigBuilder,
        BaseBuilder.Types.OBJECT
      );
      this.set(`${SERVICES_ROOT}.security`, this.#securityConfigBuilder, BaseBuilder.Types.OBJECT);
      this.set(
        `${SERVICES_ROOT}.subscription`,
        this.#subscriptionConfigBuilder,
        BaseBuilder.Types.OBJECT
      );
      this.set(`${SERVICES_ROOT}.system`, this.#systemConfigBuilder, BaseBuilder.Types.OBJECT);
      this.set(
        `${SERVICES_ROOT}.transport`,
        this.#transportConfigBuilder,
        BaseBuilder.Types.OBJECT
      );
    }

    build() {
      return super.build();
    }

    withName(name: string) {
      this.set(`happn.name`, name, BaseBuilder.Types.STRING);
      return this;
    }

    withHost(host: string) {
      this.set(`happn.host`, host, BaseBuilder.Types.STRING);
      return this;
    }

    withPort(port: number) {
      this.set(`happn.port`, port, BaseBuilder.Types.NUMERIC);
      return this;
    }

    withSecure(isSecure: boolean) {
      this.set(`happn.secure`, isSecure, BaseBuilder.Types.BOOLEAN);
      return this;
    }

    withAllowNestedPermissions(allow: boolean) {
      this.set(`happn.allowNestedPermissions`, allow, BaseBuilder.Types.BOOLEAN);
      return this;
    }

    /*
    CACHE
     */

    withCacheCheckPointAuthOverride(max: number, maxAge: number): HappnBuilder {
      this.#cacheConfigBuilder.withCheckoutPointCacheAuthOverride(max, maxAge);
      return this;
    }

    withCacheCheckPointAuthTokenOverride(max: number, maxAge: number): HappnBuilder {
      this.#cacheConfigBuilder.withCheckoutPointCacheAuthTokenOverride(max, maxAge);
      return this;
    }

    withCacheStatisticsInterval(interval: number): HappnBuilder {
      this.#cacheConfigBuilder.withStatisticsInterval(interval);
      return this;
    }

    withCacheSecurityGroupPermissionsOverride(max: number, maxAge: number): HappnBuilder {
      this.#cacheConfigBuilder.withCacheSecurityGroupPermissionsOverride(max, maxAge);
      return this;
    }

    withCacheSecurityGroupsOverride(max: number, maxAge: number): HappnBuilder {
      this.#cacheConfigBuilder.withCacheSecurityGroupsOverride(max, maxAge);
      return this;
    }

    withCacheSecurityPasswordsOverride(max: number, maxAge: number): HappnBuilder {
      this.#cacheConfigBuilder.withCacheSecurityPasswordsOverride(max, maxAge);
      return this;
    }

    withCacheSecurityUserPermissionsOverride(max: number, maxAge: number): HappnBuilder {
      this.#cacheConfigBuilder.withCacheSecurityUserPermissionsOverride(max, maxAge);
      return this;
    }

    withCacheSecurityUsersOverride(max: number, maxAge: number): HappnBuilder {
      this.#cacheConfigBuilder.withCacheSecurityUsersOverride(max, maxAge);
      return this;
    }

    /*
    CONNECT
     */

    /***
     * Can be invoked multiple times to add more than 1 exclusion
     * @param exclusion
     */
    withConnectSecurityExclusion(exclusion: string): HappnBuilder {
      this.#connectConfigBuilder.withSecurityExclusion(exclusion);
      return this;
    }

    withConnectSecurityForbiddenResponsePath(path: string): HappnBuilder {
      this.#connectConfigBuilder.withSecurityForbiddenResponsePath(path);
      return this;
    }

    withConnectSecurityUnauthorizedResponsePath(path: string): HappnBuilder {
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
    ): HappnBuilder {
      this.#dataConfigBuilder.withDataStore(name, provider, isDefault, isFsync, dbFile, fileName);
      return this;
    }

    withDataIsSecure(isSecure: boolean): HappnBuilder {
      this.#dataConfigBuilder.withSecure(isSecure);
      return this;
    }

    /*
    PROTOCOLS
     */

    withProtocolAllowNestedPermissions(isAllowed: boolean): HappnBuilder {
      this.#protocolConfigBuilder.withAllowNestedPermissions(isAllowed);
      return this;
    }

    withProtocolInboundLayer(layer: Function): HappnBuilder {
      this.#protocolConfigBuilder.withInboundLayer(layer);
      return this;
    }

    withProtocolIsSecure(isSecure: boolean): HappnBuilder {
      this.#protocolConfigBuilder.withSecure(isSecure);
      return this;
    }

    withProtocolOutboundLayer(layer: Function): HappnBuilder {
      this.#protocolConfigBuilder.withOutboundLayer(layer);
      return this;
    }

    /*
    PUBLISHER
     */

    withPublisherAcknowledgeTimeout(acknowledge: number): HappnBuilder {
      this.#publisherConfigBuilder.withAcknowledgeTimeout(acknowledge);
      return this;
    }

    withPublisherTimeout(timeout: number): HappnBuilder {
      this.#publisherConfigBuilder.withTimeout(timeout);
      return this;
    }

    /*
    SECURITY
     */

    withSecurityActivateSessionManagement(activate: boolean): HappnBuilder {
      this.#securityConfigBuilder.withActivateSessionManagement(activate);
      return this;
    }

    withSecurityAccountLockoutEnabled(enabled: boolean): HappnBuilder {
      this.#securityConfigBuilder.withAccountLockoutEnabled(enabled);
      return this;
    }

    withSecurityAccountLockoutAttempts(attempts: number): HappnBuilder {
      this.#securityConfigBuilder.withAccountLockoutAttempts(attempts);
      return this;
    }

    withSecurityAccountLockoutRetryInterval(retryInterval: number): HappnBuilder {
      this.#securityConfigBuilder.withAccountLockoutRetryInterval(retryInterval);
      return this;
    }

    withSecurityAdminPassword(password: string): HappnBuilder {
      this.#securityConfigBuilder.withAdminPassword(password);
      return this;
    }

    withSecurityAdminPublicKey(publicKey: string): HappnBuilder {
      this.#securityConfigBuilder.withAdminPublicKey(publicKey);
      return this;
    }

    // repeatable using same key and different path
    withSecurityAdminGroupPermission(permissionKey: string, actionPath: string): HappnBuilder {
      this.#securityConfigBuilder.withAdminGroupPermission(permissionKey, actionPath);
      return this;
    }

    withSecurityAdminGroupCustomData(fieldName: string, fieldValue: string): HappnBuilder {
      this.#securityConfigBuilder.withAdminGroupCustomData(fieldName, fieldValue);
      return this;
    }

    withSecurityAllowAnonymousAccess(allowAnonymous: boolean): HappnBuilder {
      this.#securityConfigBuilder.withAllowAnonymousAccess(allowAnonymous);
      return this;
    }

    withSecurityAuthProvider(name: string, instance: any): HappnBuilder {
      this.#securityConfigBuilder.withAuthProvider(name, instance);
      return this;
    }

    withSecurityCookie(name: string, domain: string): HappnBuilder {
      this.#securityConfigBuilder.withHttpsCookie(name, domain, true);
      return this;
    }

    withSecurityLogSessionActivity(shouldLog: boolean): HappnBuilder {
      this.#securityConfigBuilder.withLogSessionActivity(shouldLog);
      return this;
    }

    withSecurityLockTokenToLoginType(shouldLock: boolean): HappnBuilder {
      this.#securityConfigBuilder.withLockTokenToLoginType(shouldLock);
      return this;
    }

    withSecurityLockTokenToUserId(shouldLock: boolean): HappnBuilder {
      this.#securityConfigBuilder.withLockTokenToUserId(shouldLock);
      return this;
    }

    //TODO: lookups

    withSecurityPbkdf2Iterations(iterations: number): HappnBuilder {
      this.#securityConfigBuilder.withPbkdf2Iterations(iterations);
      return this;
    }

    withSecurityProfile(
      name: string,
      sessionKey: string,
      sessionMatchOn: any,
      policyTTL: number,
      policyInactiveThreshold: number
    ): HappnBuilder {
      this.#securityConfigBuilder.withProfile(
        name,
        sessionKey,
        sessionMatchOn,
        policyTTL,
        policyInactiveThreshold
      );
      return this;
    }

    withSessionActivityTTL(ttl: number): HappnBuilder {
      this.#securityConfigBuilder.withSessionActivityTTL(ttl);
      return this;
    }

    withSessionTokenSecret(secret: string): HappnBuilder {
      this.#securityConfigBuilder.withSessionTokenSecret(secret);
      return this;
    }

    /*
    SUBSCRIPTION
     */
    withSubscriptionAllowNestedPermissions(shouldAllow: boolean): HappnBuilder {
      this.#subscriptionConfigBuilder.withAllowNestedPermissions(shouldAllow);
      return this;
    }

    withSubscriptionTreeSearchCacheSize(size: number): HappnBuilder {
      this.#subscriptionConfigBuilder.withSubscriptionTreeSearchCacheSize(size);
      return this;
    }

    withSubscriptionTreePermutationCacheSize(size: number): HappnBuilder {
      this.#subscriptionConfigBuilder.withSubscriptionTreePermutationCacheSize(size);
      return this;
    }

    withSubscriptionTreeTimeout(timeout: number): HappnBuilder {
      this.#subscriptionConfigBuilder.withSubscriptionTreeTimeout(timeout);
      return this;
    }

    withSubscriptionTreeFilterFunction(func: Function): HappnBuilder {
      this.#subscriptionConfigBuilder.withSubscriptionTreeFilterFunc(func);
      return this;
    }

    /*
    SYSTEM
     */

    withSystemName(name: string): HappnBuilder {
      this.#systemConfigBuilder.withName(name);
      return this;
    }

    /*
    TRANSPORT
     */

    withTransportCert(cert: string): HappnBuilder {
      this.#transportConfigBuilder.withCert(cert);
      return this;
    }

    withTransportCertPath(certPath: string): HappnBuilder {
      this.#transportConfigBuilder.withCertPath(certPath);
      return this;
    }

    withTransportKeepAliveTimout(timeout: number): HappnBuilder {
      this.#transportConfigBuilder.withKeepAliveTimeout(timeout);
      return this;
    }

    withTransportKey(key: string): HappnBuilder {
      this.#transportConfigBuilder.withKey(key);
      return this;
    }

    withTransportKeyPath(keyPath: string): HappnBuilder {
      this.#transportConfigBuilder.withKeyPath(keyPath);
      return this;
    }

    withTransportMode(mode: string): HappnBuilder {
      this.#transportConfigBuilder.withMode(mode);
      return this;
    }
  };
}
