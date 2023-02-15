"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builders_1 = require("../builders/builders");
/*
These constants are used by the builder-factory to retrieve the correct builders based on an incoming
framework version (happn, happn-cluster, happner or happner-cluster).
Modules are matched based on the highest version match to the incoming framework version
 */
exports.default = {
    VERSION_THRESHOLDS: {
        HappnCore: { '1.0.0': builders_1.HappnCoreBuilder },
        HappnClusterCore: { '1.0.0': builders_1.HappnClusterCoreBuilder, '12.0.0': builders_1.HappnClusterCoreBuilder },
        HappnerCore: { '1.0.0': builders_1.HappnerCoreBuilder },
        HappnerClusterCore: { '1.0.0': builders_1.HappnerClusterCoreBuilder },
        DataConfig: { '1.0.0': builders_1.DataConfigBuilder },
        ConnectConfig: { '1.0.0': builders_1.ConnectConfigBuilder },
        ComponentsConfig: { '1.0.0': builders_1.ComponentsConfigBuilder },
        CacheConfig: { '1.0.0': builders_1.CacheConfigBuilder },
        ModulesConfig: { '1.0.0': builders_1.ModulesConfigBuilder },
        EndpointsConfig: { '1.0.0': builders_1.EndpointsConfigBuilder },
        TransportConfig: { '1.0.0': builders_1.TransportConfigBuilder },
        SystemConfig: { '1.0.0': builders_1.SystemConfigBuilder },
        SubscriptionConfig: { '1.0.0': builders_1.SubscriptionConfigBuilder },
        SecurityConfig: { '1.0.0': builders_1.SecurityConfigBuilder },
        ReplicatorConfig: { '1.0.0': builders_1.ReplicatorConfigBuilder },
        PublisherConfig: { '1.0.0': builders_1.PublisherConfigBuilder },
        ProxyConfig: { '1.0.0': builders_1.ProxyConfigBuilder },
        ProtocolConfig: { '1.0.0': builders_1.ProtocolConfigBuilder },
        MembershipConfig: { '1.0.0': builders_1.MembershipConfigBuilder },
        HealthConfig: { '1.0.0': builders_1.HealthConfigBuilder },
        OrchestratorConfig: {
            '1.0.0': builders_1.OrchestratorConfigBuilder,
            '12.0.0': builders_1.OrchestratorConfigBuilder,
        },
    },
};
