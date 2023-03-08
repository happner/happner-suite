export declare class VersionUtil {
    #private;
    findMaxModuleVersion(moduleVersions: any): string;
    findClosestModuleMatch(moduleVersions: any, version: any): any;
    findUnversionedFileMatch(rootPath: any, filePrefix: any): string;
    findClosestVersionedFileMatch(rootPath: any, filePrefix: any, version: any): string;
    matchFile(fileList: any, filePrefix: any, version: any): any;
}
