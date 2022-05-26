//____________________________ SERVICE-REGISTRY ENTRY_____________
const Member = require('./member');
const cloneMember = require('../../../test/lib/cloneMember');
module.exports = class ServiceEntry {
  constructor(name, expected, orchestrator) {
    this.name = name;
    this.expected = expected;
    this.myEndpoint = orchestrator.endpoint;
    this.orchestrator = orchestrator;
    this.endpoints = [];
    this.members = {};
  }

  static create(name, expected, orchestrator) {
    return new ServiceEntry(name, expected, orchestrator);
  }

  get found() {
    return this.endpoints.length;
  }

  get foundEnoughPeers() {
    return this.found >= this.expected;
  }

  get foundOthers() {
    return this.endpoints.includes(this.myEndpoint)
      ? this.endpoints.length > 1
      : this.endpoints.length > 0;
  }

  get connected() {
    return Object.values(this.members).filter((member) => member.connected).length;
  }

  get isConnected() {
    return this.connected >= this.expected;
  }

  get peers() {
    return Object.values(this.members).reduce((peers, member) => {
      if (member.peer) {
        peers[member.name] = member;
      }
      return peers;
    }, {});
  }

  get numPeers() {
    return Object.keys(this.peers).length;
  }

  get peersFulfilled() {
    return this.numPeers >= this.expected;
  }

  setEndpoints(found) {
    this.endpoints = found || [];
  }

  async cleanupMembers() {
    for (let [endpoint, member] of Object.entries(this.members)) {
      if (!this.endpoints.includes(endpoint)) {
        await member.stop();
        this.orchestrator.removePeer(member);
        this.removeMember(member);
      }
    }
  }
  addMembers() {
    for (let endpoint of this.endpoints) {
      this.members[endpoint] =
        this.members[endpoint] || new Member({ endpoint }, this.orchestrator);
    }
  }

  removeMember(member) {
    delete this.members[member.endpoint];
  }

  async connect(loginConfig) {
    await Promise.all(Object.values(this.members).map((member) => member.connect(loginConfig)));
  }

  async stop() {
    await Promise.all(Object.values(this.members).map((member) => member.stop()));
  }

  async subscribe() {
    // console.log(Object.keys(this.members))
    await Promise.all(Object.values(this.members).map((member) => member.subscribe()));
  }

  async connectionFrom(member) {
    if (!this.members[member.endpoint]) {
      this.members[member.endpoint] = new Member(member, this.orchestrator);
    }
    this.members[member.endpoint].connectionFrom(member);
  }

  async disconnectionFrom(member) {
    if (!this.members[member.endpoint]) return;
    this.members[member.endpoint].connectedTo = false;
    this.members[member.endpoint].connectedFrom = false;
    return this.orchestrator.__stateUpdate(this.members[member.endpoint]);
  }
};
