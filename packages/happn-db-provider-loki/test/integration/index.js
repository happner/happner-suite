require('happn-commons-test').describe({ timeout: 20e3 }, (test) => {
  const LokiDataProvider = require('../..');
  const testDirPath = test.commons.path.resolve(__dirname, `../tmp`);
  const testFixturesDir = test.commons.path.resolve(__dirname, `../__fixtures`);

  let fileId = test.newid();
  const testFileName = `${testDirPath}${test.commons.path.sep}${fileId}`;
  const tempTestFileName = `${testDirPath}${test.commons.path.sep}temp_${fileId}`;
  const mockLogger = {
    info: test.sinon.stub(),
    error: test.sinon.stub(),
    warn: test.sinon.stub(),
    trace: test.sinon.stub(),
    debug: test.sinon.stub(),
  };

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

    it('starts up the provider with a persistence filename, does some inserts, restarts the provider and checks the data is still there', async () => {
      await testPersistence();
    });

    it('starts up the provider with a persistence filename, does some inserts, tests findOne, upsert and the rollover threshold', async () => {
      await testRollOverThreshold();
    });

    it('can count', async () => {
      await testCount();
    });
    it('can merge', async () => {
      await testMerge();
    });

    it('can increment', async () => {
      await testIncrement();
    });

    it('starts up the provider with a persistence filename, does some inserts, restarts the provider and checks the data is still there - fsync', async () => {
      await testPersistence({
        fsync: true,
      });
    });

    it('starts up the provider with a persistence filename, does some inserts, tests findOne, upsert and the rollover threshold - fsync', async () => {
      await testRollOverThreshold({
        fsync: true,
      });
    });

    it('can count - fsync', async () => {
      await testCount({
        fsync: true,
      });
    });

    it('can merge - fsync', async () => {
      await testMerge({
        fsync: true,
      });
    });

    it('can increment - fsync', async () => {
      await testIncrement({
        fsync: true,
      });
    });

    it('can find with criteria', async () => {
      await testCriteria();
    });
  });
  context('Reconstruction', () => {
    before('creates test files', () => {
      test.fs.copySync(
        `${testFixturesDir}${test.commons.path.sep}bad-data`,
        `${testFixturesDir}${test.commons.path.sep}corrupted-data`,
        { force: true }
      );
      test.fs.copySync(
        `${testFixturesDir}${test.commons.path.sep}good-data`,
        `${testFixturesDir}${test.commons.path.sep}temp_corrupted-data`,
        { force: true }
      );
      test.fs.copySync(
        `${testFixturesDir}${test.commons.path.sep}good-data-bad-ops`,
        `${testFixturesDir}${test.commons.path.sep}good-data-corrupt-ops`,
        { force: true }
      );
      test.fs.copySync(
        `${testFixturesDir}${test.commons.path.sep}good-data-with-ops`,
        `${testFixturesDir}${test.commons.path.sep}temp_good-data-corrupt-ops`,
        { force: true }
      );
      test.fs.copySync(
        `${testFixturesDir}${test.commons.path.sep}corrupted-eof`,
        `${testFixturesDir}${test.commons.path.sep}corrupted-eof-test`,
        { force: true }
      );
    });
    it('can restore from good data', async () => {
      await testRestore({}, 'good-data');
    });

    it('can restore from corrupt eof', async () => {
      await testRestoreWithOps({}, 'corrupted-eof-test', 2);
    });

    it('can restore from bad data if temp file is good', async () => {
      await testRestore({}, 'corrupted-data', 2);
    });

    it('cannot restore from bad data if temp file is bad as well', async () => {
      await testRestore({}, 'bad-snapshot', 'Unexpected end of JSON input');
    });

    it('can restore from good data with operations', async () => {
      await testRestoreWithOps({}, 'good-data-with-ops', 4);
    });

    it('can restore from good data wit bad ops if temp file is good', async () => {
      await testRestoreWithOps({}, 'good-data-corrupt-ops', 2);
    });
    after('deletes files', async () => {
      await test.delay(1000);
      test.unlinkFiles([
        `${testFixturesDir}${test.commons.path.sep}corrupted-data`,
        `${testFixturesDir}${test.commons.path.sep}temp_corrupted-data`,
        `${testFixturesDir}${test.commons.path.sep}good-data-corrupt-ops`,
        `${testFixturesDir}${test.commons.path.sep}temp_good-data-corrupt-ops`,
      ]);
    });
  });
  async function testMerge(settings) {
    const lokiProvider = new LokiDataProvider(mockLogger);
    lokiProvider.settings = {
      ...{
        filename: testFileName,
        snapshotRollOverThreshold: 5,
      },
      ...settings,
    };
    await lokiProvider.initialize();
    await lokiProvider.merge('test/path/1', { data: { test1: 'test1' } });
    await lokiProvider.merge('test/path/1', { data: { test2: 'test2' } });
    await lokiProvider.merge('test/path/1', { data: { test3: 'test3' } });
    test
      .expect((await lokiProvider.findOne({ path: 'test/path/1' })).data)
      .to.eql({ test1: 'test1', test2: 'test2', test3: 'test3' });
  }

  async function testIncrement(settings) {
    const lokiProvider = new LokiDataProvider(mockLogger);
    lokiProvider.settings = {
      ...{
        filename: testFileName,
        snapshotRollOverThreshold: 5,
      },
      ...settings,
    };
    await lokiProvider.initialize();
    await lokiProvider.increment('test/increment', 'testGauge');
    await lokiProvider.increment('test/increment', 'testGauge', 2);
    await lokiProvider.increment('test/increment', 'testGauge');

    const found = await lokiProvider.find('test/increment');

    test.expect(found[0].data.testGauge.value).to.be(4);
  }

  async function testCount(settings) {
    const lokiProvider = new LokiDataProvider(mockLogger);
    const created = 1634804510343;
    const modified = created;
    lokiProvider.settings = {
      ...{
        filename: testFileName,
        snapshotRollOverThreshold: 5,
      },
      ...settings,
    };
    await lokiProvider.initialize();
    await lokiProvider.insert({ path: 'test/path/1', data: { test: 'test1' }, created, modified });
    await lokiProvider.insert({ path: 'test/path/2', data: { test: 'test2' }, created, modified });
    await lokiProvider.insert({ path: 'test/path/3', data: { test: 'test2' }, created, modified });

    test
      .expect(
        await lokiProvider.count('test/path/*', {
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
        await lokiProvider.count('test/path/*', {
          criteria: {
            'data.test': {
              $eq: 'test2',
            },
          },
        })
      )
      .to.eql({ data: { value: 2 } });
  }

  async function testRollOverThreshold(settings) {
    const lokiProvider = new LokiDataProvider(
      {
        ...{
          filename: testFileName,
          snapshotRollOverThreshold: 5,
        },
        ...settings,
      },
      mockLogger
    );
    const modifiedBy = 'test@test.com';
    await lokiProvider.initialize();
    await lokiProvider.insert({
      path: 'test/path/1',
      data: { test: 'test' },
    });
    await lokiProvider.insert({
      path: 'test/path/2',
      data: { test: 'test' },
    });
    await lokiProvider.insert({
      path: 'test/path/3',
      data: { test: 'test' },
    });
    await lokiProvider.upsert('test/path/3', {
      data: { test: 'changed' },
      _meta: { modifiedBy },
    });
    test.expect(await test.lineCount(testFileName)).to.be(5);
    await lokiProvider.upsert('test/path/4', {
      data: { test: 'inserted' },
    });
    test.expect(await test.lineCount(testFileName)).to.be(1);
    let found = await lokiProvider.find('test/path/*', { sort: { path: 1 } });
    test.expect(found.length).to.be(4);
    test.expect(found[2].data.test).to.be('changed');
    test.expect(found[2].modifiedBy).to.be(modifiedBy);
    test.expect(found[3].data.test).to.be('inserted');

    await lokiProvider.stop();
    await lokiProvider.initialize();

    found = await lokiProvider.find('test/path/*', { sort: { path: 1 } });
    test.expect(found.length).to.be(4);
    test.expect(await test.lineCount(testFileName)).to.be(1);
    await lokiProvider.insert({ path: 'test/path/5', data: { test: 'test' } });
    test.expect(await test.lineCount(testFileName)).to.be(2);
    found = await lokiProvider.find('test/path/*', { sort: { path: 1 } });
    test.expect(found.length).to.be(5);
    await lokiProvider.remove('test/path/5');
    found = await lokiProvider.find('test/path/*', { sort: { path: 1 } });
    test.expect(found.length).to.be(4);
    test.expect(await test.lineCount(testFileName)).to.be(3);
  }

  async function testPersistence(settings) {
    const lokiProvider = new LokiDataProvider(null, mockLogger);
    lokiProvider.settings = {
      ...{
        filename: testFileName,
        snapshotRollOverThreshold: 5,
      },
      ...settings,
    };
    await lokiProvider.initialize();
    await lokiProvider.insert({ path: 'test/path/1', data: { test: 'test' } });
    const found1 = (await lokiProvider.find('test/path/1'))[0];
    await lokiProvider.insert({ path: 'test/path/2', data: { test: 'test' } });
    await lokiProvider.insert({ path: 'test/path/3', data: { test: 'test' } });
    let found = await lokiProvider.find('test/path/*');
    test.expect(found.length).to.be(3);
    found = await lokiProvider.find('test/path/1');
    test.expect(found.length).to.be(1);
    found = await lokiProvider.find('test/path/*', {
      options: {
        sort: { path: -1 },
        limit: 2,
      },
    });
    test.expect(found[0].path).to.be('test/path/3');
    test.expect(found[1].path).to.be('test/path/2');
    test.expect(found.length).to.be(2);
    found = await lokiProvider.find('test/path/*', {
      options: {
        sort: { path: -1 },
        limit: 2,
        skip: 2,
      },
    });
    test.expect(found[0].path).to.be('test/path/1');
    test.expect(found.length).to.be(1);
    test.expect(lokiProvider.operationCount).to.be(3);
    await lokiProvider.stop();
    await lokiProvider.initialize();
    const found1Again = (await lokiProvider.find('test/path/1'))[0];
    test.expect(found1Again.created).to.eql(found1.created);
    test.expect(found1Again.modified).to.eql(found1.modified);
    found = await lokiProvider.find('test/path/*');
    test.expect(found.length).to.be(3);
    test.expect(lokiProvider.operationCount).to.be(0);
  }

  async function testRestore(settings, fileName, expectedError) {
    const lokiProvider = new LokiDataProvider(null, mockLogger);
    lokiProvider.settings = {
      ...{
        filename: `${testFixturesDir}${test.commons.path.sep}${fileName}`,
        snapshotRollOverThreshold: 5,
      },
      ...settings,
    };
    try {
      await lokiProvider.initialize();
    } catch (e) {
      if (e.message === expectedError) {
        return;
      }
      throw e;
    }
    const found = await lokiProvider.find('test/path/*');
    test.expect(found.length).to.be(3);
    test.expect(lokiProvider.operationCount).to.be(0);
  }

  async function testRestoreWithOps(settings, fileName, assertion) {
    const lokiProvider = new LokiDataProvider(null, mockLogger);
    lokiProvider.settings = {
      ...{
        filename: `${testFixturesDir}${test.commons.path.sep}${fileName}`,
        snapshotRollOverThreshold: 5,
      },
      ...settings,
    };
    await lokiProvider.initialize();
    const found = await lokiProvider.find('test/increment');

    test.expect(found[0].data.testGauge.value).to.be(assertion);
  }

  async function testCriteria() {
    const lokiProvider = new LokiDataProvider(null, mockLogger);
    await lokiProvider.initialize();
    await lokiProvider.insert({
      path: 'test/path/1',
      data: { test: { data: 1, other: 'blah' } },
    });
    await lokiProvider.insert({
      path: 'test/path/2',
      data: { test: { data: 2, other: 'plah' } },
    });
    await lokiProvider.insert({
      path: 'test/path/3',
      data: { test: { data: 3, other: 'lpah' } },
    });
    await lokiProvider.insert({
      path: 'test/path/4',
      data: { test: { data: 4, other: 'hello' } },
    });
    await lokiProvider.insert({
      path: 'test/path/5',
      data: { test: { data: 5, other: 'world' } },
    });

    const found1 = await lokiProvider.find('test/path/*', {
      criteria: {
        'data.test.data': {
          $eq: 1,
        },
      },
    });

    test.chai.expect(found1).to.have.lengthOf(1);
    test.chai.expect(found1).to.deep.nested.property('0.path').which.equals('test/path/1');

    const found2 = await lokiProvider.find('test/path/*', {
      criteria: {
        'data.test.data': {
          $eq: 2,
        },
      },
    });

    test.chai.expect(found2).to.have.lengthOf(1);
    test.chai.expect(found2).to.deep.nested.property('0.path').which.equals('test/path/2');

    const found3 = await lokiProvider.find('test/path/*', {
      criteria: {
        'data.test.data': {
          $eq: 3,
        },
      },
    });

    test.chai.expect(found3).to.have.lengthOf(1);
    test.chai.expect(found3).to.deep.nested.property('0.path').which.equals('test/path/3');

    const found4 = await lokiProvider.find('test/path/*', {
      criteria: {
        'data.test.data': {
          $in: [1, 3],
        },
      },
    });

    test.chai.expect(found4).to.have.lengthOf(2);
    test.chai.expect(found4).to.deep.nested.property('0.path').which.equals('test/path/1');
    test.chai.expect(found4).to.deep.nested.property('1.path').which.equals('test/path/3');

    const found5 = await lokiProvider.find('test/path/*', {
      criteria: {
        'data.test.other': {
          $like: '%la%',
        },
      },
    });

    test.chai.expect(found5).to.have.lengthOf(2);
    test.chai.expect(found5).to.deep.nested.property('0.path').which.equals('test/path/1');
    test.chai.expect(found5).to.deep.nested.property('1.path').which.equals('test/path/2');
  }
});
