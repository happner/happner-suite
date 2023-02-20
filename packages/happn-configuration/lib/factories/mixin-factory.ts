import Constants from '../constants/builder-constants';
import { HappnCoreBuilder } from '../builders/happn/happn-core-mixin';
import { CoreBuilder } from '../builders/core-builder';
import { HappnClusterCoreBuilder } from '../builders/happn-cluster/happn-cluster-core-mixin';
import { HappnerCoreBuilder } from '../builders/happner/happner-core-mixin';
import { HappnerClusterCoreBuilder } from '../builders/happner-cluster/happner-cluster-core-mixin';

export class MixinFactory {
  getMixin(type: string) {
    switch (type) {
      case Constants.HAPPN:
        return HappnCoreBuilder(CoreBuilder);
      case Constants.HAPPN_CLUSTER:
        return HappnClusterCoreBuilder(HappnCoreBuilder(CoreBuilder));
      case Constants.HAPPNER:
        return HappnerCoreBuilder(HappnCoreBuilder(CoreBuilder));
      case Constants.HAPPNER_CLUSTER:
        return HappnerClusterCoreBuilder(
          HappnClusterCoreBuilder(HappnerCoreBuilder(HappnCoreBuilder(CoreBuilder)))
        );
      default:
        throw new Error('unknown type');
    }
  }
}
