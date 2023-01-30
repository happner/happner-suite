"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionUtil = void 0;
const fs_1 = require("fs");
const compare_versions_1 = require("compare-versions");
class VersionUtil {
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
        const found = keys
            .sort((a, b) => {
            // sort latest to oldest
            if ((0, compare_versions_1.compare)(a, b, '>'))
                return -1; // greater than
            if ((0, compare_versions_1.compare)(a, b, '<'))
                return 1; // less than
            return 0; // equal
        })
            .find((item) => {
            // find the closest match (equal to or less than requested version)
            if ((0, compare_versions_1.compare)(item, version, '<=')) {
                return item;
            }
        });
        return matched[found];
    }
}
exports.VersionUtil = VersionUtil;
