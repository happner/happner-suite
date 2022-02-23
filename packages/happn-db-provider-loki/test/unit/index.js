const LokiDataProvider = require('../..');
const commons = require('happn-commons');
const test = require('happn-commons-test').create();
const fs = commons.fs;
const constants = commons.constants;
const async = commons.async;

describe(test.testName(), () => {
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
  });

  describe('happy paths', () => {
    xit('can initialize', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback1 = test.sinon.stub();
      const mockCallback2 = test.sinon.stub();
      const mockPush = test.sinon.stub();
      const mockAsyncQueue = test.sinon.stub(async, 'queue');

      mockAsyncQueue.returns({
        push: mockPush,
      });

      lokiDataProvider.initialize(mockCallback1);
      lokiDataProvider.insert(mockCallback2);
    });

    it('can getFileStream, this.fileStream equal to null', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);

      test.chai.expect(lokiDataProvider.getFileStream()).to.have.returned;
      test.chai
        .expect(lokiDataProvider.getFileStream())
        .to.be.instanceOf(Object)
        .has.own.property('path');
    });

    it('can appendOperationData', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const getFileStreamSpy = test.sinon.spy(lokiDataProvider, 'getFileStream');

      lokiDataProvider.appendOperationData('mockOperationData', test.sinon.stub());

      test.chai.expect(getFileStreamSpy).to.have.callCount(1);
      test.chai.expect(lokiDataProvider.operationCount).to.equal(1);
    });

    it('can stop, this.snapshotTimeout equal to null', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();

      lokiDataProvider.stop(mockCallback);

      test.chai.expect(mockCallback).to.have.callCount(1);
    });

    xit('can stop, this.snapshotTimeout equal to null', () => {
      const lokiDataProvider = new LokiDataProvider(mockSettings, mockLogger);
      const mockCallback = test.sinon.stub();

      lokiDataProvider.stop(mockCallback);

      test.chai.expect(mockCallback).to.have.callCount(1);
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
      test.sinon.restore();
    });

    it('fsync, fs.fsync returns if errorSyncing is true', () => {
      mockSettings.fsync = 'mcokFsync';
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
      test.sinon.restore();
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
      test.sinon.restore();
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
  });
});
