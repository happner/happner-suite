const Helper = require('./helper');
const { exec } = require('child_process');
const { fs } = require('happn-commons');
const path = require('path');

module.exports = class PM2Manager extends Helper {
  constructor() {
    super();
    this.command = `${__dirname}/pm2Instance.js`;
    this.tempDir = `${__dirname}/pm2Temp`;
    this.names = [];
  }
  static create() {
    return new PM2Manager();
  }
  start(name, config) {
    let tempFile = this.tempDir + '/' + name;
    this.names.push(name);
    if (!fs.existsSync(this.tempDir)) fs.mkdirSync(this.tempDir);
    fs.writeFileSync(tempFile, JSON.stringify(config));
    exec(`pm2 start ${this.command} --name ${name} -- ${tempFile}`);
  }
  restart(name) {
    exec(`pm2 restart  ${name}`);
  }
  destroy() {
    exec(`pm2 stop  ${this.names.join(' ')}`);
  }
};
