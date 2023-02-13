import { readdirSync } from 'fs';
import { compare } from 'compare-versions';

export class VersionUtil {
  findClosestModuleMatch(moduleVersions, version) {
    const keys = Object.keys(moduleVersions);
    const found = this.#findClosestKeyMatch(keys, version);
    return moduleVersions[found];
  }

  findClosestVersionedFileMatch(rootPath, filePrefix, version) {
    const fileList = readdirSync(rootPath);
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
        if (match[2] === undefined) matched['1.0.0'] = match[0];
        else matched[match[2]] = match[0];
      }
    });

    const keys = Object.keys(matched);
    const found = this.#findClosestKeyMatch(keys, version);
    return matched[found];
  }

  #findClosestKeyMatch(keys, version) {
    return keys
      .sort((a, b) => {
        // sort latest to oldest
        if (compare(a, b, '>')) return -1; // greater than
        if (compare(a, b, '<')) return 1; // less than
        return 0; // equal
      })
      .find((item) => {
        // find the closest match (equal to or less than requested version)
        if (compare(item, version, '<=')) {
          return item;
        }
      });
  }
}
