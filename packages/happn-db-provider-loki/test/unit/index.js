const LokiDataProvider = require('../..');
const commons = require('happn-commons');
const test = require('happn-commons-test').create();
const fs = commons.fs;
const constants = commons.constants;
const path = commons.path;
const mockFs = require('mock-fs');
const db = require('lokijs');

describe.only(test.testName(), function () {
  this.timeout(120e3);
  let mockSettings;
  let mockLogger;

  beforeEach(() => {
    mockSettings = {
      snapshotRollOverThreshold: 1e3,
      filename: 'mockFileName',
      fsync: null,
    };

    mockLogger = {
      error: test.sinon.stub(),
    };

    mockFs();
  });

  afterEach(() => {
    test.sinon.restore();
    mockFs.restore();
  });

  describe('happy paths', () => {
    it('can initialize', async () => {
      mockFs({
        mockFileName: mockFs.load(path.resolve(__dirname, '../mocks/mockFileName')),
      });

      test.sinon.stub(db.prototype, 'addCollection').returns({
        findOne: test.sinon.stub().returns({
          path: 'mockFileName',
          data: 'mockData',
          created: 1646298724155,
          modified: 1646298724155,
          meta: { revision: 0, created: 1646298724156, version: 0 },
          $loki: 1,
        }),
        update: test.sinon.stub(),
      });

      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockPush = test.sinon.stub();
      const mockCallback = test.sinon.stub();
      const mockAsyncQueue = test.sinon.stub(commons.async, 'queue');

      mockPush.callsArgWith(1, null);
      mockAsyncQueue.returns({
        push: mockPush,
      });

      test.sinon.stub(db.prototype, 'loadJSON');

      const asyncInit = lokiDataProvider.initialize();

      lokiDataProvider.db.collections = [
        {
          findOne: test.sinon.stub().returns({
            path: 'mockFileName',
            data: 'mockData',
            created: 1646298724155,
            modified: 1646298724155,
            meta: { revision: 0, created: 1646298724156, version: 0 },
            $loki: 1,
          }),
          update: test.sinon.stub(),
        },
      ];

      await asyncInit;
      await lokiDataProvider.insert({}, mockCallback);
    });

    it('initialize method returns persistenceOn is equal to null or undefined', (done) => {
      mockSettings.filename = null;
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();

      setTimeout(() => {
        try {
          test.chai.expect(lokiDataProvider.initialize(mockCallback)).to.have.returned;
          test.chai.expect(mockCallback).to.have.callCount(1).and.has.been.calledWithExactly();
          done();
        } catch (e) {
          done(e);
        }
      }, 200);
    });

    it('can insert', async () => {
      mockFs({
        mockFileName: mockFs.load(path.resolve(__dirname, '../mocks/mockFileName')),
      });

      test.sinon.stub(db.prototype, 'addCollection').returns({
        findOne: test.sinon.stub().returns({
          path: 'mockFileName',
          data: 'mockData',
          created: 1646298724155,
          modified: 1646298724155,
          meta: { revision: 0, created: 1646298724156, version: 0 },
          $loki: 1,
        }),
        update: test.sinon.stub(),
      });

      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockPush = test.sinon.stub();
      const mockCallback = test.sinon.stub();
      const mockAsyncQueue = test.sinon.stub(commons.async, 'queue');

      mockPush.callsArgWith(1, null);
      mockAsyncQueue.returns({
        push: mockPush,
      });

      test.sinon.stub(db.prototype, 'loadJSON');

      const asyncInit = lokiDataProvider.initialize();

      lokiDataProvider.db.collections = [
        {
          findOne: test.sinon.stub().returns({
            path: 'mockFileName',
            data: 'mockData',
            created: 1646298724155,
            modified: 1646298724155,
            meta: { revision: 0, created: 1646298724156, version: 0 },
            $loki: 1,
          }),
          update: test.sinon.stub(),
        },
      ];

      await asyncInit;
      await lokiDataProvider.insert({}, mockCallback);

      test.chai
        .expect(mockPush)
        .to.have.been.calledWithExactly(
          { operationType: constants.DATA_OPERATION_TYPES.INSERT, arguments: [{}] },
          test.sinon.match.func
        )
        .and.has.callCount(1);
    });

    it('can getFileStream, this.fileStream equal to null', () => {
      mockFs({
        mockFileName: mockFs.load(path.resolve(__dirname, '../mocks/mockFileName')),
      });

      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);

      test.chai.expect(lokiDataProvider.getFileStream()).to.have.returned;
      test.chai
        .expect(lokiDataProvider.getFileStream())
        .to.be.instanceOf(Object)
        .has.own.property('path');
    });

    it('can appendOperationData', () => {
      mockFs({
        mockFileName: mockFs.load(path.resolve(__dirname, '../mocks/mockFileName')),
      });

      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const getFileStreamSpy = test.sinon.spy(lokiDataProvider, 'getFileStream');

      lokiDataProvider.appendOperationData('mockOperationData', test.sinon.stub());

      test.chai.expect(getFileStreamSpy).to.have.callCount(1);
      test.chai.expect(lokiDataProvider.operationCount).to.equal(1);
    });

    it('can stop, this.snapshotTimeout equal to null', () => {
      mockFs({
        mockFileName: mockFs.load(path.resolve(__dirname, '../mocks/mockFileName')),
      });

      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();

      lokiDataProvider.stop(mockCallback);

      test.chai.expect(mockCallback).to.have.callCount(1);
      test.chai.expect(mockCallback).to.have.been.calledWithExactly();
    });

    it('fsync returns if this.settings.fsync equal to null', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();

      let fsync = lokiDataProvider.fsync(mockCallback);

      test.chai.expect(fsync()).to.have.returned;
      test.chai.expect(mockCallback).to.have.callCount(1);
      test.chai.expect(mockCallback).to.have.been.calledWithExactly(null);
    });

    it('fsync returns if e is true', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();

      let fsync = lokiDataProvider.fsync(mockCallback);

      test.chai.expect(fsync('mockString')).to.have.returned;
      test.chai.expect(mockCallback).to.have.callCount(1);
      test.chai.expect(mockCallback).to.have.been.calledWithExactly('mockString');
    });

    it('fsync, fs.open returns if errorOpening is true', () => {
      mockSettings.fsync = 'mcokFsync';
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();

      const mockFsOpen = test.sinon.stub(fs, 'open');

      let fsync = lokiDataProvider.fsync(mockCallback);
      fsync();
      mockFsOpen.withArgs('mockFileName', 'r+', test.sinon.match.func).callArgWith(
        2,
        {
          message: 'mockMessage',
        },
        {}
      );

      test.chai
        .expect(mockCallback)
        .to.have.been.calledWith(
          test.sinon.match
            .instanceOf(Error)
            .and(test.sinon.match.has('message', `failed syncing to storage device: mockMessage`))
        );
    });

    it('fsync, fs.fsync returns if errorSyncing is true', () => {
      mockSettings.fsync = 'mockFsync';
      mockSettings.snapshotRollOverThreshold = 0;
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();

      const mockFsOpen = test.sinon.stub(fs, 'open');
      const mockFsFsync = test.sinon.stub(fs, 'fsync');

      let fsync = lokiDataProvider.fsync(mockCallback);
      fsync();

      mockFsOpen.withArgs('mockFileName', 'r+', test.sinon.match.func).callArgWith(2, null, 1);
      mockFsFsync.withArgs(1, test.sinon.match.func).callArgWith(1, 'mockErrorSyncing');

      test.chai
        .expect(mockLogger.error)
        .to.have.been.calledWith(`fsync to file ${mockSettings.filename} failed`);
      test.chai.expect(mockCallback).to.have.been.calledWithExactly('mockErrorSyncing');
    });

    it('fsync, calls callback with null', () => {
      mockSettings.fsync = 'mcokFsync';
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();

      const mockFsOpen = test.sinon.stub(fs, 'open');
      const mockFsFsync = test.sinon.stub(fs, 'fsync');

      let fsync = lokiDataProvider.fsync(mockCallback);
      fsync();

      mockFsOpen.withArgs('mockFileName', 'r+', test.sinon.match.func).callArgWith(2, null, 1);
      mockFsFsync.withArgs(1, test.sinon.match.func).callArgWith(1, null);

      test.chai.expect(mockCallback).to.have.been.calledWithExactly(null);
    });

    it('mutateDatabase, test case DATA_OPERATION_TYPES.UPSERT ', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockOperation = {
        operationType: constants.DATA_OPERATION_TYPES.UPSERT,
        arguments: [
          'mockPath',
          { data: 'mockData', _meta: { path: null } },
          { merge: 'mockMerge' },
        ],
      };
      lokiDataProvider.initialize(test.sinon.stub());
      test.chai
        .expect(lokiDataProvider.mutateDatabase(mockOperation))
        .to.be.instanceOf(Object)
        .and.has.property('created')
        .which.has.property('modified');
    });

    it('can incrementInternal', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);

      lokiDataProvider.initialize(test.sinon.stub());
      test.chai
        .expect(lokiDataProvider.incrementInternal('mockPath', 'mockCountername', 1))
        .to.equal(1);
    });

    it('findInternal returns empty array result count equals 0', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);

      lokiDataProvider.initialize(test.sinon.stub());
      test.chai
        .expect(lokiDataProvider.findInternal('mockPath', {}))
        .to.be.instanceOf(Array)
        .that.deep.equals([]);
    });

    it('findInternal returns object if result count equals 0', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);

      lokiDataProvider.initialize(test.sinon.stub());
      test.chai
        .expect(
          lokiDataProvider.findInternal('mockPath', {
            options: {
              count: 2,
            },
          })
        )
        .to.be.instanceOf(Object)
        .that.deep.equals({ data: { value: 0 } });
    });

    it('findInternal returns, without parameters and parameters.criteria', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);

      lokiDataProvider.initialize(test.sinon.stub());

      test.chai
        .expect(lokiDataProvider.findInternal('mockPath', null))
        .to.be.instanceOf(Array)
        .that.deep.equals([]);
    });

    it('findInternal returns empty array', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);

      lokiDataProvider.initialize(test.sinon.stub());

      test.chai
        .expect(
          lokiDataProvider.findInternal('mockPath', {
            criteria: 'mockCriteria',
          })
        )
        .to.be.instanceOf(Array)
        .that.deep.equals([]);
    });

    it('can count', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();

      lokiDataProvider.initialize(test.sinon.stub());
      lokiDataProvider.count(
        'mockFileName',
        {
          options: {
            count: 2,
          },
        },
        mockCallback
      );

      test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, { data: { value: 0 } });
    });

    it('can storePlayback, successfully saves snapshot', (done) => {
      mockSettings.snapshotRollOverThreshold = 1;

      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const mockOperation = {
        operationType: constants.DATA_OPERATION_TYPES.INSERT,
        arguments: [],
      };
      const storePlayback = lokiDataProvider.storePlayback(mockOperation, mockCallback);

      lokiDataProvider.initialize(test.sinon.stub());
      storePlayback(null, 'mockResult');

      setTimeout(() => {
        try {
          test.chai.expect(mockCallback).to.have.callCount(1);
          test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, 'mockResult');
          done();
        } catch (e) {
          done(e);
        }
      }, 200);
    });

    it('can storePlayback, returns if this.persistenceOn is false', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const storePlacyback = lokiDataProvider.storePlayback({}, mockCallback);

      test.chai.expect(storePlacyback(null, 'mockResult')).to.have.returned;
      test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, 'mockResult');
    });

    it('can storePlayback, returns if e is true', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const storePlacyback = lokiDataProvider.storePlayback({}, mockCallback);

      test.chai.expect(storePlacyback('mock', 'mockResult')).to.have.returned;
      test.chai.expect(mockCallback).to.have.been.calledWithExactly('mock');
    });

    it('can storePlayback, callback gets called with error and method returns', (done) => {
      mockSettings.fsync = 'mockFsync';
      mockSettings.snapshotRollOverThreshold = 1;
      mockFs({
        mockFileName: mockFs.load(path.resolve(__dirname, '../mocks/mockFileName')),
      });

      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const mockOperation = {
        operationType: constants.DATA_OPERATION_TYPES.INSERT,
        arguments: [],
      };
      const storePlayback = lokiDataProvider.storePlayback(mockOperation, mockCallback);

      test.sinon
        .stub(lokiDataProvider, 'persistSnapshotData')
        .callsArgWith(1, new Error('test error'));

      lokiDataProvider.initialize(test.sinon.stub());

      storePlayback(null, 'mockResult');

      setTimeout(() => {
        try {
          test.chai
            .expect(mockLogger.error)
            .to.have.been.calledWith(
              'snapshot rollover failed',
              test.sinon.match.instanceOf(Error)
            );
          test.chai.expect(mockCallback).to.have.callCount(1);
          test.chai
            .expect(mockCallback)
            .to.have.been.calledWith(test.sinon.match.instanceOf(Error));
          done();
        } catch (e) {
          done(e);
        }
      }, 200);
    });

    it('processOperation returned if operationType is equal to DATA_OPERATION_TYPES.SNAPSHOT', (done) => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const mockOperation = {
        operationType: constants.DATA_OPERATION_TYPES.SNAPSHOT,
      };

      const snapshotStub = test.sinon.spy(lokiDataProvider, 'snapshot');

      lokiDataProvider.initialize(test.sinon.stub());

      lokiDataProvider.processOperation(mockOperation, mockCallback);

      setTimeout(() => {
        try {
          test.chai.expect(snapshotStub).to.have.callCount(2);
          done();
        } catch (e) {
          done(e);
        }
      }, 200);
    });

    it('can processOperation', (done) => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const mockOperation = {
        operationType: constants.DATA_OPERATION_TYPES.UPSERT,
        arguments: [
          'mockPath',
          { data: 'mockData', _meta: { path: null } },
          { merge: 'mockMerge' },
        ],
      };

      lokiDataProvider.initialize(test.sinon.stub());
      lokiDataProvider.processOperation(mockOperation, mockCallback);

      setTimeout(function () {
        try {
          test.chai.expect(mockCallback).to.have.callCount(1);
          test.chai
            .expect(mockCallback)
            .to.have.been.calledWith(null, test.sinon.match.instanceOf(Object));
          done();
        } catch (e) {
          done(e);
        }
      }, 200);
    });

    it('can find, parameters as a function', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();

      lokiDataProvider.initialize(test.sinon.stub());
      lokiDataProvider.find('mockFilePath', test.sinon.stub(), mockCallback);
    });

    it('can parsePersistedOperation, operationType equal to DATA_OPERATION_TYPES.INSERT', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockJson = `
      {
        "operation": {
          "operationType": "INSERT",
          "arguments": [
            {
              "$loki": "",
              "meta": ""
            }
          ]
        }
      }`;

      test.chai.expect(lokiDataProvider.parsePersistedOperation(mockJson)).to.have.returned;
      test.chai
        .expect(lokiDataProvider.parsePersistedOperation(mockJson).arguments[0])
        .to.not.haveOwnProperty('$loki');
      test.chai
        .expect(lokiDataProvider.parsePersistedOperation(mockJson).arguments[0])
        .to.not.haveOwnProperty('meta');
    });

    it('can parsePersistedOperation, operationType equal to DATA_OPERATION_TYPES.UPSERT', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockJson = `
      {
        "operation": {
          "operationType": "UPSERT",
          "arguments": [
            {
            "$loki": "",
            "meta": ""
            },
            {
              "_meta": {
                "$loki": "",
                "meta": ""
              }
            }
          ]
        }
      }`;

      test.chai.expect(lokiDataProvider.parsePersistedOperation(mockJson)).to.have.returned;
      test.chai
        .expect(lokiDataProvider.parsePersistedOperation(mockJson).arguments[1]._meta)
        .to.not.haveOwnProperty('$loki');
      test.chai
        .expect(lokiDataProvider.parsePersistedOperation(mockJson).arguments[1]._meta)
        .to.not.haveOwnProperty('meta');
    });

    xit('can upsertInternal', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const args = [
        'mockPath',
        { data: 'mockData', _meta: { path: null } },
        { merge: 'mockMerge' },
      ];

      lokiDataProvider.initialize(mockCallback);
      lokiDataProvider.upsertInternal(args[0], args[1], args[2]);
    });
  });

  describe('sad paths', () => {
    it('can upsertInternal, throws error', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);

      test.chai
        .expect(() => lokiDataProvider.upsertInternal(null))
        .to.throw(Error, 'argument [path] at position 0 is null or not a string');
    });

    it('mutateDatabase throws error if data operation type is unknown', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);

      test.chai
        .expect(() =>
          lokiDataProvider.mutateDatabase({
            operationType: constants.DATA_OPERATION_TYPES.SNAPSHOT,
          })
        )
        .to.throw(Error, `unknown data operation type: ${constants.DATA_OPERATION_TYPES.SNAPSHOT}`);
    });

    it('upsertInternal throws error if type of path is not equal to a string', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);

      test.chai
        .expect(() => lokiDataProvider.upsertInternal({}))
        .to.throw(Error, 'argument [path] at position 0 is null or not a string');
    });

    it('processOperation, triggers catch and calls callback with error', (done) => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const mockOperation = {
        operationType: null,
        arguments: [
          'mockPath',
          { data: 'mockData', _meta: { path: null } },
          { merge: 'mockMerge' },
        ],
      };

      lokiDataProvider.initialize(test.sinon.stub());
      lokiDataProvider.processOperation(mockOperation, mockCallback);

      setTimeout(function () {
        try {
          test.chai.expect(mockLogger.error).to.have.callCount(1);
          test.chai
            .expect(mockLogger.error)
            .to.have.been.calledWith(
              `failed mutating database: ${mockOperation.arguments[0]}`,
              test.sinon.match.instanceOf(Error)
            );
          test.chai.expect(mockCallback).to.have.callCount(1);
          test.chai
            .expect(mockCallback)
            .to.have.been.calledWith(test.sinon.match.instanceOf(Error));
          done();
        } catch (e) {
          done(e);
        }
      }, 200);
    });
  });
});
