import { readdirSync } from 'fs';

export class FileUtil {
  findFileByPrefix(rootPath, filePrefix) {
    const matchExpr = `^${filePrefix}.(json|ts|js){1}$`;
    const fileList = readdirSync(rootPath);

    const result = fileList.find((fileName) => {
      return fileName.match(matchExpr);
    });

    return result ? `${rootPath}/${result}` : null;
  }
}
