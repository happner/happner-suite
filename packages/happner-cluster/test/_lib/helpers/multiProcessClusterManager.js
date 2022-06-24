const Helper = require('./helper');
let ChildProcess = require('child_process');

module.exports = class Cluster extends Helper {
  constructor() {
    super();
    this.childProcess = {};
    this.pids = [];
    this.start = (configuration, index) => {
      return new Promise((resolve, reject) => {
        let childProcess = ChildProcess.fork(`${__dirname}/multiProcessClusterInstance.js`, [
          JSON.stringify(configuration),
        ]);
        this.childProcess[childProcess.pid] = childProcess;
        if (index || index === 0) this.pids[index] = childProcess.pid;
        else this.pids.push(childProcess.pid);
        childProcess.on('message', function (message) {
          if (message === 'ready') return resolve(childProcess);
        });
        childProcess.on('error', (code) => {
          this.removeChildProcess(childProcess);
          reject(code);
        });
        childProcess.on('exit', (code) => {
          // eslint-disable-next-line no-console
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
    this.listMembers = (index) => {
      return new Promise((res) => {
        let pid = this.pids[index];
        this.childProcess[pid].once('message', (info) => {
          return res(JSON.parse(info));
        });
        this.childProcess[pid].send('listMembers');
      });
    };
    this.listenForPeerEvents = (index) => {
      let pids = index || index === 0 ? [this.pids[index]] : this.pids;
      for (let pid of pids) {
        this.childProcess[pid].send('listenOnPeers');
      }
    };
    this.getPeerEvents = (index) => {
      return new Promise((res) => {
        let pid = this.pids[index];
        this.childProcess[pid].once('message', (info) => {
          return res(info);
        });
        this.childProcess[pid].send('getPeerEvents');
      });
    };
    this.stopChild = async (index, timeOut = 5000) => {
      let pid = this.pids[index];
      this.childProcess[pid].send('stopMesh');
      const timeOutTimestamp = Date.now() + timeOut;
      while (Date.now() < timeOutTimestamp) {
        await this.delay(100);
        if (!this.childProcess[pid]) return true;
      }
      return false;
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
      // eslint-disable-next-line no-console
      console.warn(`Child process failed to respond to SIGTERM in ${timeOut}ms sending SIGKILL`);
      Object.values(this.childProcess).forEach((process) => {
        process.kill('SIGKILL');
      });
    };
    this.destroy = async (timeOut = 5000) => {
      const meshStopped = await this.stopMesh(timeOut);
      if (meshStopped) return;
      // eslint-disable-next-line no-console
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
