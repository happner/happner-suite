const deasync = require('deasync');
const fs = require('fs');
const path = require('path');
// let syncImport = deasync(import);

// let getModule = (path) => {

//     try {
//       let module = new require(modulePath)();
//       return module

//   }
// };1

// static impoortCorrectBuilder(moduleName, rootPath, version) {
//     let modulePath = path.resolve(__dirname, rootPath).concat(moduleName).concat(version)
//     if (!version) return
describe('test', () => {
  let importModule = async (path) => {
    console.log(path);
    console.log(fs.existsSync(path)); //) throw new Error('MODULE NOT FOUND');
    return await import(path);
  };
  it('imports successfully', async () => {
    try {
      let model = await importModule(
        path.resolve(__dirname, '../lib/builders/happn/services/cache-config-builder.ts')
      );
      console.log('imported');
    } catch (e) {
      console.log(e);
      console.log('OK');
    }
  });
});

static async importCorrectBuilder(moduleName, rootPath, version) {
  let modulePath
  if (!version) {
    modulePath = path.resolve(__dirname, rootPath).concat(moduleName).concat('.ts')
    if (!fs.existsSync(modulePath)) throw new Error(`Bulder for ${moduleName} not found`);
    return await import(modulePath);
  }
 modulePath = path.resolve(__dirname, rootPath).concat(moduleName).concat(version).concat('ts');
 if (fs.existsSync(modulePath)) {return await import(modulePath)};
  let semanticSegments = version.split('.')
  if (semanticSegments[0] === '1') return this.importCorrectBuilder(moduleName, rootPath) //Major version would be reduced to zero, so we find the plain version
  semanticSegments[0] = (parseInt(semanticSegments[0] - 1).toString();
  let newVersion = semanticSegments.join('.')
  return this.importCorrectBuilder(moduleName, rootPath, newVersion)
  }

//     try {
//       let module = new require(modulePath)();
//       return module

//   }

// }
