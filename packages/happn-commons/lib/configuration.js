/* eslint-disable no-console */
const { ConfigValidator: Validator } = require('happn-configuration');
const { CONFIG_TYPE } = require('./constants');

module.exports = class Configuration {
  static validateConfig(config, configType, targetVersion = '1.0.0', displayConfig = false) {
    const validator = new Validator(targetVersion);
    let validationResult, errMsg;

    if (configType === undefined || configType === null)
      throw new Error(
        "invalid configType; valid options are 'HAPPN', 'HAPPNER', 'HAPPN-CLUSTER' or 'HAPPNER-CLUSTER'"
      );

    if (displayConfig) console.info(`CONFIG --> : ${JSON.stringify(config, null, 2)}`);

    switch (configType) {
      case null:
        console.warn('VALIDATE_CONFIG environment variable not set; skipping validation...');
        return;
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
