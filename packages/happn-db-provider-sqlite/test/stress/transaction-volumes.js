require('happn-commons-test').describe({ timeout: 120e3 }, (test) => {
  const SQLiteDataProvider = require('../..');
  const { DataTypes } = require('sequelize');
  const testDirPath = test.commons.path.resolve(__dirname, `../tmp`);
  const testFileName = `${testDirPath}${test.commons.path.sep}stress-test.db`;
  const mockLogger = {
    info: test.sinon.stub(),
    error: test.sinon.stub(),
    warn: test.sinon.stub(),
    trace: test.sinon.stub(),
  };

  let lastProvider;
  async function getProvider(settings) {
    if (lastProvider) {
      await lastProvider.stop();
    }
    const sqliteProvider = new SQLiteDataProvider({}, mockLogger);
    sqliteProvider.settings = test.commons._.defaultsDeep(
      {
        filename: testFileName,
        schema: [
          {
            name: 'test',
            pattern: [
              'test/insert/*',
              'test/upsert/*',
              'test/increment-separate/*',
              'test/increment-same/*',
            ],
            indexes: {
              'test.data': DataTypes.STRING,
              test1: DataTypes.STRING,
              test2: DataTypes.STRING,
              test3: DataTypes.STRING,
              testGauge: DataTypes.INTEGER,
            },
          },
        ],
      },
      settings
    );
    await sqliteProvider.initialize();
    test.log(`test file: ${testFileName}`);
    lastProvider = sqliteProvider;
    return sqliteProvider;
  }

  before('delete temp file', async () => {
    test.fs.ensureDirSync(testDirPath);
    test.unlinkFiles([testFileName]);
  });
  const OPERATIONS = 10e3,
    REPORTHEAPMOD = 1e3,
    CONCURRENT_OPERATIONS = 5e3;
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
  it(`hammers the provider with a ${OPERATIONS} inserts`, async () => {
    const sqliteProvider = await getProvider();
    const started = Date.now();
    for (let i = 0; i < OPERATIONS; i++) {
      await sqliteProvider.insert({ path: `test/insert/${i}`, data: { test: { data: i } } });
      reportHeap(i);
    }
    const duration = Date.now() - started;
    test.log(`completed inserts in ${duration}ms`);
  });
  it(`hammers the provider with a ${OPERATIONS} same increments`, async () => {
    const sqliteProvider = await getProvider();
    const started = Date.now();
    for (let i = 0; i < OPERATIONS; i++) {
      const increment = await sqliteProvider.increment(`test/increment-same/1`, 'testGauge', 5);
      reportHeap(i, `last increment value: ${increment}`);
    }
    const duration = Date.now() - started;
    test.log(`completed increments in ${duration}ms`);
  });
  it(`hammers the provider with a ${OPERATIONS} separate increments`, async () => {
    const sqliteProvider = await getProvider();
    const started = Date.now();
    for (let i = 0; i < OPERATIONS; i++) {
      const increment = await sqliteProvider.increment(
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
    const sqliteProvider = await getProvider();
    const started = Date.now();
    for (let i = 0; i < OPERATIONS; i++) {
      // we repeat so half inserts and updates
      await sqliteProvider.upsert(`test/upsert/${i % 2 === 0 ? i : i - 1}`, {
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
    const sqliteProvider = await getProvider();
    const started = Date.now();
    for (let i = 0; i < OPERATIONS; i++) {
      // we repeat so half inserts and updates
      await sqliteProvider.upsert(
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

  it(`hammers the provider with a ${CONCURRENT_OPERATIONS} merged upserts concurrently`, async () => {
    const sqliteProvider = await getProvider({ logging: false });
    const started = Date.now();
    const paths = [];
    for (let i = 0; i < CONCURRENT_OPERATIONS; i++) {
      paths.push(`test/upsert/${i % 2 === 0 ? i : i - 1}`);
    }
    const pushItem = function (path) {
      return sqliteProvider.upsert(
        path,
        {
          test1: 1,
          test2: 2,
          test3: 3,
        },
        { merge: true }
      );
    };
    await Promise.all(paths.map((path) => pushItem(path)));
    const duration = Date.now() - started;
    test.log(`completed concurrent merge upserts in ${duration}ms`);
    const results = await sqliteProvider.find('test/upsert/*');
    test.log('found: ' + results.length);
  });
});
