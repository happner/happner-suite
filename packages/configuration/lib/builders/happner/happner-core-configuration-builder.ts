/* eslint-disable @typescript-eslint/no-var-requires */
const BaseBuilder = require('happn-commons/lib/base-builder');

import { IHappnerConfigurationBuilder } from '../interfaces/i-happner-configuration-builder';
import { ComponentsConfigBuilder } from './components/components-config-builder';
import { EndpointsConfigBuilder } from './endpoints/endpoints-config-builder';
import { ModulesConfigBuilder } from './modules/modules-config-builder';

export class HappnerCoreConfigurationBuilder
  extends BaseBuilder
  implements IHappnerConfigurationBuilder {
  #componentsConfigBuilder: ComponentsConfigBuilder;
  #endpointsConfigBuilder: EndpointsConfigBuilder;
  #modulesConfigBuilder: ModulesConfigBuilder;

  constructor(
    componentsConfigBuilder: ComponentsConfigBuilder,
    endpointsConfigBuilder: EndpointsConfigBuilder,
    modulesConfigBuilder: ModulesConfigBuilder
  ) {
    super();
    this.#componentsConfigBuilder = componentsConfigBuilder;
    this.#endpointsConfigBuilder = endpointsConfigBuilder;
    this.#modulesConfigBuilder = modulesConfigBuilder;

    this.set('endpoints', this.#endpointsConfigBuilder, BaseBuilder.Types.OBJECT);
    this.set('modules', this.#modulesConfigBuilder, BaseBuilder.Types.OBJECT);
    this.set('components', this.#componentsConfigBuilder, BaseBuilder.Types.OBJECT);
  }

  withName(name: string): HappnerCoreConfigurationBuilder {
    this.set('name', name, BaseBuilder.Types.STRING);
    return this;
  }

  withDeferListen(defer: boolean): HappnerCoreConfigurationBuilder {
    this.set('deferListen', defer, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  withListenFirst(listenFirst: boolean): HappnerCoreConfigurationBuilder {
    this.set('listenFirst', listenFirst, BaseBuilder.Types.BOOLEAN);
    return this;
  }

  beginComponent() {
    return this.#componentsConfigBuilder.beginComponent();
  }

  build() {
    return super.build();
  }
}
