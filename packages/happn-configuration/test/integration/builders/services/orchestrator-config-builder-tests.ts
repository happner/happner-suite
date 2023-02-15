/* eslint-disable no-console */
import { OrchestratorConfigBuilder } from '../../../../lib/builders/happn/services/orchestrator-config-builder';
import { expect } from 'chai';

describe('orchestrator configuration builder tests', function () {
  it('builds a orchestrator config object', () => {
    const mockMinimumPeers = 5;
    const mockReplicatePath = 'replicate/path';
    const mockStabiliseTimeout = 1000;
    const mockStableReportInterval = 60000;

    const builder = new OrchestratorConfigBuilder();
    const result = builder
      .withServiceName('testService')
      .withDeploymentName('testDeployment')
      .withClusterConfigItem('testKey', 123)
      .withOrchestratorMinimumPeers(mockMinimumPeers)
      .withOrchestratorReplicatePath(mockReplicatePath)
      .withOrchestratorStabiliseTimeout(mockStabiliseTimeout)
      .withOrchestratorStableReportInterval(mockStableReportInterval)
      .withTiming(5000, 2000, 3000, 5000, 1000)
      .build();

    console.log('RESULT:', JSON.stringify(result, null, 2));

    //assertions
    expect(result.config.minimumPeers).to.equal(mockMinimumPeers);
    expect(result.config.replicate[0]).to.equal(mockReplicatePath);
    expect(result.config.stableReportInterval).to.equal(mockStableReportInterval);
    expect(result.config.timing.healthStabiliseTimeoutReport).to.equal(mockStabiliseTimeout);
  });
});
