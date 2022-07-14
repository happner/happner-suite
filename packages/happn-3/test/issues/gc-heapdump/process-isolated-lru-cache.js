const test = require('../../__fixtures/utils/test_helper').create();
const LRUCache = require('../../../lib/services/cache/cache-lru');
const cache = new LRUCache('test', { max: 1e3 });
let busy = true;
test.heapDump.start(5e3);
setTimeout(() => {
  busy = false;
}, 60e3);

async function start() {
  while (busy) {
    cache.set(`test/long/path/${Date.now()}`, { timestamp: Date.now() });
    await test.delay(10);
  }
  test.heapDump.stop();
}

start();
