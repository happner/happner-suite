"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var _HappnClusterConfigurationBuilder_happnClusterConfigBuilder, _HappnClusterConfigurationBuilder_healthConfigBuilder, _HappnClusterConfigurationBuilder_membershipConfigBuilder, _HappnClusterConfigurationBuilder_orchestratorConfigBuilder, _HappnClusterConfigurationBuilder_proxyConfigBuilder, _HappnClusterConfigurationBuilder_replicatorConfigBuilder;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HappnClusterConfigurationBuilder = void 0;
var happn_configuration_builder_1 = require("./happn-configuration-builder");
var HappnClusterConfigurationBuilder = /** @class */ (function (_super) {
    __extends(HappnClusterConfigurationBuilder, _super);
    function HappnClusterConfigurationBuilder(happnConfigBuilder, cacheConfigBuilder, connectConfigBuilder, dataConfigBuilder, protocolConfigBuilder, publisherConfigBuilder, securityConfigBuilder, subscriptionConfigBuilder, systemConfigBuilder, transportConfigBuilder, happnClusterConfigBuilder, healthConfigBuilder, membershipConfigBuilder, orchestratorConfigBuilder, proxyConfigBuilder, replicatorConfigBuilder) {
        var _this = _super.call(this, happnConfigBuilder, cacheConfigBuilder, connectConfigBuilder, dataConfigBuilder, protocolConfigBuilder, publisherConfigBuilder, securityConfigBuilder, subscriptionConfigBuilder, systemConfigBuilder, transportConfigBuilder) || this;
        _HappnClusterConfigurationBuilder_happnClusterConfigBuilder.set(_this, void 0);
        _HappnClusterConfigurationBuilder_healthConfigBuilder.set(_this, void 0);
        _HappnClusterConfigurationBuilder_membershipConfigBuilder.set(_this, void 0);
        _HappnClusterConfigurationBuilder_orchestratorConfigBuilder.set(_this, void 0);
        _HappnClusterConfigurationBuilder_proxyConfigBuilder.set(_this, void 0);
        _HappnClusterConfigurationBuilder_replicatorConfigBuilder.set(_this, void 0);
        __classPrivateFieldSet(_this, _HappnClusterConfigurationBuilder_happnClusterConfigBuilder, happnClusterConfigBuilder, "f");
        __classPrivateFieldSet(_this, _HappnClusterConfigurationBuilder_healthConfigBuilder, healthConfigBuilder, "f");
        __classPrivateFieldSet(_this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, membershipConfigBuilder, "f");
        __classPrivateFieldSet(_this, _HappnClusterConfigurationBuilder_orchestratorConfigBuilder, orchestratorConfigBuilder, "f");
        __classPrivateFieldSet(_this, _HappnClusterConfigurationBuilder_proxyConfigBuilder, proxyConfigBuilder, "f");
        __classPrivateFieldSet(_this, _HappnClusterConfigurationBuilder_replicatorConfigBuilder, replicatorConfigBuilder, "f");
        return _this;
    }
    /*
    HEALTH
     */
    HappnClusterConfigurationBuilder.prototype.withHealthInterval = function (interval) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_healthConfigBuilder, "f").withHealthInterval(interval);
        return this;
    };
    HappnClusterConfigurationBuilder.prototype.withHealthWarmupLimit = function (limit) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_healthConfigBuilder, "f").withHealthWarmupLimit(limit);
        return this;
    };
    /*
    MEMBERSHIP
     */
    HappnClusterConfigurationBuilder.prototype.withMembershipClusterName = function (name) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipClusterName(name);
        return this;
    };
    HappnClusterConfigurationBuilder.prototype.withMembershipDisseminationFactor = function (factor) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipDisseminationFactor(factor);
        return this;
    };
    HappnClusterConfigurationBuilder.prototype.withMembershipHost = function (host, port) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipHost(host);
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipPort(port);
        return this;
    };
    HappnClusterConfigurationBuilder.prototype.withMembershipJoinTimeout = function (timeout) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipJoinTimeout(timeout);
        return this;
    };
    HappnClusterConfigurationBuilder.prototype.withMembershipJoinType = function (type) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipJoinType(type);
        return this;
    };
    HappnClusterConfigurationBuilder.prototype.withMembershipMemberHost = function (host) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipMemberHost(host);
        return this;
    };
    HappnClusterConfigurationBuilder.prototype.withMembershipPing = function (interval, pingTimeout, requestTimeout, requestGroupSize) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipPingInterval(interval);
        if (pingTimeout !== undefined)
            __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipPingTimeout(pingTimeout);
        if (requestTimeout !== undefined)
            __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipPingReqTimeout(requestTimeout);
        if (requestGroupSize !== undefined)
            __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipPingReqGroupSize(requestGroupSize);
        return this;
    };
    HappnClusterConfigurationBuilder.prototype.withMembershipRandomWait = function (wait) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipRandomWait(wait);
        return this;
    };
    HappnClusterConfigurationBuilder.prototype.withMembershipIsSeed = function (isSeed) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipIsSeed(isSeed);
        return this;
    };
    HappnClusterConfigurationBuilder.prototype.withMembershipSeedWait = function (wait) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipSeedWait(wait);
        return this;
    };
    HappnClusterConfigurationBuilder.prototype.withMembershipUdpMaxDgramSize = function (size) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f").withMembershipUdpMaxDgramSize(size);
        return this;
    };
    /*
    ORCHESTRATOR
     */
    HappnClusterConfigurationBuilder.prototype.withOrchestratorMinimumPeers = function (minimum) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_orchestratorConfigBuilder, "f").withOrchestratorMinimumPeers(minimum);
        return this;
    };
    HappnClusterConfigurationBuilder.prototype.withOrchestratorReplicatePath = function (path) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_orchestratorConfigBuilder, "f").withOrchestratorReplicatePath(path);
        return this;
    };
    HappnClusterConfigurationBuilder.prototype.withOrchestratorStableReportInterval = function (interval) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_orchestratorConfigBuilder, "f").withOrchestratorStableReportInterval(interval);
        return this;
    };
    HappnClusterConfigurationBuilder.prototype.withOrchestratorStabiliseTimeout = function (timeout) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_orchestratorConfigBuilder, "f").withOrchestratorStabiliseTimeout(timeout);
        return this;
    };
    /*
    PROXY
     */
    HappnClusterConfigurationBuilder.prototype.withProxyAllowSelfSignedCerts = function (allow) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_proxyConfigBuilder, "f").withProxyAllowSelfSignedCerts(allow);
        return this;
    };
    HappnClusterConfigurationBuilder.prototype.withProxyCertPath = function (path) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_proxyConfigBuilder, "f").withProxyCertPath(path);
        return this;
    };
    HappnClusterConfigurationBuilder.prototype.withProxyHost = function (host, port) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_proxyConfigBuilder, "f").withProxyHost(host);
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_proxyConfigBuilder, "f").withProxyPort(port);
        return this;
    };
    HappnClusterConfigurationBuilder.prototype.withProxyKeyPath = function (path) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_proxyConfigBuilder, "f").withProxyKeyPath(path);
        return this;
    };
    HappnClusterConfigurationBuilder.prototype.withProxyTimeout = function (timeout) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_proxyConfigBuilder, "f").withProxyTimeout(timeout);
        return this;
    };
    /*
    REPLICATOR
     */
    HappnClusterConfigurationBuilder.prototype.withReplicatorSecurityChangeSetReplicateInterval = function (interval) {
        __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_replicatorConfigBuilder, "f").withReplicatorSecurityChangeSetReplicateInterval(interval);
        return this;
    };
    HappnClusterConfigurationBuilder.prototype.build = function () {
        var happnConfig = _super.prototype.build.call(this);
        var happnClusterConfig = __classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_happnClusterConfigBuilder, "f")
            .withHealthConfigBuilder(__classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_healthConfigBuilder, "f"))
            .withMembershipConfigBuilder(__classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_membershipConfigBuilder, "f"))
            .withOrchestratorConfigBuilder(__classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_orchestratorConfigBuilder, "f"))
            .withProxyConfigBuilder(__classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_proxyConfigBuilder, "f"))
            .withReplicatorConfigBuilder(__classPrivateFieldGet(this, _HappnClusterConfigurationBuilder_replicatorConfigBuilder, "f"))
            .build();
        return __assign(__assign({}, happnConfig), happnClusterConfig);
    };
    return HappnClusterConfigurationBuilder;
}(happn_configuration_builder_1.HappnConfigurationBuilder));
exports.HappnClusterConfigurationBuilder = HappnClusterConfigurationBuilder;
_HappnClusterConfigurationBuilder_happnClusterConfigBuilder = new WeakMap(), _HappnClusterConfigurationBuilder_healthConfigBuilder = new WeakMap(), _HappnClusterConfigurationBuilder_membershipConfigBuilder = new WeakMap(), _HappnClusterConfigurationBuilder_orchestratorConfigBuilder = new WeakMap(), _HappnClusterConfigurationBuilder_proxyConfigBuilder = new WeakMap(), _HappnClusterConfigurationBuilder_replicatorConfigBuilder = new WeakMap();
