import { VersionUtil } from '../utils/version-util';
import BuilderConstants from '../constants/builder-constants';
import { FieldTypeValidator } from '../validators/field-type-validator';
import { CoreBuilder } from '../builders/core-builder';
import {
  VersionedHappnClusterBuilder,
  VersionedHappnBuilder,
  VersionedHappnerBuilder,
  VersionedHappnerClusterBuilder,
} from '../types/version-types';

import VersionConstants from '../constants/version-constants';

const { HAPPN, HAPPN_CLUSTER, HAPPNER, HAPPNER_CLUSTER } = BuilderConstants;

export class ConfigBuilderFactory {
  #versionUtil;
  #happnVersion;
  #happnClusterVersion;
  #happnerVersion;
  #happnerClusterVersion;

  constructor(versionContext) {
    this.#versionUtil = new VersionUtil();
    this.#happnVersion = versionContext.happn ?? '1.0.0';
    this.#happnClusterVersion = versionContext.happnCluster ?? '1.0.0';
    this.#happnerVersion = versionContext.happner ?? '1.0.0';
    this.#happnerClusterVersion = versionContext.happnerCluster ?? '1.0.0';
  }

  // see https://www.typescriptlang.org/docs/handbook/2/conditional-types.html

  getHappnBuilder<T extends string>(version?: T): VersionedHappnBuilder<T> {
    const HappnCoreBuilder = this.#versionUtil.findClosestModuleMatch(
      VersionConstants.VERSION_THRESHOLDS.HappnCore,
      this.#happnVersion
    );

    const container = this.createChildBuildersContainer();
    const HappnMixin = HappnCoreBuilder(CoreBuilder);
    const result = new HappnMixin(container);
    result.builderType = HAPPN;

    return result;
  }

  getHappnClusterBuilder<T extends string>(version?: T): VersionedHappnClusterBuilder<T> {
    const HappnCoreBuilder = this.#versionUtil.findClosestModuleMatch(
      VersionConstants.VERSION_THRESHOLDS.HappnCore,
      this.#happnVersion
    );

    const HappnClusterCoreBuilder = this.#versionUtil.findClosestModuleMatch(
      VersionConstants.VERSION_THRESHOLDS.HappnClusterCore,
      this.#happnClusterVersion
    );

    const container = this.createChildBuildersContainer();

    // create a mixin and instantiate
    const HappnClusterMixin = HappnCoreBuilder(HappnClusterCoreBuilder(CoreBuilder));
    const result = new HappnClusterMixin(container);

    result.builderType = HAPPN_CLUSTER;
    return result;
  }

  getHappnerBuilder<T extends string>(version?: T): VersionedHappnerBuilder<T> {
    const HappnCoreBuilder = this.#versionUtil.findClosestModuleMatch(
      VersionConstants.VERSION_THRESHOLDS.HappnCore,
      this.#happnVersion
    );

    const HappnerCoreBuilder = this.#versionUtil.findClosestModuleMatch(
      VersionConstants.VERSION_THRESHOLDS.HappnerCore,
      this.#happnerVersion
    );

    const container = this.createChildBuildersContainer();

    // create a mixin and instantiate
    const HappnerMixin = HappnCoreBuilder(HappnerCoreBuilder(CoreBuilder));
    const result = new HappnerMixin(container);

    result.builderType = HAPPNER;
    return result;
  }

  getHappnerClusterBuilder<T extends string>(version?: T): VersionedHappnerClusterBuilder<T> {
    const HappnCoreBuilder = this.#versionUtil.findClosestModuleMatch(
      VersionConstants.VERSION_THRESHOLDS.HappnCore,
      this.#happnVersion
    );

    const HappnClusterCoreBuilder = this.#versionUtil.findClosestModuleMatch(
      VersionConstants.VERSION_THRESHOLDS.HappnClusterCore,
      this.#happnClusterVersion
    );

    const HappnerCoreBuilder = this.#versionUtil.findClosestModuleMatch(
      VersionConstants.VERSION_THRESHOLDS.HappnerCore,
      this.#happnerVersion
    );

    const HappnerClusterCoreBuilder = this.#versionUtil.findClosestModuleMatch(
      VersionConstants.VERSION_THRESHOLDS.HappnerClusterCore,
      this.#happnerClusterVersion
    );

    const container = this.createChildBuildersContainer();

    // create a mixin and instantiate
    const HappnerClusterMixin = HappnCoreBuilder(
      HappnClusterCoreBuilder(HappnerCoreBuilder(HappnerClusterCoreBuilder(CoreBuilder)))
    );
    const result = new HappnerClusterMixin(container);

    result.builderType = HAPPNER_CLUSTER;
    return result;
  }

  createChildBuildersContainer() {
    return {
      // HAPPN
      cacheConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        VersionConstants.VERSION_THRESHOLDS.CacheConfig,
        this.#happnVersion
      ))(),
      connectConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        VersionConstants.VERSION_THRESHOLDS.ConnectConfig,
        this.#happnVersion
      ))(),
      dataConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        VersionConstants.VERSION_THRESHOLDS.DataConfig,
        this.#happnVersion
      ))(),
      protocolConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        VersionConstants.VERSION_THRESHOLDS.ProtocolConfig,
        this.#happnVersion
      ))(new FieldTypeValidator()),
      publisherConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        VersionConstants.VERSION_THRESHOLDS.PublisherConfig,
        this.#happnVersion
      ))(),
      securityConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        VersionConstants.VERSION_THRESHOLDS.SecurityConfig,
        this.#happnVersion
      ))(),
      subscriptionConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        VersionConstants.VERSION_THRESHOLDS.SubscriptionConfig,
        this.#happnVersion
      ))(),
      systemConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        VersionConstants.VERSION_THRESHOLDS.SystemConfig,
        this.#happnVersion
      ))(),
      transportConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        VersionConstants.VERSION_THRESHOLDS.TransportConfig,
        this.#happnVersion
      ))(),
      // HAPPN_CLUSTER
      healthConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        VersionConstants.VERSION_THRESHOLDS.HealthConfig,
        this.#happnClusterVersion
      ))(),
      membershipConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        VersionConstants.VERSION_THRESHOLDS.MembershipConfig,
        this.#happnClusterVersion
      ))(),
      orchestratorConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        VersionConstants.VERSION_THRESHOLDS.OrchestratorConfig,
        this.#happnClusterVersion
      ))(),
      proxyConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        VersionConstants.VERSION_THRESHOLDS.ProxyConfig,
        this.#happnClusterVersion
      ))(),
      replicatorConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        VersionConstants.VERSION_THRESHOLDS.ReplicatorConfig,
        this.#happnClusterVersion
      ))(),
      // HAPPNER
      componentsConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        VersionConstants.VERSION_THRESHOLDS.ComponentsConfig,
        this.#happnerVersion
      ))(),
      endpointsConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        VersionConstants.VERSION_THRESHOLDS.EndpointsConfig,
        this.#happnerVersion
      ))(),
      modulesConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        VersionConstants.VERSION_THRESHOLDS.ModulesConfig,
        this.#happnerVersion
      ))(),
    };
  }

  // async getBuilderClassByClosestVersion(moduleName: string, rootPath: string, version: string) {
  //   const versionUtil = new VersionUtil();
  //   const modulePath = versionUtil.findClosestVersionedFileMatch(rootPath, moduleName, version);
  //   const Module = await import(modulePath);
  //   return Module[Object.keys(Module)[0]];
  // }
  //
  // async getBuilderInstanceByClosestVersion(
  //   moduleName: string,
  //   rootPath: string,
  //   version: string,
  //   ...args: any[]
  // ) {
  //   const Clz = await this.getBuilderClassByClosestVersion(moduleName, rootPath, version);
  //   return new Clz(...args);
  // }
}
