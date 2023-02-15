import { VersionUtil } from '../utils/version-util';
import BuilderConstants from '../constants/builder-constants';
import { FieldTypeValidator } from '../validators/field-type-validator';
import { CoreBuilder } from '../builders/core-builder';
import {
  VersionedHappnClusterBuilder,
  VersionedHappnBuilder,
  VersionedHappnerBuilder,
  VersionedHappnerClusterBuilder,
  VersionContext,
} from '../types/version-types';
import versionMap from '../maps/version-map';

const { HAPPN, HAPPN_CLUSTER, HAPPNER, HAPPNER_CLUSTER } = BuilderConstants;

export class ConfigBuilderFactory {
  #versionMap;
  #versionUtil;
  #versionContext;
  #happnVersion;
  #happnClusterVersion;
  #happnerVersion;
  #happnerClusterVersion;

  constructor(
    versionMap: Map<string, object>,
    versionUtil: VersionUtil,
    versionContext: VersionContext
  ) {
    this.#versionMap = versionMap;
    this.#versionUtil = versionUtil;
    this.#versionContext = versionContext;

    this.#happnVersion =
      this.#versionContext.happn ??
      this.#versionUtil.findMaxModuleVersion(this.#versionMap.get('HappnCore'));
    this.#happnClusterVersion =
      this.#versionContext.happnCluster ??
      this.#versionUtil.findMaxModuleVersion(this.#versionMap.get('HappnClusterCore'));
    this.#happnerVersion =
      this.#versionContext.happner ??
      this.#versionUtil.findMaxModuleVersion(this.#versionMap.get('HappnerCore'));
    this.#happnerClusterVersion =
      this.#versionContext.happnerCluster ??
      this.#versionUtil.findMaxModuleVersion(this.#versionMap.get('HappnerClusterCore'));
  }

  static create(versionContext) {
    return new ConfigBuilderFactory(versionMap, new VersionUtil(), versionContext);
  }

  getHappnBuilder<T extends string>(): VersionedHappnBuilder<T> {
    const HappnCoreBuilder = this.#versionUtil.findClosestModuleMatch(
      this.#versionMap.get('HappnCore'),
      this.#happnVersion
    );

    const container = this.createChildBuildersContainer();

    // create a mixin and instantiate
    const HappnMixin = HappnCoreBuilder(CoreBuilder);
    const result = new HappnMixin(container);
    result.builderType = HAPPN;

    return result as VersionedHappnBuilder<T>;
  }

  getHappnClusterBuilder<T extends string>(): VersionedHappnClusterBuilder<T> {
    const HappnCoreBuilder = this.#versionUtil.findClosestModuleMatch(
      this.#versionMap.get('HappnCore'),
      this.#happnVersion
    );

    const HappnClusterCoreBuilder = this.#versionUtil.findClosestModuleMatch(
      this.#versionMap.get('HappnClusterCore'),
      this.#happnClusterVersion
    );

    const container = this.createChildBuildersContainer();

    // create a mixin and instantiate
    const HappnClusterMixin = HappnClusterCoreBuilder(HappnCoreBuilder(CoreBuilder));
    const result = new HappnClusterMixin(container);
    result.builderType = HAPPN_CLUSTER;
    return result as unknown as VersionedHappnClusterBuilder<T>;
  }

  getHappnerBuilder<T extends string>(): VersionedHappnerBuilder<T> {
    const HappnCoreBuilder = this.#versionUtil.findClosestModuleMatch(
      this.#versionMap.get('HappnCore'),
      this.#happnVersion
    );

    const HappnerCoreBuilder = this.#versionUtil.findClosestModuleMatch(
      this.#versionMap.get('HappnerCore'),
      this.#happnerVersion
    );

    const container = this.createChildBuildersContainer();

    // create a mixin and instantiate
    const HappnerMixin = HappnerCoreBuilder(HappnCoreBuilder(CoreBuilder));
    const result = new HappnerMixin(container);

    result.builderType = HAPPNER;
    return result as VersionedHappnerBuilder<T>;
  }

  getHappnerClusterBuilder<T extends string>(): VersionedHappnerClusterBuilder<T> {
    const HappnCoreBuilder = this.#versionUtil.findClosestModuleMatch(
      this.#versionMap.get('HappnCore'),
      this.#happnVersion
    );

    const HappnClusterCoreBuilder = this.#versionUtil.findClosestModuleMatch(
      this.#versionMap.get('HappnClusterCore'),
      this.#happnClusterVersion
    );

    const HappnerCoreBuilder = this.#versionUtil.findClosestModuleMatch(
      this.#versionMap.get('HappnerCore'),
      this.#happnerVersion
    );

    const HappnerClusterCoreBuilder = this.#versionUtil.findClosestModuleMatch(
      this.#versionMap.get('HappnerClusterCore'),
      this.#happnerClusterVersion
    );

    const container = this.createChildBuildersContainer();

    // create a mixin and instantiate
    const HappnerClusterMixin = HappnerClusterCoreBuilder(
      HappnClusterCoreBuilder(HappnerCoreBuilder(HappnCoreBuilder(CoreBuilder)))
    );
    const result = new HappnerClusterMixin(container);

    result.builderType = HAPPNER_CLUSTER;
    return result as VersionedHappnerClusterBuilder<T>;
  }

  createChildBuildersContainer() {
    const happnVersion = this.#happnVersion;
    const happnClusterVersion = this.#happnClusterVersion;
    const happnerVersion = this.#happnerVersion;

    const cacheConfigVersions = this.#versionMap.get('CacheConfig');
    const connectConfigVersions = this.#versionMap.get('ConnectConfig');
    const dataConfigVersions = this.#versionMap.get('DataConfig');
    const protocolConfigVersions = this.#versionMap.get('ProtocolConfig');
    const publisherConfigVersions = this.#versionMap.get('PublisherConfig');
    const securityConfigVersions = this.#versionMap.get('SecurityConfig');
    const subscriptionConfigVersions = this.#versionMap.get('SubscriptionConfig');
    const systemConfigVersions = this.#versionMap.get('SystemConfig');
    const transportConfigVersions = this.#versionMap.get('TransportConfig');
    const healthConfigVersions = this.#versionMap.get('HealthConfig');
    const membershipConfigVersions = this.#versionMap.get('MembershipConfig');
    const orchestratorConfigVersions = this.#versionMap.get('OrchestratorConfig');
    const proxyConfigVersions = this.#versionMap.get('ProxyConfig');
    const replicatorConfigVersions = this.#versionMap.get('ReplicatorConfig');
    const componentsConfigVersions = this.#versionMap.get('ComponentsConfig');
    const endpointsConfigVersions = this.#versionMap.get('EndpointsConfig');
    const modulesConfigVersions = this.#versionMap.get('ModulesConfig');

    return {
      // HAPPN
      cacheConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        cacheConfigVersions,
        happnVersion
      ))(),
      connectConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        connectConfigVersions,
        happnVersion
      ))(),
      dataConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        dataConfigVersions,
        happnVersion
      ))(),
      protocolConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        protocolConfigVersions,
        happnVersion
      ))(new FieldTypeValidator()),
      publisherConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        publisherConfigVersions,
        happnVersion
      ))(),
      securityConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        securityConfigVersions,
        happnVersion
      ))(),
      subscriptionConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        subscriptionConfigVersions,
        happnVersion
      ))(),
      systemConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        systemConfigVersions,
        happnVersion
      ))(),
      transportConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        transportConfigVersions,
        happnVersion
      ))(),
      // HAPPN_CLUSTER
      healthConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        healthConfigVersions,
        happnClusterVersion
      ))(),
      membershipConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        membershipConfigVersions,
        happnClusterVersion
      ))(),
      orchestratorConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        orchestratorConfigVersions,
        happnClusterVersion
      ))(),
      proxyConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        proxyConfigVersions,
        happnClusterVersion
      ))(),
      replicatorConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        replicatorConfigVersions,
        happnClusterVersion
      ))(),
      // HAPPNER
      componentsConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        componentsConfigVersions,
        happnerVersion
      ))(),
      endpointsConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        endpointsConfigVersions,
        happnerVersion
      ))(),
      modulesConfigBuilder: new (this.#versionUtil.findClosestModuleMatch(
        modulesConfigVersions,
        happnerVersion
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
