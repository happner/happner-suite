var path = require('path');
var filename = path.basename(__filename);
var expect = require('expect.js');
var hooks = require('../lib/hooks');

var testSequence = parseInt(filename.split('-')[0]);
var clusterSize = 10;
var happnSecure = false;
const wait = require('await-delay');

describe(filename, function () {
  this.timeout(30000);

  before(function () {
    this.logLevel = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = 'off';
  });

  hooks.startCluster({
    testSequence: testSequence,
    size: clusterSize,
    happnSecure: happnSecure,
    clusterConfig: {
      'cluster-service-1': 4,
      'cluster-service-2': 6,
    },
  });

  it('each server stabilised with all 10 peers', function (done) {
    const peerCounts = this.servers.map(
      (server) => Object.keys(server.services.orchestrator.peers).length
    );
    expect(peerCounts).to.eql([10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);
    expect(this.servers.every((server) => server.services.orchestrator.state === 'STABLE')).to.be(
      true
    );
    done();
  });

  hooks.stopCluster();

  after(function () {
    process.env.LOG_LEVEL = this.logLevel;
  });
});
