"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrchestratorConfigBuilder = void 0;
/* eslint-disable @typescript-eslint/no-var-requires */
const BaseBuilder = require('happn-commons/lib/base-builder');
const orchestrator_config_builder_1 = require("./orchestrator-config-builder");
class OrchestratorConfigBuilder extends orchestrator_config_builder_1.OrchestratorConfigBuilder {
    constructor() {
        super();
    }
    withServiceName(serviceName) {
        this.set(`config.serviceName`, serviceName, BaseBuilder.Types.STRING);
        return this;
    }
    withDeploymentName(deployment) {
        this.ser(`config.deployment`, deployment, BaseBuilder.Types.STRING);
        return this;
    }
    withClusterName(clusterName) {
        this.set(`config.clusterName`, clusterName, BaseBuilder.Types.STRING);
        return this;
    }
    withOrchestratorStabiliseTimeout(timeout) {
        this.set(`config.timing.stabiliseTimeout`, timeout, BaseBuilder.Types.INTEGER);
        return this;
    }
    withClusterConfig(config) {
        this.set(`config.cluster`, config, BaseBuilder.Types.OBJECT);
        return this;
    }
    withTiming(timing) {
        const builder = new BaseBuilder();
        builder.set('memberRefresh', timing.memberRefresh, BaseBuilder.Types.INTEGER);
        builder.set('keepAlive', timing.keepAlive, BaseBuilder.Types.INTEGER);
        builder.set('keepAliveThreshold', timing.keepAliveThreshold, BaseBuilder.Types.INTEGER);
        builder.set('healthReport', timing.healthReport, BaseBuilder.Types.INTEGER);
        if (timing.stabiliseTimeout || this.config.stabiliseTimeout)
            builder.set('healtstabiliseTimeouthReport', timing.stabiliseTimeout || this.config.timing.stabiliseTimeout, BaseBuilder.Types.INTEGER);
        this.set(`config.timing`, builder, BaseBuilder.Types.OBJECT);
        return this;
    }
}
exports.OrchestratorConfigBuilder = OrchestratorConfigBuilder;
