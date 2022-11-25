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

  async function getProvider(settings) {
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
              test: DataTypes.STRING,
              'test.data': DataTypes.STRING,
              'data.test': DataTypes.STRING,
              test1: DataTypes.STRING,
              test2: DataTypes.STRING,
              test3: DataTypes.STRING,
              testGauge: DataTypes.INTEGER,
              'test.other': DataTypes.STRING,
            },
          },
        ],
      },
      settings
    );
    await sqliteProvider.initialize();
    test.log(`test file: ${testFileName}`);
    return sqliteProvider;
  }

  context('Data operations', () => {
    before('delete temp file', async () => {
      test.fs.ensureDirSync(testDirPath);
      test.unlinkFiles([testFileName]);
    });
    const OPERATIONS = 10e3;
    it(`hammers the provider with a ${OPERATIONS} inserts`, async () => {
      const sqliteProvider = await getProvider();
      const started = Date.now();
      for (let i = 0; i < OPERATIONS; i++) {
        await sqliteProvider.insert({ path: `test/insert/${i}`, data: { test: { data: i } } });
        if (i % 1000 === 0) {
          test.log(`${process.memoryUsage().heapUsed / 1000}kb`);
        }
      }
      const duration = Date.now() - started;
      test.log(`completed inserts in ${duration} ms`);
    });
    it(`hammers the provider with a ${OPERATIONS} same increments`, async () => {
      const sqliteProvider = await getProvider();
      const started = Date.now();
      for (let i = 0; i < OPERATIONS; i++) {
        const increment = await sqliteProvider.increment(`test/increment-same/1`, 'testGauge', 5);
        if (i % 1000 === 0) {
          test.log(`${process.memoryUsage().heapUsed / 1000}kb, last: ${increment}`);
        }
      }
      const duration = Date.now() - started;
      test.log(`completed increments in ${duration} ms`);
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
        if (i % 1000 === 0) {
          test.log(`${process.memoryUsage().heapUsed / 1000}kb, last: ${increment}`);
        }
      }
      const duration = Date.now() - started;
      test.log(`completed increments in ${duration} ms`);
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
        if (i % 1000 === 0) {
          test.log(`${process.memoryUsage().heapUsed / 1000}kb`);
        }
      }
      const duration = Date.now() - started;
      test.log(`completed upserts in ${duration} ms`);
    });
  });
});
