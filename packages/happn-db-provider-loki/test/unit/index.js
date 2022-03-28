const LokiDataProvider = require('../..');
const commons = require('happn-commons');
const fs = commons.fs;
const constants = commons.constants;
const path = commons.path;
const mockFs = commons.mockFs;
const db = require('lokijs');
const readline = require('readline');

require('happn-commons-test').describe({ timeout: 120e3 }, (test) => {
  const mockFs = test.mockfs;
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
      warn: test.sinon.stub(),
    };

    mockFs();
  });

  afterEach(() => {
    test.sinon.restore();
    mockFs.restore();
  });

  describe('happy paths', () => {
    it('can initialize', (done) => {
      mockFs({
        mockFileName: mockFs.load(path.resolve(__dirname, '../mocks/mockFileName')),
      });

      mockSettings.snapshotRollOverThreshold = null;

      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockPush = test.sinon.stub();
      const mockAsyncQueue = test.sinon.stub(commons.async, 'queue');

      const mockOperation = {
        operationType: constants.DATA_OPERATION_TYPES.UPSERT,
        arguments: [
          'mockPath',
          { data: 'mockData', _meta: { path: null } },
          { merge: 'mockMerge' },
        ],
      };

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

      mockAsyncQueue
        .withArgs(test.sinon.match.func, 1)
        .callsArgWith(0, mockOperation, test.sinon.stub());

      mockAsyncQueue.returns({
        push: mockPush,
      });

      test.sinon.stub(db.prototype, 'loadJSON').returns({});

      lokiDataProvider.initialize((e) => {
        test.expect(e).to.be(undefined);
        done();
      });

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

      test.chai.expect(lokiDataProvider.getFileStream(mockSettings.filename)).to.have.returned;
      test.chai
        .expect(lokiDataProvider.getFileStream(mockSettings.filename))
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

    it('can stop, this.snapshotTimeout equal to 10e3', () => {
      mockFs({
        mockFileName: mockFs.load(path.resolve(__dirname, '../mocks/mockFileName')),
      });

      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();

      lokiDataProvider.snapshotTimeout = 10e3;
      lokiDataProvider.stop(mockCallback);

      test.chai.expect(mockCallback).to.have.callCount(1);
      test.chai.expect(mockCallback).to.have.been.calledWithExactly();
    });

    it('fsync returns if this.settings.fsync equal to null', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const fsync = lokiDataProvider.fsync(mockSettings.filename, mockCallback);

      test.chai.expect(fsync(mockSettings.filename)).to.have.returned;
      test.chai.expect(mockCallback).to.have.callCount(1);
      test.chai.expect(mockCallback).to.have.been.calledWithExactly('mockFileName');
    });

    it('fsync returns if e is true', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const fsync = lokiDataProvider.fsync(mockSettings.filename, mockCallback);

      test.chai.expect(fsync('mockString')).to.have.returned;
      test.chai.expect(mockCallback).to.have.callCount(1);
      test.chai.expect(mockCallback).to.have.been.calledWithExactly('mockString');
    });

    it('fsync, fs.open returns if errorOpening is true', () => {
      mockSettings.fsync = 'mcokFsync';
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const mockFsOpen = test.sinon.stub(fs, 'open');
      const fsync = lokiDataProvider.fsync(mockSettings.filename, mockCallback);

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

      const fsync = lokiDataProvider.fsync(mockSettings.filename, mockCallback);

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
      const fsync = lokiDataProvider.fsync(mockSettings.filename, mockCallback);

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

    it('mutateDatabase, test case DATA_OPERATION_TYPES.INCREMENT ', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const mockOperation = {
        operationType: constants.DATA_OPERATION_TYPES.INCREMENT,
        arguments: ['mockPath', 'mockCounterName', 0],
      };

      lokiDataProvider.initialize(mockCallback);
      const result = lokiDataProvider.mutateDatabase(mockOperation);

      test.chai.expect(result).to.have.returned;
      test.chai.expect(result).to.equal(0);
    });

    it('mutateDatabase, test case DATA_OPERATION_TYPES.INSERT ', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const mockOperation = {
        operationType: constants.DATA_OPERATION_TYPES.INSERT,
        arguments: [
          {
            created: null,
            modified: null,
          },
          'mockCounterName',
          0,
        ],
      };

      lokiDataProvider.initialize(mockCallback);

      const result = lokiDataProvider.mutateDatabase(mockOperation);

      test.chai.expect(result).to.have.returned;
      test.chai.expect(result).to.haveOwnProperty('created');
      test.chai.expect(result).to.haveOwnProperty('modified');
      test.chai.expect(result).to.haveOwnProperty('meta');
    });

    it('mutateDatabase, test case DATA_OPERATION_TYPES.REMOVE, count equal to 1', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockOperation = {
        operationType: constants.DATA_OPERATION_TYPES.REMOVE,
        arguments: [
          'mockPath',
          { data: 'mockData', _meta: { path: null } },
          { merge: 'mockMerge' },
        ],
      };

      lokiDataProvider.initialize(test.sinon.stub());

      lokiDataProvider.collection = {
        chain: test.sinon.stub().returns({
          find: test.sinon.stub().returns({
            count: test.sinon.stub().returns(1),
            remove: test.sinon.stub(),
          }),
        }),
      };

      const result = lokiDataProvider.mutateDatabase(mockOperation);

      test.chai.expect(result).to.have.returned;
      test.chai.expect(result).to.haveOwnProperty('data');
      test.chai.expect(result).to.haveOwnProperty('_meta');
    });

    it('mutateDatabase, test case DATA_OPERATION_TYPES.REMOVE, count equal to 0', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockOperation = {
        operationType: constants.DATA_OPERATION_TYPES.REMOVE,
        arguments: [
          'mockPath',
          { data: 'mockData', _meta: { path: null } },
          { merge: 'mockMerge' },
        ],
      };

      lokiDataProvider.initialize(test.sinon.stub());

      const result = lokiDataProvider.mutateDatabase(mockOperation);

      test.chai.expect(result).to.have.returned;
      test.chai.expect(result).to.haveOwnProperty('data');
      test.chai.expect(result).to.haveOwnProperty('_meta');
    });

    it('can updateInternal', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockOperation = {
        operationType: constants.DATA_OPERATION_TYPES.UPDATE,
        arguments: [{}, { data: 'mockData', _meta: { path: null } }, { merge: 'mockMerge' }],
      };

      lokiDataProvider.collection = {
        update: test.sinon.stub().returns({}),
        chain: test.sinon.stub().returns({
          find: test.sinon.stub().returns({
            count: test.sinon.stub().returns(),
          }),
        }),
      };

      const result = lokiDataProvider.mutateDatabase(mockOperation);

      test.chai.expect(result).to.have.returned;
      test.chai.expect(result).to.eql({});
    });

    it('can incrementInternal', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);

      lokiDataProvider.initialize(test.sinon.stub());
      test.chai
        .expect(lokiDataProvider.incrementInternal('mockPath', 'mockCountername', 1))
        .to.equal(1);
    });

    it('can incrementInternal, recordToIncrement.data[counterName] equal to null', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);

      lokiDataProvider.initialize(test.sinon.stub());

      lokiDataProvider.collection = {
        chain: test.sinon.stub().returns({
          find: test.sinon.stub().returns({
            count: test.sinon.stub().returns(1),
            compoundsort: test.sinon.stub().returns({
              data: test.sinon.stub().returns([
                {
                  data: { mockCounterName: { value: 0 } },
                },
              ]),
            }),
          }),
        }),
        findOne: test.sinon.stub(),
        insert: test.sinon.stub().returns({
          data: { mockCountername1: { value: 0 } },
        }),
      };

      const result = lokiDataProvider.incrementInternal('mockPath', 'mockCountername1', 1);

      test.chai.expect(result).to.equal(1);
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

    it('can count, with parameters.options', () => {
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

    it('can count, without parameters.options', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();

      lokiDataProvider.initialize(test.sinon.stub());
      lokiDataProvider.count('mockFileName', {}, mockCallback);

      test.chai.expect(mockCallback).to.have.been.calledWithExactly(null, { data: { value: 0 } });
    });

    it('can storePlayback, successfully saves snapshot', (done) => {
      mockFs({
        mockFileName: mockFs.load(path.resolve(__dirname, '../mocks/mockFileName')),
      });
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

    it('can storePlayback, calls callback with appendFailure if it is true', () => {
      mockFs({
        mockFileName: mockFs.load(path.resolve(__dirname, '../mocks/mockFileName')),
      });

      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      lokiDataProvider.persistenceOn = 'mockFileName';

      test.sinon
        .stub(lokiDataProvider, 'appendOperationData')
        .withArgs({ operation: {} }, test.sinon.match.func)
        .callsArgWith(1, 'mockAppendFailure');

      const mockCallback = test.sinon.stub();
      const storePlayback = lokiDataProvider.storePlayback({}, mockCallback);

      test.chai.expect(storePlayback(null, 'mockResult')).to.have.returned;
      test.chai
        .expect(mockLogger.error)
        .to.have.been.calledWith('failed persisting operation data', 'mockAppendFailure');
      test.chai.expect(mockCallback).to.have.been.calledWith('mockAppendFailure');
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
      lokiDataProvider.storePlayback(mockOperation, mockCallback);
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
      mockFs({
        mockFileName: mockFs.load(path.resolve(__dirname, '../mocks/mockFileName')),
      });
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

    it('can upsertInternal', async () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const args = [
        'mockPath',
        { data: 'mockData', _meta: { path: null } },
        { merge: 'mockMerge' },
      ];

      await lokiDataProvider.initialize();
      await lokiDataProvider.upsertInternal(args[0], args[1], args[2]);
    });

    it('upsertInternal, without options.merge', (done) => {
      mockFs({
        mockFileName: mockFs.load(path.resolve(__dirname, '../mocks/mockFileName')),
      });

      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockPush = test.sinon.stub();
      const mockAsyncQueue = test.sinon.stub(commons.async, 'queue');
      const mockCallback = test.sinon.stub();
      const mockOperation = {
        operationType: constants.DATA_OPERATION_TYPES.UPSERT,
        arguments: ['mockPath', { data: 'mockData', _meta: { path: null } }],
      };

      mockAsyncQueue
        .withArgs(test.sinon.match.func, 1)
        .callsArgWith(0, mockOperation, test.sinon.stub());

      mockAsyncQueue.returns({
        push: mockPush,
      });

      test.sinon.stub(db.prototype, 'loadJSON').returns({});

      lokiDataProvider.initialize((e) => {
        test.expect(e).to.be(undefined);
        done();
      });
    });

    it('can increment, increment as a function', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const mockPush = test.sinon.stub();

      lokiDataProvider.operationQueue = {
        push: mockPush,
      };

      lokiDataProvider.increment('mockPath', 'mockCounterName', test.sinon.stub(), mockCallback);

      test.chai.expect(mockPush).to.have.callCount(1);
      test.chai.expect(mockPush).to.have.been.calledWith(
        {
          operationType: 'INCREMENT',
          arguments: ['mockPath', 'mockCounterName', 1],
        },
        test.sinon.match.func
      );
    });

    it('can increment, increment as a number', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const mockPush = test.sinon.stub();

      lokiDataProvider.operationQueue = {
        push: mockPush,
      };

      lokiDataProvider.increment('mockPath', 'mockCounterName', 2, mockCallback);

      test.chai.expect(mockPush).to.have.callCount(1);
      test.chai.expect(mockPush).to.have.been.calledWith(
        {
          operationType: 'INCREMENT',
          arguments: ['mockPath', 'mockCounterName', 2],
        },
        test.sinon.match.func
      );
    });

    it('can remove', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const mockPush = test.sinon.stub();

      lokiDataProvider.operationQueue = {
        push: mockPush,
      };

      lokiDataProvider.remove('mockPath', mockCallback);

      test.chai.expect(mockPush).to.have.callCount(1);
      test.chai.expect(mockPush).to.have.been.calledWith(
        {
          operationType: 'REMOVE',
          arguments: ['mockPath'],
        },
        test.sinon.match.func
      );
    });

    it('can findOne, fields as a function', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const mockFields = test.sinon.stub();

      lokiDataProvider.collection = {
        chain: test.sinon.stub().returns({
          find: test.sinon.stub().returns({
            count: test.sinon.stub().returns(1),
            compoundsort: test.sinon.stub().returns({
              data: test.sinon.stub().returns([]),
            }),
          }),
        }),
      };

      lokiDataProvider.findOne({}, mockFields, mockCallback);

      test.chai.expect(mockFields).to.have.callCount(1);
      test.chai.expect(mockFields).to.have.been.calledWithExactly(null, null);
    });

    it('can upsert, options as a function', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const mockOptions = test.sinon.stub();

      test.chai.expect(lokiDataProvider.upsert('mockPath', {}, mockOptions, mockCallback)).to.have
        .returned;
    });

    it('can upsert, persistenceOn equal to true', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const mockOptions = test.sinon.stub();
      const mockPush = test.sinon.stub();

      mockPush.withArgs({}, test.sinon.match.func).callsArgWith(1, null, { result: {} });

      lokiDataProvider.operationQueue = {
        push: mockPush,
      };

      lokiDataProvider.persistenceOn = 'mockFileName';

      lokiDataProvider.upsert('mockPath', {}, mockOptions, mockCallback);
    });

    it('findInternal returns final result, parameters as an empty object', () => {
      mockFs({
        mockFileName: mockFs.load(path.resolve(__dirname, '../mocks/mockFileName')),
      });

      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);

      lokiDataProvider.collection = {
        chain: test.sinon.stub().returns({
          find: test.sinon.stub().returns({
            count: test.sinon.stub().returns(2),
            compoundsort: test.sinon.stub().returns({
              data: test.sinon.stub().returns(['mockResult1', 'mockResult2', 'mockResult3']),
            }),
          }),
        }),
      };

      test.chai.expect(lokiDataProvider.findInternal('mockFilePath', {})).to.have.returned;
      test.chai
        .expect(lokiDataProvider.findInternal('mockFilePath', {}))
        .to.eql(['mockResult1', 'mockResult2', 'mockResult3']);
    });

    it('findInternal returns final result, with parameters:skip equal to 1', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockParameters = {
        options: {
          skip: 1,
          limit: '',
          fields: '',
          count: '',
        },
      };

      lokiDataProvider.collection = {
        chain: test.sinon.stub().returns({
          find: test.sinon.stub().returns({
            count: test.sinon.stub().returns(2),
            compoundsort: test.sinon.stub().returns({
              data: test.sinon.stub().returns(['mockResult1', 'mockResult2', 'mockResult3']),
            }),
          }),
        }),
      };

      test.chai.expect(lokiDataProvider.findInternal('mockFilePath', mockParameters)).to.have
        .returned;
      test.chai
        .expect(lokiDataProvider.findInternal('mockFilePath', mockParameters))
        .to.be.instanceOf(Array);
      test.chai
        .expect(lokiDataProvider.findInternal('mockFilePath', mockParameters))
        .to.eql(['mockResult2', 'mockResult3']);
    });

    it('findInternal returns final result, with parameters:limit equal to 1', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockParameters = {
        options: {
          skip: '',
          limit: 1,
          fields: '',
          count: '',
        },
      };

      lokiDataProvider.collection = {
        chain: test.sinon.stub().returns({
          find: test.sinon.stub().returns({
            count: test.sinon.stub().returns(2),
            compoundsort: test.sinon.stub().returns({
              data: test.sinon.stub().returns(['mockResult1', 'mockResult2', 'mockResult3']),
            }),
          }),
        }),
      };

      test.chai.expect(lokiDataProvider.findInternal('mockFilePath', mockParameters)).to.have
        .returned;
      test.chai
        .expect(lokiDataProvider.findInternal('mockFilePath', mockParameters))
        .to.be.instanceOf(Array);
      test.chai
        .expect(lokiDataProvider.findInternal('mockFilePath', mockParameters))
        .to.eql(['mockResult1']);
    });

    it('findInternal returns final result, with parameters:count equal to 1', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockParameters = {
        options: {
          skip: '',
          limit: '',
          fields: '',
          count: 1,
        },
      };

      lokiDataProvider.collection = {
        chain: test.sinon.stub().returns({
          find: test.sinon.stub().returns({
            count: test.sinon.stub().returns(2),
            compoundsort: test.sinon.stub().returns({
              data: test.sinon.stub().returns(['mockResult1', 'mockResult2', 'mockResult3']),
            }),
          }),
        }),
      };

      test.chai.expect(lokiDataProvider.findInternal('mockFilePath', mockParameters)).to.have
        .returned;
      test.chai
        .expect(lokiDataProvider.findInternal('mockFilePath', mockParameters))
        .to.be.instanceOf(Object);
      test.chai
        .expect(lokiDataProvider.findInternal('mockFilePath', mockParameters))
        .to.eql({ data: { value: 3 } });
    });

    it('findInternal returns if results.count is equal to 0', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockParameters = {
        options: {
          count: 1,
        },
      };

      lokiDataProvider.collection = {
        chain: test.sinon.stub().returns({
          find: test.sinon.stub().returns({
            count: test.sinon.stub().returns(0),
            compoundsort: test.sinon.stub().returns({
              data: test.sinon.stub().returns(['mockResult1', 'mockResult2', 'mockResult3']),
            }),
          }),
        }),
      };

      test.chai.expect(lokiDataProvider.findInternal('mockFilePath', mockParameters)).to.have
        .returned;
      test.chai
        .expect(lokiDataProvider.findInternal('mockFilePath', mockParameters))
        .to.be.instanceOf(Object);
      test.chai
        .expect(lokiDataProvider.findInternal('mockFilePath', mockParameters))
        .to.eql({ data: { value: 0 } });

      mockParameters.options.count = null;

      test.chai
        .expect(lokiDataProvider.findInternal('mockFilePath', mockParameters))
        .to.be.instanceOf(Array);
      test.chai.expect(lokiDataProvider.findInternal('mockFilePath', mockParameters)).to.eql([]);
    });

    it('findInternal returns, with options.sort', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockParameters = {
        options: {
          count: 1,
          sort: {
            mockValue1: 1,
            mockValue2: -1,
            mockValue3: -1,
          },
        },
      };

      lokiDataProvider.collection = {
        chain: test.sinon.stub().returns({
          find: test.sinon.stub().returns({
            count: test.sinon.stub().returns(2),
            compoundsort: test.sinon.stub().returns({
              data: test.sinon.stub().returns(['mockResult1', 'mockResult2', 'mockResult3']),
            }),
          }),
        }),
      };

      test.chai.expect(lokiDataProvider.findInternal('mockFilePath', mockParameters)).to.have
        .returned;
      test.chai
        .expect(lokiDataProvider.findInternal('mockFilePath', mockParameters))
        .to.be.instanceOf(Object);
      test.chai
        .expect(lokiDataProvider.findInternal('mockFilePath', mockParameters))
        .to.eql({ data: { value: 3 } });
    });

    it('findInternal returns an array of fields', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockParameters = {
        options: {
          count: null,
          fields: { mockValue: 'mockValue' },
        },
      };

      lokiDataProvider.collection = {
        chain: test.sinon.stub().returns({
          find: test.sinon.stub().returns({
            count: test.sinon.stub().returns(2),
            compoundsort: test.sinon.stub().returns({
              data: test.sinon.stub().returns([{ mockValue: 'mockValue' }]),
            }),
          }),
        }),
      };

      test.chai.expect(lokiDataProvider.findInternal('mockFilePath', mockParameters)).to.have
        .returned;
      test.chai
        .expect(lokiDataProvider.findInternal('mockFilePath', mockParameters))
        .to.be.instanceOf(Array);
      test.chai
        .expect(lokiDataProvider.findInternal('mockFilePath', mockParameters))
        .to.eql([{ mockValue: 'mockValue' }]);
    });

    it('can transformSortOptions', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const result = lokiDataProvider.transformSortOptions({
        mockValue1: 1,
        mockValue2: -1,
        mockValue3: -1,
      });

      test.chai.expect(result).to.have.returned;
      test.chai.expect(result).to.be.an.instanceOf(Array);
      test.chai.expect(result).to.eql([
        ['mockValue1', false],
        ['mockValue2', true],
        ['mockValue3', true],
      ]);
    });

    it('can findOneInternal', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);

      lokiDataProvider.collection = {
        update: test.sinon.stub().returns({}),
        chain: test.sinon.stub().returns({
          find: test.sinon.stub().returns({
            count: test.sinon.stub().returns(1),
            compoundsort: test.sinon.stub().returns({
              data: test.sinon.stub().returns(['mockValue1', 'mockValue2']),
            }),
          }),
        }),
      };

      test.chai.expect(lokiDataProvider.findOneInternal({}, { mockValue: 'mockValue' })).to.have
        .returned;
      test.chai
        .expect(lokiDataProvider.findOneInternal({}, { mockValue: 'mockValue' }))
        .to.equal('mockValue1');
    });

    it('find method, parameters as a function', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const mockParameters = test.sinon.stub();

      lokiDataProvider.collection = {
        update: test.sinon.stub().returns({}),
        chain: test.sinon.stub().returns({
          find: test.sinon.stub().returns({
            count: test.sinon.stub().returns(0),
          }),
        }),
      };

      test.chai.expect(lokiDataProvider.find('mockPath', mockParameters, mockCallback)).to.have
        .returned;
      test.chai.expect(mockParameters).to.have.been.calledWith(null, []);
    });

    it('find method, parameters as a null', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();

      lokiDataProvider.collection = {
        update: test.sinon.stub().returns({}),
        chain: test.sinon.stub().returns({
          find: test.sinon.stub().returns({
            count: test.sinon.stub().returns(0),
          }),
        }),
      };

      test.chai.expect(lokiDataProvider.find('mockPath', null, mockCallback)).to.have.returned;
      test.chai.expect(mockCallback).to.have.been.calledWith(null, []);
    });

    it('can merge', (done) => {
      mockFs({
        mockFileName: mockFs.load(path.resolve(__dirname, '../mocks/mockFileName')),
      });
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();

      lokiDataProvider.initialize(() => {
        lokiDataProvider.collection = {
          findOne: test.sinon.stub().returns({ an: 'object' }),
          update: (x) => x,
        };
        lokiDataProvider.merge('mockPath', {}, mockCallback);

        setTimeout(() => {
          try {
            test.chai
              .expect(mockCallback)
              .to.have.been.calledWith(null, test.sinon.match.instanceOf(Object));
            done();
          } catch (e) {
            done(e);
          }
        }, 200);
      });
    });

    it('can merge, persistenceOn equal to null', (done) => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();

      lokiDataProvider.initialize();
      lokiDataProvider.persistenceOn = null;

      lokiDataProvider.merge('mockPath', {}, mockCallback);

      setTimeout(() => {
        try {
          test.chai
            .expect(mockCallback)
            .to.have.been.calledWith(null, test.sinon.match.instanceOf(Object));
          done();
        } catch (e) {
          done(e);
        }
      }, 200);
    });
  });

  describe('sad paths', () => {
    it('upsertInternal throws error', () => {
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

    it('findOne calls callback with error and returns', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();

      test.chai.expect(lokiDataProvider.findOne({}, {}, mockCallback)).to.have.returned;
      test.chai.expect(mockCallback).to.have.been.calledWith(test.sinon.match.instanceOf(Error));
    });

    it('reconstruct calles logger.error with reconstruction reader error', (done) => {
      mockFs({
        mockFileName: mockFs.load(path.resolve(__dirname, '../mocks/mockFileName')),
        temp_mockFileName: mockFs.load(path.resolve(__dirname, '../mocks/mockFileName')),
      });

      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const mockOn = test.sinon.stub();

      test.sinon.stub(readline, 'createInterface').returns({
        on: mockOn,
        close: test.sinon.stub(),
      });
      test.sinon.stub(db.prototype, 'loadJSON').returns({});
      mockOn.withArgs('line', test.sinon.match.func).callsArgWith(1, '{}');
      mockOn.withArgs('line', test.sinon.match.func).callsArgWith(1, '{}');
      mockOn.withArgs('error', test.sinon.match.func).callsArgWith(1, { message: 'mockMessage' });

      lokiDataProvider.initialize(test.sinon.stub());
      test.chai
        .expect(mockLogger.error)
        .to.have.been.calledWith(`reconstruction reader error ${'mockMessage'}`);
      done();
    });

    it('reconstruct, callback gets called with error', () => {
      mockFs({
        mockFileName: mockFs.load(path.resolve(__dirname, '../mocks/mockFileName')),
      });

      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const mockOn = test.sinon.stub();

      mockOn.withArgs('error', test.sinon.match.func).callsArgWith(1, { message: 'mockMessage' });

      test.sinon.stub(readline, 'createInterface').returns({
        on: mockOn,
      });

      test.sinon.stub(db.prototype, 'loadJSON');

      lokiDataProvider.initialize(mockCallback);

      test.chai
        .expect(mockLogger.error)
        .to.have.been.calledWithExactly(`reconstruction reader error ${'mockMessage'}`);
      test.chai.expect(mockCallback).to.have.been.calledWithExactly({ message: 'mockMessage' });
    });

    it('find method calls callback with error and returns', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();

      test.chai.expect(lokiDataProvider.find('mockPath', null, mockCallback)).to.have.returned;
      test.chai.expect(mockCallback).to.have.been.calledWith(test.sinon.match.instanceOf(Error));
    });

    it('can merge, persistenceOn equal to null', (done) => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();
      const mockPush = test.sinon.stub();

      lokiDataProvider.initialize();

      mockPush
        .withArgs(
          {
            operationType: constants.DATA_OPERATION_TYPES.UPSERT,
            arguments: ['mockPath', 'mockDoc', { merge: true }],
          },
          test.sinon.match.func
        )
        .callsArgWith(1, 'mockError', null);

      lokiDataProvider.operationQueue = {
        push: mockPush,
      };

      lokiDataProvider.merge('mockPath', 'mockDoc', mockCallback);

      setTimeout(() => {
        try {
          test.chai.expect(mockCallback).to.have.been.calledWith('mockError');
          done();
        } catch (e) {
          done(e);
        }
      }, 200);
    });
  });
});
