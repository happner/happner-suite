/* eslint-disable no-console */
const {
  ConfigValidator: Validator,
  ConfigBuilderFactory: BuilderFactory,
} = require('happn-configuration');
const { CONFIG_TYPE } = require('./constants');

module.exports = class Configuration {
  /***
   * Get a configuration builder
   * @param builderType This can be one of the following: HAPPN / HAPPN-CLUSTER / HAPPNER / HAPPNER-CLUSTER
   * @param pkgContext An object containing framework versions, eg:
   *  { happn: '1.2.3', happnCluster: '2.3.4', happner: '2.1.0', happnCluster: '4.2.1' }
   * @returns A builder instance, dependent on the builderType
   */
  static getBuilder(builderType, pkgContext) {
    if (builderType === undefined || builderType === null)
      throw new Error(
        "invalid builderType; valid options are 'HAPPN', 'HAPPNER', 'HAPPN-CLUSTER' or 'HAPPNER-CLUSTER'"
      );

    const factory = new BuilderFactory(pkgContext);

    switch (builderType) {
      case CONFIG_TYPE.HAPPN:
        return factory.getHappnBuilder();
      case CONFIG_TYPE.HAPPN_CLUSTER:
        return factory.getHappnClusterBuilder();
      case CONFIG_TYPE.HAPPNER:
        return factory.getHappnerBuilder();
      case CONFIG_TYPE.HAPPNER_CLUSTER:
        return factory.getHappnerClusterBuilder();
      default:
        throw new Error('unknown builder type');
    }
  }

  static validateConfig(config, configType, targetVersion = '1.0.0', displayConfig = false) {
    const validator = new Validator(targetVersion);
    let validationResult, errMsg;

    if (configType === undefined || configType === null)
      throw new Error(
        "invalid configType; valid options are 'HAPPN', 'HAPPNER', 'HAPPN-CLUSTER' or 'HAPPNER-CLUSTER'"
      );

    if (displayConfig) console.info(`CONFIG --> : ${JSON.stringify(config, null, 2)}`);

    switch (configType.toUpperCase()) {
      case CONFIG_TYPE.HAPPN:
        validationResult = validator.validateHappnConfig(config);
        break;
      case CONFIG_TYPE.HAPPN_CLUSTER:
        validationResult = validator.validateHappnClusterConfig(config);
        break;
      case CONFIG_TYPE.HAPPNER:
        validationResult = validator.validateHappnerConfig(config);
        break;
      case CONFIG_TYPE.HAPPNER_CLUSTER:
        validationResult = validator.validateHappnerClusterConfig(config);
        break;
      default:
        errMsg = `Unrecognised VALIDATE_CONFIG environment variable: '${process.env.VALIDATE_CONFIG}'`;
        console.error(errMsg);
        throw new Error(errMsg);
    }

    if (!validationResult.valid) {
      errMsg = `configuration validation error: ${JSON.stringify(
        validationResult.errors,
        null,
        2
      )}`;
      console.error(errMsg);
      throw new Error(errMsg);
    }
  }
};
