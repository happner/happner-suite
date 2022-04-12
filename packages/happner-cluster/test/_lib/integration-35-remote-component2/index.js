module.exports = Component;
var methodCalls = 0;
var webMethodCalls = 0;

function Component() {}

Component.prototype.start = function ($happn, callback) {
  callback();
};

Component.prototype.stop = function ($happn, callback) {
  callback();
};

Component.prototype.webMethod2 = function ($happn, callback) {
  callback(null, $happn.info.mesh.name + ':remoteComponent2:webMethod2:true');
};
