"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigBuilderFactory = void 0;
var happn_configuration_builder_1 = require("./happn-configuration-builder");
var happn_cluster_configuration_builder_1 = require("./happn-cluster-configuration-builder");
var HappnConfigBuilder = require("../builders/happn-config-builder");
var CacheConfigBuilder = require("../builders/services/cache-config-builder");
var ConnectConfigBuilder = require("../builders/services/connect-config-builder");
var DataConfigBuilder = require("../builders/services/data-config-builder");
var HealthConfigBuilder = require("../builders/services/health-config-builder");
var ProtocolConfigBuilder = require("../builders/services/protocol-config-builder");
var PublisherConfigBuilder = require("../builders/services/publisher-config-builder");
var SecurityConfigBuilder = require("../builders/services/security-config-builder");
var SubscriptionConfigBuilder = require("../builders/services/subscription-config-builder");
var SystemConfigBuilder = require("../builders/services/system-config-builder");
var TransportConfigBuilder = require("../builders/services/transport-config-builder");
var HappnClusterConfigBuilder = require("../builders/happn-cluster-config-builder");
var MembershipConfigBuilder = require("../builders/services/membership-config-builder");
var OrchestratorConfigBuilder = require("../builders/services/orchestrator-config-builder");
var ProxyConfigBuilder = require("../builders/services/proxy-config-builder");
var ReplicatorConfigBuilder = require("../builders/services/replicator-config-builder");
var FieldTypeValidator = require("../validators/field-type-validator");
var BUILDER_TYPE = {
    HAPPN: 'happn',
    HAPPN_CLUSTER: 'happn-cluster',
    HAPPNER: 'happner',
    HAPPNER_CLUSTER: 'happner-cluster',
};
var ConfigBuilderFactory = /** @class */ (function () {
    function ConfigBuilderFactory() {
    }
    ConfigBuilderFactory.getBuilder = function (type) {
        switch (type) {
            case BUILDER_TYPE.HAPPN:
                return new happn_configuration_builder_1.HappnConfigurationBuilder(new HappnConfigBuilder(), new CacheConfigBuilder(), new ConnectConfigBuilder(), new DataConfigBuilder(), new ProtocolConfigBuilder(new FieldTypeValidator()), new PublisherConfigBuilder(), new SecurityConfigBuilder(), new SubscriptionConfigBuilder(), new SystemConfigBuilder(), new TransportConfigBuilder());
            case BUILDER_TYPE.HAPPN_CLUSTER:
                return new happn_cluster_configuration_builder_1.HappnClusterConfigurationBuilder(new HappnConfigBuilder(), new CacheConfigBuilder(), new ConnectConfigBuilder(), new DataConfigBuilder(), new ProtocolConfigBuilder(new FieldTypeValidator()), new PublisherConfigBuilder(), new SecurityConfigBuilder(), new SubscriptionConfigBuilder(), new SystemConfigBuilder(), new TransportConfigBuilder(), new HappnClusterConfigBuilder(), new HealthConfigBuilder(), new MembershipConfigBuilder(), new OrchestratorConfigBuilder(), new ProxyConfigBuilder(), new ReplicatorConfigBuilder());
        }
    };
    return ConfigBuilderFactory;
}());
exports.ConfigBuilderFactory = ConfigBuilderFactory;
