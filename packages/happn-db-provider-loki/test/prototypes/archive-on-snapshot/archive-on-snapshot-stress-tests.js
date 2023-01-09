describe('loki reset on snapshot plugin stress tests', function () {
  this.timeout(300e3);
  const LokiDataProvider = require('../../..');
  const TestRepositoryPlugin = require('./test-repository-plugin');
  const commons = require('happn-commons');
  const testDirPath = commons.path.resolve(__dirname, `../tmp/archive-on-snapshot`);
  const heapDumper = require('../../../../happn-commons-test/lib/heap-dumper').create();
  const RECORDCOUNT = 100;
  const expect = require('chai').expect;
  context('ensures we can insert, archive and search concurrently', () => {
    const testRepository = new TestRepositoryPlugin(testDirPath);
    const testFileName = `${testDirPath}${commons.path.sep}db.loki`;
    const mockLogger = {
      info: () => {},
      error: () => {},
      warn: () => {},
      trace: () => {},
    };

    before('delete temp file', async () => {
      commons.fs.rmSync(testDirPath, { recursive: true, force: true });
    });

    before('ensures temp dir and test file', () => {
      commons.fs.ensureDirSync(testDirPath);
    });

    after('delete temp file', async () => {
      //commons.fs.rmSync(testDirPath, { recursive: true, force: true });
    });

    /** @type {LokiDataProvider} */
    let lokiProvider;

    it('creates an instance of Loki with the test repository plugin', async () => {
      lokiProvider = new LokiDataProvider(
        {
          filename: testFileName,
          snapshotRollOverThreshold: 2, // every 2 records
          plugin: testRepository,
        },
        mockLogger
      );
      await lokiProvider.initialize();
      await heapDumper.dumpPromise(testDirPath);
    });

    // relies on above test
    it(`${RECORDCOUNT} records, concurrent searches`, async () => {
      const testSearch = async (sequence) => {
        const random = randomInt(1, sequence);
        if (random < 2 || random === sequence) {
          return;
        }
        // eslint-disable-next-line no-console
        console.log(`from sequence ${sequence} searching ${random} and up`);
        const found = await testRepository.search(random);
        expect(found.length).to.equal(sequence - random + 1);
        expect(found[0].sequence).to.equal(random);
        expect(found.at(-1).sequence).to.equal(sequence);
      };
      for (let sequence = 0; sequence < RECORDCOUNT; sequence++) {
        await Promise.all([
          testRepository.push(sequence, randomInt(100000, 900000)),
          testSearch(sequence - 1),
        ]);
        if (sequence % 20 === 0) {
          //   if (global.gc) {
          //     // eslint-disable-next-line no-console
          //     console.log('garbage out...');
          //     global.gc(true);
          //   }
          await heapDumper.dumpPromise(testDirPath);
          // eslint-disable-next-line no-console
          console.log(`heap used: ${Math.floor(process.memoryUsage().heapUsed / 1000)}kb`);
        }
      }
      const records = await testRepository.get('test/path/*');
      expect(records.length).to.equal(0);
      const files = commons.fs
        .readdirSync(testDirPath)
        .filter((fileName) => !fileName.includes('heapsnapshot'));
      expect(files.length).to.equal(RECORDCOUNT / 2 + 2);
      const found = await testRepository.search(0);
      expect(found.length).to.equal(RECORDCOUNT);
      expect(found[0].sequence).to.equal(0);
      expect(found.at(-1).sequence).to.equal(RECORDCOUNT - 1);
    });
  });

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
});
