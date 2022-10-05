const Ajv = require('ajv');
const happnSchema = require('../schemas/happn-schema.json');

module.exports = class HappnConfigValidator {
  #ajv;
  #happnSchema;

  constructor() {
    this.#ajv = new Ajv();
    // this.#happnSchema = JSON.parse(happnSchema);
  }

  validateHappnConfig(config) {
    return this.#validate(config, happnSchema);
  }

  #validate(config, schema) {
    const validate = this.#ajv.compile(schema);
    const valid = validate(config);

    if (!valid) throw new Error(validate.errors);

    return valid;
  }
};
