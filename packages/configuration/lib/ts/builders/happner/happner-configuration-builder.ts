const BaseBuilder = require('happn-commons/lib/base-builder');

import { CacheConfigBuilder } from '../happn/services/cache-config-builder.js';
import { ConnectConfigBuilder } from '../happn/services/connect-config-builder.js';
import { DataConfigBuilder } from '../happn/services/data-config-builder.js';
import { ProtocolConfigBuilder } from '../happn/services/protocol-config-builder.js';
import { PublisherConfigBuilder } from '../happn/services/publisher-config-builder.js';
import { SecurityConfigBuilder } from '../happn/services/security-config-builder.js';
import { SubscriptionConfigBuilder } from '../happn/services/subscription-config-builder.js';
import { SystemConfigBuilder } from '../happn/services/system-config-builder.js';
import { TransportConfigBuilder } from '../happn/services/transport-config-builder.js';

import { HappnConfigurationBuilder } from '../happn/happn-configuration-builder.js';
import { ComponentsConfigBuilder } from './components/components-config-builder.js';
import { EndpointsConfigBuilder } from './endpoints/endpoints-config-builder.js';
import { ModulesConfigBuilder } from './modules/modules-config-builder.js';

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
