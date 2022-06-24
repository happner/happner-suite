var EventEmitter = require('events').EventEmitter;
var util = require('util');
var dface = require('dface');

var property = require('../utils/property');
var GetAddress = require('../utils/get-address');

module.exports = class Membership extends EventEmitter {
  constructor(opts) {
    super();
    this.log = opts.logger.createLogger('Membership');
    this.getAddress = GetAddress(this.log);
  }

  static create(opts) {
    return new Membership(opts);
  }

  initialize(config, callback) {
    this.config = config;
    this.announceHost = this.happn.config.announceHost;
    this.members = {};
    this.intervals = {};
    this.__defaults(callback);
  }

  stop(options, callback) {
    if (typeof options === 'function') callback = options;
    this.log.debug('stopping');
    if (this.intervals.keepAlive) clearInterval(this.intervals.keepAlive);
    if (this.intervals.memberLoop) clearInterval(this.intervals.memberLoop);
    this.log.info('stopped');
    callback();
  }

  onUpdate(member) {
    if (member.host === this.swimAddress) return;
    if (member.cluster !== this.config.clusterName) return;
    if (member.state === 0) return this.addMember(member, true);
    if (member.state === 1) return;
    if (member.state === 2) return this.removeMember(member);
  }

  async memberLoop() {
    let members = await this.fetchMembers();
    this.updateMembers(members);
  }

  updateMembers(members) {
    for (let savedMember of Object.values(this.members)) {
      if (!members.find((member) => savedMember.host === member.host))
        this.onUpdate({ ...savedMember, state: 2 });
    }
    for (let member of members) {
      if (!this.members[member.host]) {
        this.onUpdate({ ...member, state: 0 });
      }
    }
  }

  removeMember(member) {
    if (!this.members[member.host]) return;
    delete this.members[member.host];
    this.log.$$TRACE(
      'has %d other members (%s left)',
      Object.keys(this.members).length,
      member.host
    );
    this.emit('remove', {
      memberId: member.host,
    });
  }

  addMember(member, update) {
    if (update === true) {
      this.emit('update', {
        memberId: member.host,
        url: member.url,
      });
    }
    if (this.members[member.host]) {
      return;
    }
    this.members[member.host] = member;
    this.log.$$TRACE(
      'has %d other members (%s arrived)',
      Object.keys(this.members).length,
      member.host
    );
    this.emit('add', {
      memberId: member.host,
      url: member.url,
    });
  }

  async bootstrap() {
    let config, protocol, address, happnUrl, wait, deployment;

    // this.log.debug('listening at %s', this.swimAddress);
    this.log.debug("joining cluster '%s'", this.config.clusterName);
    this.deployment = this.config.deployment;
    config = this.config;
    protocol = this.happn.services.transport.config.mode;
    address = this.happn.server.address();

    if (address.address === '0.0.0.0') {
      // using this to inform remote hosts where to attach
      // 0.0.0.0 won't do, instead use first public ipv4 address
      happnUrl = this.getAddress();
    } else {
      happnUrl = address.address;
    }

    if (this.announceHost) {
      happnUrl = this.announceHost;
    }
    happnUrl += ':' + address.port;
    happnUrl = protocol + '://' + happnUrl;
    this.ownMemberInfo = {
      url: happnUrl,
      host: this.memberId,
      cluster: this.config.clusterName,
    };
    if (this.intervals.keepAlive) clearInterval(this.intervals.keepAlive);
    this.sendKeepAlive();
    this.intervals.keepAlive = setInterval(
      this.sendKeepAlive.bind(this),
      this.config.timing.keepAliveInterval
    );

    wait = config.seed ? 0 : config.seedWait;

    if (config.randomWait > 0 && !config.seed) {
      wait += Math.round(Math.random() * config.randomWait);
    }

    setTimeout(async () => {
      this.memberLoop.bind(this)();
      this.intervals.membership = setInterval(
        this.memberLoop.bind(this),
        this.config.timing.membership
      );
    }, wait);
  }

  sendKeepAlive() {
    let keepAlivePath = `/SYSTEM/DEPLOYMENT/${this.deployment}/${this.memberId}`;
    let keepAliveData = {
      ...this.ownMemberInfo,
    };
    this.happn.services.data.upsert(keepAlivePath, keepAliveData);
  }

  async fetchMembers() {
    let data = await this.happn.services.data.get(`/SYSTEM/DEPLOYMENT/${this.deployment}/**`, {
      criteria: {
        '_meta.modified': { $gte: Date.now() - this.config.timing.keepAliveThreshold },
      },
    });
    return data.map((entry) => entry.data);
  }

  __defaults(callback) {
    var config = this.config;

    if (!config.clusterName) config.clusterName = 'happn-cluster';

    if (typeof config.seed !== 'boolean') config.seed = false;

    if (typeof config.seedWait !== 'number') config.seedWait = 0;
    if (typeof config.randomWait !== 'number') config.randomWait = 0;

    try {
      config.host = dface(config.host);
    } catch (e) {
      return callback(e);
    }
    // need actual ip address, remote hosts can't connect to 0.0.0.0 here
    if (config.host === '0.0.0.0') config.host = this.getAddress();

    if (!config.port) config.port = this.happn.server.address().port;

    config.timing = config.timing || {
      keepAliveInterval: 2e3,
      membership: 2e3,
      keepAliveThreshold: 3e3,
    };

    this.swimAddress = (this.announceHost || config.host) + ':' + config.port;
    this.memberId = this.swimAddress;

    callback();
  }
};
