const UtilsService = require('../../../lib/services/utils/service');
const CacheService = require('../../../lib/services/cache/service');
const UsersByGroupCache = require('../../../lib/services/security/users-by-group-cache');
const test = require('../../__fixtures/utils/test_helper').create();
describe(test.testName(__filename, 3), function () {
  this.timeout(10000);
  it('create and defaults', async () => {
    const usersByGroupCache = UsersByGroupCache.create(await newCacheService());
    test.expect(usersByGroupCache.__config).to.eql({ max: 10000 });
    const usersByGroupCache1 = UsersByGroupCache.create(await newCacheService(), {
      max: 100000,
    });
    test.expect(usersByGroupCache1.__config).to.eql({ max: 100000 });
  });

  it('cacheResult and uncacheResult', async () => {
    const usersByGroupCache1 = UsersByGroupCache.create(await newCacheService(), {
      max: 5,
    });
    usersByGroupCache1.cacheResult('group-1', ['username-1']);

    test.expect(usersByGroupCache1.getResult('group-1')).to.eql(['username-1']);

    test.expect(usersByGroupCache1.__mappings).to.eql({ 'username-1': { 'group-1': 1 } });
    usersByGroupCache1.uncacheResult('group-1');
    test.expect(usersByGroupCache1.getResult('group-1')).to.eql(null);
    test.expect(usersByGroupCache1.__mappings).to.eql({});
  });

  it('removeMappings', async () => {
    const isEmptyObject = test.sinon.stub();
    const mockCacheService = {
      create: test.sinon.stub().returns({
        happn: {
          services: {
            utils: {
              isEmptyObject,
            },
          },
        },
      }),
    };

    const usersByGroupCache1 = UsersByGroupCache.create(mockCacheService, {
      max: 5,
    });

    usersByGroupCache1.removeMappings({ data: ['mockUsername'] });

    test.chai.expect(usersByGroupCache1.__mappings).to.eql({});
    test.chai.expect(isEmptyObject).to.have.callCount(0);
  });

  it('clear', async () => {
    const clear = test.sinon.stub();
    const mockCacheService = {
      create: test.sinon.stub().returns({
        clear,
      }),
    };

    const usersByGroupCache1 = UsersByGroupCache.create(mockCacheService, {
      max: 5,
    });

    usersByGroupCache1.clear({ data: ['mockUsername'] });

    test.chai.expect(clear).to.have.callCount(1);
    test.chai.expect(usersByGroupCache1.__mappings).to.eql({});
  });

  it('userChanged dispose', async () => {
    const usersByGroupCache1 = UsersByGroupCache.create(await newCacheService(), {
      max: 5,
    });
    usersByGroupCache1.cacheResult('group-1', ['username-1']);

    test.expect(usersByGroupCache1.getResult('group-1')).to.eql(['username-1']);

    usersByGroupCache1.cacheResult('group-2', ['username-1']);
    usersByGroupCache1.cacheResult('group-3', ['username-1']);
    usersByGroupCache1.cacheResult('group-4', ['username-1']);
    usersByGroupCache1.cacheResult('group-5', ['username-1']);

    test.expect(usersByGroupCache1.__mappings).to.eql({
      'username-1': { 'group-1': 1, 'group-2': 1, 'group-3': 1, 'group-4': 1, 'group-5': 1 },
    });

    usersByGroupCache1.userChanged('username-1');
    test.expect(usersByGroupCache1.__mappings).to.eql({});
  });

  it('userChanged dispose, returns if username does not exist in this.__mappings', async () => {
    const usersByGroupCache1 = UsersByGroupCache.create(await newCacheService(), {
      max: 5,
    });

    const result = usersByGroupCache1.userChanged('username-1');

    test.chai.expect(result).to.have.returned;
    test.chai.expect(result).to.equal();
  });

  it('groupChanged dispose', async () => {
    const usersByGroupCache1 = UsersByGroupCache.create(await newCacheService(), {
      max: 5,
    });
    usersByGroupCache1.cacheResult('group-1', ['username-1']);
    usersByGroupCache1.cacheResult('group-2', ['username-1']);
    usersByGroupCache1.cacheResult('group-3', ['username-1']);
    usersByGroupCache1.cacheResult('group-4', ['username-1']);
    usersByGroupCache1.cacheResult('group-5', ['username-1']);

    test.expect(usersByGroupCache1.__mappings).to.eql({
      'username-1': { 'group-1': 1, 'group-2': 1, 'group-3': 1, 'group-4': 1, 'group-5': 1 },
    });

    usersByGroupCache1.groupChanged('group-3');
    test
      .expect(usersByGroupCache1.__mappings)
      .to.eql({ 'username-1': { 'group-1': 1, 'group-2': 1, 'group-4': 1, 'group-5': 1 } });
  });

  it('dispose due to cache set', async () => {
    const usersByGroupCache1 = UsersByGroupCache.create(await newCacheService(), {
      max: 5,
    });
    usersByGroupCache1.cacheResult('group-1', ['username-1']);
    usersByGroupCache1.cacheResult('group-2', ['username-1']);
    usersByGroupCache1.cacheResult('group-3', ['username-1']);
    usersByGroupCache1.cacheResult('group-4', ['username-1']);
    usersByGroupCache1.cacheResult('group-5', ['username-1']);

    test.expect(usersByGroupCache1.__mappings).to.eql({
      'username-1': { 'group-1': 1, 'group-2': 1, 'group-3': 1, 'group-4': 1, 'group-5': 1 },
    });

    usersByGroupCache1.cacheResult('group-6', ['username-1']);
    test.expect(usersByGroupCache1.__mappings).to.eql({
      'username-1': { 'group-2': 1, 'group-3': 1, 'group-4': 1, 'group-5': 1, 'group-6': 1 },
    });
  });

  it('tests clear method', async () => {
    const stubClear = test.sinon.stub();
    const stubCreateCacheService = {
      create: test.sinon.stub().returns({ clear: stubClear }),
    };
    const usersByGroupCache = UsersByGroupCache.create(stubCreateCacheService, {
      max: 5,
    });

    usersByGroupCache.clear();

    test.chai.expect(stubClear).to.have.callCount(1);
  });

  it('tests userChanged returns if this.__mappings[username] is falsy', async () => {
    const usersByGroupCache = UsersByGroupCache.create(await newCacheService(), {
      max: 5,
    });
    const mockUserName = 'mockUserName';

    const result = usersByGroupCache.userChanged(mockUserName);

    test.chai.expect(result).to.be.undefined;
  });

  it('tests removeMappings - check if this.__mappings[username] is falsy', async () => {
    const usersByGroupCache = UsersByGroupCache.create(await newCacheService(), {
      max: 5,
    });
    const mockResult = {
      data: ['username'],
    };
    const mockGroupName = 'mockGroupName';

    usersByGroupCache.removeMappings(mockResult, mockGroupName);

    test.chai.expect(usersByGroupCache.__mappings).to.be.eql({});
  });

  function newCacheService() {
    return new Promise((resolve, reject) => {
      const cacheService = new CacheService();
      cacheService.happn = {
        services: {
          utils: new UtilsService(),
        },
      };
      cacheService.initialize({}, (e) => {
        if (e) return reject(e);
        resolve(cacheService);
      });
    });
  }
});
