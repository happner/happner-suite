require('happn-commons-test').describe({ timeout: 120e3 }, (test) => {
  const LokiDataProvider = require('../..');
  const testDirPath = test.commons.path.resolve(__dirname, `../tmp`);
  const testFileName = `${testDirPath}${test.commons.path.sep}stress-test.db`;
  const mockLogger = {
    info: test.sinon.stub(),
    error: test.sinon.stub(),
    warn: test.sinon.stub(),
    trace: test.sinon.stub(),
  };

  let cachedProvider;
  async function getProvider(settings) {
    if (cachedProvider) return cachedProvider;
    const lokiProvider = new LokiDataProvider({}, mockLogger);
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

    it('will at some point perform archivals', () => {
      for (let i = 0; i < 10; i++) {
        setTimeout(async () => {
          console.log('>>> PERFORMING ARCHIVE');
          const lokiProvider = await getProvider();
          await lokiProvider.archive();
        }, Math.random() * 20000);
      }
    });

    it(`hammers the provider with a ${OPERATIONS} inserts`, async () => {
      const lokiProvider = await getProvider();
      const started = Date.now();
      for (let i = 0; i < OPERATIONS; i++) {
        await lokiProvider.insert({ path: `test/insert/${i}`, data: { test: { data: i } } });
        reportHeap(i);
      }
      const duration = Date.now() - started;
      test.log(`completed inserts in ${duration}ms`);
    });

    it(`hammers the provider with a ${OPERATIONS} same increments`, async () => {
      const lokiProvider = await getProvider();
      const started = Date.now();
      for (let i = 0; i < OPERATIONS; i++) {
        const increment = await lokiProvider.increment(`test/increment-same/1`, 'testGauge', 5);
        reportHeap(i, `last increment value: ${increment}`);
      }
      const duration = Date.now() - started;
      test.log(`completed increments in ${duration}ms`);
    });

    it(`hammers the provider with a ${OPERATIONS} separate increments`, async () => {
      const lokiProvider = await getProvider();
      const started = Date.now();
      for (let i = 0; i < OPERATIONS; i++) {
        const increment = await lokiProvider.increment(
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
      const lokiProvider = await getProvider();
      const started = Date.now();
      for (let i = 0; i < OPERATIONS; i++) {
        // we repeat so half inserts and updates
        await lokiProvider.upsert(`test/upsert/${i % 2 === 0 ? i : i - 1}`, {
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
      const lokiProvider = await getProvider();
      const started = Date.now();
      for (let i = 0; i < OPERATIONS; i++) {
        // we repeat so half inserts and updates
        await lokiProvider.upsert(
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
