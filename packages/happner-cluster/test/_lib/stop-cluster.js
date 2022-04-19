const delay = require('await-delay');
module.exports = async function (servers, done) {
  for (let server of servers) {
    await server.stop({ reconnect: false });
    await delay(200);
  }
  done();
};
