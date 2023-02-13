import { IHappnClusterConfigurationBuilderV2 } from '../builders/interfaces/i-happn-cluster-configuration-builder-v2';
import { IHappnClusterConfigurationBuilder } from '../builders/interfaces/i-happn-cluster-configuration-builder';
import { IHappnConfigurationBuilder } from '../builders/interfaces/i-happn-configuration-builder';
import { IHappnerConfigurationBuilder } from '../builders/interfaces/i-happner-configuration-builder';
import { IHappnerClusterConfigurationBuilder } from '../builders/interfaces/i-happner-cluster-configuration-builder';

export type VersionedHappnBuilder<T extends string> = T extends
  | `1.${string}.${string}`
  | `2.${string}.${string}`
  | `3.${string}.${string}`
  | `4.${string}.${string}`
  | `5.${string}.${string}`
  | `6.${string}.${string}`
  | `7.${string}.${string}`
  | `8.${string}.${string}`
  | `9.${string}.${string}`
  | `10.${string}.${string}`
  | `11.${string}.${string}`
  ? IHappnConfigurationBuilder
  : IHappnConfigurationBuilder;

export type VersionedHappnClusterBuilder<T extends string> = T extends
  | `12.${string}.${string}`
  | `13.${string}.${string}`
  | `14.${string}.${string}`
  ? IHappnClusterConfigurationBuilderV2
  : T extends
      | `1.${string}.${string}`
      | `2.${string}.${string}`
      | `3.${string}.${string}`
      | `4.${string}.${string}`
      | `5.${string}.${string}`
      | `6.${string}.${string}`
      | `7.${string}.${string}`
      | `8.${string}.${string}`
      | `9.${string}.${string}`
      | `10.${string}.${string}`
      | `11.${string}.${string}`
  ? IHappnClusterConfigurationBuilder
  : IHappnClusterConfigurationBuilderV2;

export type VersionedHappnerBuilder<T extends string> = T extends
  | `12.${string}.${string}`
  | `13.${string}.${string}`
  | `14.${string}.${string}`
  | `1.${string}.${string}`
  | `2.${string}.${string}`
  | `3.${string}.${string}`
  | `4.${string}.${string}`
  | `5.${string}.${string}`
  | `6.${string}.${string}`
  | `7.${string}.${string}`
  | `8.${string}.${string}`
  | `9.${string}.${string}`
  | `10.${string}.${string}`
  | `11.${string}.${string}`
  ? IHappnerConfigurationBuilder
  : IHappnerConfigurationBuilder;

export type VersionedHappnerClusterBuilder<T extends string> = T extends
  | `12.${string}.${string}`
  | `13.${string}.${string}`
  | `14.${string}.${string}`
  | `1.${string}.${string}`
  | `2.${string}.${string}`
  | `3.${string}.${string}`
  | `4.${string}.${string}`
  | `5.${string}.${string}`
  | `6.${string}.${string}`
  | `7.${string}.${string}`
  | `8.${string}.${string}`
  | `9.${string}.${string}`
  | `10.${string}.${string}`
  | `11.${string}.${string}`
  ? IHappnerClusterConfigurationBuilder
  : IHappnerClusterConfigurationBuilder;

// check this out: https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c

/*
TYPES FOR VERSION INFERENCE
 */

// export type InferHappnVersion<T> = T extends {
//   happn: infer A;
//   happnCluster?: never;
//   happner?: never;
//   happnerCluster?: never;
// }
//   ? A
//   : null;
//
// type InferHappnClusterVersion<T> = T extends {
//   happn: string;
//   happnCluster: infer A;
//   happner?: never;
//   happnerCluster?: never;
// }
//   ? A
//   : null;
//
// type InferHappnerVersion<T> = T extends {
//   happn: string;
//   happnCluster?: never;
//   happner: infer A;
//   happnerCluster?: never;
// }
//   ? A
//   : null;
//
// type InferHappnerClusterVersion<T> = T extends {
//   happn: string;
//   happnCluster: string;
//   happner: string;
//   happnerCluster: infer A;
// }
//   ? A
//   : null;

// type HappnVersion = InferHappnVersion<{ happn: '1.0.0' }>;
// type HappnClusterVersion = InferHappnClusterVersion<{ happn: '1.0.0'; happnCluster: '2.0.1' }>;
// type HappnerVersion = InferHappnerVersion<{ happn: '1.0.0'; happner: '3.0.1' }>;
// type HappnerClusterVersion = InferHappnerClusterVersion<{
//   happn: '1.0.0';
//   happnCluster: '1.2.3';
//   happner: '3.0.1';
//   happnerCluster: '3.2.1';
// }>;
