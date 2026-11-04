require('happn-commons-test').describe({ timeout: 20000 }, function (test) {
  const MongoDataStore = require('../../lib/datastore');
  const expect = test.expect;

  let warnings;
  const onWarning = (warning) => warnings.push(warning);

  beforeEach(() => {
    warnings = [];
    process.on('warning', onWarning);
  });

  afterEach(() => {
    process.removeListener('warning', onWarning);
  });

  async function createStore(findOneAndUpdate) {
    const store = await MongoDataStore.create({ url: 'mongodb://127.0.0.1:27017/happn' });
    store.data.findOneAndUpdate = findOneAndUpdate;
    return store;
  }

  function callbackStyle(fn) {
    return new Promise((resolve, reject) => {
      fn((e, result) => (e ? reject(e) : resolve(result)));
    });
  }

  it('findAndModify does not trigger the DEP0174 promisify warning', async () => {
    const store = await createStore((criteria, data, options, callback) =>
      callback(null, { value: { path: criteria.path } })
    );
    const result = await callbackStyle((cb) => store.findAndModify({ path: '/a' }, {}, cb));
    // deprecation warnings are emitted on the next tick
    await test.delay(50);
    expect(result).to.eql({ path: '/a' });
    expect(warnings.filter((w) => w.code === 'DEP0174')).to.eql([]);
  });

  it('findAndModify resolves as a promise', async () => {
    const store = await createStore((criteria, data, options, callback) =>
      callback(null, { value: { path: criteria.path } })
    );
    expect(await store.findAndModify({ path: '/b' }, {})).to.eql({ path: '/b' });
  });

  it('findAndModify passes upsert options and returns the updated document', async () => {
    let usedOptions;
    const store = await createStore((criteria, data, options, callback) => {
      usedOptions = options;
      callback(null, { value: { path: criteria.path } });
    });
    await callbackStyle((cb) => store.findAndModify({ path: '/c' }, {}, cb));
    expect(usedOptions.upsert).to.be(true);
    expect(usedOptions.returnDocument).to.be('after');
  });

  it('findAndModify returns null when no document is returned', async () => {
    const store = await createStore((criteria, data, options, callback) => callback(null, null));
    expect(await callbackStyle((cb) => store.findAndModify({ path: '/d' }, {}, cb))).to.be(null);
  });

  it('findAndModify propagates errors, such as duplicate key errors', async () => {
    const store = await createStore((criteria, data, options, callback) =>
      callback(new Error('E11000 duplicate key error'))
    );
    let error;
    try {
      await callbackStyle((cb) => store.findAndModify({ path: '/e' }, {}, cb));
    } catch (e) {
      error = e;
    }
    expect(error.message).to.contain('duplicate key');
  });
});
