/* eslint-disable no-console */
const LokiDataProvider = require('../..');
const test = require('happn-commons-test').create();
const testDirPath = test.commons.path.resolve(__dirname, `../tmp`);
const testFileName = `${testDirPath}${test.commons.path.sep}disaster-recovery.db`;
const mockLogger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  trace: console.log,
  debug: console.log,
};

let cachedProvider;
/**
 *
 * @param {*} settings
 * @returns { LokiDataProvider }
 */
async function getProvider(settings) {
  if (cachedProvider) return cachedProvider;
  const lokiProvider = new LokiDataProvider(
    {
      fsync: true,
    },
    mockLogger
  );
  lokiProvider.settings = test.commons._.defaultsDeep(
    {
      filename: testFileName,
    },
    settings
  );
  await lokiProvider.initialize();
  test.log(`test file: ${testFileName}`);
  cachedProvider = lokiProvider;
  return lokiProvider;
}

/**
 *
 * @param { LokiDataProvider } lokiProvider
 */
async function reportLastId(lokiProvider) {
  console.log(await lokiProvider.findOne({ path: '/test/path/1' }));
  console.log((await lokiProvider.findOne({ path: '/test/path/1' }))?.data?.test);
}

async function start() {
  test.fs.ensureDirSync(testDirPath);
  //test.unlinkFiles([testFileName]);
  const lokiProvider = await getProvider();
  await reportLastId(lokiProvider);
  for (let i = 0; i < 1e6; i++) {
    await lokiProvider.upsert('/test/path/1', { data: { test: i } });
    await test.delay(1e3);
    test.log(`did ${i} upserts`);
  }
}

start();
