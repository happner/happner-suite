const { fs, path, lock } = require('happn-commons');
module.exports = class TestRepository {
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

    if (head[0]?.sequence === sequence) {
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
      let tempProvider = new LokiDataProvider(
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
      tempProvider = null;
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
};
