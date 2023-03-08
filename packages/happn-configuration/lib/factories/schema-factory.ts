import { join } from 'path';
import { readFileSync } from 'fs';
import Constants from '../constants/builder-constants';
import { FileUtil } from '../utils/file-util';

export class SchemaFactory {
  getSchema(name) {
    const versionUtil = new FileUtil();
    const schemaRootPath = join(__dirname, '..', 'schemas');
    let schemaPath;

    if (
      name === Constants.HAPPN ||
      name === Constants.HAPPNER ||
      name === Constants.HAPPN_CLUSTER ||
      name === Constants.HAPPNER_CLUSTER
    ) {
      schemaPath = versionUtil.findFileByPrefix(schemaRootPath, `${name}-schema`);
    } else {
      schemaPath = versionUtil.findFileByPrefix(
        `${schemaRootPath}/sub-schemas`,
        `${name}-schema`
      );
    }

    return JSON.parse(readFileSync(schemaPath).toString());
  }
}
