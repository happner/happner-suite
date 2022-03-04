//____________________________ ORCHESTRATOR_________________
const Happn = require('happn-3');
const _ = require('lodash');
const clone = require('clone');
const EventEmitter = require('events').EventEmitter;
const ServiceEntry = require('./orchestrator/serviceEntry');
const getAddress = require('../utils/get-address');
const CONSTANTS = require('./orchestrator/constants');
var property = require('../utils/property');
const NodeUtil = require('util');

module.exports = class Orchestrator extends EventEmitter {
  constructor(opts) {
    super();
    this.log = opts.logger.createLogger('Orchestrator');
    this.constants = CONSTANTS.STATES;
    this.state = this.constants.WARMUP;
    this.unstable = false;
    this.HappnClient = Happn.client;
  }

  static create(opts) {
    return new Orchestrator(opts);
  }

  get peers() {
    let peers = Object.values(this.registry).reduce(
      (peers, service) => ({ ...peers, ...service.peers }),
      {}
    );
    let self = this.registry[this.serviceName].members[this.endpoint];
    if (self && self.peer) property(peers, '__self', self);
    return peers;
  }

  get members() {
    return Object.values(this.registry).reduce(
      (members, service) => ({ ...members, ...service.members }),
      {}
    );
  }
  get unstableMembers() {
    return Object.values(this.members).filter((member) => !member.peer).length > 0;
  }

  initialize(config, callback) {
    this.config = this.defaults(config);
    this.intervals = this.configureIntervals(this.config);
    this.serviceName = this.config.serviceName;
    this.deployment = this.config.deployment;
    this.clusterName = this.config.clusterName;

    this.ip = getAddress()();

    this.announceHost = this.happn.config.announceHost;
    this.registry = {};
    this.keepaliveThreshold = this.config.keepaliveThreshold;
    this.stabiliseWaiting = [];
    this.stabilised = NodeUtil.promisify(this.stabilised);
    for (let [service, expected] of Object.entries(this.config.cluster))
      this.registry[service] = ServiceEntry.create(service, expected, this);

    this.secure = this.happn.config.secure;

    this.happn.services.session.on('authentic', this.__onConnectionFrom.bind(this));

    this.happn.services.session.on('disconnect', this.__onDisconnectionFrom.bind(this));
    callback();
  }

  defaults(config) {
    config = config || {};
    config = _.defaults({}, config, {
      keepaliveThreshold: 2e3,
      replicate: ['*'],
      serviceName: 'happn-cluster-node',
      deployment: 'Test-Deploy',
      clusterName: 'happn-cluster',
      stabiliseTimeout: 15e3,
    });
    config.replicate.push('/__REPLICATE');
    config.replicate = this.__reducePaths(config.replicate);
    if (config.cluster && Object.keys(config.cluster).length) return config;
    config.cluster = {};
    config.cluster[config.serviceName] = config.minimumPeers || 1;
    return config;
  }

  configureIntervals() {
    let intervals = {
      keepAlive: {
        time: 1e3,
        method: 'keepAlive',
      },
      membership: {
        time: 2e3,
        method: 'memberCheck',
      },
      health: {
        time: 5e3,
        method: 'healthReport',
      },
    };
    if (!this.config.intervals) return intervals;
    for (let name of Object.keys(this.config.intervals)) {
      if (intervals[name])
        intervals[name].time = this.config.intervals[name] || this.intervals[name].time;
    }
    return intervals;
  }

  async start() {
    this.endpoint = this.announceHost
      ? this.announceHost + ':' + this.happn.config.port
      : this.ip + ':' + this.happn.config.port;
    this.loginConfig = {
      // used to login to remote cluster members as a cluster peer
      info: {
        name: this.happn.name, // a.k.a. mesh.name
        clusterName: this.clusterName,
        serviceName: this.serviceName,
        // memberId: this.happn.services.membership.memberId,
        endpoint: this.endpoint,
      },
    };
    if (this.secure) {
      this.adminUser = this.happn.services.security.config.adminUser;
      this.loginConfig.username = this.adminUser.username;
      this.loginConfig.password = this.adminUser.password;
    }
    var localLoginConfig = clone(this.loginConfig);
    delete localLoginConfig.info.clusterName;
    this.localClient = await this.happn.services.session.localClient(localLoginConfig);
    this.startIntervals();
  }

  startIntervals() {
    for (let info of Object.values(this.intervals)) {
      this[info.method].call(this);
      info.interval = setInterval(this[info.method].bind(this), info.time);
    }
  }

  stabilised(callback) {
    if (this.stableTimeout) return;
    if (typeof callback === 'function') this.stabiliseWaiting.push(callback);
    if (this.config.stabiliseTimeout) {
      this.stableTimeout = setTimeout(() => {
        var error = new Error('failed to stabilise in time');
        error.name = 'StabiliseTimeout';
        this.clearStabilizedTimeout(error);
      }, this.config.stabiliseTimeout);
    }
    this.__stateUpdate();
  }

  clearStabilizedTimeout(error) {
    error = Array.isArray(error) ? error[0] : error;
    let callback;
    while ((callback = this.stabiliseWaiting.shift()) !== undefined) callback(error);
  }

  async stop(opts, cb) {
    if (typeof opts === 'function') cb = opts;
    for (let info of Object.values(this.intervals)) {
      await clearInterval(info.interval);
    }

    await Promise.all(Object.values(this.registry).map((service) => service.stop()));
    if (cb) cb();
  }

  memberCheck() {
    this.lookup();
    this.addMembers();
    this.connect();
    this.subscribe();
    this.__stateUpdate();
  }

  async lookup() {
    let endpoints = await this.fetchEndpoints();
    Object.entries(this.registry).forEach(([name, service]) =>
      service.setEndpoints(endpoints[name] || [])
    );
  }

  async fetchEndpoints() {
    // Doing this in a seperate function so that we can alter it to allow for non-aws cases if desired.
    let data = await this.happn.services.data.get(`/SYSTEM/DEPLOYMENT/${this.deployment}/**`, {
      criteria: {
        '_meta.modified': { $gte: Date.now() - this.keepaliveThreshold },
      },
    });
    return data
      .map((entry) => entry.data)
      .reduce((endpointMap, { service, endpoint }) => {
        endpointMap[service] = endpointMap[service] || [];
        endpointMap[service].push(endpoint);
        return endpointMap;
      }, {});
  }

  async connect() {
    for (let service of Object.values(this.registry)) {
      service.connect(this.getLoginConfig());
    }
  }
  async subscribe() {
    for (let service of Object.values(this.registry)) {
      service.subscribe();
    }
  }

  addMembers() {
    for (let service of Object.values(this.registry)) {
      service.addMembers();
    }
  }

  keepAlive() {
    let keepAlivePath = `/SYSTEM/DEPLOYMENT/${this.deployment}/${this.serviceName}/${this.endpoint}`;
    let keepAliveData = {
      service: this.serviceName,
      endpoint: this.endpoint,
    };
    this.happn.services.data.upsert(keepAlivePath, keepAliveData);
  }

  getLoginConfig() {
    if (!this.loginConfig) return null;
    var config = {
      info: clone(this.loginConfig.info),
    };
    if (this.loginConfig.username) config.username = this.loginConfig.username.toString();
    if (this.loginConfig.password) config.password = this.loginConfig.password.toString();
    config.protocol = this.happn.services.transport.config.mode;
    return config;
  }

  peerStatusUpdate(member) {
    if (!member.serviceName) return;
    if (member.peer) return this.addPeer(member);
    return this.removePeer(member);
  }

  addPeer(member) {
    member.listedAsPeer = true;
    this.registry[member.serviceName].members[member.endpoint] = member;
    this.emit('peer/add', member.name, member);
    // if (!this.registry[member.serviceName][member.endpoint]) this.registry[member.serviceName][member.endpoint] = member;
    this.log.info('cluster size %d (%s arrived)', Object.keys(this.peers).length, member.name);
  }

  removePeer(member) {
    member.listedAsPeer = false;
    this.emit('peer/remove', member.name, member);

    this.log.info('cluster size %d (%s left)', Object.keys(this.peers).length, member.name);
  }

  removeMember(member) {
    if (this.registry[member.serviceName]) this.registry[member.serviceName].removeMember(member);
  }

  __stateUpdate(member) {
    let errors = this.__checkErroredMembers();
    if (errors) return this.clearStabilizedTimeout(errors);
    if (member && member.listedAsPeer !== member.peer) this.peerStatusUpdate(member);
    if (
      Object.values(this.registry).every((service) => {
        return service.peersFulfilled;
      }) &&
      !this.unstableMembers
    ) {
      if (this.state !== this.constants.STABLE) {
        this.log.info(`Node ${this.happn.name} in service ${this.serviceName} stabilized`);
      }
      let callback;
      this.clearStabilizedTimeout();
      this.state = this.constants.STABLE;
      this.unstable = false;
      clearTimeout(this.stableTimeout);
      return;
    }

    if (this.state === this.constants.STABLE) this.unstable = true; //System was stable, but is no longer.

    if (Object.values(this.registry).every((service) => service.isConnected)) {
      this.state = this.unstable
        ? this.constants.UNSTABLE_RESUBSCRIBING
        : this.constants.SUBSCRIBING;
      return;
    }
    if (Object.values(this.registry).every((service) => service.foundEnoughPeers)) {
      this.state = this.unstable ? this.constants.UNSTABLE_RECONNECTING : this.constants.CONNECTING;
      return;
    }
    if (Object.values(this.registry).some((service) => service.foundOthers)) {
      this.state = this.unstable
        ? this.constants.UNSTABLE_INSUFFICIENT_PEERS
        : this.constants.WARMUP_CONNECTING;
      return;
    }
    this.state = this.constants.ISOLATED;
  }

  __checkErroredMembers() {
    let error = false;
    let errors = [];
    Object.values(this.members).forEach((member) => {
      if (member.error) {
        error = true;
        errors.push(member.error);
      }
    });
    if (error) return errors;
  }

  healthReport() {
    this.log.info(
      `Member: name ${this.happn.name}, endpoint: ${this.endpoint}, service: ${this.serviceName}, state: ${this.state}`
    );

    let peerReport = Object.values(this.registry)
      .map((service) => {
        return `\tService ${service.name} has ${service.numPeers} peers of ${service.expected} required`;
      })
      .join('\n');
    this.log.info(`Node: ${this.happn.name} breakdown: \n` + peerReport);
  }

  __onConnectionFrom(data) {
    if (!data.info) return;
    if (!data.info.clusterName) return;
    this.log.debug('connect from (<-) %s/%s', data.info.clusterName, data.info.name);
    if (data.info.clusterName !== this.clusterName) return;
    const { serviceName } = data.info;
    this.registry[serviceName].connectionFrom(data.info);
  }

  __onDisconnectionFrom(data) {
    if (!data.info || !data.info.clusterName || !data.info.serviceName) return;
    this.log.debug('disconnect from (<-) %s/%s', data.info.clusterName, data.info.name);

    if (data.info.clusterName !== this.clusterName) return;
    this.registry[data.info.serviceName].disconnectionFrom(data.info);
  }

  __reducePaths(paths) {
    if (paths.length === 1) return paths;

    //* means match anything
    if (paths.some((path) => path === '*')) return ['*'];

    //remove any duplicates
    let returnPaths = paths.filter((v, i) => paths.indexOf(v) === i);

    let wildPaths = returnPaths.reduce((arr, path) => {
      if (path.indexOf('*') > -1) arr.push(path.split('/'));
      return arr;
    }, []);

    let tamePaths = returnPaths.reduce((arr, path) => {
      if (path.indexOf('*') === -1) arr.push(path.split('/'));
      return arr;
    }, []);

    for (let wildPathArr of wildPaths) {
      for (let tamePathArr of tamePaths) {
        if (tamePathArr.length === wildPathArr.length) {
          //same amount of segments
          let wildPath = wildPathArr.join('/');
          let tamePath = tamePathArr.join('/');
          if (tamePath.match(new RegExp(wildPath.replace(/\*/g, '.*'))) != null) {
            returnPaths.splice(returnPaths.indexOf(tamePath), 1);
          }
        }
      }
    }

    return returnPaths;
  }
};
