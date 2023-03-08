import { IHappnClusterConfigurationBuilder } from '../builders/interfaces/i-happn-cluster-configuration-builder';
import { IHappnConfigurationBuilder } from '../builders/interfaces/i-happn-configuration-builder';
import { IHappnerConfigurationBuilder } from '../builders/interfaces/i-happner-configuration-builder';
import { IHappnerClusterConfigurationBuilder } from '../builders/interfaces/i-happner-cluster-configuration-builder';
export type VersionContext = {
    happn: string;
    happnCluster: string;
    happner: string;
    happnerCluster: string;
};
export type VersionedHappnBuilder<T extends string> = T extends `1.${string}.${string}` | `2.${string}.${string}` | `3.${string}.${string}` | `4.${string}.${string}` | `5.${string}.${string}` | `6.${string}.${string}` | `7.${string}.${string}` | `8.${string}.${string}` | `9.${string}.${string}` | `10.${string}.${string}` | `11.${string}.${string}` ? IHappnConfigurationBuilder : IHappnConfigurationBuilder;
export type VersionedHappnClusterBuilder<T extends string> = T extends `12.${string}.${string}` | `13.${string}.${string}` | `14.${string}.${string}` ? IHappnClusterConfigurationBuilder : T extends `1.${string}.${string}` | `2.${string}.${string}` | `3.${string}.${string}` | `4.${string}.${string}` | `5.${string}.${string}` | `6.${string}.${string}` | `7.${string}.${string}` | `8.${string}.${string}` | `9.${string}.${string}` | `10.${string}.${string}` | `11.${string}.${string}` ? IHappnClusterConfigurationBuilder : IHappnClusterConfigurationBuilder;
export type VersionedHappnerBuilder<T extends string> = T extends `12.${string}.${string}` | `13.${string}.${string}` | `14.${string}.${string}` | `1.${string}.${string}` | `2.${string}.${string}` | `3.${string}.${string}` | `4.${string}.${string}` | `5.${string}.${string}` | `6.${string}.${string}` | `7.${string}.${string}` | `8.${string}.${string}` | `9.${string}.${string}` | `10.${string}.${string}` | `11.${string}.${string}` ? IHappnerConfigurationBuilder : IHappnerConfigurationBuilder;
export type VersionedHappnerClusterBuilder<T extends string> = T extends `12.${string}.${string}` | `13.${string}.${string}` | `14.${string}.${string}` | `1.${string}.${string}` | `2.${string}.${string}` | `3.${string}.${string}` | `4.${string}.${string}` | `5.${string}.${string}` | `6.${string}.${string}` | `7.${string}.${string}` | `8.${string}.${string}` | `9.${string}.${string}` | `10.${string}.${string}` | `11.${string}.${string}` ? IHappnerClusterConfigurationBuilder : IHappnerClusterConfigurationBuilder;
