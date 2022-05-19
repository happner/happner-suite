module.exports =class WhoAmI {
  constructor() {}
  start($happn, callback) {
    callback();
  }
  getHappnName($happn, callback) {
    $happn.log.info('getHappnName Method called in WhoAmI Component');
    $happn.emit("Message", {some: 'data'})
    callback(null, { name: $happn.name });
  }
}
