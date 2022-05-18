const Helper = require('./helper');
let ChildProcess = require('child_process');

module.exports = class Cluster extends Helper {
  constructor() {
    super();
    this.childProcess = {};

    this.start = (configuration) => {
      return new Promise((resolve, reject) => {
        let childProcess = ChildProcess.fork(`${__dirname}/multiProcessClusterInstance.js`, [
          JSON.stringify(configuration),
        ]);
        this.childProcess[childProcess.pid] = childProcess;
        childProcess.on('message', function (message) {
          if (message === 'ready') return resolve(childProcess);
        });
        childProcess.on('error', (cdoe) => {
          this.removeChildProcess(childProcess);
          reject(cdoe);
        });
        childProcess.on('exit', (code) => {
          console.log(`child process exited with code ${code}`);
          this.removeChildProcess(childProcess);
        });
      });
    };
    this.removeChildProcess = (childProcess) => {
      childProcess.removeAllListeners('error');
      childProcess.removeAllListeners('message');
      childProcess.removeAllListeners('exit');
      delete this.childProcess[childProcess.pid];
    };
    this.stopMesh = async (timeOut) => {
      Object.values(this.childProcess).forEach((process) => {
        process.send('stopMesh');
      });
      const timeOutTimestamp = Date.now() + timeOut;
      while (Date.now() < timeOutTimestamp) {
        await this.delay(100);
        if (Object.keys(this.childProcess).length === 0) return true;
      }
      return false;
    };
    this.stopAllProcess = async (timeOut) => {
      Object.values(this.childProcess).forEach((process) => {
        process.kill('SIGTERM');
      });
      const timeOutTimestamp = Date.now() + timeOut;
      while (Date.now() < timeOutTimestamp) {
        await this.delay(100);
        if (Object.keys(this.childProcess).length === 0) return;
      }
      console.warn(`Child process failed to respond to SIGTERM in ${timeOut}ms sending SIGKILL`);
      Object.values(this.childProcess).forEach((process) => {
        process.kill('SIGKILL');
      });
    };
    this.destroy = async (timeOut = 5000) => {
      const meshStopped = await this.stopMesh(timeOut);
      if (meshStopped) return;
      console.warn(
        `Child process failed to respond to stopMesh in ${timeOut}ms, stopping processes`
      );
      return this.stopAllProcess(timeOut);
    };
  }

  static create() {
    return new Cluster();
  }
};
