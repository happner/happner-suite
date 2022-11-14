/* eslint-disable no-console */
const { OrchestratorConfigBuilder } = require('../../../../lib/ts/builders/happn/services/orchestrator-config-builder');
const helper = require('happn-commons-test/lib/base-test-helper').create();

describe(helper.testName(), function () {
  it('builds a orchestrator config object', () => {
    const mockMinimumPeers = 5;
    const mockReplicatePath = 'replicate/path';
    const mockStabiliseTimeout = 1000;
    const mockStableReportInterval = 60000;

    const builder = new OrchestratorConfigBuilder();
    const result = builder
      .withOrchestratorMinimumPeers(mockMinimumPeers)
      .withOrchestratorReplicatePath(mockReplicatePath)
      .withOrchestratorStabiliseTimeout(mockStabiliseTimeout)
      .withOrchestratorStableReportInterval(mockStableReportInterval)
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    //assertions
    helper.expect(result.config.minimumPeers).to.equal(mockMinimumPeers);
    helper.expect(result.config.replicate[0]).to.equal(mockReplicatePath);
    helper.expect(result.config.stableReportInterval).to.equal(mockStableReportInterval);
    helper.expect(result.config.stabiliseTimeout).to.equal(mockStabiliseTimeout);
  });
});
