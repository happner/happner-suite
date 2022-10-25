var lastLoginConfig;
const NodeUtil = require('util');
module.exports.getLastLoginConfig = function () {
  var cloned = JSON.parse(JSON.stringify(lastLoginConfig));

  delete cloned.plugin;

  return cloned;
};

var queuedLoginError = null;
let loginError = () => {
  return true;
};
module.exports.queueLoginError = function (error, condition) {
  queuedLoginError = error;
  if (condition) loginError = condition;
};

var queuedSubscriptionError = null;
module.exports.queueSubscriptionError = function (error) {
  queuedSubscriptionError = error;
};

module.exports.create = NodeUtil.promisify(function (config, callback) {
  if (queuedLoginError && loginError()) {
    var error = queuedLoginError;
    queuedLoginError = null;
    process.nextTick(function () {
      callback(error);
    });
    return;
  }

  if (config.config && config.config.url) config = config.config;

  var name = 'remote-happn-instance';

  if (config.url) {
    //eslint-disable-next-line
    name = config.url.split('//')[1].replace(/\./g, '-').replace(/\:/g, '_');
  }

  lastLoginConfig = config;

  process.nextTick(function () {
    callback(null, new MockHappnClient(name));
  });
});

module.exports.instances = {};

function MockHappnClient(name) {
  this.serverInfo = {
    name: name,
  };
  module.exports.instances[name] = this;
  this.eventHandlers = {};

  var onDestroy,
    _this = this;
  this.socket = {
    on: function (event, handler) {
      if (event === 'destroy') {
        onDestroy = handler;
      }
    },
    destroy: function () {
      _this.destroyed = true;
      onDestroy();
    },
  };

  this.__subscribed = [];
  this.__subscriptionHandlers = {};
}

MockHappnClient.prototype.onEvent = function (event, handler) {
  this.eventHandlers[event] = this.eventHandlers[event] || [];
  this.eventHandlers[event].push(handler);
};

MockHappnClient.prototype.offEvent = function () {};
MockHappnClient.prototype.disconnect = () => {};
MockHappnClient.prototype.on = NodeUtil.promisify(function (path, opts, handler, callback) {
  if (queuedSubscriptionError) {
    var error = queuedSubscriptionError;
    queuedSubscriptionError = null;
    process.nextTick(function () {
      callback(error);
    });
    return;
  }
  this.__subscribed.push(path);
  this.__subscriptionHandlers[path] = handler;
  process.nextTick(callback);
});

MockHappnClient.prototype.emitDisconnect = function () {
  var handlers = this.eventHandlers['reconnect-scheduled'];
  if (!handlers) return;
  handlers.forEach(function (fn) {
    fn();
  });
};

MockHappnClient.prototype.emitHappnEvent = function (path, data, meta) {
  if (!this.__subscriptionHandlers[path]) return;
  this.__subscriptionHandlers[path](data, meta);
};
