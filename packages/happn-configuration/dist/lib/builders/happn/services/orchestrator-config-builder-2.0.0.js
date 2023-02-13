"use strict";
/* eslint-disable @typescript-eslint/no-var-requires */
// noinspection JSDeprecatedSymbols
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrchestratorConfigBuilderV2 = void 0;
const orchestrator_config_builder_1 = require("./orchestrator-config-builder");
const BaseBuilder = require('happn-commons/lib/base-builder');
class OrchestratorConfigBuilderV2 extends orchestrator_config_builder_1.OrchestratorConfigBuilder {
    constructor() {
        super();
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
exports.OrchestratorConfigBuilderV2 = OrchestratorConfigBuilderV2;
