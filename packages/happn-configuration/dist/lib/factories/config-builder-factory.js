"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const version_util_1 = require("../utils/version-util");
const builder_constants_1 = __importDefault(require("../constants/builder-constants"));
const field_type_validator_1 = require("../validators/field-type-validator");
// mixin specific imports
const happn_core_mixin_1 = require("../builders/happn/happn-core-mixin");
const happn_cluster_core_mixin_1 = require("../builders/happn-cluster/happn-cluster-core-mixin");
const happner_core_mixin_1 = require("../builders/happner/happner-core-mixin");
const happner_cluster_core_mixin_1 = require("../builders/happner-cluster/happner-cluster-core-mixin");
const path_1 = require("path");
const base_builder_1 = __importDefault(require("happn-commons/lib/base-builder"));
const { HAPPN, HAPPN_CLUSTER, HAPPNER, HAPPNER_CLUSTER } = builder_constants_1.default;
// core class used for mixins...
const BaseClz = (_a = class BaseClz extends base_builder_1.default {
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
    static getBuilder(type, version) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (type) {
                case HAPPN:
                    return yield ConfigBuilderFactory.getHappnBuilder(version);
                case HAPPN_CLUSTER:
                    return yield ConfigBuilderFactory.getHappnClusterBuilder(version);
                case HAPPNER:
                    return yield ConfigBuilderFactory.getHappnerBuilder(version);
                case HAPPNER_CLUSTER:
                    return yield ConfigBuilderFactory.getHappnerClusterBuilder(version);
                default:
                    throw new Error('Unknown configuration type');
            }
        });
    }
    static getHappnBuilder(version) {
        return __awaiter(this, void 0, void 0, function* () {
            const container = yield ConfigBuilderFactory.createContainer(version);
            const HappnMixin = (0, happn_core_mixin_1.HappnCoreBuilder)(BaseClz);
            const result = new HappnMixin(container);
            result.builderType = HAPPN;
            return result;
        });
    }
    static getHappnClusterBuilder(version) {
        return __awaiter(this, void 0, void 0, function* () {
            const container = yield ConfigBuilderFactory.createContainer(version);
            const HappnClusterMixin = (0, happn_core_mixin_1.HappnCoreBuilder)((0, happn_cluster_core_mixin_1.HappnClusterCoreBuilder)(BaseClz));
            const result = new HappnClusterMixin(container);
            result.builderType = HAPPN_CLUSTER;
            return result;
        });
    }
    static getHappnerBuilder(version) {
        return __awaiter(this, void 0, void 0, function* () {
            const container = yield ConfigBuilderFactory.createContainer(version);
            const HappnerMixin = (0, happn_core_mixin_1.HappnCoreBuilder)((0, happner_core_mixin_1.HappnerCoreBuilder)(BaseClz));
            const result = new HappnerMixin(container);
            result.builderType = HAPPNER;
            return result;
        });
    }
    static getHappnerClusterBuilder(version) {
        return __awaiter(this, void 0, void 0, function* () {
            const container = yield ConfigBuilderFactory.createContainer(version);
            const HappnerClusterMixin = (0, happn_core_mixin_1.HappnCoreBuilder)((0, happn_cluster_core_mixin_1.HappnClusterCoreBuilder)((0, happner_core_mixin_1.HappnerCoreBuilder)((0, happner_cluster_core_mixin_1.HappnerClusterCoreBuilder)(BaseClz))));
            const result = new HappnerClusterMixin(container);
            result.builderType = HAPPNER_CLUSTER;
            return result;
        });
    }
    static createContainer(version) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                cacheConfigBuilder: yield this.getSubconfigBuilder('cache-config-builder', (0, path_1.join)(__dirname, '..', 'builders/happn/services'), version),
                componentsConfigBuilder: yield this.getSubconfigBuilder('components-config-builder', (0, path_1.join)(__dirname, '..', 'builders/happner/components'), version),
                connectConfigBuilder: yield this.getSubconfigBuilder('connect-config-builder', (0, path_1.join)(__dirname, '..', 'builders/happn/services'), version),
                dataConfigBuilder: yield this.getSubconfigBuilder('data-config-builder', (0, path_1.join)(__dirname, '..', 'builders/happn/services'), version),
                endpointsConfigBuilder: yield this.getSubconfigBuilder('endpoints-config-builder', (0, path_1.join)(__dirname, '..', 'builders/happner/endpoints'), version),
                membershipConfigBuilder: yield this.getSubconfigBuilder('membership-config-builder', (0, path_1.join)(__dirname, '..', 'builders/happn/services'), version),
                modulesConfigBuilder: yield this.getSubconfigBuilder('modules-config-builder', (0, path_1.join)(__dirname, '..', 'builders/happner/modules'), version),
                orchestratorConfigBuilder: yield this.getSubconfigBuilder('orchestrator-config-builder', (0, path_1.join)(__dirname, '..', 'builders/happn/services'), version),
                protocolConfigBuilder: yield this.getSubconfigBuilder('protocol-config-builder', (0, path_1.join)(__dirname, '..', 'builders/happn/services'), version, new field_type_validator_1.FieldTypeValidator()),
                proxyConfigBuilder: yield this.getSubconfigBuilder('proxy-config-builder', (0, path_1.join)(__dirname, '..', 'builders/happn/services'), version),
                publisherConfigBuilder: yield this.getSubconfigBuilder('publisher-config-builder', (0, path_1.join)(__dirname, '..', 'builders/happn/services'), version),
                replicatorConfigBuilder: yield this.getSubconfigBuilder('replicator-config-builder', (0, path_1.join)(__dirname, '..', 'builders/happn/services'), version),
                securityConfigBuilder: yield this.getSubconfigBuilder('security-config-builder', (0, path_1.join)(__dirname, '..', 'builders/happn/services'), version),
                subscriptionConfigBuilder: yield this.getSubconfigBuilder('subscription-config-builder', (0, path_1.join)(__dirname, '..', 'builders/happn/services'), version),
                systemConfigBuilder: yield this.getSubconfigBuilder('system-config-builder', (0, path_1.join)(__dirname, '..', 'builders/happn/services'), version),
                transportConfigBuilder: yield this.getSubconfigBuilder('transport-config-builder', (0, path_1.join)(__dirname, '..', 'builders/happn/services'), version),
                healthConfigBuilder: yield this.getSubconfigBuilder('health-config-builder', (0, path_1.join)(__dirname, '..', 'builders/happn/services'), version),
            };
        });
    }
    static getSubconfigBuilder(moduleName, rootPath, version, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const versionUtil = new version_util_1.VersionUtil();
            const modulePath = versionUtil.findClosestVersionedFileMatch(rootPath, moduleName, version);
            const Module = yield (_a = modulePath, Promise.resolve().then(() => __importStar(require(_a))));
            const Clz = Module[Object.keys(Module)[0]];
            return new Clz(...args);
        });
    }
}
exports.ConfigBuilderFactory = ConfigBuilderFactory;
