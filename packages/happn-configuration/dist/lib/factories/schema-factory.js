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
var _SchemaFactory_instances, _SchemaFactory_version, _SchemaFactory_findClosestMatch;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaFactory = void 0;
const path_1 = require("path");
const fs_1 = require("fs");
const compare_versions_1 = require("compare-versions");
const builder_constants_1 = __importDefault(require("../constants/builder-constants"));
class SchemaFactory {
    constructor(version) {
        _SchemaFactory_instances.add(this);
        _SchemaFactory_version.set(this, void 0);
        __classPrivateFieldSet(this, _SchemaFactory_version, version, "f");
    }
    getSchema(name) {
        const schemaRootPath = (0, path_1.join)(__dirname, '..', 'schemas');
        let schemaPath;
        if (name === builder_constants_1.default.HAPPN ||
            name === builder_constants_1.default.HAPPNER ||
            name === builder_constants_1.default.HAPPN_CLUSTER ||
            name === builder_constants_1.default.HAPPNER_CLUSTER) {
            schemaPath = __classPrivateFieldGet(this, _SchemaFactory_instances, "m", _SchemaFactory_findClosestMatch).call(this, schemaRootPath, name, __classPrivateFieldGet(this, _SchemaFactory_version, "f"));
        }
        else {
            schemaPath = __classPrivateFieldGet(this, _SchemaFactory_instances, "m", _SchemaFactory_findClosestMatch).call(this, `${schemaRootPath}/sub-schemas`, name, __classPrivateFieldGet(this, _SchemaFactory_version, "f"));
        }
        // console.log(`found schema path: ${schemaPath}`);
        return JSON.parse((0, fs_1.readFileSync)(schemaPath).toString());
    }
}
exports.SchemaFactory = SchemaFactory;
_SchemaFactory_version = new WeakMap(), _SchemaFactory_instances = new WeakSet(), _SchemaFactory_findClosestMatch = function _SchemaFactory_findClosestMatch(rootPath, schemaName, requestedVersion) {
    const schemaMatcher = `${schemaName}-schema`;
    const versionMatcher = '[0-9]+\\.[0-9]+\\.[0-9]+';
    const matchedVersion = (0, fs_1.readdirSync)(rootPath)
        .filter((fileName) => {
        return !!fileName.match(schemaMatcher);
    })
        .sort((a, b) => {
        const strip = (str) => {
            const versionMatch = str.match(versionMatcher);
            if (versionMatch) {
                return versionMatch[0];
            }
            else {
                return '1.0.0';
            }
        };
        a = strip(a);
        b = strip(b);
        if ((0, compare_versions_1.compare)(a, b, '>')) {
            return -1;
        }
        if ((0, compare_versions_1.compare)(a, b, '<')) {
            return 1;
        }
        // a === b
        return 0;
    })
        .map((fileName) => {
        const versionMatch = fileName.match(versionMatcher);
        return versionMatch ? versionMatch[0] : '1.0.0';
    })
        .find((item) => {
        if ((0, compare_versions_1.compare)(item, requestedVersion, '<=')) {
            return `${rootPath}/${schemaName}-schema-${item}.json`;
        }
    });
    return matchedVersion === '1.0.0'
        ? `${rootPath}/${schemaName}-schema.json`
        : `${rootPath}/${schemaName}-schema-${matchedVersion}.json`;
};
