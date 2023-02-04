/* eslint-disable @typescript-eslint/no-var-requires */
import { VersionUtil } from '../utils/version-util';
import BuilderConstants from '../constants/builder-constants';
import { FieldTypeValidator } from '../validators/field-type-validator';

// mixin specific imports
import { HappnCoreBuilder } from '../builders/happn/happn-core-mixin';
import { HappnClusterCoreBuilder } from '../builders/happn-cluster/happn-cluster-core-mixin';
import { HappnerCoreBuilder } from '../builders/happner/happner-core-mixin';
import { HappnerClusterCoreBuilder } from '../builders/happner-cluster/happner-cluster-core-mixin';
import { join } from 'path';

import BaseBuilder from 'happn-commons/lib/base-builder';

const { HAPPN, HAPPN_CLUSTER, HAPPNER, HAPPNER_CLUSTER } = BuilderConstants;

// core class used for mixins...
const BaseClz = class BaseClz extends BaseBuilder {
  #builderType;

  constructor(...args: any[]) {
    super(...args);
  }

  set builderType(type) {
    this.#builderType = type;
  }

  get builderType() {
    return this.#builderType;
  }

  build() {
    const result = super.build();

    switch (this.builderType) {
      case HAPPN:
      case HAPPN_CLUSTER:
        return result.happn;
      case HAPPNER:
      case HAPPNER_CLUSTER:
        return result;
      default:
        throw new Error('unknown baseType');
    }
  }
};

export class ConfigBuilderFactory {
  static async getBuilder(type: string, version: string) {
    switch (type) {
      case HAPPN:
        return await ConfigBuilderFactory.getHappnBuilder(version);
      case HAPPN_CLUSTER:
        return await ConfigBuilderFactory.getHappnClusterBuilder(version);
      case HAPPNER:
        return await ConfigBuilderFactory.getHappnerBuilder(version);
      case HAPPNER_CLUSTER:
        return await ConfigBuilderFactory.getHappnerClusterBuilder(version);
      default:
        throw new Error('Unknown configuration type');
    }
  }

  static async getHappnBuilder(version: string) {
    const container = await ConfigBuilderFactory.createContainer(version);
    const HappnMixin = HappnCoreBuilder(BaseClz);
    const result = new HappnMixin(container);
    result.builderType = HAPPN;
    return result;
  }

  static async getHappnClusterBuilder(version: string) {
    const container = await ConfigBuilderFactory.createContainer(version);
    const HappnClusterMixin = HappnCoreBuilder(HappnClusterCoreBuilder(BaseClz));
    const result = new HappnClusterMixin(container);
    result.builderType = HAPPN_CLUSTER;
    return result;
  }

  static async getHappnerBuilder(version: string) {
    const container = await ConfigBuilderFactory.createContainer(version);
    const HappnerMixin = HappnCoreBuilder(HappnerCoreBuilder(BaseClz));
    const result = new HappnerMixin(container);
    result.builderType = HAPPNER;
    return result;
  }

  static async getHappnerClusterBuilder(version: string) {
    const container = await ConfigBuilderFactory.createContainer(version);
    const HappnerClusterMixin = HappnCoreBuilder(
      HappnClusterCoreBuilder(HappnerCoreBuilder(HappnerClusterCoreBuilder(BaseClz)))
    );
    const result = new HappnerClusterMixin(container);
    result.builderType = HAPPNER_CLUSTER;
    return result;
  }

  static async createContainer(version: string) {
    return {
      cacheConfigBuilder: await this.getSubconfigBuilder(
        'cache-config-builder',
        join(__dirname, '..', 'builders/happn/services'),
        version
      ),
      componentsConfigBuilder: await this.getSubconfigBuilder(
        'components-config-builder',
        join(__dirname, '..', 'builders/happner/components'),
        version
      ),
      connectConfigBuilder: await this.getSubconfigBuilder(
        'connect-config-builder',
        join(__dirname, '..', 'builders/happn/services'),
        version
      ),
      dataConfigBuilder: await this.getSubconfigBuilder(
        'data-config-builder',
        join(__dirname, '..', 'builders/happn/services'),
        version
      ),
      endpointsConfigBuilder: await this.getSubconfigBuilder(
        'endpoints-config-builder',
        join(__dirname, '..', 'builders/happner/endpoints'),
        version
      ),
      membershipConfigBuilder: await this.getSubconfigBuilder(
        'membership-config-builder',
        join(__dirname, '..', 'builders/happn/services'),
        version
      ),
      modulesConfigBuilder: await this.getSubconfigBuilder(
        'modules-config-builder',
        join(__dirname, '..', 'builders/happner/modules'),
        version
      ),
      orchestratorConfigBuilder: await this.getSubconfigBuilder(
        'orchestrator-config-builder',
        join(__dirname, '..', 'builders/happn/services'),
        version
      ),
      protocolConfigBuilder: await this.getSubconfigBuilder(
        'protocol-config-builder',
        join(__dirname, '..', 'builders/happn/services'),
        version,
        new FieldTypeValidator()
      ),
      proxyConfigBuilder: await this.getSubconfigBuilder(
        'proxy-config-builder',
        join(__dirname, '..', 'builders/happn/services'),
        version
      ),
      publisherConfigBuilder: await this.getSubconfigBuilder(
        'publisher-config-builder',
        join(__dirname, '..', 'builders/happn/services'),
        version
      ),
      replicatorConfigBuilder: await this.getSubconfigBuilder(
        'replicator-config-builder',
        join(__dirname, '..', 'builders/happn/services'),
        version
      ),
      securityConfigBuilder: await this.getSubconfigBuilder(
        'security-config-builder',
        join(__dirname, '..', 'builders/happn/services'),
        version
      ),
      subscriptionConfigBuilder: await this.getSubconfigBuilder(
        'subscription-config-builder',
        join(__dirname, '..', 'builders/happn/services'),
        version
      ),
      systemConfigBuilder: await this.getSubconfigBuilder(
        'system-config-builder',
        join(__dirname, '..', 'builders/happn/services'),
        version
      ),
      transportConfigBuilder: await this.getSubconfigBuilder(
        'transport-config-builder',
        join(__dirname, '..', 'builders/happn/services'),
        version
      ),
      healthConfigBuilder: await this.getSubconfigBuilder(
        'health-config-builder',
        join(__dirname, '..', 'builders/happn/services'),
        version
      ),
    };
  }

  static async getSubconfigBuilder(
    moduleName: string,
    rootPath: string,
    version: string,
    ...args: any[]
  ) {
    const versionUtil = new VersionUtil();
    const modulePath = versionUtil.findClosestVersionedFileMatch(rootPath, moduleName, version);
    const Module = await import(modulePath);
    const Clz = Module[Object.keys(Module)[0]];
    return new Clz(...args);
  }
}
