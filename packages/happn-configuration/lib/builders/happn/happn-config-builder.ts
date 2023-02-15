import BaseBuilder from 'happn-commons/lib/base-builder';
import { Constructor } from '../../types/mixin-types';
import constants from '../../constants/config-constants';
import BuilderConstants from '../../constants/builder-constants';

const SERVICES_ROOT = constants.HAPPN_SERVICES_ROOT;
const { HAPPN } = BuilderConstants;

export function HappnCoreBuilder<TBase extends Constructor>(Base: TBase) {
  return class HappnConfigBuilder extends Base {
    constructor(...args: any[]) {
      super(...args);
      const container = args[0];
      this.#initialiseChildBuilders(container);
    }

    /***
     * This function takes the container (which cascades through all constructors in the mixin chain)
     * and extracts the relevant child builders for this specific builder. It then exposes the child
     * builders as properties on this class, to enable dot-notation invocation.
     * @param container
     * @private
     */
    #initialiseChildBuilders(container) {
      const keys = Object.keys(container);

      keys.forEach((key) => {
        const parentType = container[key].parentType;
        const builderInstance = container[key].instance;

        if (parentType === HAPPN) {
          // set each child builder on the BaseBuilder
          this.set(
            `${SERVICES_ROOT}.${key.substring(0, key.indexOf('ConfigBuilder'))}`,
            builderInstance,
            BaseBuilder.Types.OBJECT
          );

          // dynamically expose each child builder - these will be accessible via dot-notation
          this[key] = builderInstance;
        }
      });
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
  };
}
