"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaFactory = void 0;
const path_1 = require("path");
const fs_1 = require("fs");
const builder_constants_1 = __importDefault(require("../constants/builder-constants"));
const file_util_1 = require("../utils/file-util");
class SchemaFactory {
    getSchema(name) {
        const versionUtil = new file_util_1.FileUtil();
        const schemaRootPath = (0, path_1.join)(__dirname, '..', 'schemas');
        let schemaPath;
        if (name === builder_constants_1.default.HAPPN ||
            name === builder_constants_1.default.HAPPNER ||
            name === builder_constants_1.default.HAPPN_CLUSTER ||
            name === builder_constants_1.default.HAPPNER_CLUSTER) {
            schemaPath = versionUtil.findFileByPrefix(schemaRootPath, `${name}-schema`);
        }
        else {
            schemaPath = versionUtil.findFileByPrefix(`${schemaRootPath}/sub-schemas`, `${name}-schema`);
        }
        return JSON.parse((0, fs_1.readFileSync)(schemaPath).toString());
    }
}
exports.SchemaFactory = SchemaFactory;
