const delay = require('await-delay');
module.exports = async function (servers, done) {
  for (let server of servers) {
    await server.stop({ reconnect: false });
    await delay(300);
  }
  await delay(3000);
  if (done) return done();
};
