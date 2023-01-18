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
var _BaseClz_builderType, _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigBuilderFactory = void 0;
/* eslint-disable @typescript-eslint/no-var-requires */
const BaseBuilder = require('happn-commons/lib/base-builder');
const builder_constants_1 = __importDefault(require("../constants/builder-constants"));
const cache_config_builder_1 = require("../builders/happn/services/cache-config-builder");
const connect_config_builder_1 = require("../builders/happn/services/connect-config-builder");
const data_config_builder_1 = require("../builders/happn/services/data-config-builder");
const publisher_config_builder_1 = require("../builders/happn/services/publisher-config-builder");
const protocol_config_builder_1 = require("../builders/happn/services/protocol-config-builder");
const security_config_builder_1 = require("../builders/happn/services/security-config-builder");
const subscription_config_builder_1 = require("../builders/happn/services/subscription-config-builder");
const system_config_builder_1 = require("../builders/happn/services/system-config-builder");
const transport_config_builder_1 = require("../builders/happn/services/transport-config-builder");
const membership_config_builder_1 = require("../builders/happn/services/membership-config-builder");
const orchestrator_config_builder_1 = require("../builders/happn/services/orchestrator-config-builder");
const replicator_config_builder_1 = require("../builders/happn/services/replicator-config-builder");
const proxy_config_builder_1 = require("../builders/happn/services/proxy-config-builder");
const health_config_builder_1 = require("../builders/happn/services/health-config-builder");
const field_type_validator_1 = require("../validators/field-type-validator");
const components_config_builder_1 = require("../builders/happner/components/components-config-builder");
const endpoints_config_builder_1 = require("../builders/happner/endpoints/endpoints-config-builder");
const modules_config_builder_1 = require("../builders/happner/modules/modules-config-builder");
// mixin specific imports
const happn_core_mixin_1 = require("../builders/happn/happn-core-mixin");
const happn_cluster_core_mixin_1 = require("../builders/happn-cluster/happn-cluster-core-mixin");
const happner_core_mixin_1 = require("../builders/happner/happner-core-mixin");
const happner_cluster_core_mixin_1 = require("../builders/happner-cluster/happner-cluster-core-mixin");
const { HAPPN, HAPPN_CLUSTER, HAPPNER, HAPPNER_CLUSTER } = builder_constants_1.default;
// core class used for mixins...
const BaseClz = (_a = class BaseClz extends BaseBuilder {
        constructor(...args) {
            super(...args);
            _BaseClz_builderType.set(this, void 0);
        }
        set builderType(type) {
            __classPrivateFieldSet(this, _BaseClz_builderType, type, "f");
        }
        get builderType() {
            return __classPrivateFieldGet(this, _BaseClz_builderType, "f");
        }
        build() {
            const result = super.build();
            switch (this.builderType) {
                case HAPPN:
                case HAPPN_CLUSTER:
                    return result.happn;
                case HAPPNER:
                case HAPPNER_CLUSTER:
                    return result;
                default:
                    throw new Error('unknown baseType');
            }
        }
    },
    _BaseClz_builderType = new WeakMap(),
    _a);
class ConfigBuilderFactory {
    static getBuilder(type) {
        switch (type) {
            case HAPPN:
                return ConfigBuilderFactory.getHappnBuilder();
            case HAPPN_CLUSTER:
                return ConfigBuilderFactory.getHappnClusterBuilder();
            case HAPPNER:
                return ConfigBuilderFactory.getHappnerBuilder();
            case HAPPNER_CLUSTER:
                return ConfigBuilderFactory.getHappnerClusterBuilder();
            default:
                throw new Error('Unknown configuration type');
        }
    }
    static getHappnBuilder() {
        const container = ConfigBuilderFactory.createContainer();
        const HappnMixin = (0, happn_core_mixin_1.HappnCoreBuilder)(BaseClz);
        const result = new HappnMixin(container);
        result.builderType = HAPPN;
        return result;
    }
    static getHappnClusterBuilder() {
        const container = ConfigBuilderFactory.createContainer();
        const HappnClusterMixin = (0, happn_core_mixin_1.HappnCoreBuilder)((0, happn_cluster_core_mixin_1.HappnClusterCoreBuilder)(BaseClz));
        const result = new HappnClusterMixin(container);
        result.builderType = HAPPN_CLUSTER;
        return result;
    }
    static getHappnerBuilder() {
        const container = ConfigBuilderFactory.createContainer();
        const HappnerMixin = (0, happn_core_mixin_1.HappnCoreBuilder)((0, happner_core_mixin_1.HappnerCoreBuilder)(BaseClz));
        const result = new HappnerMixin(container);
        result.builderType = HAPPNER;
        return result;
    }
    static getHappnerClusterBuilder() {
        const container = ConfigBuilderFactory.createContainer();
        const HappnerClusterMixin = (0, happn_core_mixin_1.HappnCoreBuilder)((0, happn_cluster_core_mixin_1.HappnClusterCoreBuilder)((0, happner_core_mixin_1.HappnerCoreBuilder)((0, happner_cluster_core_mixin_1.HappnerClusterCoreBuilder)(BaseClz))));
        const result = new HappnerClusterMixin(container);
        result.builderType = HAPPNER_CLUSTER;
        return result;
    }
    static createContainer() {
        return {
            cacheConfigBuilder: new cache_config_builder_1.CacheConfigBuilder(),
            componentsConfigBuilder: new components_config_builder_1.ComponentsConfigBuilder(),
            connectConfigBuilder: new connect_config_builder_1.ConnectConfigBuilder(),
            dataConfigBuilder: new data_config_builder_1.DataConfigBuilder(),
            endpointsConfigBuilder: new endpoints_config_builder_1.EndpointsConfigBuilder(),
            membershipConfigBuilder: new membership_config_builder_1.MembershipConfigBuilder(),
            modulesConfigBuilder: new modules_config_builder_1.ModulesConfigBuilder(),
            orchestratorConfigBuilder: new orchestrator_config_builder_1.OrchestratorConfigBuilder(),
            protocolConfigBuilder: new protocol_config_builder_1.ProtocolConfigBuilder(new field_type_validator_1.FieldTypeValidator()),
            proxyConfigBuilder: new proxy_config_builder_1.ProxyConfigBuilder(),
            publisherConfigBuilder: new publisher_config_builder_1.PublisherConfigBuilder(),
            replicatorConfigBuilder: new replicator_config_builder_1.ReplicatorConfigBuilder(),
            securityConfigBuilder: new security_config_builder_1.SecurityConfigBuilder(),
            subscriptionConfigBuilder: new subscription_config_builder_1.SubscriptionConfigBuilder(),
            systemConfigBuilder: new system_config_builder_1.SystemConfigBuilder(),
            transportConfigBuilder: new transport_config_builder_1.TransportConfigBuilder(),
            healthConfigBuilder: new health_config_builder_1.HealthConfigBuilder(),
        };
    }
}
exports.ConfigBuilderFactory = ConfigBuilderFactory;
