module.exports = Component;

function Component() {}

Component.prototype.start = function ($happn, callback) {
  callback();
};

Component.prototype.stop = function ($happn, callback) {
  callback();
};

Component.prototype.block = function ($happn, callback) {
  setTimeout(() => {
    const target = Date.now() + 10000;
    // eslint-disable-next-line no-empty
    while (Date.now() <= target) {}
  }, 100);
  callback(null, $happn.info.mesh.name + ':brokerComponent:block');
};
