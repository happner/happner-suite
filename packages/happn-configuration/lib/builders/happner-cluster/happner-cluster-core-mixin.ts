/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/no-explicit-any */
const BaseBuilder = require('happn-commons/lib/base-builder');
import { Constructor } from '../../types/mixin-types';

export function HappnerClusterCoreBuilder<TBase extends Constructor>(Base: TBase) {
  return class HappnerClusterConfigurationBuilder extends Base {
    constructor(...args: any[]) {
      super(...args);
    }

    withClusterRequestTimeout(timeout: number): HappnerClusterConfigurationBuilder {
      this.set('cluster.requestTimeout', timeout, BaseBuilder.Types.NUMERIC);
      return this;
    }

    withClusterResponseTimeout(timeout: number) {
      this.set('cluster.responseTimeout', timeout, BaseBuilder.Types.NUMERIC);
      return this;
    }

    withDomain(domain: string) {
      this.set('domain', domain, BaseBuilder.Types.STRING);
      return this;
    }
  };
}
