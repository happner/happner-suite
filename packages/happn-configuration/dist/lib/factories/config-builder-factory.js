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
var _ConfigBuilderFactory_versionMap, _ConfigBuilderFactory_versionUtil, _ConfigBuilderFactory_versionContext, _ConfigBuilderFactory_happnVersion, _ConfigBuilderFactory_happnClusterVersion, _ConfigBuilderFactory_happnerVersion, _ConfigBuilderFactory_happnerClusterVersion;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigBuilderFactory = void 0;
const version_util_1 = require("../utils/version-util");
const builder_constants_1 = __importDefault(require("../constants/builder-constants"));
const field_type_validator_1 = require("../validators/field-type-validator");
const core_builder_1 = require("../builders/core-builder");
const version_map_1 = __importDefault(require("../maps/version-map"));
const { HAPPN, HAPPN_CLUSTER, HAPPNER, HAPPNER_CLUSTER } = builder_constants_1.default;
class ConfigBuilderFactory {
    constructor(versionMap, versionUtil, versionContext) {
        var _a, _b, _c, _d;
        _ConfigBuilderFactory_versionMap.set(this, void 0);
        _ConfigBuilderFactory_versionUtil.set(this, void 0);
        _ConfigBuilderFactory_versionContext.set(this, void 0);
        _ConfigBuilderFactory_happnVersion.set(this, void 0);
        _ConfigBuilderFactory_happnClusterVersion.set(this, void 0);
        _ConfigBuilderFactory_happnerVersion.set(this, void 0);
        _ConfigBuilderFactory_happnerClusterVersion.set(this, void 0);
        __classPrivateFieldSet(this, _ConfigBuilderFactory_versionMap, versionMap, "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_versionUtil, versionUtil, "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_versionContext, versionContext, "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_happnVersion, (_a = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionContext, "f").happn) !== null && _a !== void 0 ? _a : __classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findMaxModuleVersion(__classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('HappnCore')), "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_happnClusterVersion, (_b = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionContext, "f").happnCluster) !== null && _b !== void 0 ? _b : __classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findMaxModuleVersion(__classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('HappnClusterCore')), "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_happnerVersion, (_c = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionContext, "f").happner) !== null && _c !== void 0 ? _c : __classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findMaxModuleVersion(__classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('HappnerCore')), "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_happnerClusterVersion, (_d = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionContext, "f").happnerCluster) !== null && _d !== void 0 ? _d : __classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findMaxModuleVersion(__classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('HappnerClusterCore')), "f");
    }
    static create(versionContext) {
        return new ConfigBuilderFactory(version_map_1.default, new version_util_1.VersionUtil(), versionContext);
    }
    getHappnBuilder() {
        const HappnCoreBuilder = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(__classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('HappnCore'), __classPrivateFieldGet(this, _ConfigBuilderFactory_happnVersion, "f"));
        const container = this.createChildBuildersContainer();
        // create a mixin and instantiate
        const HappnMixin = HappnCoreBuilder(core_builder_1.CoreBuilder);
        const result = new HappnMixin(container);
        result.builderType = HAPPN;
        return result;
    }
    getHappnClusterBuilder() {
        const HappnCoreBuilder = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(__classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('HappnCore'), __classPrivateFieldGet(this, _ConfigBuilderFactory_happnVersion, "f"));
        const HappnClusterCoreBuilder = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(__classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('HappnClusterCore'), __classPrivateFieldGet(this, _ConfigBuilderFactory_happnClusterVersion, "f"));
        const container = this.createChildBuildersContainer();
        // create a mixin and instantiate
        const HappnClusterMixin = HappnClusterCoreBuilder(HappnCoreBuilder(core_builder_1.CoreBuilder));
        const result = new HappnClusterMixin(container);
        result.builderType = HAPPN_CLUSTER;
        return result;
    }
    getHappnerBuilder() {
        const HappnCoreBuilder = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(__classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('HappnCore'), __classPrivateFieldGet(this, _ConfigBuilderFactory_happnVersion, "f"));
        const HappnerCoreBuilder = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(__classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('HappnerCore'), __classPrivateFieldGet(this, _ConfigBuilderFactory_happnerVersion, "f"));
        const container = this.createChildBuildersContainer();
        // create a mixin and instantiate
        const HappnerMixin = HappnerCoreBuilder(HappnCoreBuilder(core_builder_1.CoreBuilder));
        const result = new HappnerMixin(container);
        result.builderType = HAPPNER;
        return result;
    }
    getHappnerClusterBuilder() {
        const HappnCoreBuilder = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(__classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('HappnCore'), __classPrivateFieldGet(this, _ConfigBuilderFactory_happnVersion, "f"));
        const HappnClusterCoreBuilder = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(__classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('HappnClusterCore'), __classPrivateFieldGet(this, _ConfigBuilderFactory_happnClusterVersion, "f"));
        const HappnerCoreBuilder = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(__classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('HappnerCore'), __classPrivateFieldGet(this, _ConfigBuilderFactory_happnerVersion, "f"));
        const HappnerClusterCoreBuilder = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(__classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('HappnerClusterCore'), __classPrivateFieldGet(this, _ConfigBuilderFactory_happnerClusterVersion, "f"));
        const container = this.createChildBuildersContainer();
        // create a mixin and instantiate
        const HappnerClusterMixin = HappnerClusterCoreBuilder(HappnClusterCoreBuilder(HappnerCoreBuilder(HappnCoreBuilder(core_builder_1.CoreBuilder))));
        const result = new HappnerClusterMixin(container);
        result.builderType = HAPPNER_CLUSTER;
        return result;
    }
    createChildBuildersContainer() {
        const happnVersion = __classPrivateFieldGet(this, _ConfigBuilderFactory_happnVersion, "f");
        const happnClusterVersion = __classPrivateFieldGet(this, _ConfigBuilderFactory_happnClusterVersion, "f");
        const happnerVersion = __classPrivateFieldGet(this, _ConfigBuilderFactory_happnerVersion, "f");
        const cacheConfigVersions = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('CacheConfig');
        const connectConfigVersions = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('ConnectConfig');
        const dataConfigVersions = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('DataConfig');
        const protocolConfigVersions = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('ProtocolConfig');
        const publisherConfigVersions = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('PublisherConfig');
        const securityConfigVersions = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('SecurityConfig');
        const subscriptionConfigVersions = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('SubscriptionConfig');
        const systemConfigVersions = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('SystemConfig');
        const transportConfigVersions = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('TransportConfig');
        const healthConfigVersions = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('HealthConfig');
        const membershipConfigVersions = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('MembershipConfig');
        const orchestratorConfigVersions = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('OrchestratorConfig');
        const proxyConfigVersions = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('ProxyConfig');
        const replicatorConfigVersions = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('ReplicatorConfig');
        const componentsConfigVersions = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('ComponentsConfig');
        const endpointsConfigVersions = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('EndpointsConfig');
        const modulesConfigVersions = __classPrivateFieldGet(this, _ConfigBuilderFactory_versionMap, "f").get('ModulesConfig');
        return {
            // HAPPN
            cacheConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(cacheConfigVersions, happnVersion))(),
            connectConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(connectConfigVersions, happnVersion))(),
            dataConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(dataConfigVersions, happnVersion))(),
            protocolConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(protocolConfigVersions, happnVersion))(new field_type_validator_1.FieldTypeValidator()),
            publisherConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(publisherConfigVersions, happnVersion))(),
            securityConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(securityConfigVersions, happnVersion))(),
            subscriptionConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(subscriptionConfigVersions, happnVersion))(),
            systemConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(systemConfigVersions, happnVersion))(),
            transportConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(transportConfigVersions, happnVersion))(),
            // HAPPN_CLUSTER
            healthConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(healthConfigVersions, happnClusterVersion))(),
            membershipConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(membershipConfigVersions, happnClusterVersion))(),
            orchestratorConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(orchestratorConfigVersions, happnClusterVersion))(),
            proxyConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(proxyConfigVersions, happnClusterVersion))(),
            replicatorConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(replicatorConfigVersions, happnClusterVersion))(),
            // HAPPNER
            componentsConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(componentsConfigVersions, happnerVersion))(),
            endpointsConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(endpointsConfigVersions, happnerVersion))(),
            modulesConfigBuilder: new (__classPrivateFieldGet(this, _ConfigBuilderFactory_versionUtil, "f").findClosestModuleMatch(modulesConfigVersions, happnerVersion))(),
        };
    }
}
exports.ConfigBuilderFactory = ConfigBuilderFactory;
_ConfigBuilderFactory_versionMap = new WeakMap(), _ConfigBuilderFactory_versionUtil = new WeakMap(), _ConfigBuilderFactory_versionContext = new WeakMap(), _ConfigBuilderFactory_happnVersion = new WeakMap(), _ConfigBuilderFactory_happnClusterVersion = new WeakMap(), _ConfigBuilderFactory_happnerVersion = new WeakMap(), _ConfigBuilderFactory_happnerClusterVersion = new WeakMap();
