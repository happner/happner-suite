require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  function mockData(state) {
    if (!state) state = 1; //active

    return {
      status: state,
      get: test.sinon.stub().callsArg(2),
      on: test.sinon.stub().callsArg(3),
      off: test.sinon.stub().callsArg(1),
      offPath: test.sinon.stub().callsArg(1),
      getPaths: test.sinon.stub().callsArg(2),
      set: test.sinon.stub().callsArg(3),
      increment: test.sinon.stub().callsArg(4),
      remove: test.sinon.stub().callsArg(2),
      count: test.sinon.stub().callsArg(2),
    };
  }

  it('test the on with a connection, no origin and options', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent'
    );
    secureData.on('test/path', null, function () {}, done);
  });

  it('test the on with a connection', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent',
      { username: 'test' }
    );
    secureData.on('test/path', {}, function () {}, done);
  });

  it('test the on with a connection with preceding /', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent',
      { username: 'test' }
    );
    secureData.on('/test/path', {}, function () {}, done);
  });

  it('test the on with a connection, default opts', function (done) {
    const mockedData = mockData();
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockedData,
      'testComponent',
      { username: 'test' }
    );
    secureData.on(
      'test/path',
      function () {},
      () => {
        test.expect(mockedData.on.lastCall.args[0]).to.eql('/_data/testComponent/test/path');
        test.expect(mockedData.on.lastCall.args[1]).to.eql({
          onBehalfOf: 'test',
        });
        done();
      }
    );
  });

  it('test the on with a connection, default opts, with *', function (done) {
    const mockedData = mockData();
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockedData,
      'testComponent',
      { username: 'test' }
    );
    secureData.on(
      '*',
      function () {},
      () => {
        test.expect(mockedData.on.lastCall.args[0]).to.eql('/_data/testComponent/**');
        test.expect(mockedData.on.lastCall.args[1]).to.eql({
          onBehalfOf: 'test',
        });
        done();
      }
    );
  });

  it('test the bad path, on', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent',
      { username: 'test' }
    );
    secureData.on(
      '',
      {},
      function () {},
      (e) => {
        test.expect(e.message).to.be('[bad path]: either empty or not a string');
        done();
      }
    );
  });

  it('test the on without a connection', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(2),
      'testComponent',
      { username: 'test' }
    );

    secureData.on(
      'test/path',
      {},
      function () {},
      function (e) {
        test
          .expect(e.toString())
          .to.be(
            'Error: client state not active or connected, action: on, path: test/path, component: testComponent'
          );
        done();
      }
    );
  });

  it('test the off with a connection', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent',
      { username: 'test' }
    );
    secureData.off('test/path', done);
  });

  it('test the off by listenerRef with a connection', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent',
      { username: 'test' }
    );
    secureData.off(1, done);
  });

  it('test the off with a connection, bad path', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent',
      { username: 'test' }
    );
    secureData.off(undefined, (e) => {
      test.expect(e.message).to.be('[bad path]: either empty or not a string');
      done();
    });
  });

  it('test the off without a connection', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(2),
      'testComponent',
      { username: 'test' }
    );
    secureData.off('test/path', function (e) {
      test
        .expect(e.toString())
        .to.be(
          'Error: client state not active or connected, action: off, path: test/path, component: testComponent'
        );
      done();
    });
  });

  it('test the offAll with a connection', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent',
      { username: 'test' }
    );

    secureData.offAll(done);
  });

  it('test the offAll without a connection', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(2),
      'testComponent',
      { username: 'test' }
    );

    secureData.offAll(function (e) {
      test
        .expect(e.toString())
        .to.be(
          'Error: client state not active or connected, action: offAll, path: *, component: testComponent'
        );
      done();
    });
  });

  it('test the offPath with a connection', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent',
      { username: 'test' }
    );

    secureData.offPath('test/path', done);
  });

  it('test the offPath with a connection, bad path', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent',
      { username: 'test' }
    );
    secureData.offPath(null, (e) => {
      test.expect(e.message).to.be('[bad path]: either empty or not a string');
      done();
    });
  });

  it('test the offPath without a connection', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(2),
      'testComponent',
      { username: 'test' }
    );

    secureData.offPath('test/path', function (e) {
      test
        .expect(e.toString())
        .to.be(
          'Error: client state not active or connected, action: offPath, path: test/path, component: testComponent'
        );
      done();
    });
  });

  it('test the get with a connection', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent',
      { username: 'test' }
    );
    secureData.get('test/path', {}, done);
  });

  it('test the get with a connection, default options, no origin', function (done) {
    const mockedData = mockData();
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockedData,
      'testComponent'
    );
    secureData.get('test/path', undefined, () => {
      test.expect(mockedData.get.lastCall.args[0]).to.eql('/_data/testComponent/test/path');
      test.expect(mockedData.get.lastCall.args[1]).to.eql({});
      done();
    });
  });

  it('test the get with a connection, bad path', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent',
      { username: 'test' }
    );
    secureData.get({}, {}, (e) => {
      test.expect(e.message).to.be('[bad path]: either empty or not a string');
      done();
    });
  });

  it('test the get without a connection', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(2),
      'testComponent',
      { username: 'test' }
    );
    secureData.get('test/path', {}, function (e) {
      test
        .expect(e.toString())
        .to.be(
          'Error: client state not active or connected, action: get, path: test/path, component: testComponent'
        );
      done();
    });
  });

  it('test the get without a connection, default args', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(2),
      'testComponent',
      { username: 'test' }
    );

    secureData.get('test/path', function (e) {
      test
        .expect(e.toString())
        .to.be(
          'Error: client state not active or connected, action: get, path: test/path, component: testComponent'
        );
      done();
    });
  });

  it('test the count with a connection', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent',
      { username: 'test' }
    );
    secureData.count('test/path', {}, done);
  });

  it('test the count with a connection, default options, no origin', function (done) {
    const mockedData = mockData();
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockedData,
      'testComponent'
    );
    secureData.count('test/path', undefined, () => {
      test.expect(mockedData.count.lastCall.args[0]).to.eql('/_data/testComponent/test/path');
      test.expect(mockedData.count.lastCall.args[1]).to.eql({});
      done();
    });
  });

  it('test the count with a connection. bad path', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent',
      { username: 'test' }
    );
    secureData.count(1, {}, (e) => {
      test.expect(e.message).to.be('[bad path]: either empty or not a string');
      done();
    });
  });

  it('test the count without a connection', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(2),
      'testComponent',
      { username: 'test' }
    );

    secureData.count('test/path', {}, function (e) {
      test
        .expect(e.toString())
        .to.be(
          'Error: client state not active or connected, action: count, path: test/path, component: testComponent'
        );
      done();
    });
  });

  it('test the count without a connection, default args', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(2),
      'testComponent',
      { username: 'test' }
    );
    secureData.count('test/path', function (e) {
      test
        .expect(e.toString())
        .to.be(
          'Error: client state not active or connected, action: count, path: test/path, component: testComponent'
        );
      done();
    });
  });

  it('test the getPaths with a connection', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent',
      { username: 'test' }
    );

    secureData.getPaths('test/path/*', done);
  });

  it('test the getPaths with a connection, no origin', function (done) {
    const mockedData = mockData();
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockedData,
      'testComponent'
    );
    secureData.getPaths('test/path/*', () => {
      test.expect(mockedData.getPaths.lastCall.args[0]).to.eql('/_data/testComponent/test/path/*');
      test.expect(mockedData.getPaths.lastCall.args[1]).to.eql({});
      done();
    });
  });

  it('test the getPaths with a connection, bad path', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent',
      { username: 'test' }
    );

    secureData.getPaths(null, (e) => {
      test.expect(e.message).to.be('[bad path]: either empty or not a string');
      done();
    });
  });

  it('test the getPaths without a connection', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(2),
      'testComponent',
      { username: 'test' }
    );
    secureData.getPaths('test/path/*', function (e) {
      test
        .expect(e.toString())
        .to.be(
          'Error: client state not active or connected, action: getPaths, path: test/path/*, component: testComponent'
        );
      done();
    });
  });

  it('test the set with a connection', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent',
      { username: 'test' }
    );

    secureData.set('test/path', {}, {}, done);
  });

  it('test the set with a connection, no origin default opts', function (done) {
    const mockedData = mockData();
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockedData,
      'testComponent'
    );

    secureData.set('test/path', {}, undefined, () => {
      test.expect(mockedData.set.lastCall.args[0]).to.eql('/_data/testComponent/test/path');
      test.expect(mockedData.set.lastCall.args[1]).to.eql({});
      done();
    });
  });

  it('test the set with a connection, bad path', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent',
      { username: 'test' }
    );

    secureData.set(null, {}, {}, (e) => {
      test.expect(e.message).to.be('[bad path]: either empty or not a string');
      done();
    });
  });

  it('test the set without a connection', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(2),
      'testComponent',
      { username: 'test' }
    );

    secureData.set('test/path', {}, {}, function (e) {
      test
        .expect(e.toString())
        .to.be(
          'Error: client state not active or connected, action: set, path: test/path, component: testComponent'
        );
      done();
    });
  });

  it('test the set without a connection, default args', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(2),
      'testComponent',
      { username: 'test' }
    );

    secureData.set('test/path', {}, function (e) {
      test
        .expect(e.toString())
        .to.be(
          'Error: client state not active or connected, action: set, path: test/path, component: testComponent'
        );
      done();
    });
  });

  it('test the increment with a connection', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent',
      { username: 'test' }
    );

    secureData.increment('test/path', 'test-gauge', 1, done);
  });

  it('test the increment with a connection, no origin', function (done) {
    const mockedData = mockData();
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockedData,
      'testComponent'
    );

    secureData.increment('test/path', 'test-gauge', 10, () => {
      test.expect(mockedData.increment.lastCall.args[0]).to.eql('/_data/testComponent/test/path');
      test.expect(mockedData.increment.lastCall.args[1]).to.eql('test-gauge');
      test.expect(mockedData.increment.lastCall.args[2]).to.eql(10);
      test.expect(mockedData.increment.lastCall.args[3]).to.eql({});
      done();
    });
  });

  it('test the increment with a connection, bad path', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent',
      { username: 'test' }
    );

    secureData.increment(null, 'test-gauge', 1, (e) => {
      test.expect(e.message).to.be('[bad path]: either empty or not a string');
      done();
    });
  });

  it('test the increment without a connection', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(2),
      'testComponent',
      { username: 'test' }
    );

    secureData.increment('test/path', 'test-gauge', 1, function (e) {
      test
        .expect(e.toString())
        .to.be(
          'Error: client state not active or connected, action: increment, path: test/path, component: testComponent'
        );
      done();
    });
  });

  it('test the increment without a connection, default args 1', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(2),
      'testComponent',
      { username: 'test' }
    );

    secureData.increment('test/path', function (e) {
      test
        .expect(e.toString())
        .to.be(
          'Error: client state not active or connected, action: increment, path: test/path, component: testComponent'
        );
      done();
    });
  });

  it('test the increment without a connection, default args 2', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(2),
      'testComponent',
      { username: 'test' }
    );

    secureData.increment('test/path', 'test-gauge', function (e) {
      test
        .expect(e.toString())
        .to.be(
          'Error: client state not active or connected, action: increment, path: test/path, component: testComponent'
        );
      done();
    });
  });

  it('test the remove with a connection', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent',
      { username: 'test' }
    );

    secureData.remove('test/path', {}, done);
  });

  it('test the remove with a connection, no origin, default opts', function (done) {
    const mockedData = mockData();
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockedData,
      'testComponent'
    );

    secureData.remove('test/path', undefined, () => {
      test.expect(mockedData.remove.lastCall.args[0]).to.eql('/_data/testComponent/test/path');
      test.expect(mockedData.remove.lastCall.args[1]).to.eql({});
      done();
    });
  });

  it('test the remove with a connection, bad path', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent',
      { username: 'test' }
    );

    secureData.remove(null, {}, (e) => {
      test.expect(e.message).to.be('[bad path]: either empty or not a string');
      done();
    });
  });

  it('test the remove without a connection', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(2),
      'testComponent',
      { username: 'test' }
    );

    secureData.remove('test/path', {}, function (e) {
      test
        .expect(e.toString())
        .to.be(
          'Error: client state not active or connected, action: remove, path: test/path, component: testComponent'
        );
      done();
    });
  });

  it('test the remove without a connection, default args', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(2),
      'testComponent',
      { username: 'test' }
    );

    secureData.remove('test/path', function (e) {
      test
        .expect(e.toString())
        .to.be(
          'Error: client state not active or connected, action: remove, path: test/path, component: testComponent'
        );
      done();
    });
  });
});
