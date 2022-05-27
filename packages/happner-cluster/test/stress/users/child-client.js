const testclient = require('../../_lib/client');
try {
  testclient.create('user1', 'password', '6001');
} catch (e) {
  process.send(['dead', e]);
}
