var os = require('os');
var procStats = require('proc-stats');
var Logger = require('happn-logger');

module.exports = function () {
  return new SystemComponent();
};

class SystemComponent {
  constructor() {
    this.__systemUp = Date.now();
  }
  initialize($happn, callback) {
    this.__lastTimestamp = Date.now();
    this.$happn = $happn;
    Logger.emitter.on('after', this.publishLogEvent($happn));
    callback(null);
  }

  stop() {
    Logger.emitter.removeAllListeners('after')
  }

  compactDBFile($happn, callback) {
    return $happn._mesh.happn.server.services.data.compact(callback);
  }
  getStats($happn, callback) {
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
  }
  systemInfo() {
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
  }
  async setLogLevel(level) {
    Logger.setLogLevel(level);
  }
  publishLogEvent($happn) {
    return (level, msg, additional) => {
      try {
        if ($happn.data.noConnection()) return;
        $happn.emitLocal(`system/log/${level}`, {
          level,
          msg,
          additional,
          timestamp: Date.now()
        },
        "noCallback"
        );
      } catch {}
    };
  }
}
