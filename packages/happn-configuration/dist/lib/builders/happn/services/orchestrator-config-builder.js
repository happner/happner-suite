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
    withServiceName(serviceName) {
        this.set(`config.serviceName`, serviceName, BaseBuilder.Types.STRING);
        return this;
    }
    withDeploymentName(deployment) {
        this.set(`config.deployment`, deployment, BaseBuilder.Types.STRING);
        return this;
    }
    withClusterName(clusterName) {
        this.set(`config.clusterName`, clusterName, BaseBuilder.Types.STRING);
        return this;
    }
    withClusterConfigItem(fieldName, fieldValue) {
        this.set(`config.cluster.${fieldName}`, fieldValue, BaseBuilder.Types.INTEGER);
        return this;
    }
    withTiming(memberRefresh, keepAlive, keepAliveThreshold, healthReport, stabiliseTimeout) {
        const builder = new BaseBuilder();
        builder.set('memberRefresh', memberRefresh, BaseBuilder.Types.INTEGER);
        builder.set('keepAlive', keepAlive, BaseBuilder.Types.INTEGER);
        builder.set('keepAliveThreshold', keepAliveThreshold, BaseBuilder.Types.INTEGER);
        builder.set('healthReport', healthReport, BaseBuilder.Types.INTEGER);
        if (stabiliseTimeout || this.config.stabiliseTimeout)
            builder.set('healthStabiliseTimeoutReport', stabiliseTimeout || this.config.timing.stabiliseTimeout, BaseBuilder.Types.INTEGER);
        this.set(`config.timing`, builder, BaseBuilder.Types.OBJECT);
        return this;
    }
}
exports.OrchestratorConfigBuilder = OrchestratorConfigBuilder;
