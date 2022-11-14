"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _HappnClusterConfigurationBuilder_healthConfigBuilder, _HappnClusterConfigurationBuilder_membershipConfigBuilder, _HappnClusterConfigurationBuilder_orchestratorConfigBuilder, _HappnClusterConfigurationBuilder_proxyConfigBuilder, _HappnClusterConfigurationBuilder_replicatorConfigBuilder;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HappnClusterConfigurationBuilder = void 0;
const BaseBuilder = require('happn-commons/lib/base-builder');
const happn_configuration_builder_1 = require("../happn/happn-configuration-builder");
class HappnClusterConfigurationBuilder extends happn_configuration_builder_1.HappnConfigurationBuilder {
    constructor(cacheConfigBuilder, connectConfigBuilder, dataConfigBuilder, protocolConfigBuilder, publisherConfigBuilder, securityConfigBuilder, subscriptionConfigBuilder, systemConfigBuilder, transportConfigBuilder, healthConfigBuilder, membershipConfigBuilder, orchestratorConfigBuilder, proxyConfigBuilder, replicatorConfigBuilder) {
        super(cacheConfigBuilder, connectConfigBuilder, dataConfigBuilder, protocolConfigBuilder, publisherConfigBuilder, securityConfigBuilder, subscriptionConfigBuilder, systemConfigBuilder, transportConfigBuilder);
        _HappnClusterConfigurationBuilder_healthConfigBuilder.set(this, void 0);
        _HappnClusterConfigurationBuilder_membershipConfigBuilder.set(this, void 0);
        _HappnClusterConfigurationBuilder_orchestratorConfigBuilder.set(this, void 0);
        _HappnClusterConfigurationBuilder_proxyConfigBuilder.set(this, void 0);
        _HappnClusterConfigurationBuilder_replicatorConfigBuilder.set(this, void 0);
        __classPrivateFieldSet(this, _HappnClusterConfigurationBuilder_healthConfigBuilder, healthConfigBuilder, "f");
        __classPrivateFieldSet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, membershipConfigBuilder, "f");
        __classPrivateFieldSet(this, _HappnClusterConfigurationBuilder_orchestratorConfigBuilder, orchestratorConfigBuilder, "f");
        __classPrivateFieldSet(this, _HappnClusterConfigurationBuilder_proxyConfigBuilder, proxyConfigBuilder, "f");
        __classPrivateFieldSet(this, _HappnClusterConfigurationBuilder_replicatorConfigBuilder, replicatorConfigBuilder, "f");
    }
    /*
    HEALTH
     */
    withHealthInterval(interval) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_healthConfigBuilder, "f").withHealthInterval(interval);
        return this;
    }
    withHealthWarmupLimit(limit) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_healthConfigBuilder, "f").withHealthWarmupLimit(limit);
        return this;
    }
    /*
    MEMBERSHIP
     */
    withMembershipClusterName(name) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipClusterName(name);
        return this;
    }
    withMembershipDisseminationFactor(factor) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipDisseminationFactor(factor);
        return this;
    }
    withMembershipHost(host, port) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipHost(host);
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipPort(port);
        return this;
    }
    withMembershipJoinTimeout(timeout) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipJoinTimeout(timeout);
        return this;
    }
    withMembershipJoinType(type) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipJoinType(type);
        return this;
    }
    withMembershipMemberHost(host) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipMemberHost(host);
        return this;
    }
    withMembershipPing(interval, pingTimeout, requestTimeout, requestGroupSize) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipPingInterval(interval);
        if (pingTimeout !== undefined)
            __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipPingTimeout(pingTimeout);
        if (requestTimeout !== undefined)
            __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipPingReqTimeout(requestTimeout);
        if (requestGroupSize !== undefined)
            __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipPingReqGroupSize(requestGroupSize);
        return this;
    }
    withMembershipRandomWait(wait) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipRandomWait(wait);
        return this;
    }
    withMembershipIsSeed(isSeed) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipIsSeed(isSeed);
        return this;
    }
    withMembershipSeedWait(wait) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipSeedWait(wait);
        return this;
    }
    withMembershipUdpMaxDgramSize(size) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipUdpMaxDgramSize(size);
        return this;
    }
    /*
    ORCHESTRATOR
     */
    withOrchestratorMinimumPeers(minimum) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_orchestratorConfigBuilder, "f").withOrchestratorMinimumPeers(minimum);
        return this;
    }
    withOrchestratorReplicatePath(path) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_orchestratorConfigBuilder, "f").withOrchestratorReplicatePath(path);
        return this;
    }
    withOrchestratorStableReportInterval(interval) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_orchestratorConfigBuilder, "f").withOrchestratorStableReportInterval(interval);
        return this;
    }
    withOrchestratorStabiliseTimeout(timeout) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_orchestratorConfigBuilder, "f").withOrchestratorStabiliseTimeout(timeout);
        return this;
    }
    /*
    PROXY
     */
    withProxyAllowSelfSignedCerts(allow) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_proxyConfigBuilder, "f").withProxyAllowSelfSignedCerts(allow);
        return this;
    }
    withProxyCertPath(path) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_proxyConfigBuilder, "f").withProxyCertPath(path);
        return this;
    }
    withProxyHost(host, port) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_proxyConfigBuilder, "f").withProxyHost(host);
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_proxyConfigBuilder, "f").withProxyPort(port);
        return this;
    }
    withProxyKeyPath(path) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_proxyConfigBuilder, "f").withProxyKeyPath(path);
        return this;
    }
    withProxyTimeout(timeout) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_proxyConfigBuilder, "f").withProxyTimeout(timeout);
        return this;
    }
    /*
    REPLICATOR
     */
    withReplicatorSecurityChangeSetReplicateInterval(interval) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_replicatorConfigBuilder, "f").withReplicatorSecurityChangeSetReplicateInterval(interval);
        return this;
    }
    build() {
        const happnConfig = super.build();
        const clusterBuilder = new BaseBuilder();
        clusterBuilder.set(`health`, __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_healthConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
        clusterBuilder.set(`membership`, __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
        clusterBuilder.set(`orchestrator`, __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_orchestratorConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
        clusterBuilder.set(`proxy`, __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_proxyConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
        clusterBuilder.set(`replicator`, __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_replicatorConfigBuilder, "f"), BaseBuilder.Types.OBJECT);
        const clusterConfig = clusterBuilder.build();
        return Object.assign({ happn: happnConfig }, clusterConfig);
    }
}
exports.HappnClusterConfigurationBuilder = HappnClusterConfigurationBuilder;
_HappnClusterConfigurationBuilder_healthConfigBuilder = new WeakMap(), _HappnClusterConfigurationBuilder_membershipConfigBuilder = new WeakMap(), _HappnClusterConfigurationBuilder_orchestratorConfigBuilder = new WeakMap(), _HappnClusterConfigurationBuilder_proxyConfigBuilder = new WeakMap(), _HappnClusterConfigurationBuilder_replicatorConfigBuilder = new WeakMap();
//# sourceMappingURL=happn-cluster-configuration-builder.js.map