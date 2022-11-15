const BaseBuilder = require('happn-commons/lib/base-builder');

import { CacheConfigBuilder } from '../happn/services/cache-config-builder';
import { ConnectConfigBuilder } from '../happn/services/connect-config-builder';
import { DataConfigBuilder } from '../happn/services/data-config-builder';
import { ProtocolConfigBuilder } from '../happn/services/protocol-config-builder';
import { PublisherConfigBuilder } from '../happn/services/publisher-config-builder';
import { SecurityConfigBuilder } from '../happn/services/security-config-builder';
import { SubscriptionConfigBuilder } from '../happn/services/subscription-config-builder';
import { SystemConfigBuilder } from '../happn/services/system-config-builder';
import { TransportConfigBuilder } from '../happn/services/transport-config-builder';

import { HappnConfigurationBuilder } from '../happn/happn-configuration-builder';
import { ComponentsConfigBuilder } from './components/components-config-builder';
import { EndpointsConfigBuilder } from './endpoints/endpoints-config-builder';
import { ModulesConfigBuilder } from './modules/modules-config-builder';

export class HappnerConfigurationBuilder extends HappnConfigurationBuilder {
  #componentsConfigBuilder: ComponentsConfigBuilder;
  #endpointsConfigBuilder: EndpointsConfigBuilder;
  #modulesConfigBuilder: ModulesConfigBuilder;

  constructor(
    cacheConfigBuilder: CacheConfigBuilder,
    connectConfigBuilder: ConnectConfigBuilder,
    dataConfigBuilder: DataConfigBuilder,
    protocolConfigBuilder: ProtocolConfigBuilder,
    publisherConfigBuilder: PublisherConfigBuilder,
    securityConfigBuilder: SecurityConfigBuilder,
    subscriptionConfigBuilder: SubscriptionConfigBuilder,
    systemConfigBuilder: SystemConfigBuilder,
    transportConfigBuilder: TransportConfigBuilder,
    componentsConfigBuilder: ComponentsConfigBuilder,
    endpointsConfigBuilder: EndpointsConfigBuilder,
    modulesConfigBuilder: ModulesConfigBuilder
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
    this.#componentsConfigBuilder = componentsConfigBuilder;
    this.#endpointsConfigBuilder = endpointsConfigBuilder;
    this.#modulesConfigBuilder = modulesConfigBuilder;
  }

  withName(name: string): HappnerConfigurationBuilder {
    this.set('name', name, super.Types.STRING);
    return this;
  }

  withDeferListen(defer: boolean): HappnerConfigurationBuilder {
    this.set('deferListen', defer, super.Types.BOOLEAN);
    return this;
  }

  withListenFirst(listenFirst: boolean): HappnerConfigurationBuilder {
    this.set('listenFirst', listenFirst, super.Types.BOOLEAN);
    return this;
  }

  beginComponent() {
    return this.#componentsConfigBuilder.beginComponent();
  }

  build() {
    const happnConfig = super.build();

    const happnerBuilder = new BaseBuilder();
    happnerBuilder.set('endpoints', this.#endpointsConfigBuilder, BaseBuilder.Types.OBJECT);
    happnerBuilder.set('modules', this.#modulesConfigBuilder, BaseBuilder.Types.OBJECT);
    happnerBuilder.set('components', this.#componentsConfigBuilder, BaseBuilder.Types.OBJECT);
    const happnerConfig = happnerBuilder.build();

    return { happn: happnConfig, ...happnerConfig };
  }
}
