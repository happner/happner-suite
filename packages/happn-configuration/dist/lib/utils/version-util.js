"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _VersionUtil_instances, _VersionUtil_findClosestKeyMatch, _VersionUtil_sortKeys;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionUtil = void 0;
const fs_1 = require("fs");
const compare_versions_1 = require("compare-versions");
class VersionUtil {
    constructor() {
        _VersionUtil_instances.add(this);
    }
    findMaxModuleVersion(moduleVersions) {
        const keys = Object.keys(moduleVersions);
        return __classPrivateFieldGet(this, _VersionUtil_instances, "m", _VersionUtil_sortKeys).call(this, keys)[0];
    }
    findClosestModuleMatch(moduleVersions, version) {
        const keys = Object.keys(moduleVersions);
        const found = __classPrivateFieldGet(this, _VersionUtil_instances, "m", _VersionUtil_findClosestKeyMatch).call(this, keys, version);
        return moduleVersions[found];
    }
    findUnversionedFileMatch(rootPath, filePrefix) {
        const matchExpr = `^${filePrefix}.(json|ts|js){1}$`;
        const fileList = (0, fs_1.readdirSync)(rootPath);
        const result = fileList.find((fileName) => {
            return fileName.match(matchExpr);
        });
        return result ? `${rootPath}/${result}` : null;
    }
    findClosestVersionedFileMatch(rootPath, filePrefix, version) {
        const fileList = (0, fs_1.readdirSync)(rootPath);
        const foundFile = this.matchFile(fileList, filePrefix, version);
        return `${rootPath}/${foundFile}`;
    }
    matchFile(fileList, filePrefix, version) {
        const versionMatcher = '(\\d+\\.\\d+\\.\\d+){0,1}';
        const matchExpr = `^(${filePrefix})-{0,1}${versionMatcher}.(json|ts|js){1}$`;
        const matched = {};
        fileList.forEach((fileName) => {
            const match = fileName.match(matchExpr);
            if (match) {
                if (match[2] === undefined)
                    matched['1.0.0'] = match[0];
                else
                    matched[match[2]] = match[0];
            }
        });
        const keys = Object.keys(matched);
        const found = __classPrivateFieldGet(this, _VersionUtil_instances, "m", _VersionUtil_findClosestKeyMatch).call(this, keys, version);
        return matched[found];
    }
}
exports.VersionUtil = VersionUtil;
_VersionUtil_instances = new WeakSet(), _VersionUtil_findClosestKeyMatch = function _VersionUtil_findClosestKeyMatch(keys, version) {
    return __classPrivateFieldGet(this, _VersionUtil_instances, "m", _VersionUtil_sortKeys).call(this, keys).find((item) => {
        // find the closest match (equal to or less than requested version)
        if ((0, compare_versions_1.compare)(item, version, '<=')) {
            return item;
        }
    });
}, _VersionUtil_sortKeys = function _VersionUtil_sortKeys(keys) {
    return keys.sort((a, b) => {
        // sort latest to oldest
        if ((0, compare_versions_1.compare)(a, b, '>'))
            return -1; // greater than
        if ((0, compare_versions_1.compare)(a, b, '<'))
            return 1; // less than
        return 0; // equal
    });
};
