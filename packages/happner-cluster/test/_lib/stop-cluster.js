module.exports = async function (servers, done) {
  for (let server of servers) {
    //The following is done to  avoid having to wait between tests and/or having expired cluster members details remaining in DB
    let dataService = server._mesh.happn.server.services.data;
    try {
      await dataService.remove('/_SYSTEM/DEPLOYMENT/*');
      // eslint-disable-next-line no-empty
    } catch (e) {}
    await server.stop({ reconnect: false });
  }
  if (done) return done();
};
