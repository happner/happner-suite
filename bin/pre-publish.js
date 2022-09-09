/* eslint-disable no-console */
const path = require('path');
const basePackage = require('../package.json');
const workspacePackages = basePackage.workspaces.map((path) => require(`../${path}/package.json`));
const workspacePackageNames = basePackage.workspaces.map((path) => path.split('/')[1]);

let lastHighestVersionJump = -1;
let packagesMetaData = null;
let prereleases = [];

const { execSync } = require('child_process');

function executeGitCommand(command) {
  return execSync(command)
    .toString('utf8')
    .replace(/[\n\r\s]+$/, '');
}

console.log('fetching metadata from npm...');
Promise.all(
  workspacePackageNames.map((packageName) =>
    require('axios').default.get(`https://registry.npmjs.org/${packageName}`)
  )
)
  .then((metaData) => {
    console.log('fetched data from npm');
    packagesMetaData = metaData.map((metaDataItem) => {
      let localPackage = workspacePackages.find((item) => item.name === metaDataItem.data.name);
      if (!localPackage) return null;
      console.log('scanning package: ', metaDataItem.data.name);
      const newVersion = localPackage.version;
      const lastVersion = getLatestNonPrereleaseVersion(metaDataItem.data['versions']);
      console.log(`highest current version:${lastVersion}, local version: ${newVersion}`);
      const isPrerelease = newVersion.match(/^([0-9]\d*)\.([0-9]\d*)\.([0-9]\d*)$/) == null;
      return {
        publishOrder: getPackagePublishOrder(localPackage.name),
        isPrerelease,
        versionJumped: newVersion !== lastVersion,
        versionJumpMadeSense: versionJumpMadeSense(
          newVersion,
          lastVersion,
          localPackage.name,
          isPrerelease
        ),
        newVersion,
        lastVersion,
        name: metaDataItem.data.name,
        workspaceDependencies: getWorkspaceDependencies(localPackage).concat(
          getWorkspaceDependencies(localPackage, true)
        ),
        releasesUpToDate: checkReleasesUpToDate(localPackage),
        possibleOnlyInTests: checkOnlyInTests(localPackage),
      };
    }).filter((item) => item !== null);
    console.log('fetching master package...');
    return require('axios').default.get(
      `https://raw.githubusercontent.com/happner/happner-suite/master/package.json`
    );
  })
  .then((masterPackage) => {
    console.log('fetched master package...');
    verifyPublish(packagesMetaData, masterPackage.data);
  })
  .catch((e) => {
    throw e;
  });

function getVersionObject(versionString) {
  const split = versionString.split('.');
  const versionObject= {
    versionString,
    major: parseInt(split[0]),
    minor: parseInt(split[1]),
    patch: isNaN(split[2]) ? split[2] : parseInt(split[2]),
  };
  versionObject.isPrerelease = isNaN(versionObject.patch);
  return versionObject;
}

function getLatestNonPrereleaseVersion(versions) {
  const nonPrereleaseVersions = Object.keys(versions)
    .map(versionString => getVersionObject(versionString))
    .filter(versionObject => {
      return versionObject.isPrerelease === false;
    });

  nonPrereleaseVersions.sort((versionObjectA, versionObjectB) => {
    if (versionObjectA.major > versionObjectB.major) {
      return 1;
    }
    if (versionObjectB.major > versionObjectA.major) {
      return -1;
    }
    if (versionObjectA.minor > versionObjectB.minor) {
      return 1;
    }
    if (versionObjectB.minor > versionObjectA.minor) {
      return -1;
    }
    if (versionObjectA.patch > versionObjectB.patch) {
      return 1;
    }
    if (versionObjectB.patch > versionObjectA.patch) {
      return -1;
    }
    return 0;
  });
  return nonPrereleaseVersions.pop().versionString;
}

function verifyPublish(packagesMetaData, masterPackage) {
  let issues = [],
    successes = [];
  packagesMetaData.forEach((packageMetaData) =>
    verifyPackage(packageMetaData, packagesMetaData, issues, successes)
  );
  const packageLockVersion = require('../package-lock.json').version;
  const packageVersion = require('../package.json').version;
  if (packageLockVersion !== packageVersion) {
    issues.push(
      `package-lock with version ${packageLockVersion} is not same as package version: ${packageVersion}, run npm i`
    );
  }
  const branch = executeGitCommand('git rev-parse --abbrev-ref HEAD');
  if (branch !== 'master') {
    issues.push(`DO NOT PUBLISH FROM FEATURE OR DEV BRANCH: ${branch}`);
  }

  let masterPackageVersion = masterPackage.version;
  let localMasterPackageVersion = require('../package.json').version;

  if (
    lastHighestVersionJump > -1 &&
    (successes.length > 0 || issues.length > 0) &&
    branch !== 'master'
  ) {
    const masterPackageJump = getVersionJump(localMasterPackageVersion, masterPackageVersion);
    if (masterPackageVersion === localMasterPackageVersion) {
      issues.push(
        `local ${branch} version same as github master package version, should jump ${[
          'patch',
          'minor',
          'major',
        ].at(lastHighestVersionJump)}`
      );
    }
    if (masterPackageJump.section !== lastHighestVersionJump) {
      issues.push(
        `${branch} version should jump ${['patch', 'minor', 'major'].at(lastHighestVersionJump)}`
      );
    }
  }

  if (localMasterPackageVersion !== require('../package-lock.json').version) {
    issues.push(
      `${localMasterPackageVersion} and package-lock version ${
        require('../package-lock.json').version
      } do not match`
    );
  }

  if (issues.length > 0) {
    console.warn('issues:');
    issues.forEach((issue) => console.warn(issue));
    if (successes.length > 0) {
      console.info('ok:');
      successes.forEach((success) => console.info(success.name));
    }
    if (prereleases.length > 0) {
      console.info('prereleases ready for publish:');
      getPublishOrder().forEach((packageName) => {
        const found = prereleases.find((prerelease) => prerelease.packageName === packageName);
        if (found) {
          console.info(`npm publish --workspace=${packageName} --tag prerelease-${found.major}`);
        }
      });
    }
    return;
  }
  console.info('ready for publish, in the following order:');
  successes
    .sort((a, b) => a.publishOrder - b.publishOrder)
    .forEach((success) => {
      if (success.versionJumped) {
        console.info(`npm publish --workspace=${success.name}`);
      }
    });
}

function verifyPackage(packageMetaData, packagesMetaData, issues, successes) {
  let foundIssue = false;
  if (packageMetaData.versionJumpMadeSense !== true) {
    issues.push(
      `bad version jump for package ${packageMetaData.name}: ${packageMetaData.versionJumpMadeSense}`
    );
    foundIssue = true;
  }
  if (packageMetaData.possibleOnlyInTests) {
    issues.push(
      `${packageMetaData.name}: possible ".only" in tests: ${packageMetaData.possibleOnlyInTests}`
    );
    foundIssue = true;
  }
  if (!packageMetaData.releasesUpToDate) {
    issues.push(`${packageMetaData.name}: RELEASES.md not up to date`);
    foundIssue = true;
  }
  packageMetaData.workspaceDependencies.forEach((dependency) => {
    const dependencyInfo = packagesMetaData.find(
      (packageMetaData) => packageMetaData.name === dependency.name
    );
    if (dependencyInfo.newVersion !== dependency.version && dependencyInfo.newVersion !== dependency.version.slice(1)) {
      issues.push(
        `${packageMetaData.name}: update dependency version dependency ${dependencyInfo.name} from ${dependency.version} to ${dependencyInfo.newVersion}`
      );
      foundIssue = true;
    }
    if (!packageMetaData.versionJumped && dependencyInfo.versionJumped) {
      issues.push(
        `${packageMetaData.name}: update version as dependency version has jumped, dependency ${dependencyInfo.name} from ${dependency.version} to ${dependencyInfo.newVersion}`
      );
      foundIssue = true;
    }
  });

  if (!foundIssue) {
    successes.push(packageMetaData);
  }
}

function getWorkspaceDependencies(package, dev) {
  let dependencyGraph = dev === true ? package.devDependencies : package.dependencies;
  if (dependencyGraph == null) return [];
  return Object.keys(dependencyGraph)
    .filter((depdendencyName) => workspacePackageNames.indexOf(depdendencyName) > -1)
    .map((dependencyGraphKey) => {
      return {
        name: dependencyGraphKey,
        version: dependencyGraph[dependencyGraphKey],
      };
    });
}

function versionJumpMadeSense(newVersion, oldVersion, packageName, isPrerelease) {
  if (newVersion === oldVersion) return true;
  const jump = getVersionJump(newVersion, oldVersion);
  if (jump.section === -1) {
    return `new version ${newVersion} for package ${packageName} should be one of the following: ${jump.possibleOptions.join(
      ' || '
    )}`;
  }
  if (lastHighestVersionJump < jump.section) lastHighestVersionJump = jump.section;
  if (isPrerelease) {
    prereleases.push({ packageName, major: newVersion.split('.').shift() });
    return `package version ${newVersion} is pre-release or non standard`;
  }
  return true;
}

function getVersionJump(newVersion, oldVersion) {
  let [oldMajor, oldMinor, oldPatch] = oldVersion.split('.');

  let possibleOptions = [
    [oldMajor, oldMinor, parseInt(oldPatch) + 1],
    [oldMajor, parseInt(oldMinor) + 1, '0'],
    [parseInt(oldMajor) + 1, '0', '0'],
  ].map((optionSet) => optionSet.join('.'));

  return { section: possibleOptions.indexOf(newVersion.split('-')[0]), possibleOptions };
}

function getPackageRootPath(packageName) {
  return path.resolve(__dirname, `../packages/${packageName}`);
}

function checkReleasesUpToDate(localPackage) {
  const releasesPath = `${getPackageRootPath(localPackage.name)}${path.sep}RELEASES.md`;
  const fs = require('fs');
  let releaseText,
    releasesExists = true;
  try {
    releaseText = fs.readFileSync(releasesPath);
  } catch (e) {
    releasesExists = false;
  }
  if (!releasesExists) return true;
  return releaseText.indexOf(localPackage.version.split('-')[0]) > -1;
}

function checkOnlyInTests(localPackage) {
  const testsPath = `${getPackageRootPath(localPackage.name)}${path.sep}test`;
  let output;
  try {
    output = require('child_process').execSync(
      `grep -r "\\.only\\| only: true\\| only:true\\|, only: true\\|, only:true\\|,only: true\\|,only:true" ${testsPath}`
    );
  } catch (e) {
    // do nothing
  }
  if (!output) return false;
  return output.toString().trim();
}

function getPackagePublishOrder(packageName) {
  return getPublishOrder().indexOf(packageName);
}

function getPublishOrder() {
  return [
    'happn-commons',
    'happn-commons-test',
    'happn-nedb',
    'redis-lru-cache',
    'tame-search',
    'happn-db-provider-loki',
    'happn-db-provider-nedb',
    'happn-db-provider-elasticsearch',
    'happn-db-provider-mongo',
    'happn-util-crypto',
    'happn-logger',
    'happn-3',
    'happn-cluster',
    'happner-client',
    'happner-2',
    'happner-cluster',
  ];
}
