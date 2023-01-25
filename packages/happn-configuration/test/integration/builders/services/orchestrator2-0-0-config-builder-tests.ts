/* eslint-disable no-console */
import { OrchestratorConfigBuilder } from '../../../../lib/builders/happn/services/orchestrator-config-builder-2.0.0';
import { expect } from 'chai';

describe('orchestrator configuration builder tests', function () {
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
    expect(result.config.minimumPeers).to.equal(mockMinimumPeers);
    expect(result.config.replicate[0]).to.equal(mockReplicatePath);
    expect(result.config.stableReportInterval).to.equal(mockStableReportInterval);
    expect(result.config.timing.stabiliseTimeout).to.equal(mockStabiliseTimeout);
  });
});
