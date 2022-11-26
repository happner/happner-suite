require('happn-commons-test').describe({ timeout: 120e3 }, (test) => {
  const NedbDataProvider = require('../..');
  const testDirPath = test.commons.path.resolve(__dirname, `../tmp`);
  const testFileName = `${testDirPath}${test.commons.path.sep}stress-test.db`;
  const mockLogger = {
    info: test.sinon.stub(),
    error: test.sinon.stub(),
    warn: test.sinon.stub(),
    trace: test.sinon.stub(),
  };

  let cachedProvider;
  async function getProvider() {
    if (cachedProvider) return cachedProvider;
    const nedbProvider = new NedbDataProvider({ filename: testFileName }, mockLogger);
    await nedbProvider.initialize();
    test.log(`test file: ${testFileName}`);
    cachedProvider = nedbProvider;
    return nedbProvider;
  }

  context('Data operations', () => {
    before('delete temp file', async () => {
      test.fs.ensureDirSync(testDirPath);
      test.unlinkFiles([testFileName]);
    });
    const OPERATIONS = 10e3,
      REPORTHEAPMOD = 1e3;
    function reportHeap(count, msg) {
      if (count % REPORTHEAPMOD !== 0) {
        return;
      }
      let line = `heap used: ${Math.floor(process.memoryUsage().heapUsed / 1000)}kb`;
      if (msg) {
        line += ` ${msg}`;
      }
      test.log(line);
    }
    it(`hammers the provider with a ${OPERATIONS} same increments`, async () => {
      const nedbProvider = await getProvider();
      const started = Date.now();
      for (let i = 0; i < OPERATIONS; i++) {
        const increment = await nedbProvider.increment(`test/increment-same/1`, 'testGauge', 5);
        reportHeap(i, `last increment value: ${increment}`);
      }
      const duration = Date.now() - started;
      test.log(`completed increments in ${duration}ms`);
    });
    it(`hammers the provider with a ${OPERATIONS} separate increments`, async () => {
      const nedbProvider = await getProvider();
      const started = Date.now();
      for (let i = 0; i < OPERATIONS; i++) {
        const increment = await nedbProvider.increment(
          `test/increment-separate/${i}`,
          'testGauge',
          5
        );
        reportHeap(i, `last increment value: ${increment}`);
      }
      const duration = Date.now() - started;
      test.log(`completed increments in ${duration}ms`);
    });
    it(`hammers the provider with a ${OPERATIONS} upserts`, async () => {
      const nedbProvider = await getProvider();
      const started = Date.now();
      for (let i = 0; i < OPERATIONS; i++) {
        // we repeat so half inserts and updates
        await nedbProvider.upsert(`test/upsert/${i % 2 === 0 ? i : i - 1}`, {
          test1: i,
          test2: i,
          test3: i,
        });
        reportHeap(i);
      }
      const duration = Date.now() - started;
      test.log(`completed upserts in ${duration}ms`);
    });

    it(`hammers the provider with a ${OPERATIONS} merged upserts`, async () => {
      const nedbProvider = await getProvider();
      const started = Date.now();
      for (let i = 0; i < OPERATIONS; i++) {
        // we repeat so half inserts and updates
        await nedbProvider.upsert(
          `test/upsert/${i % 2 === 0 ? i : i - 1}`,
          {
            test1: i,
            test2: i,
            test3: i,
          },
          { merge: true }
        );
        reportHeap(i);
      }
      const duration = Date.now() - started;
      test.log(`completed merge upserts in ${duration}ms`);
    });
  });
});
