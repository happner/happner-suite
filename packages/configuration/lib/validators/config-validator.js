const Ajv = require('ajv');
const happnSchema = require('../schemas/happn-schema.json');
const cacheSchema = require('../schemas/cache-schema.json');
const connectSchema = require('../schemas/connect-schema.json');
const dataSchema = require('../schemas/data-schema.json');
const protocolSchema = require('../schemas/protocol-schema.json');
const publisherSchema = require('../schemas/publisher-schema.json');
const securitySchema = require('../schemas/services-security-schema.json');
const subscriptionSchema = require('../schemas/subscription-schema.json');
const systemSchema = require('../schemas/system-schema.json');
const transportSchema = require('../schemas/transport-schema.json');
const FieldTypeValidator = require('../validators/field-type-validator');

module.exports = class ConfigValidator {
  #ajv;
  #fieldTypeValidator;

  constructor() {
    this.#ajv = new Ajv({
      schemas: [
        cacheSchema,
        connectSchema,
        dataSchema,
        protocolSchema,
        publisherSchema,
        securitySchema,
        subscriptionSchema,
        systemSchema,
        transportSchema,
      ],
      strictNumbers: false, // to handle Infinity types
    });

    this.#fieldTypeValidator = new FieldTypeValidator();
  }

  validateCacheConfig(config) {
    return this.#validate(config, cacheSchema);
  }

  validateConnectConfig(config) {
    return this.#validate(config, connectSchema);
  }

  validateDataConfig(config) {
    return this.#validate(config, dataSchema);
  }

  validateProtocolConfig(config) {
    let result = this.#validate(config, protocolSchema);

    if (config.config.inboundLayers !== null) {
      config.config.inboundLayers.forEach((layer) => {
        let inboundResult = this.#fieldTypeValidator.validateFunctionArgs(layer, 2);
        if (!inboundResult.isValid) {
          if (result.valid) result.valid = false;
          result.errors.push(inboundResult.error);
        }
      });
    }

    if (config.config.outboundLayers !== null) {
      config.config.outboundLayers.forEach((layer) => {
        let outboundResult = this.#fieldTypeValidator.validateFunctionArgs(layer, 2);
        if (!outboundResult.isValid) {
          if (result.valid) result.valid = false;
          result.errors.push(outboundResult.error);
        }
      });
    }

    return result;
  }

  validatePublisherConfig(config) {
    return this.#validate(config, publisherSchema);
  }

  validateSecurityConfig(config) {
    return this.#validate(config, securitySchema);
  }

  validateSubscriptionConfig(config) {
    return this.#validate(config, subscriptionSchema);
  }

  validateSystemConfig(config) {
    return this.#validate(config, systemSchema);
  }

  validateTransportConfig(config) {
    return this.#validate(config, transportSchema);
  }

  validateHappnConfig(config) {
    return this.#validate(config, happnSchema);
  }

  #validate(config, schema) {
    const result = { valid: false, errors: [] };
    const validate = this.#ajv.compile(schema);
    result.valid = validate(config);

    if (!result.valid) {
      result.errors = validate.errors;
    }
    return result;
  }
};
