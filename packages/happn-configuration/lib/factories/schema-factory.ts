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
      schemaVersionedPath = `${schemaRootPath}/${name}-schema-${this.#version}.json`;
    } else {
      schemaNonVersionedPath = `${schemaRootPath}/sub-schemas/${name}-schema.json`;
      schemaVersionedPath = `${schemaRootPath}/sub-schemas/${name}-schema-${this.#version}.json`;
    }

    return existsSync(`${schemaVersionedPath}`)
      ? JSON.parse(readFileSync(schemaVersionedPath).toString())
      : JSON.parse(readFileSync(schemaNonVersionedPath).toString());
  }
}
