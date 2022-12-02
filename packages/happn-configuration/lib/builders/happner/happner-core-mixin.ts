/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/no-explicit-any */
const BaseBuilder = require('happn-commons/lib/base-builder');
import { Constructor } from '../../types/mixin-types';
import { IHappnerConfigurationBuilder } from '../interfaces/i-happner-configuration-builder';
import { ComponentsConfigBuilder } from './components/components-config-builder';
import { EndpointsConfigBuilder } from './endpoints/endpoints-config-builder';
import { ModulesConfigBuilder } from './modules/modules-config-builder';

export function HappnerCoreBuilder<TBase extends Constructor>(Base: TBase) {
  return class HappnerConfigurationBuilder extends Base implements IHappnerConfigurationBuilder {
    #componentsConfigBuilder: ComponentsConfigBuilder;
    #endpointsConfigBuilder: EndpointsConfigBuilder;
    #modulesConfigBuilder: ModulesConfigBuilder;

    constructor(...args: any[]) {
      super(...args);

      const container = args[0];

      this.#componentsConfigBuilder = container.componentsConfigBuilder;
      this.#endpointsConfigBuilder = container.endpointsConfigBuilder;
      this.#modulesConfigBuilder = container.modulesConfigBuilder;

      this.set('endpoints', this.#endpointsConfigBuilder, BaseBuilder.Types.OBJECT);
      this.set('modules', this.#modulesConfigBuilder, BaseBuilder.Types.OBJECT);
      this.set('components', this.#componentsConfigBuilder, BaseBuilder.Types.OBJECT);
    }

    withDeferListen(defer: boolean) {
      this.set('deferListen', defer, BaseBuilder.Types.BOOLEAN);
      return this;
    }

    withListenFirst(listenFirst: boolean) {
      this.set('listenFirst', listenFirst, BaseBuilder.Types.BOOLEAN);
      return this;
    }

    beginComponent() {
      return this.#componentsConfigBuilder.beginComponent();
    }

    beginEndpoint() {
      return this.#endpointsConfigBuilder.beginEndpoint();
    }

    beginModule() {
      return this.#modulesConfigBuilder.beginModule();
    }
  };
}
