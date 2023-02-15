/* eslint-disable no-console,no-unused-vars,@typescript-eslint/no-var-requires */
import { expect } from 'chai';
import { ConfigValidator } from '../../../../lib/validators/config-validator';

import mockLogger from '../../../__fixtures/logger';

describe('membership configuration validation tests', function () {
  const validator = new ConfigValidator(mockLogger);

  it('validates full membership config', () => {
    const membershipConfig = createValidMembershipConfig();
    const result = validator.validateMembershipConfig(membershipConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  clusterName
   */

  it('validates membership config with missing clusterName', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.clusterName;
    const result = validator.validateMembershipConfig(membershipConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  disseminationFactor
   */

  it('validates membership config with missing disseminationFactor', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.disseminationFactor;
    const result = validator.validateMembershipConfig(membershipConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  host
   */

  it('validates membership config with missing host', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.host;
    const result = validator.validateMembershipConfig(membershipConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  joinType
   */

  it('validates membership config with missing joinType', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.joinType;
    const result = validator.validateMembershipConfig(membershipConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  joinTimeout
   */

  it('validates membership config with missing joinTimeout', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.joinTimeout;
    const result = validator.validateMembershipConfig(membershipConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  hosts
   */

  it('validates membership config with missing hosts', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.hosts;
    const result = validator.validateMembershipConfig(membershipConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  pingInterval
   */

  it('validates membership config with missing pingInterval', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.pingInterval;
    const result = validator.validateMembershipConfig(membershipConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  pingTimeout
   */

  it('validates membership config with missing pingTimeout', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.pingTimeout;
    const result = validator.validateMembershipConfig(membershipConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  pingReqTimeout
   */

  it('validates membership config with missing pingReqTimeout', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.pingReqTimeout;
    const result = validator.validateMembershipConfig(membershipConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  pingReqGroupSize
   */

  it('validates membership config with missing pingReqGroupSize', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.pingReqGroupSize;
    const result = validator.validateMembershipConfig(membershipConfig);

    expect(result.valid).to.equal(true);
  });

  /*
  port
   */

  it('validates membership config with missing port', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.port;
    const result = validator.validateMembershipConfig(membershipConfig);

    expect(result.valid).to.equal(true);
  });

  /*
 randomWait
  */

  it('validates membership config with missing randomWait', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.randomWait;
    const result = validator.validateMembershipConfig(membershipConfig);

    expect(result.valid).to.equal(true);
  });

  /*
 seed - TODO: is this required?
  */

  it('validates membership config with missing seed', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.seed;
    const result = validator.validateMembershipConfig(membershipConfig);

    expect(result.valid).to.equal(true);
  });

  /*
 udp.maxDgramSize - TODO: is this required?
  */

  it('validates membership config with missing udp', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.udp;
    const result = validator.validateMembershipConfig(membershipConfig);

    expect(result.valid).to.equal(true);
  });

  it('validates membership config with missing udp.maxDgramSize', () => {
    const membershipConfig = createValidMembershipConfig();
    delete membershipConfig.config.udp.maxDgramSize;
    const result = validator.validateMembershipConfig(membershipConfig);

    expect(result.valid).to.equal(true);
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
