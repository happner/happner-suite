var os = require('os');
var procStats = require('proc-stats');
const commons = require('happn-commons'),
  fs = commons.fs;
var diskspace = require('diskspace');
var Logger = require('happn-logger');

module.exports = function () {
  return new System();
};

function System() {
  this.__systemUp = Date.now();
  this.initialize = function ($happn, callback) {
    this.__lastTimestamp = Date.now();
    this.$happn = $happn;
    callback(null);
  };

  this.compactDBFile = function ($happn, callback) {
    return $happn._mesh.happn.server.services.data.compact(callback);
  };

  this.getStats = function ($happn, callback) {
    try {
      var now = Date.now();
      var seconds = (now - this.__lastTimestamp) / 1000;
      var upTime = now - this.__systemUp;
      var statistics = {};

      this.__lastTimestamp = now;

      statistics.measurementInterval = seconds;
      statistics.system = this.systemInfo($happn);
      statistics.system.upTime = upTime;
      statistics.system.meshName = $happn.info.mesh.name;
      statistics.timestamp = now;

      procStats.stats((e, result) => {
        if (e) return $happn.log.error('Failure to fetch cpu usage stats: ', e);
        statistics.usage = result;
        callback(null, statistics);
      });
    } catch (e) {
      callback(e);
    }
  };

  this.systemInfo = function () {
    return {
      host: os.hostname(),
      type: os.type(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      totalmem: os.totalmem(),
      freemem: os.freemem(),
      cpus: os.cpus(),
      happnerVersion: require('../../../package.json').version,
    };
  };
}
