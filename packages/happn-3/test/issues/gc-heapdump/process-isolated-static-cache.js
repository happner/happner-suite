const test = require('../../__fixtures/utils/test_helper').create();
const StaticCache = require('../../../lib/services/cache/cache-static');
const cache = new StaticCache('test');
let busy = true;
test.heapDump.start(5e3);
setTimeout(() => {
  busy = false;
}, 60e3);

async function start() {
  while (busy) {
    cache.set(`test/long/path/${Date.now()}`, { timestamp: Date.now() }, { ttl: 5 });
    await test.delay(10);
  }
  test.heapDump.stop();
}

start();
