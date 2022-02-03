require('../../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  const ElasticSearchDataProvider = require('happn-db-provider-elasticsearch');
  const testId = test.compressedUUID();
  const mockLogger = {
    info: test.sinon.stub(),
    error: test.sinon.stub(),
    warn: test.sinon.stub(),
    trace: test.sinon.stub(),
  };

  it('can persist and find data', async () => {
    await testPersistence();
  });
  it('can count', async () => {
    await testCount();
  });

  async function testCount(settings) {
    const elasticsearchProvider = new ElasticSearchDataProvider(
      {
        ...settings,
      },
      mockLogger
    );
    await elasticsearchProvider.initialize();
    await elasticsearchProvider.upsert(`test/count/${testId}/1`, {
      data: { test: 'test1' },
    });
    await elasticsearchProvider.upsert(`test/count/${testId}/2`, {
      data: { test: 'test2' },
    });
    await elasticsearchProvider.upsert(`test/count/${testId}/3`, {
      data: { test: 'test2' },
    });

    test
      .expect(
        await elasticsearchProvider.count(`test/count/${testId}/*`, {
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
        await elasticsearchProvider.count(`test/count/${testId}/*`, {
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
    const elasticsearchProvider = new ElasticSearchDataProvider(
      {
        ...settings,
      },
      mockLogger
    );
    await elasticsearchProvider.initialize();
    const results = [];
    //path, document, options, callback
    results.push(
      await elasticsearchProvider.upsert(
        `test/persist/${testId}/1`,
        { data: { test: 'test' } },
        { modifiedBy: 'x' }
      )
    );
    results.push(
      await elasticsearchProvider.upsert(
        `test/persist/${testId}/2`,
        { data: { test: 'test' } },
        { modifiedBy: 'x' }
      )
    );
    results.push(
      await elasticsearchProvider.upsert(
        `test/persist/${testId}/3`,
        { data: { test: 'test' } },
        { modifiedBy: 'x' }
      )
    );
    results.push(
      await elasticsearchProvider.upsert(
        `test/persist/${testId}/3`,
        { data: { test: 'test' } },
        { modifiedBy: 'x' }
      )
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

    let found = await elasticsearchProvider.find(`test/persist/${testId}/*`);
    test.expect(found.length).to.be(3);
    found = await elasticsearchProvider.find(`test/persist/${testId}/1`);
    test.expect(found.length).to.be(1);
    found = await elasticsearchProvider.find(`test/persist/${testId}/*`, {
      options: {
        sort: { path: -1 },
        limit: 2,
      },
    });
    test.expect(found[0].path).to.be(`test/persist/${testId}/3`);
    test.expect(found[1].path).to.be(`test/persist/${testId}/2`);
    test.expect(found.length).to.be(2);
    found = await elasticsearchProvider.find(`test/persist/${testId}/*`, {
      options: {
        sort: { path: -1 },
        limit: 2,
        skip: 2,
      },
    });
    test.expect(found[0].path).to.be(`test/persist/${testId}/1`);
    test.expect(found.length).to.be(1);
  }
});
