"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigBuilderFactory = void 0;
const happn_configuration_builder_js_1 = require("../builders/happn/happn-configuration-builder.js");
const happn_cluster_configuration_builder_js_1 = require("../builders/happn-cluster/happn-cluster-configuration-builder.js");
const cache_config_builder_js_1 = require("../builders/happn/services/cache-config-builder.js");
const connect_config_builder_js_1 = require("../builders/happn/services/connect-config-builder.js");
const data_config_builder_js_1 = require("../builders/happn/services/data-config-builder.js");
const publisher_config_builder_js_1 = require("../builders/happn/services/publisher-config-builder.js");
const protocol_config_builder_js_1 = require("../builders/happn/services/protocol-config-builder.js");
const security_config_builder_js_1 = require("../builders/happn/services/security-config-builder.js");
const subscription_config_builder_js_1 = require("../builders/happn/services/subscription-config-builder.js");
const system_config_builder_js_1 = require("../builders/happn/services/system-config-builder.js");
const transport_config_builder_js_1 = require("../builders/happn/services/transport-config-builder.js");
const membership_config_builder_js_1 = require("../builders/happn/services/membership-config-builder.js");
const orchestrator_config_builder_js_1 = require("../builders/happn/services/orchestrator-config-builder.js");
const replicator_config_builder_js_1 = require("../builders/happn/services/replicator-config-builder.js");
const proxy_config_builder_js_1 = require("../builders/happn/services/proxy-config-builder.js");
const health_config_builder_js_1 = require("../builders/happn/services/health-config-builder.js");
const field_type_validator_js_1 = require("../validators/field-type-validator.js");
const happner_configuration_builder_js_1 = require("../builders/happner/happner-configuration-builder.js");
const components_config_builder_js_1 = require("../builders/happner/components/components-config-builder.js");
const endpoints_config_builder_js_1 = require("../builders/happner/endpoints/endpoints-config-builder.js");
const modules_config_builder_js_1 = require("../builders/happner/modules/modules-config-builder.js");
const BUILDER_TYPE = require('../../constants/builder-constants');
class ConfigBuilderFactory {
    static getBuilder(type) {
        switch (type) {
            case BUILDER_TYPE.HAPPN:
                return new happn_configuration_builder_js_1.HappnConfigurationBuilder(new cache_config_builder_js_1.CacheConfigBuilder(), new connect_config_builder_js_1.ConnectConfigBuilder(), new data_config_builder_js_1.DataConfigBuilder(), new protocol_config_builder_js_1.ProtocolConfigBuilder(new field_type_validator_js_1.FieldTypeValidator()), new publisher_config_builder_js_1.PublisherConfigBuilder(), new security_config_builder_js_1.SecurityConfigBuilder(), new subscription_config_builder_js_1.SubscriptionConfigBuilder(), new system_config_builder_js_1.SystemConfigBuilder(), new transport_config_builder_js_1.TransportConfigBuilder());
            case BUILDER_TYPE.HAPPN_CLUSTER:
                return new happn_cluster_configuration_builder_js_1.HappnClusterConfigurationBuilder(new cache_config_builder_js_1.CacheConfigBuilder(), new connect_config_builder_js_1.ConnectConfigBuilder(), new data_config_builder_js_1.DataConfigBuilder(), new protocol_config_builder_js_1.ProtocolConfigBuilder(new field_type_validator_js_1.FieldTypeValidator()), new publisher_config_builder_js_1.PublisherConfigBuilder(), new security_config_builder_js_1.SecurityConfigBuilder(), new subscription_config_builder_js_1.SubscriptionConfigBuilder(), new system_config_builder_js_1.SystemConfigBuilder(), new transport_config_builder_js_1.TransportConfigBuilder(), new health_config_builder_js_1.HealthConfigBuilder(), new membership_config_builder_js_1.MembershipConfigBuilder(), new orchestrator_config_builder_js_1.OrchestratorConfigBuilder(), new proxy_config_builder_js_1.ProxyConfigBuilder(), new replicator_config_builder_js_1.ReplicatorConfigBuilder());
            case BUILDER_TYPE.HAPPNER:
                return new happner_configuration_builder_js_1.HappnerConfigurationBuilder(new cache_config_builder_js_1.CacheConfigBuilder(), new connect_config_builder_js_1.ConnectConfigBuilder(), new data_config_builder_js_1.DataConfigBuilder(), new protocol_config_builder_js_1.ProtocolConfigBuilder(new field_type_validator_js_1.FieldTypeValidator()), new publisher_config_builder_js_1.PublisherConfigBuilder(), new security_config_builder_js_1.SecurityConfigBuilder(), new subscription_config_builder_js_1.SubscriptionConfigBuilder(), new system_config_builder_js_1.SystemConfigBuilder(), new transport_config_builder_js_1.TransportConfigBuilder(), new components_config_builder_js_1.ComponentsConfigBuilder(), new endpoints_config_builder_js_1.EndpointsConfigBuilder(), new modules_config_builder_js_1.ModulesConfigBuilder());
            default:
                return null;
        }
    }
}
exports.ConfigBuilderFactory = ConfigBuilderFactory;
