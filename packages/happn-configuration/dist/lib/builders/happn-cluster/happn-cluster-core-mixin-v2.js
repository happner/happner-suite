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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HappnClusterCoreBuilderV2 = void 0;
const base_builder_1 = __importDefault(require("happn-commons/lib/base-builder"));
const config_constants_1 = __importDefault(require("../../constants/config-constants"));
const SERVICES_ROOT = config_constants_1.default.HAPPN_SERVICES_ROOT;
function HappnClusterCoreBuilderV2(Base) {
    var _HappnClusterBuilder_healthConfigBuilder, _HappnClusterBuilder_membershipConfigBuilder, _HappnClusterBuilder_orchestratorConfigBuilder, _HappnClusterBuilder_proxyConfigBuilder, _HappnClusterBuilder_replicatorConfigBuilder, _a;
    return _a = class HappnClusterBuilder extends Base {
            constructor(...args) {
                super(...args);
                _HappnClusterBuilder_healthConfigBuilder.set(this, void 0);
                _HappnClusterBuilder_membershipConfigBuilder.set(this, void 0);
                _HappnClusterBuilder_orchestratorConfigBuilder.set(this, void 0);
                _HappnClusterBuilder_proxyConfigBuilder.set(this, void 0);
                _HappnClusterBuilder_replicatorConfigBuilder.set(this, void 0);
                const container = args[0];
                __classPrivateFieldSet(this, _HappnClusterBuilder_healthConfigBuilder, container.healthConfigBuilder, "f");
                __classPrivateFieldSet(this, _HappnClusterBuilder_membershipConfigBuilder, container.membershipConfigBuilder, "f");
                __classPrivateFieldSet(this, _HappnClusterBuilder_orchestratorConfigBuilder, container.orchestratorConfigBuilder, "f");
                __classPrivateFieldSet(this, _HappnClusterBuilder_proxyConfigBuilder, container.proxyConfigBuilder, "f");
                __classPrivateFieldSet(this, _HappnClusterBuilder_replicatorConfigBuilder, container.replicatorConfigBuilder, "f");
                this.set(`${SERVICES_ROOT}.health`, __classPrivateFieldGet(this, _HappnClusterBuilder_healthConfigBuilder, "f"), base_builder_1.default.Types.OBJECT);
                this.set(`${SERVICES_ROOT}.membership`, __classPrivateFieldGet(this, _HappnClusterBuilder_membershipConfigBuilder, "f"), base_builder_1.default.Types.OBJECT);
                this.set(`${SERVICES_ROOT}.orchestrator`, __classPrivateFieldGet(this, _HappnClusterBuilder_orchestratorConfigBuilder, "f"), base_builder_1.default.Types.OBJECT);
                this.set(`${SERVICES_ROOT}.proxy`, __classPrivateFieldGet(this, _HappnClusterBuilder_proxyConfigBuilder, "f"), base_builder_1.default.Types.OBJECT);
                this.set(`${SERVICES_ROOT}.replicator`, __classPrivateFieldGet(this, _HappnClusterBuilder_replicatorConfigBuilder, "f"), base_builder_1.default.Types.OBJECT);
            }
            /*
              HEALTH
               */
            withHealthInterval(interval) {
                __classPrivateFieldGet(this, _HappnClusterBuilder_healthConfigBuilder, "f").withHealthInterval(interval);
                return this;
            }
            withHealthWarmupLimit(limit) {
                __classPrivateFieldGet(this, _HappnClusterBuilder_healthConfigBuilder, "f").withHealthWarmupLimit(limit);
                return this;
            }
            /*
            ORCHESTRATOR
             */
            withOrchestratorMinimumPeers(minimum) {
                __classPrivateFieldGet(this, _HappnClusterBuilder_orchestratorConfigBuilder, "f").withOrchestratorMinimumPeers(minimum);
                return this;
            }
            withOrchestratorReplicatePath(path) {
                __classPrivateFieldGet(this, _HappnClusterBuilder_orchestratorConfigBuilder, "f").withOrchestratorReplicatePath(path);
                return this;
            }
            withOrchestratorStableReportInterval(interval) {
                __classPrivateFieldGet(this, _HappnClusterBuilder_orchestratorConfigBuilder, "f").withOrchestratorStableReportInterval(interval);
                return this;
            }
            withOrchestratorStabiliseTimeout(timeout) {
                __classPrivateFieldGet(this, _HappnClusterBuilder_orchestratorConfigBuilder, "f").withOrchestratorStabiliseTimeout(timeout);
                return this;
            }
            /*
            PROXY
             */
            withProxyAllowSelfSignedCerts(allow) {
                __classPrivateFieldGet(this, _HappnClusterBuilder_proxyConfigBuilder, "f").withProxyAllowSelfSignedCerts(allow);
                return this;
            }
            withProxyCertPath(path) {
                __classPrivateFieldGet(this, _HappnClusterBuilder_proxyConfigBuilder, "f").withProxyCertPath(path);
                return this;
            }
            withProxyHost(host, port) {
                __classPrivateFieldGet(this, _HappnClusterBuilder_proxyConfigBuilder, "f").withProxyHost(host);
                __classPrivateFieldGet(this, _HappnClusterBuilder_proxyConfigBuilder, "f").withProxyPort(port);
                return this;
            }
            withProxyKeyPath(path) {
                __classPrivateFieldGet(this, _HappnClusterBuilder_proxyConfigBuilder, "f").withProxyKeyPath(path);
                return this;
            }
            withProxyTimeout(timeout) {
                __classPrivateFieldGet(this, _HappnClusterBuilder_proxyConfigBuilder, "f").withProxyTimeout(timeout);
                return this;
            }
            /*
            REPLICATOR
             */
            withReplicatorSecurityChangeSetReplicateInterval(interval) {
                __classPrivateFieldGet(this, _HappnClusterBuilder_replicatorConfigBuilder, "f").withReplicatorSecurityChangeSetReplicateInterval(interval);
                return this;
            }
        },
        _HappnClusterBuilder_healthConfigBuilder = new WeakMap(),
        _HappnClusterBuilder_membershipConfigBuilder = new WeakMap(),
        _HappnClusterBuilder_orchestratorConfigBuilder = new WeakMap(),
        _HappnClusterBuilder_proxyConfigBuilder = new WeakMap(),
        _HappnClusterBuilder_replicatorConfigBuilder = new WeakMap(),
        _a;
}
exports.HappnClusterCoreBuilderV2 = HappnClusterCoreBuilderV2;
