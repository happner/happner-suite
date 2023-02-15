/* eslint-disable no-console,@typescript-eslint/no-var-requires */
import { expect } from 'chai';
import { VersionUtil } from '../../lib/utils/version-util';

describe('version util tests', function () {
  // - group filename, version and extension
  const matchExpr = '^(\\D+[^-])-{0,1}(\\d+\\.\\d+\\.\\d+){0,1}.(json|ts|js){1}$';

  it('regex handles no version', () => {
    const testFileName = 'my-test-file.json';
    const result = testFileName.match(matchExpr);

    expect(result[0]).to.equal(testFileName);
    expect(result[1]).to.equal('my-test-file');
    expect(result[2]).to.equal(undefined);
    expect(result[3]).to.equal('json');
  });

  it('regex handles valid version', () => {
    const testFileName = 'my-test-file-1.2.3.json';
    const result = testFileName.match(matchExpr);

    expect(result[0]).to.equal(testFileName);
    expect(result[1]).to.equal('my-test-file');
    expect(result[2]).to.equal('1.2.3');
    expect(result[3]).to.equal('json');
  });

  it('regex handles invalid version', () => {
    const testFileName = 'my-test-file-8.7.6.5.4.json';
    const result = testFileName.match(matchExpr);

    expect(result).to.equal(null);
  });

  it('regex handles invalid extension', () => {
    const testFileName = 'my-test-file-8.7.6.blah';
    const result = testFileName.match(matchExpr);

    expect(result).to.equal(null);
  });

  it('util finds the correct file version', () => {
    const versionUtil = new VersionUtil();
    const fileList = ['my-test-file.json', 'my-test-file-2.0.1.json', 'my-test-file-3.4.2.json'];
    const result = versionUtil.matchFile(fileList, 'my-test-file', '2.1.0');

    expect(result).to.equal('my-test-file-2.0.1.json');
  });

  it('util finds the correct file version in file list', () => {
    const versionUtil = new VersionUtil();
    const fileList = [
      'disallowed-file.txt',
      'random-file.json',
      'another-file-2.1.2.json',
      'my-test-file-0.0.1.json',
      'my-test-file-3.4.2.json',
    ];
    const result = versionUtil.matchFile(fileList, 'my-test-file', '2.1.0');

    expect(result).to.equal('my-test-file-0.0.1.json');
  });
});
