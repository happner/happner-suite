require('expose-gc');
const path = require('path');
module.exports = class HeapDumper {
  #interval;
  static create() {
    return new HeapDumper();
  }
  dump(callback, folderPath) {
    const heapdump = require('heapdump');
    folderPath = folderPath || path.resolve(__dirname, '../../../temp');
    global.gc();
    heapdump.writeSnapshot(`${folderPath}/${Date.now()}.heapsnapshot`, function (err, filename) {
      if (err) {
        // eslint-disable-next-line no-console
        console.log(`heap dump failed: ${err.message}`);
      } else {
        // eslint-disable-next-line no-console
        console.log('dump written to', filename);
      }
      callback();
    });
  }
  async start(interval, folderPath) {
    this.#interval = setInterval(() => {
      this.dump(null, folderPath);
    }, interval);
  }
  stop() {
    clearInterval(this.#interval);
  }
};
