"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MixinFactory = void 0;
const builder_constants_1 = __importDefault(require("../constants/builder-constants"));
const happn_core_mixin_1 = require("../builders/happn/happn-core-mixin");
const core_builder_1 = require("../builders/core-builder");
const happn_cluster_core_mixin_1 = require("../builders/happn-cluster/happn-cluster-core-mixin");
const happner_core_mixin_1 = require("../builders/happner/happner-core-mixin");
const happner_cluster_core_mixin_1 = require("../builders/happner-cluster/happner-cluster-core-mixin");
class MixinFactory {
    getMixin(type) {
        switch (type) {
            case builder_constants_1.default.HAPPN:
                return (0, happn_core_mixin_1.HappnCoreBuilder)(core_builder_1.CoreBuilder);
            case builder_constants_1.default.HAPPN_CLUSTER:
                return (0, happn_cluster_core_mixin_1.HappnClusterCoreBuilder)((0, happn_core_mixin_1.HappnCoreBuilder)(core_builder_1.CoreBuilder));
            case builder_constants_1.default.HAPPNER:
                return (0, happner_core_mixin_1.HappnerCoreBuilder)((0, happn_core_mixin_1.HappnCoreBuilder)(core_builder_1.CoreBuilder));
            case builder_constants_1.default.HAPPNER_CLUSTER:
                return (0, happner_cluster_core_mixin_1.HappnerClusterCoreBuilder)((0, happn_cluster_core_mixin_1.HappnClusterCoreBuilder)((0, happner_core_mixin_1.HappnerCoreBuilder)((0, happn_core_mixin_1.HappnCoreBuilder)(core_builder_1.CoreBuilder))));
            default:
                throw new Error('unknown type');
        }
    }
}
exports.MixinFactory = MixinFactory;
