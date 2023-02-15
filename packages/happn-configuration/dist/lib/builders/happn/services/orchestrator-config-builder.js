"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrchestratorConfigBuilder = void 0;
/* eslint-disable @typescript-eslint/no-var-requires */
const BaseBuilder = require('happn-commons/lib/base-builder');
class OrchestratorConfigBuilder extends BaseBuilder {
    constructor() {
        super();
    }
    withOrchestratorMinimumPeers(peerCount) {
        this.set(`config.minimumPeers`, peerCount, BaseBuilder.Types.INTEGER);
        return this;
    }
    withOrchestratorReplicatePath(path) {
        this.push(`config.replicate`, path, BaseBuilder.Types.STRING);
        return this;
    }
    withOrchestratorStableReportInterval(interval) {
        this.set(`config.stableReportInterval`, interval, BaseBuilder.Types.INTEGER);
        return this;
    }
    withOrchestratorStabiliseTimeout(timeout) {
        this.set(`config.stabiliseTimeout`, timeout, BaseBuilder.Types.INTEGER);
        return this;
    }
}
exports.OrchestratorConfigBuilder = OrchestratorConfigBuilder;
