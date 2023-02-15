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
var _CoreBuilder_builderType, _CoreBuilder_container;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreBuilder = void 0;
/* eslint-disable @typescript-eslint/ban-types,@typescript-eslint/no-var-requires,@typescript-eslint/no-explicit-any */
const builder_constants_1 = __importDefault(require("../constants/builder-constants"));
const base_builder_1 = __importDefault(require("happn-commons/lib/base-builder"));
const { HAPPN, HAPPN_CLUSTER, HAPPNER, HAPPNER_CLUSTER } = builder_constants_1.default;
class CoreBuilder extends base_builder_1.default {
    constructor(container) {
        super();
        _CoreBuilder_builderType.set(this, void 0);
        _CoreBuilder_container.set(this, void 0);
        __classPrivateFieldSet(this, _CoreBuilder_container, container, "f");
    }
    set builderType(type) {
        __classPrivateFieldSet(this, _CoreBuilder_builderType, type, "f");
    }
    get builderType() {
        return __classPrivateFieldGet(this, _CoreBuilder_builderType, "f");
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
}
exports.CoreBuilder = CoreBuilder;
_CoreBuilder_builderType = new WeakMap(), _CoreBuilder_container = new WeakMap();
