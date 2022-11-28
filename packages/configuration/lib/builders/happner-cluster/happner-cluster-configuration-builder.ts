/* eslint-disable @typescript-eslint/no-var-requires */
const BaseBuilder = require('happn-commons/lib/base-builder');

import { IHappnConfigurationBuilder } from '../interfaces/i-happn-configuration-builder';
import { IHappnClusterConfigurationBuilder } from '../interfaces/i-happn-cluster-configuration-builder';
import { IHappnerConfigurationBuilder } from '../interfaces/i-happner-configuration-builder';
import { IHappnerClusterConfigurationBuilder } from '../interfaces/i-happner-cluster-configuration-builder';
import { HappnConfigurationBuilder } from '../happn/happn-configuration-builder';
import { ComponentConfigBuilder } from '../happner/components/components-config-builder';
import { CacheConfigBuilder } from '../happn/services/cache-config-builder';
import { ConnectConfigBuilder } from '../happn/services/connect-config-builder';
import { DataConfigBuilder } from '../happn/services/data-config-builder';
import { ProtocolConfigBuilder } from '../happn/services/protocol-config-builder';
import { PublisherConfigBuilder } from '../happn/services/publisher-config-builder';
import { SecurityConfigBuilder } from '../happn/services/security-config-builder';
import { SubscriptionConfigBuilder } from '../happn/services/subscription-config-builder';
import { SystemConfigBuilder } from '../happn/services/system-config-builder';
import { TransportConfigBuilder } from '../happn/services/transport-config-builder';
import { HappnClusterCoreConfigurationBuilder } from '../happn-cluster/happn-cluster-core-configuration-builder';
import { HappnerCoreConfigurationBuilder } from '../happner/happner-core-configuration-builder';

export class HappnerClusterConfigurationBuilder
  extends HappnConfigurationBuilder
  implements
    IHappnConfigurationBuilder,
    IHappnClusterConfigurationBuilder,
    IHappnerConfigurationBuilder,
    IHappnerClusterConfigurationBuilder
{
  #happnClusterCoreBuilder: HappnClusterCoreConfigurationBuilder;
  #happnerCoreBuilder: HappnerCoreConfigurationBuilder;

  constructor(
    // happn
    cacheConfigBuilder: CacheConfigBuilder,
    connectConfigBuilder: ConnectConfigBuilder,
    dataConfigBuilder: DataConfigBuilder,
    protocolConfigBuilder: ProtocolConfigBuilder,
    publisherConfigBuilder: PublisherConfigBuilder,
    securityConfigBuilder: SecurityConfigBuilder,
    subscriptionConfigBuilder: SubscriptionConfigBuilder,
    systemConfigBuilder: SystemConfigBuilder,
    transportConfigBuilder: TransportConfigBuilder,
    // happn-cluster
    happnClusterCoreBuilder: HappnClusterCoreConfigurationBuilder,
    // happner
    happnerCoreBuilder: HappnerCoreConfigurationBuilder
  ) {
    super(
      cacheConfigBuilder,
      connectConfigBuilder,
      dataConfigBuilder,
      protocolConfigBuilder,
      publisherConfigBuilder,
      securityConfigBuilder,
      subscriptionConfigBuilder,
      systemConfigBuilder,
      transportConfigBuilder
    );
    this.#happnClusterCoreBuilder = happnClusterCoreBuilder;
    this.#happnerCoreBuilder = happnerCoreBuilder;
  }

  beginComponent(): ComponentConfigBuilder {
    return this.#happnerCoreBuilder.beginComponent();
  }

  withClusterRequestTimeout(timeout: number): HappnerClusterConfigurationBuilder {
    this.set('cluster.requestTimeout', timeout, BaseBuilder.Types.NUMERIC);
    return this;
  }

  withClusterResponseTimeout(timeout: number) {
    this.set('cluster.responseTimeout', timeout, BaseBuilder.Types.NUMERIC);
    return this;
  }

  withDeferListen(defer: boolean): HappnerClusterConfigurationBuilder {
    this.#happnerCoreBuilder.withDeferListen(defer);
    return this;
  }

  withDomain(domain: string) {
    this.set('domain', domain, BaseBuilder.Types.STRING);
    return this;
  }

  withHealthInterval(interval: number): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withHealthInterval(interval);
    return this;
  }

  withHealthWarmupLimit(limit: number): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withHealthWarmupLimit(limit);
    return this;
  }

  withListenFirst(listenFirst: boolean): HappnerClusterConfigurationBuilder {
    this.#happnerCoreBuilder.withListenFirst(listenFirst);
    return this;
  }

  withMembershipClusterName(name: string): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withMembershipClusterName(name);
    return this;
  }

  withMembershipDisseminationFactor(factor: number): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withMembershipDisseminationFactor(factor);
    return this;
  }

  withMembershipHost(host: string, port: number): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withMembershipHost(host, port);
    return this;
  }

  withMembershipIsSeed(isSeed: boolean): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withMembershipIsSeed(isSeed);
    return this;
  }

  withMembershipJoinTimeout(timeout: number): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withMembershipJoinTimeout(timeout);
    return this;
  }

  withMembershipJoinType(type: string): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withMembershipJoinType(type);
    return this;
  }

  withMembershipMemberHost(host: string): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withMembershipMemberHost(host);
    return this;
  }

  withMembershipPing(
    interval: number,
    pingTimeout?: number,
    requestTimeout?: number,
    requestGroupSize?: number
  ): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withMembershipPing(
      interval,
      pingTimeout,
      requestTimeout,
      requestGroupSize
    );
    return this;
  }

  withMembershipRandomWait(wait: number): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withMembershipRandomWait(wait);
    return this;
  }

  withMembershipSeedWait(wait: number): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withMembershipSeedWait(wait);
    return this;
  }

  withMembershipUdpMaxDgramSize(size: number): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withMembershipUdpMaxDgramSize(size);
    return this;
  }

  withName(name: string): HappnerClusterConfigurationBuilder {
    this.#happnerCoreBuilder.withName(name);
    return this;
  }

  withOrchestratorMinimumPeers(minimum: number): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withOrchestratorMinimumPeers(minimum);
    return this;
  }

  withOrchestratorReplicatePath(path: string): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withOrchestratorReplicatePath(path);
    return this;
  }

  withOrchestratorStabiliseTimeout(timeout: number): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withOrchestratorStabiliseTimeout(timeout);
    return this;
  }

  withOrchestratorStableReportInterval(interval: number): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withOrchestratorStableReportInterval(interval);
    return this;
  }

  withProxyAllowSelfSignedCerts(allow: boolean): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withProxyAllowSelfSignedCerts(allow);
    return this;
  }

  withProxyCertPath(path: string): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withProxyCertPath(path);
    return this;
  }

  withProxyHost(host: string, port: number): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withProxyHost(host, port);
    return this;
  }

  withProxyKeyPath(path: string): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withProxyKeyPath(path);
    return this;
  }

  withProxyTimeout(timeout: number): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withProxyTimeout(timeout);
    return this;
  }

  withReplicatorSecurityChangeSetReplicateInterval(
    interval: number
  ): HappnerClusterConfigurationBuilder {
    this.#happnClusterCoreBuilder.withReplicatorSecurityChangeSetReplicateInterval(interval);
    return this;
  }

  build() {
    const happnConfig = super.build();
    const happnClusterConfig = this.#happnClusterCoreBuilder.build();
    const happnerConfig = this.#happnerCoreBuilder.build();

    return { ...happnConfig, ...happnClusterConfig, ...happnerConfig };
  }
}
