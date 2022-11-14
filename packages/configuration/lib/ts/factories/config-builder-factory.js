"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigBuilderFactory = void 0;
const happn_configuration_builder_1 = require("../builders/happn/happn-configuration-builder");
const happn_cluster_configuration_builder_1 = require("../builders/happn-cluster/happn-cluster-configuration-builder");
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
const field_type_validator_1 = __importDefault(require("../../validators/field-type-validator"));
const happner_configuration_builder_1 = require("../builders/happner/happner-configuration-builder");
const components_config_builder_1 = require("../builders/happner/components/components-config-builder");
const endpoints_config_builder_1 = require("../builders/happner/endpoints/endpoints-config-builder");
const modules_config_builder_1 = require("../builders/happner/modules/modules-config-builder");
const BUILDER_TYPE = require('../../constants/builder-constants');
class ConfigBuilderFactory {
    static getBuilder(type) {
        switch (type) {
            case BUILDER_TYPE.HAPPN:
                return new happn_configuration_builder_1.HappnConfigurationBuilder(new cache_config_builder_1.CacheConfigBuilder(), new connect_config_builder_1.ConnectConfigBuilder(), new data_config_builder_1.DataConfigBuilder(), new protocol_config_builder_1.ProtocolConfigBuilder(new field_type_validator_1.default()), new publisher_config_builder_1.PublisherConfigBuilder(), new security_config_builder_1.SecurityConfigBuilder(), new subscription_config_builder_1.SubscriptionConfigBuilder(), new system_config_builder_1.SystemConfigBuilder(), new transport_config_builder_1.TransportConfigBuilder());
            case BUILDER_TYPE.HAPPN_CLUSTER:
                return new happn_cluster_configuration_builder_1.HappnClusterConfigurationBuilder(new cache_config_builder_1.CacheConfigBuilder(), new connect_config_builder_1.ConnectConfigBuilder(), new data_config_builder_1.DataConfigBuilder(), new protocol_config_builder_1.ProtocolConfigBuilder(new field_type_validator_1.default()), new publisher_config_builder_1.PublisherConfigBuilder(), new security_config_builder_1.SecurityConfigBuilder(), new subscription_config_builder_1.SubscriptionConfigBuilder(), new system_config_builder_1.SystemConfigBuilder(), new transport_config_builder_1.TransportConfigBuilder(), new health_config_builder_1.HealthConfigBuilder(), new membership_config_builder_1.MembershipConfigBuilder(), new orchestrator_config_builder_1.OrchestratorConfigBuilder(), new proxy_config_builder_1.ProxyConfigBuilder(), new replicator_config_builder_1.ReplicatorConfigBuilder());
            case BUILDER_TYPE.HAPPNER:
                return new happner_configuration_builder_1.HappnerConfigurationBuilder(new cache_config_builder_1.CacheConfigBuilder(), new connect_config_builder_1.ConnectConfigBuilder(), new data_config_builder_1.DataConfigBuilder(), new protocol_config_builder_1.ProtocolConfigBuilder(new field_type_validator_1.default()), new publisher_config_builder_1.PublisherConfigBuilder(), new security_config_builder_1.SecurityConfigBuilder(), new subscription_config_builder_1.SubscriptionConfigBuilder(), new system_config_builder_1.SystemConfigBuilder(), new transport_config_builder_1.TransportConfigBuilder(), new components_config_builder_1.ComponentsConfigBuilder(), new endpoints_config_builder_1.EndpointsConfigBuilder(), new modules_config_builder_1.ModulesConfigBuilder());
            default:
                return null;
        }
    }
}
exports.ConfigBuilderFactory = ConfigBuilderFactory;
//# sourceMappingURL=config-builder-factory.js.map