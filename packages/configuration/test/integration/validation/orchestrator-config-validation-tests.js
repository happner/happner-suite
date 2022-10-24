/* eslint-disable no-console,no-unused-vars */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const ConfigValidator = require('../../../lib/validators/config-validator');

describe(helper.testName(), function () {
  const validator = new ConfigValidator();

  it('validates full orchestrator config', () => {
    const orchestratorConfig = createValidOrchestratorConfig();
    const result = validator.validateOrchestratorConfig(orchestratorConfig);

    helper.expect(result.valid).to.equal(true);
  });

  /*
  minimumPeers
   */

  it('validates orchestrator config with missing minimumPeers', () => {
    const orchestratorConfig = createValidOrchestratorConfig();
    delete orchestratorConfig.config.minimumPeers;

    const result = validator.validateOrchestratorConfig(orchestratorConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates orchestrator config with invalid minimumPeers', () => {
    const orchestratorConfig = createValidOrchestratorConfig();
    orchestratorConfig.config.minimumPeers = 'invalid-limit';

    const result = validator.validateOrchestratorConfig(orchestratorConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  /*
  replicate
   */

  it('validates orchestrator config with missing replicate', () => {
    const orchestratorConfig = createValidOrchestratorConfig();
    delete orchestratorConfig.config.replicate;

    const result = validator.validateOrchestratorConfig(orchestratorConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates orchestrator config with invalid replicate', () => {
    const orchestratorConfig = createValidOrchestratorConfig();
    orchestratorConfig.config.replicate[0] = 334324;

    const result = validator.validateOrchestratorConfig(orchestratorConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be string');
  });

  /*
  stabiliseTimeout
   */

  it('validates orchestrator config with missing stabiliseTimeout', () => {
    const orchestratorConfig = createValidOrchestratorConfig();
    delete orchestratorConfig.config.stabiliseTimeout;

    const result = validator.validateOrchestratorConfig(orchestratorConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates orchestrator config with invalid stabiliseTimeout', () => {
    const orchestratorConfig = createValidOrchestratorConfig();
    orchestratorConfig.config.stabiliseTimeout = 'invalid-stabilise-timeout';

    const result = validator.validateOrchestratorConfig(orchestratorConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  /*
  stableReportInterval
   */

  it('validates orchestrator config with missing stableReportInterval', () => {
    const orchestratorConfig = createValidOrchestratorConfig();
    delete orchestratorConfig.config.stableReportInterval;

    const result = validator.validateOrchestratorConfig(orchestratorConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates orchestrator config with invalid stableReportInterval', () => {
    const orchestratorConfig = createValidOrchestratorConfig();
    orchestratorConfig.config.stableReportInterval = 'invalid-report-interval';

    const result = validator.validateOrchestratorConfig(orchestratorConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });
});

function createValidOrchestratorConfig() {
  return {
    config: {
      minimumPeers: 5,
      replicate: ['replicate/path'],
      stabiliseTimeout: 1000,
      stableReportInterval: 60000,
    },
  };
}
