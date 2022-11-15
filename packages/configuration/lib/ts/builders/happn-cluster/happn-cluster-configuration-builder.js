"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HappnClusterConfigurationBuilder = void 0;
const BaseBuilder = require('happn-commons/lib/base-builder');
const happn_configuration_builder_js_1 = require("../happn/happn-configuration-builder.js");
class HappnClusterConfigurationBuilder extends happn_configuration_builder_js_1.HappnConfigurationBuilder {
    #healthConfigBuilder;
    #membershipConfigBuilder;
    #orchestratorConfigBuilder;
    #proxyConfigBuilder;
    #replicatorConfigBuilder;
    constructor(cacheConfigBuilder, connectConfigBuilder, dataConfigBuilder, protocolConfigBuilder, publisherConfigBuilder, securityConfigBuilder, subscriptionConfigBuilder, systemConfigBuilder, transportConfigBuilder, healthConfigBuilder, membershipConfigBuilder, orchestratorConfigBuilder, proxyConfigBuilder, replicatorConfigBuilder) {
        super(cacheConfigBuilder, connectConfigBuilder, dataConfigBuilder, protocolConfigBuilder, publisherConfigBuilder, securityConfigBuilder, subscriptionConfigBuilder, systemConfigBuilder, transportConfigBuilder);
        this.#healthConfigBuilder = healthConfigBuilder;
        this.#membershipConfigBuilder = membershipConfigBuilder;
        this.#orchestratorConfigBuilder = orchestratorConfigBuilder;
        this.#proxyConfigBuilder = proxyConfigBuilder;
        this.#replicatorConfigBuilder = replicatorConfigBuilder;
    }
    /*
    HEALTH
     */
    withHealthInterval(interval) {
        this.#healthConfigBuilder.withHealthInterval(interval);
        return this;
    }
    withHealthWarmupLimit(limit) {
        this.#healthConfigBuilder.withHealthWarmupLimit(limit);
        return this;
    }
    /*
    MEMBERSHIP
     */
    withMembershipClusterName(name) {
        this.#membershipConfigBuilder.withMembershipClusterName(name);
        return this;
    }
    withMembershipDisseminationFactor(factor) {
        this.#membershipConfigBuilder.withMembershipDisseminationFactor(factor);
        return this;
    }
    withMembershipHost(host, port) {
        this.#membershipConfigBuilder.withMembershipHost(host);
        this.#membershipConfigBuilder.withMembershipPort(port);
        return this;
    }
    withMembershipJoinTimeout(timeout) {
        this.#membershipConfigBuilder.withMembershipJoinTimeout(timeout);
        return this;
    }
    withMembershipJoinType(type) {
        this.#membershipConfigBuilder.withMembershipJoinType(type);
        return this;
    }
    withMembershipMemberHost(host) {
        this.#membershipConfigBuilder.withMembershipMemberHost(host);
        return this;
    }
    withMembershipPing(interval, pingTimeout, requestTimeout, requestGroupSize) {
        this.#membershipConfigBuilder.withMembershipPingInterval(interval);
        if (pingTimeout !== undefined)
            this.#membershipConfigBuilder.withMembershipPingTimeout(pingTimeout);
        if (requestTimeout !== undefined)
            this.#membershipConfigBuilder.withMembershipPingReqTimeout(requestTimeout);
        if (requestGroupSize !== undefined)
            this.#membershipConfigBuilder.withMembershipPingReqGroupSize(requestGroupSize);
        return this;
    }
    withMembershipRandomWait(wait) {
        this.#membershipConfigBuilder.withMembershipRandomWait(wait);
        return this;
    }
    withMembershipIsSeed(isSeed) {
        this.#membershipConfigBuilder.withMembershipIsSeed(isSeed);
        return this;
    }
    withMembershipSeedWait(wait) {
        this.#membershipConfigBuilder.withMembershipSeedWait(wait);
        return this;
    }
    withMembershipUdpMaxDgramSize(size) {
        this.#membershipConfigBuilder.withMembershipUdpMaxDgramSize(size);
        return this;
    }
    /*
    ORCHESTRATOR
     */
    withOrchestratorMinimumPeers(minimum) {
        this.#orchestratorConfigBuilder.withOrchestratorMinimumPeers(minimum);
        return this;
    }
    withOrchestratorReplicatePath(path) {
        this.#orchestratorConfigBuilder.withOrchestratorReplicatePath(path);
        return this;
    }
    withOrchestratorStableReportInterval(interval) {
        this.#orchestratorConfigBuilder.withOrchestratorStableReportInterval(interval);
        return this;
    }
    withOrchestratorStabiliseTimeout(timeout) {
        this.#orchestratorConfigBuilder.withOrchestratorStabiliseTimeout(timeout);
        return this;
    }
    /*
    PROXY
     */
    withProxyAllowSelfSignedCerts(allow) {
        this.#proxyConfigBuilder.withProxyAllowSelfSignedCerts(allow);
        return this;
    }
    withProxyCertPath(path) {
        this.#proxyConfigBuilder.withProxyCertPath(path);
        return this;
    }
    withProxyHost(host, port) {
        this.#proxyConfigBuilder.withProxyHost(host);
        this.#proxyConfigBuilder.withProxyPort(port);
        return this;
    }
    withProxyKeyPath(path) {
        this.#proxyConfigBuilder.withProxyKeyPath(path);
        return this;
    }
    withProxyTimeout(timeout) {
        this.#proxyConfigBuilder.withProxyTimeout(timeout);
        return this;
    }
    /*
    REPLICATOR
     */
    withReplicatorSecurityChangeSetReplicateInterval(interval) {
        this.#replicatorConfigBuilder.withReplicatorSecurityChangeSetReplicateInterval(interval);
        return this;
    }
    build() {
        const happnConfig = super.build();
        const clusterBuilder = new BaseBuilder();
        clusterBuilder.set(`health`, this.#healthConfigBuilder, BaseBuilder.Types.OBJECT);
        clusterBuilder.set(`membership`, this.#membershipConfigBuilder, BaseBuilder.Types.OBJECT);
        clusterBuilder.set(`orchestrator`, this.#orchestratorConfigBuilder, BaseBuilder.Types.OBJECT);
        clusterBuilder.set(`proxy`, this.#proxyConfigBuilder, BaseBuilder.Types.OBJECT);
        clusterBuilder.set(`replicator`, this.#replicatorConfigBuilder, BaseBuilder.Types.OBJECT);
        const clusterConfig = clusterBuilder.build();
        return { happn: happnConfig, ...clusterConfig };
    }
}
exports.HappnClusterConfigurationBuilder = HappnClusterConfigurationBuilder;
