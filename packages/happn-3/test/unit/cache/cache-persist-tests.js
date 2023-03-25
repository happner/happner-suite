const CachePersist = require('../../../lib/services/cache/cache-persist');
const test = require('../../__fixtures/utils/test_helper').create();

describe.only(test.testName(), () => {
  let mockDatastore;
  var testId = require('shortid').generate();

  beforeEach(() => {
    mockDatastore = {
      get: test.sinon.stub(),
      remove: test.sinon.stub(),
      upsert: test.sinon.stub(),
    };
  });

  afterEach(() => {
    mockDatastore = null;
  });

  context('constructor', () => {
    it('creates new instance', () => {
      const instance = new CachePersist('mockName', {
        dataStore: mockDatastore,
      });

      test.chai.expect(instance.constructor.name).to.equal('CachePersist');
      test.chai.expect(instance).to.be.an.instanceOf(CachePersist);
    });
  });

  context('getters', () => {
    it('gets synced', () => {
      const instance = new CachePersist('mockName', {
        dataStore: mockDatastore,
      });
      const result = instance.isSynced;

      test.chai.expect(result).to.be.false;
    });

    it('gets syncing', () => {
      const instance = new CachePersist('mockName', {
        dataStore: mockDatastore,
      });
      const result = instance.isSyncing;

      test.chai.expect(result).to.be.false;
    });
  });

  context('get', () => {
    it('checks synced if it is false', () => {
      const instance = new CachePersist('mockName', {
        dataStore: mockDatastore,
      });
      const callback = test.sinon.stub();
      const result = instance.get('mockKey', callback);

      test.chai.expect(result).to.be.undefined;
      test.chai.expect(callback).to.have.been.calledOnce;
    });

    it('gets data from dataStore and data gets persisted', () => {
      mockDatastore.get.callsFake((_, cb) => cb(null, null));
      mockDatastore.upsert.callsFake((_, __, ___, cb) => cb(null));
      const callbackOne = test.sinon.stub().returns('test');
      const callbackTwo = test.sinon.stub().returns('test');
      let key = `test${testId}test`;

      const instance = new CachePersist('mockName', {
        dataStore: mockDatastore,
        keyTransformers: [{ regex: /test(?<keyMask>[A-Za-z0-9]+)test/ }],
      });

      instance.sync(callbackTwo);
      const result = instance.get(key, { default: { value: 'mockDefault' } }, callbackOne);

      test.chai.expect(result).to.be.undefined;
      test.chai.expect(callbackOne).to.have.been.calledWithExactly(null, 'mockDefault');
      test.chai.expect(callbackOne).to.have.been.calledOnce;
      test.chai.expect(callbackTwo).to.have.been.calledOnce;
      test.chai.expect(callbackTwo).to.have.been.calledWithExactly(null);
    });

    it('gets data from dataStore, data gets persisted and a callback with an error is returned', () => {
      mockDatastore.get.callsFake((_, cb) => cb(null, null));
      mockDatastore.upsert.callsFake((_, __, ___, cb) => cb(new Error('mockError')));
      const callbackOne = test.sinon.stub().returns('test');
      const callbackTwo = test.sinon.stub().returns('test');
      let key = `test${testId}test`;

      const instance = new CachePersist('mockName', {
        dataStore: mockDatastore,
        keyTransformers: [{ regex: /test(?<keyMask>[A-Za-z0-9]+)test/ }],
      });

      instance.sync(callbackTwo);
      const result = instance.get(key, { default: { value: 'mockDefault' } }, callbackOne);

      test.chai.expect(result).to.be.undefined;
      test.chai
        .expect(callbackOne)
        .to.have.been.calledWithExactly(
          test.sinon.match.instanceOf(Error).and(test.sinon.match.has('message', 'mockError'))
        );
      test.chai.expect(callbackOne).to.have.been.calledOnce;
      test.chai.expect(callbackTwo).to.have.been.calledOnce;
      test.chai.expect(callbackTwo).to.have.been.calledWithExactly(null);
    });

    it('gets data from dataStore, data gets persisted and data is not cloned', () => {
      mockDatastore.get.callsFake((_, cb) => cb(null, null));
      mockDatastore.upsert.callsFake((_, __, ___, cb) => cb(null));
      const callbackOne = test.sinon.stub().returns('test');
      const callbackTwo = test.sinon.stub().returns('test');
      let key = `test${testId}test`;

      const instance = new CachePersist('mockName', {
        dataStore: mockDatastore,
        keyTransformers: [{ regex: /test(?<keyMask>[A-Za-z0-9]+)test/ }],
      });

      instance.sync(callbackTwo);
      instance.get(
        key,
        { default: { value: 'mockDefault', opts: { clone: false } }, clone: false },
        callbackOne
      );

      test.chai.expect(callbackOne).to.have.been.calledWithExactly(null, 'mockDefault');
      test.chai.expect(callbackOne).to.have.been.calledOnce;
    });

    it('does not get data from dataStore because options is undefined', () => {
      mockDatastore.get.callsFake((_, cb) => cb(null, null));
      mockDatastore.upsert.callsFake((_, __, ___, cb) => cb(null));
      const callbackOne = test.sinon.stub().returns('test');
      const callbackTwo = test.sinon.stub().returns('test');
      let key = `test${testId}test`;

      const instance = new CachePersist('mockName', {
        dataStore: mockDatastore,
        keyTransformers: [{ regex: /test(?<keyMask>[A-Za-z0-9]+)test/ }],
      });

      instance.sync(callbackTwo);
      instance.get(key, undefined, callbackOne);

      test.chai.expect(callbackOne).to.have.been.calledWithExactly(null, null);
      test.chai.expect(callbackOne).to.have.been.calledOnce;
    });

    it('does not get data from dataStore because default data is null', () => {
      mockDatastore.get.callsFake((_, cb) => cb(null, null));
      mockDatastore.upsert.callsFake((_, __, ___, cb) => cb(null));
      const callbackOne = test.sinon.stub().returns('test');
      const callbackTwo = test.sinon.stub().returns('test');
      let key = `test${testId}test`;

      const instance = new CachePersist('mockName', {
        dataStore: mockDatastore,
        keyTransformers: [{ regex: /test(?<keyMask>[A-Za-z0-9]+)test/ }],
      });

      instance.sync(callbackTwo);
      instance.get(key, { default: null }, callbackOne);

      test.chai.expect(callbackOne).to.have.been.calledWithExactly(null, null);
      test.chai.expect(callbackOne).to.have.been.calledOnce;
    });
  });

  context('set', () => {
    it.only('', () => {
      const instance = new CachePersist('mockName', {
        dataStore: mockDatastore,
        keyTransformers: [{ regex: /test(?<keyMask>[A-Za-z0-9]+)test/ }],
      });
      let key = `test${testId}test`;
      let callback = test.sinon.stub();

      const result = instance.set(key, 'mockData', callback, null);

      test.chai.expect(result).to.be.undefined;
    });
  });
});
