/* eslint-disable no-console */
const { HealthConfigBuilder } = require('../../../../lib/ts/builders/happn/services/health-config-builder');
const helper = require('happn-commons-test/lib/base-test-helper').create();

describe(helper.testName(), function () {
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
    helper.expect(result.config.warmupLimit).to.equal(mockWarmupLimit);
    helper.expect(result.config.healthInterval).to.equal(mockHealthInterval);
  });
});
