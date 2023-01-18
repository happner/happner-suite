require('expose-gc');
const path = require('path');
module.exports = class HeapDumper {
  #interval;
  static create() {
    return new HeapDumper();
  }
  dumpPromise(folderPath) {
    const heapdump = require('heapdump');
    folderPath = folderPath || path.resolve(__dirname, '../../../temp');
    global.gc();
    return new Promise((resolve, reject) => {
      heapdump.writeSnapshot(`${folderPath}/${Date.now()}.heapsnapshot`, function (err, filename) {
        if (err) {
          // eslint-disable-next-line no-console
          console.log(`heap dump failed: ${err.message}`);
          return reject(err);
        }
        // eslint-disable-next-line no-console
        console.log('dump written to', filename);
        resolve();
      });
    });
  }
  dump(callback, folderPath) {
    let error;
    return this.dumpPromise(folderPath)
      .catch((e) => {
        error = e;
      })
      .finally(() => {
        if (error) return callback(error);
        return callback();
      });
  }
  async start(interval, folderPath) {
    this.#interval = setInterval(async () => {
      this.dumpPromise(folderPath);
    }, interval);
  }
  stop() {
    clearInterval(this.#interval);
  }
};
