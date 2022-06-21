const delay = require('await-delay');
module.exports = async function (servers, done) {
  for (let server of servers) {
    //The following is done to  avoid having to wait between tests and/or having expired cluster members details remaining in DB
    let orchestrator = server._mesh.happn.server.services.orchestrator;
    let dataService = server._mesh.happn.server.services.data;
    let keepAlivePath = `/SYSTEM/DEPLOYMENT/${orchestrator.deployment}/${orchestrator.serviceName}/${orchestrator.endpoint}`;
    await orchestrator.stop();
    await dataService.remove(keepAlivePath);

    await server.stop({ reconnect: false });
    await delay(300);
  }
  if (done) return done();
};
