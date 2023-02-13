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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _ConfigBuilderFactory_versionUtil, _ConfigBuilderFactory_happnVersion, _ConfigBuilderFactory_happnClusterVersion, _ConfigBuilderFactory_happnerVersion, _ConfigBuilderFactory_happnerClusterVersion;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigBuilderFactory = void 0;
const version_util_1 = require("../utils/version-util");
const builder_constants_1 = __importDefault(require("../constants/builder-constants"));
const field_type_validator_1 = require("../validators/field-type-validator");
const core_builder_1 = require("../builders/core-builder");
const version_constants_1 = __importDefault(require("../constants/version-constants"));
const { HAPPN, HAPPN_CLUSTER, HAPPNER, HAPPNER_CLUSTER } = builder_constants_1.default;
class ConfigBuilderFactory {
    constructor(versionContext) {
        var _a, _b, _c, _d;
        _ConfigBuilderFactory_versionUtil.set(this, void 0);
        _ConfigBuilderFactory_happnVersion.set(this, void 0);
        _ConfigBuilderFactory_happnClusterVersion.set(this, void 0);
        _ConfigBuilderFactory_happnerVersion.set(this, void 0);
        _ConfigBuilderFactory_happnerClusterVersion.set(this, void 0);
        __classPrivateFieldSet(this, _ConfigBuilderFactory_versionUtil, new version_util_1.VersionUtil(), "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_happnVersion, (_a = versionContext.happn) !== null && _a !== void 0 ? _a : '1.0.0', "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_happnClusterVersion, (_b = versionContext.happnCluster) !== null && _b !== void 0 ? _b : '1.0.0', "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_happnerVersion, (_c = versionContext.happner) !== null && _c !== void 0 ? _c : '1.0.0', "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_happnerClusterVersion, (_d = versionContext.happnerCluster) !== null && _d !== void 0 ? _d : '1.0.0', "f");
    }
    // see https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
    getHappnBuilder(version) {
        const HappnCoreBuilder = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.HappnCore, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnVersion, "f"));
        const container = this.createChildBuildersContainer();
        const HappnMixin = HappnCoreBuilder(core_builder_1.CoreBuilder);
        const result = new HappnMixin(container);
        result.builderType = HAPPN;
        return result;
    }
    getHappnClusterBuilder(version) {
        const HappnCoreBuilder = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.HappnCore, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnVersion, "f"));
        const HappnClusterCoreBuilder = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.HappnClusterCore, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnClusterVersion, "f"));
        const container = this.createChildBuildersContainer();
        // create a mixin and instantiate
        const HappnClusterMixin = HappnCoreBuilder(HappnClusterCoreBuilder(core_builder_1.CoreBuilder));
        const result = new HappnClusterMixin(container);
        result.builderType = HAPPN_CLUSTER;
        return result;
    }
    getHappnerBuilder(version) {
        const HappnCoreBuilder = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.HappnCore, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnVersion, "f"));
        const HappnerCoreBuilder = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.HappnerCore, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnerVersion, "f"));
        const container = this.createChildBuildersContainer();
        // create a mixin and instantiate
        const HappnerMixin = HappnCoreBuilder(HappnerCoreBuilder(core_builder_1.CoreBuilder));
        const result = new HappnerMixin(container);
        result.builderType = HAPPNER;
        return result;
    }
    getHappnerClusterBuilder(version) {
        const HappnCoreBuilder = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.HappnCore, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnVersion, "f"));
        const HappnClusterCoreBuilder = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.HappnClusterCore, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnClusterVersion, "f"));
        const HappnerCoreBuilder = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.HappnerCore, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnerVersion, "f"));
        const HappnerClusterCoreBuilder = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.HappnerClusterCore, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnerClusterVersion, "f"));
        const container = this.createChildBuildersContainer();
        // create a mixin and instantiate
        const HappnerClusterMixin = HappnCoreBuilder(HappnClusterCoreBuilder(HappnerCoreBuilder(HappnerClusterCoreBuilder(core_builder_1.CoreBuilder))));
        const result = new HappnerClusterMixin(container);
        result.builderType = HAPPNER_CLUSTER;
        return result;
    }
    createChildBuildersContainer() {
        return {
            // HAPPN
            cacheConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.CacheConfig, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnVersion, "f")))(),
            connectConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.ConnectConfig, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnVersion, "f")))(),
            dataConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.DataConfig, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnVersion, "f")))(),
            protocolConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.ProtocolConfig, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnVersion, "f")))(new field_type_validator_1.FieldTypeValidator()),
            publisherConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.PublisherConfig, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnVersion, "f")))(),
            securityConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.SecurityConfig, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnVersion, "f")))(),
            subscriptionConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.SubscriptionConfig, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnVersion, "f")))(),
            systemConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.SystemConfig, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnVersion, "f")))(),
            transportConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.TransportConfig, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnVersion, "f")))(),
            // HAPPN_CLUSTER
            healthConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.HealthConfig, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnClusterVersion, "f")))(),
            membershipConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.MembershipConfig, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnClusterVersion, "f")))(),
            orchestratorConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.OrchestratorConfig, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnClusterVersion, "f")))(),
            proxyConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.ProxyConfig, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnClusterVersion, "f")))(),
            replicatorConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.ReplicatorConfig, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnClusterVersion, "f")))(),
            // HAPPNER
            componentsConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.ComponentsConfig, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnerVersion, "f")))(),
            endpointsConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.EndpointsConfig, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnerVersion, "f")))(),
            modulesConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(version_constants_1.default.VERSION_THRESHOLDS.ModulesConfig, __classPrivateFieldGet(this, _ConfigBuilderFactory_happnerVersion, "f")))(),
        };
    }
}
exports.ConfigBuilderFactory = ConfigBuilderFactory;
_ConfigBuilderFactory_versionUtil = new WeakMap(), _ConfigBuilderFactory_happnVersion = new WeakMap(), _ConfigBuilderFactory_happnClusterVersion = new WeakMap(), _ConfigBuilderFactory_happnerVersion = new WeakMap(), _ConfigBuilderFactory_happnerClusterVersion = new WeakMap();
