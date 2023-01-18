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
var _SchemaFactory_version;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaFactory = void 0;
const path_1 = require("path");
const fs_1 = require("fs");
const builder_constants_1 = __importDefault(require("../constants/builder-constants"));
class SchemaFactory {
    constructor(version) {
        _SchemaFactory_version.set(this, void 0);
        __classPrivateFieldSet(this, _SchemaFactory_version, version, "f");
    }
    getSchema(name) {
        const schemaRootPath = (0, path_1.join)(__dirname, '..', 'schemas');
        let schemaNonVersionedPath;
        let schemaVersionedPath;
        if (name === builder_constants_1.default.HAPPN ||
            name === builder_constants_1.default.HAPPNER ||
            name === builder_constants_1.default.HAPPN_CLUSTER ||
            name === builder_constants_1.default.HAPPNER_CLUSTER) {
            schemaNonVersionedPath = `${schemaRootPath}/${name}-schema.json`;
            schemaVersionedPath = `${schemaRootPath}/${name}-schema-${__classPrivateFieldGet(this, _SchemaFactory_version, "f")}.json`;
        }
        else {
            schemaNonVersionedPath = `${schemaRootPath}/sub-schemas/${name}-schema.json`;
            schemaVersionedPath = `${schemaRootPath}/sub-schemas/${name}-schema-${__classPrivateFieldGet(this, _SchemaFactory_version, "f")}.json`;
        }
        return (0, fs_1.existsSync)(`${schemaVersionedPath}`)
            ? JSON.parse((0, fs_1.readFileSync)(schemaVersionedPath).toString())
            : JSON.parse((0, fs_1.readFileSync)(schemaNonVersionedPath).toString());
    }
}
exports.SchemaFactory = SchemaFactory;
_SchemaFactory_version = new WeakMap();
