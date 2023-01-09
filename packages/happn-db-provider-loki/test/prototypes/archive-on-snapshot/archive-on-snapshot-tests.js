const { fs, path, lock } = require('happn-commons');
class TestRepository {
  #dirPath;
  #lock;
  constructor(dirPath) {
    this.#dirPath = dirPath;
    this.#lock = new lock();
  }

  /** @type {LokiDataProvider} */
  #provider;
  attach(provider) {
    this.#provider = provider;
  }

  async push(sequence, packet) {
    return await this.#provider.insert({
      path: `test/path/${sequence}`,
      data: { sequence, packet },
    });
  }

  async search(sequence) {
    // ensure we dont read while we are clearing etc.
    return this.#lock.acquire('readwrite', () => {
      return this.#searchInternal(sequence);
    });
  }

  async #searchInternal(sequence) {
    const criteria = {
      'data.sequence': { $gte: sequence },
    };
    const options = {
      sort: {
        'data.sequence': 1,
      },
    };

    const head = (await this.#provider.find(`test/path/*`, { criteria, ...options })).map(
      (item) => item.data
    );

    if (head[0].sequence === sequence) {
      // we in the cache, return what we have
      return head;
    }

    const LokiDataProvider = require('../../..');
    const fileSequences = fs
      .readdirSync(this.#dirPath)
      .filter((fileName) => {
        if (!fileName.match(/^db-[0-9]/)) {
          return false;
        }
        return parseInt(fileName.replace('db-', '')) >= sequence;
      })
      .map((fileName) => {
        return parseInt(fileName.replace('db-', ''));
      })
      .sort((a, b) => {
        return a - b;
      });

    const tail = [];
    for (let sequence of fileSequences) {
      const tempProvider = new LokiDataProvider(
        {
          filename: `${this.#dirPath}${path.sep}db-${sequence}`,
          readOnly: true, // TODO: so no snapshotting etc.
        },
        this.#provider.logger
      );
      await tempProvider.initialize();
      (await tempProvider.find(`test/path/*`, { criteria, ...options })).forEach((item) => {
        tail.push(item.data);
      });
      await tempProvider.stop();
    }
    return tail.concat(head);
  }

  async get(path, criteria, options) {
    return await this.#provider.find(path, {
      criteria,
      ...options,
    });
  }

  /**
   * protected to ensure reads and writes dont conflict
   * @returns { boolean }
   */
  async snapshotBeforeRolloverHandler() {
    return this.#lock.acquire('readwrite', () => {
      return this.#snapshotBeforeRolloverHandlerInternal();
    });
  }

  async #snapshotBeforeRolloverHandlerInternal() {
    const lastItem = (
      await this.get(`test/path/*`, null, {
        sort: {
          'data.sequence': -1,
        },
        limit: 1,
      })
    ).pop();
    if (!lastItem) {
      // continue with snapshot
      return true;
    }
    fs.writeFileSync(
      `${this.#dirPath}${path.sep}db-${lastItem.data.sequence}`,
      `${JSON.stringify({
        snapshot: this.#provider.db.serialize(),
      })}\r\n`
    );
    await this.#provider.clearInternal();
    // eslint-disable-next-line no-console
    console.log(`archived to ${this.#dirPath}${path.sep}db-${lastItem.data.sequence}}`);
    return false; // no need to snapshot
  }
}

require('happn-commons-test').describe({ timeout: 120e3 }, (test) => {
  const LokiDataProvider = require('../../..');
  const testDirPath = test.commons.path.resolve(__dirname, `../tmp/archive-on-snapshot`);
  context(
    'starts up the provider with a persistence filename, does some inserts, archives the database, ensures new database is empty, and loads the archived database to get some data',
    () => {
      const testRepository = new TestRepository(testDirPath);
      const testFileName = `${testDirPath}${test.commons.path.sep}db.loki`;
      const mockLogger = {
        info: test.sinon.stub(),
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
        test
          .expect(files.sort())
          .to.eql(['db-14', 'db-19', 'db-4', 'db-9', 'db.loki', 'temp_db.loki']);
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
