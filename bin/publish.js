/* eslint-disable no-console */
const path = require('path');
const basePackage = require('../package.json');
const workspacePackages = basePackage.workspaces.map((path) => require(`../${path}/package.json`));
const workspacePackageNames = basePackage.workspaces.map((path) => path.split('/')[1]);
console.log('fetching metadata from npm');
Promise.all(
  workspacePackageNames.map((packageName) =>
    require('axios').default.get(`https://registry.npmjs.org/${packageName}`)
  )
)
  .then((metaData) => {
    const packagesMetaData = metaData.map((metaDataItem) => {
      let localPackage = workspacePackages.find((item) => item.name === metaDataItem.data.name);
      const newVersion = localPackage.version;
      const lastVersion = metaDataItem.data['dist-tags'].latest;
      const isPrerelease = newVersion.match(/^([0-9]\d*)\.([0-9]\d*)\.([0-9]\d*)$/) == null;
      return {
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
    });
    verifyPublish(packagesMetaData);
  })
  .catch((e) => {
    throw e;
  });

function verifyPublish(packagesMetaData) {
  let issues = [],
    successes = [];
  packagesMetaData.forEach((packageMetaData) =>
    verifyPackage(packageMetaData, packagesMetaData, issues, successes)
  );
  if (issues.length > 0) {
    console.warn('ISSUES FOUND:');
    issues.forEach((issue) => console.warn(issue));
  }
  if (successes.length > 0) {
    console.warn('OK:');
    successes.forEach((success) => console.info(success));
  }
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
      `${packageMetaData.name}: possible only in tests: ${packageMetaData.possibleOnlyInTests}`
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
    if (dependencyInfo.newVersion !== dependency.version.slice(1)) {
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
    successes.push(` ${packageMetaData.name}: ok`);
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
  if (isPrerelease) return `package version ${newVersion} is pre-release or invalid`;
  if (newVersion === oldVersion) return true;
  let [oldMajor, oldMinor, oldPatch] = oldVersion.split('.');

  let possibleOptions = [
    [parseInt(oldMajor) + 1, '0', '0'],
    [oldMajor, parseInt(oldMinor) + 1, '0'],
    [oldMajor, oldMinor, parseInt(oldPatch) + 1],
  ].map((optionSet) => optionSet.join('.'));

  if (possibleOptions.indexOf(newVersion) === -1) {
    return `new version ${newVersion} for package ${packageName} should be one of the following: ${possibleOptions.join(
      ' || '
    )}`;
  }
  return true;
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
  return releaseText.indexOf(localPackage.version) > -1;
}

function checkOnlyInTests(localPackage) {
  const testsPath = `${getPackageRootPath(localPackage.name)}${path.sep}test`;
  let output;
  try {
    output = require('child_process').execSync(
      `grep -r "\\.only\\| only: true\\| only:true\\|,only: true\\|,only:true" ${testsPath}`
    );
  } catch (e) {
    // do nothing
  }
  if (!output) return false;
  return output.toString().trim();
}
