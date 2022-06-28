var Member = require('../../lib/services/orchestrator/member');
var MockOrchestrator = require('../mocks/mock-orchestrator');
var mockOpts = require('../mocks/mock-opts');
var MockHappnClient = require('../mocks/mock-happn-client');

require('../lib/test-helper').describe({ timeout: 30e3 }, function (test) {
  before(function () {
    this.logLevel = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = 'off';
  });

  before(function () {
    this.orchestrator = new MockOrchestrator(mockOpts);
  });

  beforeEach(function () {
    MockHappnClient.instances = {};
    this.orchestrator.config.replicate = ['/*'];
  });

  context("initialised from remote's login.info", function () {
    it('logs back into remote and updates state', function (done) {
      var m = new Member({
        orchestrator: this.orchestrator,
        clusterName: 'cluster-name',
        memberFromLogin: {
          memberId: 'MEMBER_ID',
          url: 'http://10.0.0.2:55000',
        },
      });

      // test.expect(m.connectingTo).to.equal(true);

      // wait for login
      setTimeout(function () {
        test.expect(MockHappnClient.instances['10-0-0-2_55000']).to.not.be(undefined);

        // test.expect(m.connectingTo).to.equal(false);
        test.expect(m.connectedTo).to.equal(true);
        // test.expect(m.connectedFrom).to.equal(false);
        test.expect(m.name).to.equal('10-0-0-2_55000');

        done();
      }, 20);
    });
  });

  context('initialised from membership (swim) info', function () {
    it('logs back into remote and updates state', function (done) {
      var m = new Member({
        orchestrator: this.orchestrator,
        clusterName: 'cluster-name',
        member: {
          memberId: 'MEMBER_ID',
          url: 'http://10.0.0.2:55000',
        },
      });

      // test.expect(m.connectingTo).to.equal(true);

      setTimeout(function () {
        test.expect(MockHappnClient.instances['10-0-0-2_55000']).to.not.be(undefined);

        // test.expect(m.connectingTo).to.equal(false);
        test.expect(m.connectedTo).to.equal(true);
        // test.expect(m.connectedFrom).to.equal(false);
        test.expect(m.name).to.equal('10-0-0-2_55000');

        done();
      }, 20);
    });
  });

  context('replication', function () {
    it('subscribes to configured paths to replicate', function (done) {
      var m = new Member({
        orchestrator: this.orchestrator,
        clusterName: 'cluster-name',
        member: {
          memberId: 'MEMBER_ID',
          url: 'http://10.0.0.2:55000',
        },
      });

      setTimeout(function () {
        var replicationClient = MockHappnClient.instances['10-0-0-2_55000'];
        test.expect(replicationClient.__subscribed).to.eql(['/*']);
        test.expect(m.subscribedTo).to.equal(true);

        done();
      }, 20);
    });

    it('can subscribe to multiple paths', function (done) {
      this.orchestrator.config.replicate = ['/alternative/*', '/paths/*'];

      var m = new Member({
        orchestrator: this.orchestrator,
        clusterName: 'cluster-name',
        member: {
          memberId: 'MEMBER_ID',
          url: 'http://10.0.0.2:55000',
        },
      });

      setTimeout(function () {
        var replicationClient = MockHappnClient.instances['10-0-0-2_55000'];
        test.expect(replicationClient.__subscribed).to.eql(['/alternative/*', '/paths/*']);
        test.expect(m.subscribedTo).to.equal(true);

        done();
      }, 20);
    });

    it('can subscribe to no paths', function (done) {
      this.orchestrator.config.replicate = [];

      var m = new Member({
        orchestrator: this.orchestrator,
        clusterName: 'cluster-name',
        member: {
          memberId: 'MEMBER_ID',
          url: 'http://10.0.0.2:55000',
        },
      });

      setTimeout(function () {
        var replicationClient = MockHappnClient.instances['10-0-0-2_55000'];
        test.expect(replicationClient.__subscribed).to.eql([]);
        test.expect(m.subscribedTo).to.equal(true);

        done();
      }, 20);
    });
  });

  context('errors', function () {
    it('sets error on login error', function (done) {
      MockHappnClient.queueLoginError(new Error('login error'));

      var m = new Member({
        orchestrator: this.orchestrator,
        clusterName: 'cluster-name',
        member: {
          memberId: 'MEMBER_ID',
          url: 'http://10.0.0.2:55000',
        },
      });

      this.orchestrator.members[m.memberId] = m;

      setTimeout(function () {
        test.expect(m.error.message).to.equal('login error');
        done();
      }, 20);
    });

    it('sets error on subscription error', function (done) {
      MockHappnClient.queueSubscriptionError(new Error('subscription error'));

      var m = new Member({
        orchestrator: this.orchestrator,
        clusterName: 'cluster-name',
        member: {
          memberId: 'MEMBER_ID',
          url: 'http://10.0.0.2:55000',
        },
      });

      this.orchestrator.members[m.memberId] = m;

      setTimeout(function () {
        test.expect(m.error.message).to.equal('subscription error');
        done();
      }, 20);
    });
  });

  after(function () {
    process.env.LOG_LEVEL = this.logLevel;
  });
});
