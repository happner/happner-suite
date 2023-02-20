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
var _ConfigBuilderFactory_instances, _ConfigBuilderFactory_mixinFactory, _ConfigBuilderFactory_cacheConfigBuilder, _ConfigBuilderFactory_componentsConfigBuilder, _ConfigBuilderFactory_connectConfigBuilder, _ConfigBuilderFactory_dataConfigBuilder, _ConfigBuilderFactory_endpointsConfigBuilder, _ConfigBuilderFactory_healthConfigBuilder, _ConfigBuilderFactory_membershipConfigBuilder, _ConfigBuilderFactory_modulesConfigBuilder, _ConfigBuilderFactory_orchestratorConfigBuilder, _ConfigBuilderFactory_protocolConfigBuilder, _ConfigBuilderFactory_proxyConfigBuilder, _ConfigBuilderFactory_publisherConfigBuilder, _ConfigBuilderFactory_replicatorConfigBuilder, _ConfigBuilderFactory_securityConfigBuilder, _ConfigBuilderFactory_subscriptionConfigBuilder, _ConfigBuilderFactory_systemConfigBuilder, _ConfigBuilderFactory_transportConfigBuilder, _ConfigBuilderFactory_childBuildersContainer_get;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigBuilderFactory = void 0;
const builder_constants_1 = __importDefault(require("../constants/builder-constants"));
const field_type_validator_1 = require("../validators/field-type-validator");
const mixin_factory_1 = require("./mixin-factory");
const builders_1 = require("../builders/builders");
const { HAPPN, HAPPN_CLUSTER, HAPPNER, HAPPNER_CLUSTER } = builder_constants_1.default;
class ConfigBuilderFactory {
    constructor(mixinFactory, cacheConfigBuilder, componentsConfigBuilder, connectConfigBuilder, dataConfigBuilder, endpointsConfigBuilder, healthConfigBuilder, membershipConfigBuilder, modulesConfigBuilder, orchestratorConfigBuilder, protocolConfigBuilder, proxyConfigBuilder, publisherConfigBuilder, replicatorConfigBuilder, securityConfigBuilder, subscriptionConfigBuilder, systemConfigBuilder, transportConfigBuilder) {
        _ConfigBuilderFactory_instances.add(this);
        _ConfigBuilderFactory_mixinFactory.set(this, void 0);
        _ConfigBuilderFactory_cacheConfigBuilder.set(this, void 0);
        _ConfigBuilderFactory_componentsConfigBuilder.set(this, void 0);
        _ConfigBuilderFactory_connectConfigBuilder.set(this, void 0);
        _ConfigBuilderFactory_dataConfigBuilder.set(this, void 0);
        _ConfigBuilderFactory_endpointsConfigBuilder.set(this, void 0);
        _ConfigBuilderFactory_healthConfigBuilder.set(this, void 0);
        _ConfigBuilderFactory_membershipConfigBuilder.set(this, void 0);
        _ConfigBuilderFactory_modulesConfigBuilder.set(this, void 0);
        _ConfigBuilderFactory_orchestratorConfigBuilder.set(this, void 0);
        _ConfigBuilderFactory_protocolConfigBuilder.set(this, void 0);
        _ConfigBuilderFactory_proxyConfigBuilder.set(this, void 0);
        _ConfigBuilderFactory_publisherConfigBuilder.set(this, void 0);
        _ConfigBuilderFactory_replicatorConfigBuilder.set(this, void 0);
        _ConfigBuilderFactory_securityConfigBuilder.set(this, void 0);
        _ConfigBuilderFactory_subscriptionConfigBuilder.set(this, void 0);
        _ConfigBuilderFactory_systemConfigBuilder.set(this, void 0);
        _ConfigBuilderFactory_transportConfigBuilder.set(this, void 0);
        __classPrivateFieldSet(this, _ConfigBuilderFactory_mixinFactory, mixinFactory, "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_cacheConfigBuilder, cacheConfigBuilder, "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_componentsConfigBuilder, componentsConfigBuilder, "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_connectConfigBuilder, connectConfigBuilder, "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_dataConfigBuilder, dataConfigBuilder, "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_endpointsConfigBuilder, endpointsConfigBuilder, "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_healthConfigBuilder, healthConfigBuilder, "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_membershipConfigBuilder, membershipConfigBuilder, "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_modulesConfigBuilder, modulesConfigBuilder, "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_orchestratorConfigBuilder, orchestratorConfigBuilder, "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_protocolConfigBuilder, protocolConfigBuilder, "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_proxyConfigBuilder, proxyConfigBuilder, "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_publisherConfigBuilder, publisherConfigBuilder, "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_replicatorConfigBuilder, replicatorConfigBuilder, "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_securityConfigBuilder, securityConfigBuilder, "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_subscriptionConfigBuilder, subscriptionConfigBuilder, "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_systemConfigBuilder, systemConfigBuilder, "f");
        __classPrivateFieldSet(this, _ConfigBuilderFactory_transportConfigBuilder, transportConfigBuilder, "f");
    }
    static create() {
        return new ConfigBuilderFactory(new mixin_factory_1.MixinFactory(), new builders_1.CacheConfigBuilder(), new builders_1.ComponentsConfigBuilder(), new builders_1.ConnectConfigBuilder(), new builders_1.DataConfigBuilder(), new builders_1.EndpointsConfigBuilder(), new builders_1.HealthConfigBuilder(), new builders_1.MembershipConfigBuilder(), new builders_1.ModulesConfigBuilder(), new builders_1.OrchestratorConfigBuilder(), new builders_1.ProtocolConfigBuilder(new field_type_validator_1.FieldTypeValidator()), new builders_1.ProxyConfigBuilder(), new builders_1.PublisherConfigBuilder(), new builders_1.ReplicatorConfigBuilder(), new builders_1.SecurityConfigBuilder(), new builders_1.SubscriptionConfigBuilder(), new builders_1.SystemConfigBuilder(), new builders_1.TransportConfigBuilder());
    }
    getHappnBuilder() {
        const HappnMixin = __classPrivateFieldGet(this, _ConfigBuilderFactory_mixinFactory, "f").getMixin(HAPPN);
        const result = new HappnMixin(__classPrivateFieldGet(this, _ConfigBuilderFactory_instances, "a", _ConfigBuilderFactory_childBuildersContainer_get));
        result.builderType = HAPPN;
        return result;
    }
    getHappnClusterBuilder() {
        const HappnClusterMixin = __classPrivateFieldGet(this, _ConfigBuilderFactory_mixinFactory, "f").getMixin(HAPPN_CLUSTER);
        const result = new HappnClusterMixin(__classPrivateFieldGet(this, _ConfigBuilderFactory_instances, "a", _ConfigBuilderFactory_childBuildersContainer_get));
        result.builderType = HAPPN_CLUSTER;
        return result;
    }
    getHappnerBuilder() {
        const HappnerMixin = __classPrivateFieldGet(this, _ConfigBuilderFactory_mixinFactory, "f").getMixin(HAPPNER);
        const result = new HappnerMixin(__classPrivateFieldGet(this, _ConfigBuilderFactory_instances, "a", _ConfigBuilderFactory_childBuildersContainer_get));
        result.builderType = HAPPNER;
        return result;
    }
    getHappnerClusterBuilder() {
        const HappnerClusterMixin = __classPrivateFieldGet(this, _ConfigBuilderFactory_mixinFactory, "f").getMixin(HAPPNER_CLUSTER);
        const result = new HappnerClusterMixin(__classPrivateFieldGet(this, _ConfigBuilderFactory_instances, "a", _ConfigBuilderFactory_childBuildersContainer_get));
        result.builderType = HAPPNER_CLUSTER;
        return result;
    }
}
exports.ConfigBuilderFactory = ConfigBuilderFactory;
_ConfigBuilderFactory_mixinFactory = new WeakMap(), _ConfigBuilderFactory_cacheConfigBuilder = new WeakMap(), _ConfigBuilderFactory_componentsConfigBuilder = new WeakMap(), _ConfigBuilderFactory_connectConfigBuilder = new WeakMap(), _ConfigBuilderFactory_dataConfigBuilder = new WeakMap(), _ConfigBuilderFactory_endpointsConfigBuilder = new WeakMap(), _ConfigBuilderFactory_healthConfigBuilder = new WeakMap(), _ConfigBuilderFactory_membershipConfigBuilder = new WeakMap(), _ConfigBuilderFactory_modulesConfigBuilder = new WeakMap(), _ConfigBuilderFactory_orchestratorConfigBuilder = new WeakMap(), _ConfigBuilderFactory_protocolConfigBuilder = new WeakMap(), _ConfigBuilderFactory_proxyConfigBuilder = new WeakMap(), _ConfigBuilderFactory_publisherConfigBuilder = new WeakMap(), _ConfigBuilderFactory_replicatorConfigBuilder = new WeakMap(), _ConfigBuilderFactory_securityConfigBuilder = new WeakMap(), _ConfigBuilderFactory_subscriptionConfigBuilder = new WeakMap(), _ConfigBuilderFactory_systemConfigBuilder = new WeakMap(), _ConfigBuilderFactory_transportConfigBuilder = new WeakMap(), _ConfigBuilderFactory_instances = new WeakSet(), _ConfigBuilderFactory_childBuildersContainer_get = function _ConfigBuilderFactory_childBuildersContainer_get() {
    return {
        // HAPPN
        cacheConfigBuilder: __classPrivateFieldGet(this, _ConfigBuilderFactory_cacheConfigBuilder, "f"),
        connectConfigBuilder: __classPrivateFieldGet(this, _ConfigBuilderFactory_connectConfigBuilder, "f"),
        dataConfigBuilder: __classPrivateFieldGet(this, _ConfigBuilderFactory_dataConfigBuilder, "f"),
        protocolConfigBuilder: __classPrivateFieldGet(this, _ConfigBuilderFactory_protocolConfigBuilder, "f"),
        publisherConfigBuilder: __classPrivateFieldGet(this, _ConfigBuilderFactory_publisherConfigBuilder, "f"),
        securityConfigBuilder: __classPrivateFieldGet(this, _ConfigBuilderFactory_securityConfigBuilder, "f"),
        subscriptionConfigBuilder: __classPrivateFieldGet(this, _ConfigBuilderFactory_subscriptionConfigBuilder, "f"),
        systemConfigBuilder: __classPrivateFieldGet(this, _ConfigBuilderFactory_systemConfigBuilder, "f"),
        transportConfigBuilder: __classPrivateFieldGet(this, _ConfigBuilderFactory_transportConfigBuilder, "f"),
        // HAPPN_CLUSTER
        healthConfigBuilder: __classPrivateFieldGet(this, _ConfigBuilderFactory_healthConfigBuilder, "f"),
        membershipConfigBuilder: __classPrivateFieldGet(this, _ConfigBuilderFactory_membershipConfigBuilder, "f"),
        orchestratorConfigBuilder: __classPrivateFieldGet(this, _ConfigBuilderFactory_orchestratorConfigBuilder, "f"),
        proxyConfigBuilder: __classPrivateFieldGet(this, _ConfigBuilderFactory_proxyConfigBuilder, "f"),
        replicatorConfigBuilder: __classPrivateFieldGet(this, _ConfigBuilderFactory_replicatorConfigBuilder, "f"),
        // HAPPNER
        componentsConfigBuilder: __classPrivateFieldGet(this, _ConfigBuilderFactory_componentsConfigBuilder, "f"),
        endpointsConfigBuilder: __classPrivateFieldGet(this, _ConfigBuilderFactory_endpointsConfigBuilder, "f"),
        modulesConfigBuilder: __classPrivateFieldGet(this, _ConfigBuilderFactory_modulesConfigBuilder, "f"),
    };
};
