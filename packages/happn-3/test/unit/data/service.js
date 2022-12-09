const test = require('../../__fixtures/utils/test_helper').create();
describe(test.testName(__filename, 3), function () {
  this.timeout(5000);
  const DataService = require('../../../lib/services/data/service');
  const Utils = require('../../../lib/services/utils/service');

  beforeEach('it restores sinon', () => {
    test.sinon.restore();
  });

  function getServiceInstancePromise(config = {}) {
    return new Promise((resolve, reject) => {
      getServiceInstance(config, (e, instance) => {
        if (e) return reject(e);
        resolve(instance);
      });
    });
  }

  function getServiceInstance(config = {}, callback) {
    let dataService = new DataService();
    dataService.config = {};
    dataService.datastores = {};
    dataService.dataroutes = {};
    dataService.happn = {
      services: {
        utils: new Utils(),
        system: {
          package: require('../../../package.json'),
        },
      },
    };

    dataService.initialize(config, (e) => {
      if (e) return callback(e);
      callback(null, dataService);
    });
  }

  it('tests the _insertDataProvider method', function (done) {
    getServiceInstance({}, (e, dataService) => {
      if (e) return done(e);
      dataService.datastores = {};
      dataService._insertDataProvider(
        0,
        {
          name: 'test_store',
          provider: 'memory',
          isDefault: true,
          settings: {},
          patterns: ['/TEST/PATTERN/*'],
        },
        function (e) {
          if (e) return done(e);
          test.expect(Object.keys(dataService.datastores).length).to.be(1);
          test.expect(Object.keys(dataService.dataroutes)).to.eql(['/TEST/PATTERN/*']);
          test.expect(dataService.defaultDatastore).to.be('test_store');
          done();
        }
      );
    });
  });

  it('tests the archive method - provider has no archive method', async () => {
    const path = '/test/path';

    const dataService = await getServiceInstancePromise();
    test.sinon.stub(dataService, 'db').returns({});

    try {
      await dataService.archive(path);
      throw new Error('Error has not been thrown by internal function!!!');
    } catch (e) {
      test
        .expect(e.message)
        .to.equal(`archive feature not available for provider on path: ${path}`);
    }
  });

  it('tests the archive method - provider has an archive method', async () => {
    const path = '/test/path';

    const dataService = await getServiceInstancePromise();
    const archiveStub = test.sinon.stub().callsArgWith(0, null, `mock archive ${path}`);
    test.sinon.stub(dataService, 'db').returns({
      archive: archiveStub,
    });

    const result = await dataService.archive(path);
    test.expect(result).to.equal(`mock archive ${path}`);
  });

  it('tests the _insertDataProvider method insert after default', function (done) {
    let dataService = new DataService();
    dataService.config = {};
    dataService.datastores = {};
    dataService.dataroutes = {};
    dataService._insertDataProvider(
      0,
      {
        name: 'test_store',
        provider: 'memory',
        settings: {},
        patterns: ['/TEST/PATTERN/*'],
      },
      function (e) {
        if (e) return done(e);
        dataService._insertDataProvider(
          0,
          {
            name: 'test_store_1',
            provider: 'memory',
            settings: {},
            patterns: ['/TEST/PATTERN/1/*'],
          },
          function (e) {
            if (e) return done(e);
            test.expect(Object.keys(dataService.datastores).length).to.be(2);
            test
              .expect(Object.keys(dataService.dataroutes))
              .to.eql(['/TEST/PATTERN/*', '/TEST/PATTERN/1/*']);
            //esnure the original data provider is still the default
            test.expect(dataService.defaultDatastore).to.be('test_store');
            done();
          }
        );
      }
    );
  });

  it('tests the parseFields method', function () {
    let dataService = new DataService();

    var parsedResult = dataService.parseFields({
      $and: [
        {
          _id: 'test-id',
          $or: [
            {
              time: 10,
            },
            {
              time: 20,
            },
            {
              time: 30,
            },
            {
              time: 40,
            },
          ],
        },
      ],
    });

    test.expect(parsedResult).to.eql({
      $and: [
        {
          _id: 'test-id',
          $or: [
            {
              'data.time': 10,
            },
            {
              'data.time': 20,
            },
            {
              'data.time': 30,
            },
            {
              'data.time': 40,
            },
          ],
        },
      ],
    });

    parsedResult = dataService.parseFields({
      $and: [
        {
          _id: 'test-id',
          $or: [
            {
              '_meta.path': {
                $regex: '.*detail-or/10/.*',
              },
            },
            {
              '_meta.path': {
                $regex: '.*detail-or/20/.*',
              },
            },
            {
              '_meta.path': {
                $regex: '.*detail-or/30/.*',
              },
            },
            {
              '_meta.path': {
                $regex: '.*detail-or/40/.*',
              },
            },
          ],
        },
      ],
    });

    test.expect(parsedResult).to.eql({
      $and: [
        {
          _id: 'test-id',
          $or: [
            {
              path: {
                $regex: {},
              },
            },
            {
              path: {
                $regex: {},
              },
            },
            {
              path: {
                $regex: {},
              },
            },
            {
              path: {
                $regex: {},
              },
            },
          ],
        },
      ],
    });
  });

  it('tests the addDataStoreFilter and removeDataStoreFilter methods', function (done) {
    const dataService = new DataService();
    const utilsService = new Utils();
    dataService.happn = {
      services: {
        error: {},
        utils: utilsService,
      },
    };
    dataService.initialize({}, () => {
      const mockDataStore1 = { test: 1 };
      const mockDataStore2 = { test: 2 };
      const mockDataStore3 = { test: 3 };

      dataService.datastores = {
        test1: {
          name: 'test1',
          patterns: ['/test/1/*'],
          provider: mockDataStore1,
        },
        test2: {
          name: 'test2',
          patterns: ['/test/1/2/*'],
          provider: mockDataStore2,
        },
        test3: {
          name: 'test3',
          patterns: ['/test/1/2/3/*'],
          provider: mockDataStore3,
        },
      };

      dataService.addDataStoreFilter('/test/1/*', 'test1');
      dataService.addDataStoreFilter('/test/1/2/*', 'test2');
      dataService.addDataStoreFilter('/test/1/2/3/*', 'test3');

      test
        .expect(dataService.dataroutessorted)
        .to.eql(['/test/1/2/3/*', '/test/1/2/*', '/test/1/*']);

      test.expect(dataService.db('/test/1/2/3/*')).to.be(mockDataStore3);
      test
        .expect(Object.keys(dataService.dataroutes))
        .to.eql(['/test/1/*', '/test/1/2/*', '/test/1/2/3/*']);

      dataService.removeDataStoreFilter('/test/1/2/3/*');

      test.expect(Object.keys(dataService.dataroutes)).to.eql(['/test/1/*', '/test/1/2/*']);
      test.expect(dataService.dataroutessorted).to.eql(['/test/1/2/*', '/test/1/*']);
      test.expect(dataService.db('/test/1/2/3/*')).to.be(mockDataStore2);
      done();
    });
  });
});
