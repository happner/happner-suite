require('happn-commons-test').describe({ timeout: 120e3 }, (test) => {
  const SQLiteDataProvider = require('../..');
  const { DataTypes } = require('sequelize');
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
            pattern: ['test/path/*', 'test/increment*'],
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
    it('starts up the provider, with logging', async () => {
      await getProvider({
        logging: true,
      });
    });
    it('starts up the provider with a persistence filename, does some inserts, restarts the provider and checks the data is still there', async () => {
      await testPersistence();
    });
    it('can count without criteria', async () => {
      await testCount();
    });
    it('can find with criteria', async () => {
      await testCriteria();
    });
    it('can count with criteria', async () => {
      await testCountWithCriteria();
    });
    it('can merge', async () => {
      await testMerge();
    });
    it('can increment', async () => {
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

    const found = await sqliteProvider.findOne('test/increment');
    test.expect(found.data.testGauge.value).to.be(4);
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

    test.expect(await sqliteProvider.count('test/path/*')).to.eql({ data: { value: 3 } });
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

  async function testCriteria(settings) {
    const sqliteProvider = await getProvider(settings);
    await sqliteProvider.insert({
      path: 'test/path/1',
      data: { test: { data: 1, other: 'blah' } },
    });
    await sqliteProvider.insert({
      path: 'test/path/2',
      data: { test: { data: 2, other: 'plah' } },
    });
    await sqliteProvider.insert({
      path: 'test/path/3',
      data: { test: { data: 3, other: 'lpah' } },
    });
    await sqliteProvider.insert({
      path: 'test/path/4',
      data: { test: { data: 4, other: 'hello' } },
    });
    await sqliteProvider.insert({
      path: 'test/path/5',
      data: { test: { data: 5, other: 'world' } },
    });

    const found1 = await sqliteProvider.find('test/path/*', {
      criteria: {
        'data.test.data': {
          $eq: 1,
        },
      },
    });

    test.chai.expect(found1).to.have.lengthOf(1);
    test.chai.expect(found1).to.deep.nested.property('0.path').which.equals('test/path/1');

    const found2 = await sqliteProvider.find('test/path/*', {
      criteria: {
        'data.test.data': {
          $eq: 2,
        },
      },
    });

    test.chai.expect(found2).to.have.lengthOf(1);
    test.chai.expect(found2).to.deep.nested.property('0.path').which.equals('test/path/2');

    const found3 = await sqliteProvider.find('test/path/*', {
      criteria: {
        'data.test.data': {
          $eq: 3,
        },
      },
    });

    test.chai.expect(found3).to.have.lengthOf(1);
    test.chai.expect(found3).to.deep.nested.property('0.path').which.equals('test/path/3');

    const found4 = await sqliteProvider.find('test/path/*', {
      criteria: {
        'data.test.data': {
          $in: [1, 3],
        },
      },
    });

    test.chai.expect(found4).to.have.lengthOf(2);
    test.chai.expect(found4).to.deep.nested.property('0.path').which.equals('test/path/1');
    test.chai.expect(found4).to.deep.nested.property('1.path').which.equals('test/path/3');

    const found5 = await sqliteProvider.find('test/path/*', {
      criteria: {
        'data.test': {
          other: {
            $like: '%la%',
          },
        },
      },
    });

    test.chai.expect(found5).to.have.lengthOf(2);
    test.chai.expect(found5).to.deep.nested.property('0.path').which.equals('test/path/1');
    test.chai.expect(found5).to.deep.nested.property('1.path').which.equals('test/path/2');

    const found6 = await sqliteProvider.find('test/path/*', {
      criteria: {
        $and: [
          {
            data: {
              test: {
                other: {
                  $like: '%ah',
                },
              },
            },
          },
          {
            data: {
              test: {
                data: {
                  $gt: 1,
                },
              },
            },
          },
        ],
      },
    });

    test.chai.expect(found6).to.have.lengthOf(2);
    test.chai.expect(found6).to.deep.nested.property('0.path').which.equals('test/path/2');
    test.chai.expect(found6).to.deep.nested.property('1.path').which.equals('test/path/3');

    const found7 = await sqliteProvider.find('test/path/*', {
      criteria: {
        $or: [
          {
            data: {
              test: {
                other: {
                  $like: 'bl%',
                },
              },
            },
          },
          {
            data: {
              test: {
                data: {
                  $gt: 2,
                },
              },
            },
          },
        ],
      },
    });

    test.chai.expect(found7).to.have.lengthOf(4);
    test.chai.expect(found7).to.deep.nested.property('0.path').which.equals('test/path/1');
    test.chai.expect(found7).to.deep.nested.property('1.path').which.equals('test/path/3');

    const found8 = await sqliteProvider.find('test/path/*', {
      criteria: {
        $and: [
          {
            data: {
              test: {
                other: {
                  $nin: ['blah'],
                },
              },
            },
          },
          {
            data: {
              test: {
                other: {
                  $like: '%l%',
                },
              },
            },
          },
          {
            $or: [
              {
                data: {
                  test: {
                    other: {
                      $in: ['hello', 'world'],
                    },
                  },
                },
              },
              {
                data: {
                  test: {
                    data: {
                      $lt: 3,
                    },
                  },
                },
              },
            ],
          },
        ],
      },
    });

    test.chai.expect(found8).to.have.lengthOf(3);
    test.chai.expect(found8).to.deep.nested.property('0.path').which.equals('test/path/4');
    test.chai.expect(found8).to.deep.nested.property('1.path').which.equals('test/path/5');
    test.chai.expect(found8).to.deep.nested.property('2.path').which.equals('test/path/2');
  }
});
