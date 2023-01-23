import { join } from 'path';
import { readFileSync, readdirSync } from 'fs';
import { compare } from 'compare-versions';
import Constants from '../constants/builder-constants';

export class SchemaFactory {
  #version;

  constructor(version) {
    this.#version = version;
  }

  getSchema(name) {
    const schemaRootPath = join(__dirname, '..', 'schemas');
    let schemaPath;

    if (
      name === Constants.HAPPN ||
      name === Constants.HAPPNER ||
      name === Constants.HAPPN_CLUSTER ||
      name === Constants.HAPPNER_CLUSTER
    ) {
      schemaPath = this.#findClosestMatch(schemaRootPath, name, this.#version);
    } else {
      schemaPath = this.#findClosestMatch(`${schemaRootPath}/sub-schemas`, name, this.#version);
    }

    // console.log(`found schema path: ${schemaPath}`);
    return JSON.parse(readFileSync(schemaPath).toString());
  }

  #findClosestMatch(rootPath, schemaName, requestedVersion) {
    const schemaMatcher = `${schemaName}-schema`;
    const versionMatcher = '[0-9]+\\.[0-9]+\\.[0-9]+';

    const matchedVersion = readdirSync(rootPath)
      .filter((fileName) => {
        return !!fileName.match(schemaMatcher);
      })
      .sort((a, b) => {
        const strip = (str) => {
          const versionMatch = str.match(versionMatcher);

          if (versionMatch) {
            return versionMatch[0];
          } else {
            return '1.0.0';
          }
        };

        a = strip(a);
        b = strip(b);

        if (compare(a, b, '>')) {
          return -1;
        }
        if (compare(a, b, '<')) {
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
        if (compare(item, requestedVersion, '<=')) {
          return `${rootPath}/${schemaName}-schema-${item}.json`;
        }
      });

    return matchedVersion === '1.0.0'
      ? `${rootPath}/${schemaName}-schema.json`
      : `${rootPath}/${schemaName}-schema-${matchedVersion}.json`;
  }
}
