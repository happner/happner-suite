require('happn-commons-test').describe({ timeout: 20e3 }, (test) => {
  const LokiDataProvider = require('../..');
  const testDirPath = test.commons.path.resolve(__dirname, `../tmp/archiving`);

  const fileId = test.newid();
  const testFileName = `${testDirPath}${test.commons.path.sep}${fileId}`;
  const mockLogger = {
    info: test.sinon.stub(),
    error: test.sinon.stub(),
    warn: test.sinon.stub(),
    trace: test.sinon.stub(),
  };

  context(
    'starts up the provider with a persistence filename, does some inserts, archives the database, ensures new database is empty, and loads the archived database to get some data',
    () => {
      before('ensures temp dir and test file', () => {
        test.fs.ensureDirSync(testDirPath);
      });

      after('delete temp file', async () => {
        test.fs.rmSync(testDirPath, { recursive: true, force: true });
      });

      /** @type {LokiDataProvider} */
      let lokiProvider;
      let archiveId;

      it('creates an instance of Loki', async () => {
        lokiProvider = new LokiDataProvider(null, mockLogger);
        lokiProvider.settings = {
          ...{
            filename: testFileName,
            snapshotRollOverThreshold: 5,
          },
        };

        await lokiProvider.initialize();
      });

      it('inserts some data', async () => {
        await lokiProvider.insert({ path: 'test/path/1', data: { test: 'test' } });
        await lokiProvider.insert({ path: 'test/path/2', data: { test: 'test' } });
        await lokiProvider.insert({ path: 'test/path/3', data: { test: 'test' } });
      });

      it('ensure the database has correct database pre-archive', async () => {
        const archiveLog = await lokiProvider.find('/_ARCHIVE/LIST/*');
        test.expect(archiveLog.length).to.be(0);

        const archiveSequence = await lokiProvider.find('/_ARCHIVE/SEQUENCE');
        test.expect(archiveSequence.length).to.be(0);

        const found = await lokiProvider.find('test/path/*');
        test.expect(found.length).to.be(3);
      });

      it('archives old database', async () => {
        archiveId = await lokiProvider.archive();
        test.expect(archiveId).to.be(1);
      });

      it('ensure the database has correct database post-archive', async () => {
        const archiveList = await lokiProvider.find('/_ARCHIVE/LIST/*');
        test.expect(archiveList.length).to.be(1);

        const found = await lokiProvider.find('test/path/*');
        test.expect(found.length).to.be(0);
      });

      it('loads the archived database to get some data', async () => {
        await lokiProvider.find(`/_ARCHIVE/LOAD/${archiveId}`);

        const found1 = await lokiProvider.find('test/path/*');
        test.expect(found1.length).to.be(0);

        const found2 = await lokiProvider.find('/_ARCHIVE/GET/test/path/*');
        test.expect(found2.length).to.be(3);
      });

      it('unloads the archived database to get current data', async () => {
        await lokiProvider.find(`/_ARCHIVE/UNLOAD/`);

        const found = await lokiProvider.find('test/path/*');
        test.expect(found.length).to.be(0);

        try {
          await lokiProvider.find('/_ARCHIVE/GET/test/path/*');
          throw new Error('No error generated!');
        } catch (e) {
          test.expect(e.message).to.equal('Cannot read from archive: no archive loaded');
        }
      });

      it.skip('starts up the provider with a persistence filename, does some inserts, archives the database while concurrently manipulating data, ensure there has been no data loss in new database and archived database intersection', async () => {});
    }
  );
});
