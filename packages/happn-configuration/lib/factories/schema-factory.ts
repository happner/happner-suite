import { join } from 'path';
import { readFileSync } from 'fs';
import Constants from '../constants/builder-constants';
import { VersionUtil } from '../utils/version-util';

export class SchemaFactory {
  #version;

  constructor(version) {
    this.#version = version;
  }

  getSchema(name) {
    const versionUtil = new VersionUtil();
    const schemaRootPath = join(__dirname, '..', 'schemas');
    let schemaPath;

    if (
      name === Constants.HAPPN ||
      name === Constants.HAPPNER ||
      name === Constants.HAPPN_CLUSTER ||
      name === Constants.HAPPNER_CLUSTER
    ) {
      schemaPath = versionUtil.findClosestVersionedFileMatch(
        schemaRootPath,
        `${name}-schema`,
        this.#version
      );
    } else {
      schemaPath = versionUtil.findClosestVersionedFileMatch(
        `${schemaRootPath}/sub-schemas`,
        `${name}-schema`,
        this.#version
      );
    }

    return JSON.parse(readFileSync(schemaPath).toString());
  }
}
