/* eslint-disable no-console,no-unused-vars */
const helper = require('happn-commons-test/lib/base-test-helper').create();
const ConfigValidator = require('../../../lib/validators/config-validator');

describe(helper.testName(), function () {
  const validator = new ConfigValidator();

  it('validates full health config', () => {
    const membershipConfig = createValidMembershipConfig();
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(true);
  });

  /*
  clusterName
   */

  it('invalidates health config with missing clusterName', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.clusterName;
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(false);
  });

  it('invalidates health config with invalid clusterName', () => {
    const membershipConfig = createValidMembershipConfig();
    membershipConfig.config.clusterName = 7897438247;
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be string');
  });

  /*
  disseminationFactor
   */

  it('validates health config with missing disseminationFactor', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.disseminationFactor;
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates health config with invalid disseminationFactor', () => {
    const membershipConfig = createValidMembershipConfig();
    membershipConfig.config.disseminationFactor = 'invalid-factor';
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be number');
  });

  /*
  host
   */

  it('invalidates health config with missing host', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.host;
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal("must have required property 'host'");
  });

  it('invalidates health config with invalid host', () => {
    const membershipConfig = createValidMembershipConfig();
    membershipConfig.config.host = 2893129837;
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be string');
  });

  /*
  joinType
   */

  it('validates health config with missing joinType', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.joinType;
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates health config with invalid joinType', () => {
    const membershipConfig = createValidMembershipConfig();
    membershipConfig.config.joinType = 3284324;
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be string');
  });

  /*
  joinTimeout
   */

  it('validates health config with missing joinTimeout', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.joinTimeout;
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates health config with invalid joinTimeout', () => {
    const membershipConfig = createValidMembershipConfig();
    membershipConfig.config.joinTimeout = 'invalid-type';
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  /*
  hosts
   */

  it('invalidates health config with missing hosts', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.hosts;
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal("must have required property 'hosts'");
  });

  it('invalidates health config with invalid hosts', () => {
    const membershipConfig = createValidMembershipConfig();
    membershipConfig.config.hosts[0] = 2893129837;
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be string');
  });

  /*
  pingInterval
   */

  it('validates health config with missing pingInterval', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.pingInterval;
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates health config with invalid pingInterval', () => {
    const membershipConfig = createValidMembershipConfig();
    membershipConfig.config.pingInterval = 'invalid-type';
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  /*
  pingTimeout
   */

  it('validates health config with missing pingTimeout', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.pingTimeout;
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates health config with invalid pingTimeout', () => {
    const membershipConfig = createValidMembershipConfig();
    membershipConfig.config.pingTimeout = 'invalid-type';
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  /*
  pingReqTimeout
   */

  it('validates health config with missing pingReqTimeout', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.pingReqTimeout;
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates health config with invalid pingReqTimeout', () => {
    const membershipConfig = createValidMembershipConfig();
    membershipConfig.config.pingReqTimeout = 'invalid-type';
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  /*
  pingReqGroupSize
   */

  it('validates health config with missing pingReqGroupSize', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.pingReqGroupSize;
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates health config with invalid pingReqGroupSize', () => {
    const membershipConfig = createValidMembershipConfig();
    membershipConfig.config.pingReqGroupSize = 'invalid-type';
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  /*
  port
   */

  it('invalidates health config with missing port', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.port;
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal("must have required property 'port'");
  });

  it('invalidates health config with invalid port', () => {
    const membershipConfig = createValidMembershipConfig();
    membershipConfig.config.port = 'invalid-type';
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be integer');
  });

  /*
 randomWait
  */

  it('validates health config with missing randomWait', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.randomWait;
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates health config with invalid randomWait', () => {
    const membershipConfig = createValidMembershipConfig();
    membershipConfig.config.randomWait = 'invalid-type';
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be number');
  });

  /*
 seed - TODO: is this required?
  */

  it('validates health config with missing seed', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.seed;
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates health config with invalid seed', () => {
    const membershipConfig = createValidMembershipConfig();
    membershipConfig.config.seed = 'invalid-type';
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be boolean');
  });

  /*
 udp.maxDgramSize - TODO: is this required?
  */

  it('validates health config with missing udp', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.udp;
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('validates health config with missing udp.maxDgramSize', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.udp.maxDgramSize;
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(true);
  });

  it('invalidates health config with invalid udp.maxDgramSize', () => {
    const membershipConfig = createValidMembershipConfig();
    membershipConfig.config.udp.maxDgramSize = 'invalid-type';
    const result = validator.validateMembershipConfig(membershipConfig);

    helper.expect(result.valid).to.equal(false);
    helper.expect(result.errors[0].message).to.equal('must be number');
  });
});

function createValidMembershipConfig() {
  return {
    config: {
      clusterName: 'mock-cluster',
      disseminationFactor: 2,
      host: '192.168.1.30',
      joinType: 'testType',
      joinTimeout: 2000,
      hosts: ['192.168.1.20'],
      pingInterval: 1000,
      pingTimeout: 1000,
      pingReqTimeout: 2000,
      pingReqGroupSize: 10,
      port: 5200,
      randomWait: 2500,
      seed: true,
      seedWait: 5000,
      udp: {
        maxDgramSize: 20,
      },
    },
  };
}
