// return first external ipv4 address
const os = require('os');
const NODE_MAJOR_VERSION = process.versions.node.split('.')[0];
const ip4Family = NODE_MAJOR_VERSION < 18 ? 'IPv4' : 4;

module.exports = class Helper extends require('events').EventEmitter {
  constructor() {
    super();
    this.delay = require('await-delay');
    this.address = {
      self: (interfaces) => {
        const NETWORK_INTERFACE = parseInt(process.env['NETWORK_INTERFACE']) || 0;
        interfaces = interfaces || os.networkInterfaces();
        let addresses = Object.keys(interfaces)
          .reduce((acc, current) => [...acc, ...interfaces[current]], [])
          .filter((iface) => !iface.internal && iface.family === ip4Family)
          .map((iface) => iface.address);
        if (NETWORK_INTERFACE && addresses.length >= NETWORK_INTERFACE + 1)
          return addresses[NETWORK_INTERFACE];
        return addresses[0];
      },
    };
  }
};
