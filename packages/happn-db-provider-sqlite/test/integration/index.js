require('happn-commons-test').describe({ timeout: 120e3 }, (test) => {
  const SQLiteDataProvider = require('../..');
  const { Sequelize, DataTypes } = require('sequelize');
  const testDirPath = test.commons.path.resolve(__dirname, `../tmp`);
  let fileId = test.newid();
  const testFileName = `${testDirPath}${test.commons.path.sep}${fileId}`;
  const tempTestFileName = `${testDirPath}${test.commons.path.sep}temp_${fileId}`;
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
            pattern: 'test/path/*',
            indexes: {
              'test.data': DataTypes.STRING,
              'data.test': DataTypes.STRING,
              'data.test1': DataTypes.STRING,
              'data.test2': DataTypes.STRING,
              'data.test3': DataTypes.STRING,
              testGauge: DataTypes.INTEGER,
            },
          },
        ],
      },
      settings
    );
    await sqliteProvider.initialize();
    return sqliteProvider;
  }

  context('Data operations', () => {
    before('ensures temp dir and test file', () => {
      test.fs.ensureDirSync(testDirPath);
      test.fs.writeFileSync(testFileName, '');
    });
    beforeEach('delete temp file', async () => {
      test.unlinkFiles([testFileName, tempTestFileName]);
    });
    after(async () => {
      test.unlinkFiles([testFileName, tempTestFileName]);
    });
    it('starts up the provider', async () => {
      await getProvider();
    });
    it('starts up the provider with a persistence filename, does some inserts, restarts the provider and checks the data is still there', async () => {
      await testPersistence();
    });
    it('can count without criteria', async () => {
      await testCount();
    });
    it('can count with criteria', async () => {
      await testCountWithCriteria();
    });
    it('can merge', async () => {
      await testMerge();
    });
    it.only('can increment', async () => {
      await testIncrement();
    });
  });
  async function testMerge() {
    const sqliteProvider = await getProvider();
    await sqliteProvider.merge('test/path/1', { data: { test1: 'test1' } });
    await sqliteProvider.merge('test/path/1', { data: { test2: 'test2' } });
    await sqliteProvider.merge('test/path/1', { data: { test3: 'test3' } });
    const found = await sqliteProvider.findOne('test/path/1');
    test.expect(found.data).to.eql({ test1: 'test1', test2: 'test2', test3: 'test3' });
  }

  async function testIncrement(settings) {
    const sqliteProvider = await getProvider(settings);
    await sqliteProvider.increment('test/increment', 'testGauge');
    await sqliteProvider.increment('test/increment', 'testGauge', 2);
    await sqliteProvider.increment('test/increment', 'testGauge');

    const found = await sqliteProvider.find('test/increment');

    test.expect(found[0].data.testGauge.value).to.be(4);
  }

  async function testCountWithCriteria(settings) {
    const sqliteProvider = await getProvider(settings);
    await sqliteProvider.insert({
      path: 'test/path/1',
      data: { test: 'test1' },
    });
    await sqliteProvider.insert({
      path: 'test/path/2',
      data: { test: 'test2' },
    });
    await sqliteProvider.insert({
      path: 'test/path/3',
      data: { test: 'test2' },
    });
    test
      .expect(
        await sqliteProvider.count('test/path/*', {
          criteria: {
            'data.test': {
              $eq: 'test1',
            },
          },
        })
      )
      .to.eql({ data: { value: 1 } });

    test
      .expect(
        await sqliteProvider.count('test/path/*', {
          criteria: {
            'data.test': {
              $eq: 'test2',
            },
          },
        })
      )
      .to.eql({ data: { value: 2 } });
  }

  async function testCount(settings) {
    const sqliteProvider = await getProvider(settings);
    await sqliteProvider.insert({
      path: 'test/path/1',
      data: { test: 'test1' },
    });
    await sqliteProvider.insert({
      path: 'test/path/2',
      data: { test: 'test2' },
    });
    await sqliteProvider.insert({
      path: 'test/path/3',
      data: { test: 'test2' },
    });

    test.expect(await sqliteProvider.count('test/path/*', {})).to.eql({ data: { value: 3 } });
    test.expect(await sqliteProvider.count('test/path/1', {})).to.eql({ data: { value: 1 } });
  }

  async function testPersistence(settings) {
    const sqliteProvider = await getProvider(settings);
    await sqliteProvider.insert({ path: 'test/path/1', data: { test: { data: 1 } } });
    const found1 = (await sqliteProvider.find('test/path/1'))[0];
    await sqliteProvider.insert({ path: 'test/path/2', data: { test: { data: 1 } } });
    await sqliteProvider.insert({ path: 'test/path/3', data: { test: { data: 1 } } });
    let found = await sqliteProvider.find('test/path/*');
    test.expect(found.length).to.be(3);
    found = await sqliteProvider.find('test/path/1');
    test.expect(found.length).to.be(1);
    found = await sqliteProvider.find('test/path/*', {
      options: {
        sort: { path: -1 },
        limit: 2,
      },
    });
    test.expect(found[0].path).to.be('test/path/3');
    test.expect(found[1].path).to.be('test/path/2');
    test.expect(found.length).to.be(2);
    found = await sqliteProvider.find('test/path/*', {
      options: {
        sort: { path: -1 },
        limit: 2,
        skip: 2,
      },
    });
    test.expect(found[0].path).to.be('test/path/1');
    test.expect(found.length).to.be(1);
    await sqliteProvider.stop();
    await sqliteProvider.initialize();
    const found1Again = (await sqliteProvider.find('test/path/1'))[0];
    test.expect(found1Again.created).to.eql(found1.created);
    test.expect(found1Again.modified).to.eql(found1.modified);
    found = await sqliteProvider.find('test/path/*');
    test.expect(found.length).to.be(3);
  }
});
