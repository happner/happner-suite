/* eslint-disable no-console */
const helper = require('../../../happn-commons-test/lib/base-test-helper').create();
const CacheConfigBuilder = require('../../lib/builders/cache/cache-config-builder');

describe(helper.testName(), function () {
  it('builds a cache config object', () => {
    const testStatisticsInterval = 5000;

    const builder = new CacheConfigBuilder();
    const result = builder.withStatisticsInterval(testStatisticsInterval).build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    helper.expect(result.cache.config.statisticsInterval).to.equal(testStatisticsInterval);
  });
});
