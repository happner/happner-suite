require('../../../__fixtures/utils/test_helper').describe({ timeout: 20000 }, (test) => {
  const MongoDataProvider = require('happn-db-provider-mongo');
  const mockLogger = {
    info: test.sinon.stub(),
    error: test.sinon.stub(),
    warn: test.sinon.stub(),
    trace: test.sinon.stub(),
  };
  const [mongoUrl, database, collection] = [
    'mongodb://127.0.0.1:27017',
    'mongo-provider-test',
    'mongo-provider-test',
  ];
  let clearMongo = require('../../../__fixtures/utils/cluster/clear-mongodb');
  beforeEach('clear mongo', async () => {
    await clearMongo(mongoUrl, collection);
  });

  after(async () => {
    await test.cleanup();
  });

  it('does some inserts, restarts the provider and checks the data is still there', async () => {
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
  async function testRemove(settings) {
    const mongoProvider = new MongoDataProvider(
      {
        ...settings,
        database,
        collection,
      },
      mockLogger
    );
    await mongoProvider.initialize();
    await mongoProvider.upsert('test/remove/1', { data: { test: 'test1' } });
    await mongoProvider.upsert('test/remove/2', { data: { test: 'test2' } });
    await mongoProvider.upsert('test/remove/3', { data: { test: 'test3' } });
    test.expect(await getCount(mongoProvider, 'test/remove/*')).to.be(3);
    const result1 = await mongoProvider.remove('test/remove/*', {
      criteria: {
        'data.test': {
          $eq: 'test1',
        },
      },
    });
    test.expect(result1.data.removed).to.be(1);
    test.expect(await getCount(mongoProvider, 'test/remove/*')).to.be(2);
    const result2 = await mongoProvider.remove('test/remove/*');
    test.expect(result2.data.removed).to.be(2);
    test.expect(await getCount(mongoProvider, 'test/remove/*')).to.be(0);
    await mongoProvider.stop();
  }

  async function getCount(mongoProvider, path) {
    const count = (await mongoProvider.count(path)).data.value;
    return count;
  }

  async function testIncrement(settings) {
    const mongoProvider = new MongoDataProvider(
      {
        ...settings,
        database,
        collection,
      },
      mockLogger
    );
    await mongoProvider.initialize();
    const results = [
      await mongoProvider.increment('test/increment', 'testGauge'),
      await mongoProvider.increment('test/increment', 'testGauge', 2),
      await mongoProvider.increment('test/increment', 'testGauge'),
    ];

    test.expect(results).to.eql([1, 3, 4]);
    const found = await mongoProvider.find('test/increment');
    test.expect(found[0].data.testGauge.value).to.be(4);
    await mongoProvider.stop();
  }

  async function testCount(settings) {
    const created = 1634804510343;
    const modified = created;
    const mongoProvider = new MongoDataProvider(
      {
        ...settings,
        database,
        collection,
      },
      mockLogger
    );
    await mongoProvider.initialize();
    await mongoProvider.upsert('test/path/1', {
      data: { test: 'test1' },
      created,
      modified,
    });
    await mongoProvider.upsert('test/path/2', {
      data: { test: 'test2' },
      created,
      modified,
    });
    await mongoProvider.upsert('test/path/3', {
      data: { test: 'test2' },
      created,
      modified,
    });

    test
      .expect(
        await mongoProvider.count('test/path/*', {
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
        await mongoProvider.count('test/path/*', {
          criteria: {
            'data.test': {
              $eq: 'test2',
            },
          },
        })
      )
      .to.eql({ data: { value: 2 } });
    await mongoProvider.stop();
  }

  async function testPersistence(settings) {
    const mongoProvider = new MongoDataProvider(
      {
        ...settings,
        database,
        collection,
      },
      mockLogger
    );
    await mongoProvider.initialize();
    const results = [];
    //path, document, options, callback
    results.push(
      await mongoProvider.upsert('test/path/1', { data: { test: 'test' } }, { modifiedBy: 'x' })
    );
    results.push(
      await mongoProvider.upsert('test/path/2', { data: { test: 'test' } }, { modifiedBy: 'x' })
    );
    results.push(
      await mongoProvider.upsert('test/path/3', { data: { test: 'test' } }, { modifiedBy: 'x' })
    );
    results.push(
      await mongoProvider.upsert('test/path/3', { data: { test: 'test' } }, { modifiedBy: 'x' })
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

    let found = await mongoProvider.find('test/path/*');
    test.expect(found.length).to.be(3);
    found = await mongoProvider.find('test/path/1');
    test.expect(found.length).to.be(1);
    found = await mongoProvider.find('test/path/*', {
      options: {
        sort: { path: -1 },
        limit: 2,
      },
    });
    test.expect(found[0].path).to.be('test/path/3');
    test.expect(found[1].path).to.be('test/path/2');
    test.expect(found.length).to.be(2);
    found = await mongoProvider.find('test/path/*', {
      options: {
        sort: { path: -1 },
        limit: 2,
        skip: 2,
      },
    });
    test.expect(found[0].path).to.be('test/path/1');
    test.expect(found.length).to.be(1);
    await mongoProvider.stop();
    await mongoProvider.initialize();
    found = await mongoProvider.find('test/path/*');
    test.expect(found.length).to.be(3);
    await mongoProvider.stop();
  }
});
