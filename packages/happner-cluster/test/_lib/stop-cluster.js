module.exports = async function (servers, done) {
  for (let server of servers) {
    //The following is done to  avoid having to wait between tests and/or having expired cluster members details remaining in DB
    let orchestrator = server._mesh.happn.server.services.orchestrator;
    let dataService = server._mesh.happn.server.services.data;
    let keepAlivePath = `/SYSTEM/DEPLOYMENT/${orchestrator.deployment}/${orchestrator.serviceName}/${orchestrator.endpoint}`;
    await orchestrator.stop();
    try {
      await dataService.remove(keepAlivePath);
      // eslint-disable-next-line no-empty
    } catch (e) {}
    await server.stop({ reconnect: false });
  }
  if (done) return done();
};
