require('happn-commons-test').describe({ timeout: 20000 }, function (test) {
  const MongoProvider = require('../../index');
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

  function duplicateKeyError() {
    return new Error('E11000 duplicate key error collection: happn.happn index: path_1');
  }

  // responses are consumed in order, one per findOneAndUpdate call
  async function createProvider(responses) {
    const provider = new MongoProvider({ url: 'mongodb://127.0.0.1:27017/happn' });
    provider.db = await MongoDataStore.create(provider.settings);
    const findOneAndUpdate = test.sinon.spy((criteria, data, options, callback) => {
      const response = responses.shift();
      if (response instanceof Error) return callback(response);
      callback(null, { value: { ...data.$set, created: data.$setOnInsert.created } });
    });
    provider.db.data.findOneAndUpdate = findOneAndUpdate;
    return { provider, findOneAndUpdate };
  }

  function upsert(provider, path, setData) {
    return new Promise((resolve, reject) => {
      provider.upsert(path, setData, {}, (e, result) => (e ? reject(e) : resolve(result)));
    });
  }

  async function upsertError(provider, path, setData) {
    try {
      await upsert(provider, path, setData);
    } catch (e) {
      return e;
    }
    throw new Error('expected upsert to fail');
  }

  function expectNoPromisifyWarnings() {
    expect(warnings.filter((w) => w.code === 'DEP0174')).to.eql([]);
  }

  it('upserts and returns the transformed document', async () => {
    const { provider, findOneAndUpdate } = await createProvider(['ok']);
    const result = await upsert(provider, '/upsert/1', { data: { test: 1 } });
    await test.delay(50);
    expect(findOneAndUpdate.callCount).to.be(1);
    expect(findOneAndUpdate.firstCall.args[0]).to.eql({ path: '/upsert/1' });
    expect(result.data).to.eql({ test: 1 });
    expect(result._meta.path).to.be('/upsert/1');
    expect(result._meta.created).to.be.a('number');
    expectNoPromisifyWarnings();
  });

  it('upserts using the promise interface', async () => {
    const { provider } = await createProvider(['ok']);
    const result = await provider.upsert('/upsert/2', { data: { test: 2 } });
    expect(result.data).to.eql({ test: 2 });
    expect(result._meta.path).to.be('/upsert/2');
  });

  it('retries once on a duplicate key error and returns the retried document', async () => {
    const { provider, findOneAndUpdate } = await createProvider([duplicateKeyError(), 'ok']);
    const result = await upsert(provider, '/upsert/3', { data: { test: 3 } });
    await test.delay(50);
    expect(findOneAndUpdate.callCount).to.be(2);
    expect(findOneAndUpdate.secondCall.args[0]).to.eql(findOneAndUpdate.firstCall.args[0]);
    expect(findOneAndUpdate.secondCall.args[1]).to.eql(findOneAndUpdate.firstCall.args[1]);
    expect(result.data).to.eql({ test: 3 });
    expect(result._meta.path).to.be('/upsert/3');
    expectNoPromisifyWarnings();
  });

  it('returns the error if the duplicate key retry also fails', async () => {
    const retryError = duplicateKeyError();
    const { provider, findOneAndUpdate } = await createProvider([duplicateKeyError(), retryError]);
    const error = await upsertError(provider, '/upsert/4', { data: { test: 4 } });
    await test.delay(50);
    expect(findOneAndUpdate.callCount).to.be(2);
    expect(error).to.be(retryError);
    expectNoPromisifyWarnings();
  });

  it('returns other errors without retrying', async () => {
    const failure = new Error('connection lost');
    const { provider, findOneAndUpdate } = await createProvider([failure]);
    const error = await upsertError(provider, '/upsert/5', { data: { test: 5 } });
    await test.delay(50);
    expect(findOneAndUpdate.callCount).to.be(1);
    expect(error).to.be(failure);
    expectNoPromisifyWarnings();
  });
});
