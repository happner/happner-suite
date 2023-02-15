"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUtil = void 0;
const fs_1 = require("fs");
class FileUtil {
    findFileByPrefix(rootPath, filePrefix) {
        const matchExpr = `^${filePrefix}.(json|ts|js){1}$`;
        const fileList = (0, fs_1.readdirSync)(rootPath);
        const result = fileList.find((fileName) => {
            return fileName.match(matchExpr);
        });
        return result ? `${rootPath}/${result}` : null;
    }
}
exports.FileUtil = FileUtil;
