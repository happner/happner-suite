module.exports = Component;

function Component() {}

Component.prototype.start = function ($happn, callback) {
  callback();
};

Component.prototype.stop = function ($happn, callback) {
  callback();
};

Component.prototype.block = async function ($happn) {
  setTimeout(() => {
    const target = Date.now() + 10000;
    // eslint-disable-next-line no-empty
    while (Date.now() <= target) {}
  }, 100);
  return $happn.info.mesh.name + ':brokerComponent:block';
};
