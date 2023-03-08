"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HappnCoreBuilder = void 0;
const base_builder_1 = __importDefault(require("happn-commons/lib/base-builder"));
const config_constants_1 = __importDefault(require("../../constants/config-constants"));
const builder_constants_1 = __importDefault(require("../../constants/builder-constants"));
const SERVICES_ROOT = config_constants_1.default.HAPPN_SERVICES_ROOT;
const { HAPPN } = builder_constants_1.default;
function HappnCoreBuilder(Base) {
    var _HappnConfigBuilder_instances, _HappnConfigBuilder_initialiseChildBuilders, _a;
    return _a = class HappnConfigBuilder extends Base {
            constructor(...args) {
                super(...args);
                _HappnConfigBuilder_instances.add(this);
                const container = args[0];
                __classPrivateFieldGet(this, _HappnConfigBuilder_instances, "m", _HappnConfigBuilder_initialiseChildBuilders).call(this, container);
            }
            withName(name) {
                this.set(`happn.name`, name, base_builder_1.default.Types.STRING);
                return this;
            }
            withHost(host) {
                this.set(`happn.host`, host, base_builder_1.default.Types.STRING);
                return this;
            }
            withPort(port) {
                this.set(`happn.port`, port, base_builder_1.default.Types.NUMERIC);
                return this;
            }
            withSecure(isSecure) {
                this.set(`happn.secure`, isSecure, base_builder_1.default.Types.BOOLEAN);
                return this;
            }
            withAllowNestedPermissions(allow) {
                this.set(`happn.allowNestedPermissions`, allow, base_builder_1.default.Types.BOOLEAN);
                return this;
            }
        },
        _HappnConfigBuilder_instances = new WeakSet(),
        _HappnConfigBuilder_initialiseChildBuilders = function _HappnConfigBuilder_initialiseChildBuilders(container) {
            const keys = Object.keys(container);
            keys.forEach((key) => {
                const parentType = container[key].parentType;
                const builderInstance = container[key].instance;
                if (parentType === HAPPN) {
                    // set each child builder on the BaseBuilder
                    this.set(`${SERVICES_ROOT}.${key.substring(0, key.indexOf('ConfigBuilder'))}`, builderInstance, base_builder_1.default.Types.OBJECT);
                    // dynamically expose each child builder - these will be accessible via dot-notation
                    this[key] = builderInstance;
                }
            });
        },
        _a;
}
exports.HappnCoreBuilder = HappnCoreBuilder;
