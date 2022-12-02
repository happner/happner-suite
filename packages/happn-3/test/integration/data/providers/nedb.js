require('../../../__fixtures/utils/test_helper').describe({ timeout: 20000 }, (test) => {
  const NEDBDataProvider = require('happn-db-provider-nedb');
  const testFileName = test.newTestFile();
  const mockLogger = {
    info: test.sinon.stub(),
    error: test.sinon.stub(),
    warn: test.sinon.stub(),
    trace: test.sinon.stub(),
  };
  beforeEach('delete temp file', async () => {
    test.unlinkFiles([testFileName]);
  });

  after(async () => {
    await test.cleanup();
  });

  it('starts up the provider with a persistence filename, does some inserts, restarts the provider and checks the data is still there', async () => {
    await testPersistence();
  });
  it('can count', async () => {
    await testCount();
  });
  it('can increment', async () => {
    await testIncrement();
  });
  it('can remove', async () => {
    await testRemove({
      fsync: true,
    });
  });
  it('starts up the provider with a persistence filename, does some inserts, restarts the provider and checks the data is still there - fsync', async () => {
    await testPersistence({
      fsync: true,
    });
  });
  it('can count - fsync', async () => {
    await testCount({
      fsync: true,
    });
  });
  it('can increment - fsync', async () => {
    await testIncrement({
      fsync: true,
    });
  });

  it('can remove - fsync', async () => {
    await testRemove({
      fsync: true,
    });
  });

  async function testRemove(settings) {
    const nedbProvider = new NEDBDataProvider(
      {
        ...{
          filename: testFileName,
        },
        ...settings,
      },
      mockLogger
    );
    await nedbProvider.initialize();
    await nedbProvider.upsert('test/remove/1', { data: { test: 'test1' } });
    await nedbProvider.upsert('test/remove/2', { data: { test: 'test2' } });
    await nedbProvider.upsert('test/remove/3', { data: { test: 'test3' } });
    test.expect(await getCount(nedbProvider, 'test/remove/*')).to.be(3);
    const result1 = await nedbProvider.remove('test/remove/*', {
      criteria: {
        'data.test': {
          $eq: 'test1',
        },
      },
    });
    test.expect(result1.data.removed).to.be(1);
    test.expect(await getCount(nedbProvider, 'test/remove/*')).to.be(2);
    const result2 = await nedbProvider.remove('test/remove/*');
    test.expect(result2.data.removed).to.be(2);
    test.expect(await getCount(nedbProvider, 'test/remove/*')).to.be(0);
  }

  async function getCount(nedbProvider, path) {
    return (await nedbProvider.count(path)).data.value;
  }

  async function testIncrement(settings) {
    const nedbProvider = new NEDBDataProvider(
      {
        ...{
          filename: testFileName,
        },
        ...settings,
      },
      mockLogger
    );
    await nedbProvider.initialize();
    const results = [
      await nedbProvider.increment('test/increment', 'testGauge'),
      await nedbProvider.increment('test/increment', 'testGauge', 2),
      await nedbProvider.increment('test/increment', 'testGauge'),
    ];

    test.expect(results).to.eql([1, 3, 4]);
    const found = await nedbProvider.find('test/increment');
    test.expect(found[0].data.testGauge.value).to.be(4);
  }

  async function testCount(settings) {
    const created = 1634804510343;
    const modified = created;
    const nedbProvider = new NEDBDataProvider(
      {
        ...{
          filename: testFileName,
        },
        ...settings,
      },
      mockLogger
    );
    await nedbProvider.initialize();
    await nedbProvider.upsert('test/path/1', {
      data: { test: 'test1' },
      created,
      modified,
    });
    await nedbProvider.upsert('test/path/2', {
      data: { test: 'test2' },
      created,
      modified,
    });
    await nedbProvider.upsert('test/path/3', {
      data: { test: 'test2' },
      created,
      modified,
    });

    test
      .expect(
        await nedbProvider.count('test/path/*', {
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
        await nedbProvider.count('test/path/*', {
          criteria: {
            'data.test': {
              $eq: 'test2',
            },
          },
        })
      )
      .to.eql({ data: { value: 2 } });
  }

  async function testPersistence(settings) {
    const nedbProvider = new NEDBDataProvider(
      {
        ...{
          filename: testFileName,
        },
        ...settings,
      },
      mockLogger
    );
    await nedbProvider.initialize();
    const results = [];
    //path, document, options, callback
    results.push(
      await nedbProvider.upsert('test/path/1', { data: { test: 'test' } }, { modifiedBy: 'x' })
    );
    results.push(
      await nedbProvider.upsert('test/path/2', { data: { test: 'test' } }, { modifiedBy: 'x' })
    );
    results.push(
      await nedbProvider.upsert('test/path/3', { data: { test: 'test' } }, { modifiedBy: 'x' })
    );
    results.push(
      await nedbProvider.upsert('test/path/3', { data: { test: 'test' } }, { modifiedBy: 'x' })
    );

    test
      .expect(
        results.map((result) => {
          return result._meta.modifiedBy;
        })
      )
      .to.eql(['x', 'x', 'x', 'x']);

    test
      .expect(
        results.map((result) => {
          return result.data;
        })
      )
      .to.eql(Array(4).fill({ test: 'test' }));

    let found = await nedbProvider.find('test/path/*');
    test.expect(found.length).to.be(3);
    found = await nedbProvider.find('test/path/1');
    test.expect(found.length).to.be(1);
    found = await nedbProvider.find('test/path/*', {
      options: {
        sort: { path: -1 },
        limit: 2,
      },
    });
    test.expect(found[0].path).to.be('test/path/3');
    test.expect(found[1].path).to.be('test/path/2');
    test.expect(found.length).to.be(2);
    found = await nedbProvider.find('test/path/*', {
      options: {
        sort: { path: -1 },
        limit: 2,
        skip: 2,
      },
    });
    test.expect(found[0].path).to.be('test/path/1');
    test.expect(found.length).to.be(1);
    await nedbProvider.stop();
    await nedbProvider.initialize();
    found = await nedbProvider.find('test/path/*');
    test.expect(found.length).to.be(3);
  }
});
