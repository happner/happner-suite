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
    console.log("BEFORE BLOCK")
    const target = Date.now() + 5000;
    while (Date.now() <= target) {}
    console.log("AFTER BLOCK")

  }, 100);
  callback(null, $happn.info.mesh.name + ':brokerComponent:block');
};
