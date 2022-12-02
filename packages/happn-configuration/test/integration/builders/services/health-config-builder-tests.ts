/* eslint-disable no-console */
import { HealthConfigBuilder } from '../../../../lib/builders/happn/services/health-config-builder';
import { expect } from 'chai';

describe('health configuration builder tests', function () {
  it('builds a health config object', () => {
    const mockWarmupLimit = 1000;
    const mockHealthInterval = 5000;

    const builder = new HealthConfigBuilder();
    const result = builder
      .withHealthWarmupLimit(mockWarmupLimit)
      .withHealthInterval(mockHealthInterval)
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    //assertions
    expect(result.config.warmupLimit).to.equal(mockWarmupLimit);
    expect(result.config.healthInterval).to.equal(mockHealthInterval);
  });
});
