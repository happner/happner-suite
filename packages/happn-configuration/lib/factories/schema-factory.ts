import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import Constants from '../constants/builder-constants';

export class SchemaFactory {
  #version;

  constructor(version) {
    this.#version = version;
  }

  getSchema(name) {
    const schemaRootPath = join(__dirname, '..', 'schemas');

    let schemaNonVersionedPath;
    let schemaVersionedPath;

    if (
      name === Constants.HAPPN ||
      name === Constants.HAPPNER ||
      name === Constants.HAPPN_CLUSTER ||
      name === Constants.HAPPNER_CLUSTER
    ) {
      schemaNonVersionedPath = `${schemaRootPath}/${name}-schema.json`;
      schemaVersionedPath = `${schemaRootPath}/${this.#version}/${name}-schema.json`;
    } else {
      schemaNonVersionedPath = `${schemaRootPath}/sub-schemas/${name}-schema.json`;
      schemaVersionedPath = `${schemaRootPath}/sub-schemas/${this.#version}/${name}-schema.json`;
    }

    return existsSync(`${schemaNonVersionedPath}`)
      ? JSON.parse(readFileSync(schemaNonVersionedPath).toString())
      : JSON.parse(readFileSync(schemaVersionedPath).toString());
  }
}
