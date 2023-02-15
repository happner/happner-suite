"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigBuilderFactory = void 0;
const builder_constants_1 = __importDefault(require("../constants/builder-constants"));
const field_type_validator_1 = require("../validators/field-type-validator");
const core_builder_1 = require("../builders/core-builder");
const builders_1 = require("../builders/builders");
const { HAPPN, HAPPN_CLUSTER, HAPPNER, HAPPNER_CLUSTER } = builder_constants_1.default;
class ConfigBuilderFactory {
    static create() {
        return new ConfigBuilderFactory();
    }
    getHappnBuilder() {
        const container = this.createChildBuildersContainer();
        // create a mixin and instantiate
        const HappnMixin = (0, builders_1.HappnCoreBuilder)(core_builder_1.CoreBuilder);
        const result = new HappnMixin(container);
        result.builderType = HAPPN;
        return result;
    }
    getHappnClusterBuilder() {
        const container = this.createChildBuildersContainer();
        // create a mixin and instantiate
        const HappnClusterMixin = (0, builders_1.HappnClusterCoreBuilder)((0, builders_1.HappnCoreBuilder)(core_builder_1.CoreBuilder));
        const result = new HappnClusterMixin(container);
        result.builderType = HAPPN_CLUSTER;
        return result;
    }
    getHappnerBuilder() {
        const container = this.createChildBuildersContainer();
        // create a mixin and instantiate
        const HappnerMixin = (0, builders_1.HappnerCoreBuilder)((0, builders_1.HappnCoreBuilder)(core_builder_1.CoreBuilder));
        const result = new HappnerMixin(container);
        result.builderType = HAPPNER;
        return result;
    }
    getHappnerClusterBuilder() {
        const container = this.createChildBuildersContainer();
        // create a mixin and instantiate
        const HappnerClusterMixin = (0, builders_1.HappnerClusterCoreBuilder)((0, builders_1.HappnClusterCoreBuilder)((0, builders_1.HappnerCoreBuilder)((0, builders_1.HappnCoreBuilder)(core_builder_1.CoreBuilder))));
        const result = new HappnerClusterMixin(container);
        result.builderType = HAPPNER_CLUSTER;
        return result;
    }
    createChildBuildersContainer() {
        return {
            // HAPPN
            cacheConfigBuilder: new builders_1.CacheConfigBuilder(),
            connectConfigBuilder: new builders_1.ConnectConfigBuilder(),
            dataConfigBuilder: new builders_1.DataConfigBuilder(),
            protocolConfigBuilder: new builders_1.ProtocolConfigBuilder(new field_type_validator_1.FieldTypeValidator()),
            publisherConfigBuilder: new builders_1.PublisherConfigBuilder(),
            securityConfigBuilder: new builders_1.SecurityConfigBuilder(),
            subscriptionConfigBuilder: new builders_1.SubscriptionConfigBuilder(),
            systemConfigBuilder: new builders_1.SystemConfigBuilder(),
            transportConfigBuilder: new builders_1.TransportConfigBuilder(),
            // HAPPN_CLUSTER
            healthConfigBuilder: new builders_1.HealthConfigBuilder(),
            membershipConfigBuilder: new builders_1.MembershipConfigBuilder(),
            orchestratorConfigBuilder: new builders_1.OrchestratorConfigBuilder(),
            proxyConfigBuilder: new builders_1.ProxyConfigBuilder(),
            replicatorConfigBuilder: new builders_1.ReplicatorConfigBuilder(),
            // HAPPNER
            componentsConfigBuilder: new builders_1.ComponentsConfigBuilder(),
            endpointsConfigBuilder: new builders_1.EndpointsConfigBuilder(),
            modulesConfigBuilder: new builders_1.ModulesConfigBuilder(),
        };
    }
}
exports.ConfigBuilderFactory = ConfigBuilderFactory;
