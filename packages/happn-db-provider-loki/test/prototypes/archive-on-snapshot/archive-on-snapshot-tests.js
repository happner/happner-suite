require('happn-commons-test').describe({ timeout: 120e3 }, (test) => {
  const LokiDataProvider = require('../../..');
  const TestRepositoryPlugin = require('./test-repository-plugin');
  const testDirPath = test.commons.path.resolve(__dirname, `../tmp/archive-on-snapshot`);
  context(
    'starts up the provider with a persistence filename, does some inserts, archives the database, ensures new database is empty, and loads the archived database to get some data',
    () => {
      const testRepository = new TestRepositoryPlugin(testDirPath);
      const testFileName = `${testDirPath}${test.commons.path.sep}db.loki`;
      const mockLogger = {
        info: test.sinon.stub(),
        debug: test.sinon.stub(),
        error: test.sinon.stub(),
        warn: test.sinon.stub(),
        trace: test.sinon.stub(),
      };

      before('delete temp file', async () => {
        test.fs.rmSync(testDirPath, { recursive: true, force: true });
      });

      before('ensures temp dir and test file', () => {
        test.fs.ensureDirSync(testDirPath);
      });

      after('delete temp file', async () => {
        test.fs.rmSync(testDirPath, { recursive: true, force: true });
      });

      /** @type {LokiDataProvider} */
      let lokiProvider;

      it('creates an instance of Loki with the test repository plugin', async () => {
        lokiProvider = new LokiDataProvider(
          {
            filename: testFileName,
            snapshotRollOverThreshold: 5,
            plugin: testRepository,
          },
          mockLogger
        );
        await lokiProvider.initialize();
      });

      // relies on above test
      it('inserts 20 records, we do a get and return no items, we look for archives and find 4 files', async () => {
        for (let sequence = 0; sequence < 20; sequence++) {
          await testRepository.push(sequence, test.randomInt(100000, 900000));
        }
        const records = await testRepository.get('test/path/*');
        test.expect(records.length).to.equal(0);
        const files = test.fs.readdirSync(testDirPath);
        test.expect(files.sort()).to.eql(['db-14', 'db-19', 'db-4', 'db-9', 'db.loki']);
      });

      // relies on above test
      it('inserts 3 records, we do a get all, we get 3 records back, straight from cache', async () => {
        for (let sequence = 20; sequence < 23; sequence++) {
          await testRepository.push(sequence, test.randomInt(100000, 900000));
        }
        const records = await testRepository.get('test/path/*');
        test.expect(records.length).to.equal(3);
      });

      // relies on above test
      it('we are able to search for last 2 packets by looking for sequence 21', async () => {
        const found = await testRepository.search(21);
        test.expect(found.length).to.be(2);
        test.expect(found[0].sequence).to.be(21);
        test.expect(found[1].sequence).to.be(22);
      });

      // relies on above test
      it('we are able to search for all 23 by looking for sequence 0', async () => {
        const found = await testRepository.search(0);
        test.expect(found.length).to.be(23);
        test.expect(found[0].sequence).to.be(0);
        test.expect(found.at(-1).sequence).to.be(22);
      });
    }
  );
});
