/* eslint-disable @typescript-eslint/no-var-requires */
const BaseBuilder = require('happn-commons/lib/base-builder');
const fs = require('happn-commons').fs;
const path = require('path');
import BuilderConstants from '../constants/builder-constants';
import { FieldTypeValidator } from '../validators/field-type-validator';

// mixin specific imports
import { HappnCoreBuilder } from '../builders/happn/happn-core-mixin';
import { HappnClusterCoreBuilder } from '../builders/happn-cluster/happn-cluster-core-mixin';
import { HappnerCoreBuilder } from '../builders/happner/happner-core-mixin';
import { HappnerClusterCoreBuilder } from '../builders/happner-cluster/happner-cluster-core-mixin';

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
        return ConfigBuilderFactory.getHappnBuilder(version);
      case HAPPN_CLUSTER:
        return ConfigBuilderFactory.getHappnClusterBuilder(version);
      case HAPPNER:
        return ConfigBuilderFactory.getHappnerBuilder(version);
      case HAPPNER_CLUSTER:
        return ConfigBuilderFactory.getHappnerClusterBuilder(version);
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
        '../builders/happn/services',
        version
      ),
      componentsConfigBuilder: await this.getSubconfigBuilder(
        'components-config-builder',
        '../builders/happner/components',
        version
      ),
      connectConfigBuilder: await this.getSubconfigBuilder(
        'connect-config-builder',
        '../builders/happn/services',
        version
      ),
      dataConfigBuilder: await this.getSubconfigBuilder(
        'data-config-builder',
        '../builders/happn/services',
        version
      ),
      endpointsConfigBuilder: await this.getSubconfigBuilder(
        'endpoints-config-builder',
        '../builders/happner/endpoints',
        version
      ),
      membershipConfigBuilder: await this.getSubconfigBuilder(
        'membership-config-builder',
        '../builders/happn/services',
        version
      ),
      modulesConfigBuilder: await this.getSubconfigBuilder(
        'modules-config-builder',
        '../builders/happner/modules',
        version
      ),
      orchestratorConfigBuilder: await this.getSubconfigBuilder(
        'orchestrator-config-builder',
        '../builders/happn/services',
        version
      ),
      protocolConfigBuilder: await this.getSubconfigBuilder(
        'protocol-config-builder',
        '../builders/happn/services',
        version,
        new FieldTypeValidator()
      ),
      proxyConfigBuilder: await this.getSubconfigBuilder(
        'proxy-config-builder',
        '../builders/happn/services',
        version
      ),
      publisherConfigBuilder: await this.getSubconfigBuilder(
        'publisher-config-builder',
        '../builders/happn/services',
        version
      ),
      replicatorConfigBuilder: await this.getSubconfigBuilder(
        'replicator-config-builder',
        '../builders/happn/services',
        version
      ),
      securityConfigBuilder: await this.getSubconfigBuilder(
        'security-config-builder',
        '../builders/happn/services',
        version
      ),
      subscriptionConfigBuilder: await this.getSubconfigBuilder(
        'subscription-config-builder',
        '../builders/happn/services',
        version
      ),
      systemConfigBuilder: await this.getSubconfigBuilder(
        'system-config-builder',
        '../builders/happn/services',
        version
      ),
      transportConfigBuilder: await this.getSubconfigBuilder(
        'transport-config-builder',
        '../builders/happn/services',
        version
      ),
      healthConfigBuilder: await this.getSubconfigBuilder(
        'health-config-builder',
        '../builders/happn/services',
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
    let Proto;
    const className = this.kebab2camel(moduleName);
    const FallbackProto = (await this.importCorrectBuilder(moduleName, rootPath, null))[className];
    try {
      Proto = (await this.importCorrectBuilder(moduleName, rootPath, version))[className];
    } catch (e) {
      console.warn(e);
    }
    return Proto ? new Proto(...args) : new FallbackProto(...args);
  }

  static async importCorrectBuilder(moduleName: string, rootPath: string, version: string) {
    let modulePath;
    if (!version) {
      modulePath = path.resolve(__dirname, rootPath).concat('/').concat(moduleName).concat('.ts');
      if (!fs.existsSync(modulePath)) throw new Error(`Bulder for ${moduleName} not found`);
      return await import(modulePath);
    }
    modulePath = path
      .resolve(__dirname, rootPath)
      .concat('/')
      .concat(moduleName)
      .concat('-')
      .concat(version)
      .concat('.ts');
    if (fs.existsSync(modulePath)) {
      return await import(modulePath);
    }
    const semanticSegments = version.split('.');
    if (parseInt(semanticSegments[0]) - 1 <= 1) {
      return this.importCorrectBuilder(moduleName, rootPath, null);
    }
    //Major version would be reduced to 1, so we find the plain version
    semanticSegments[0] = (parseInt(semanticSegments[0]) - 1).toString();
    const newVersion = semanticSegments.join('.');
    return this.importCorrectBuilder(moduleName, rootPath, newVersion);
  }

  static kebab2camel(moduleName: string) {
    const words = moduleName.split('-');
    const camelled = words
      .map((word) => {
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join('');
    return camelled;
  }
}
