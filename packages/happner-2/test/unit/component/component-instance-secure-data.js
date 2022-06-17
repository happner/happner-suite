require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, (test) => {
  function mockData(state) {
    if (!state) state = 1; //active

    return {
      status: state,
      get: function (path, opts, callback) {
        return callback();
      },
      on: function (path, opts, handler, callback) {
        return callback();
      },
      off: function (path, callback) {
        return callback();
      },
      offPath: function (path, callback) {
        return callback();
      },
      getPaths: function (path, opts, callback) {
        return callback();
      },
      set: function (path, data, opts, callback) {
        return callback();
      },
      increment: function (path, gauge, increment, opts, callback) {
        return callback();
      },
      remove: function (path, opts, callback) {
        return callback();
      },
      count: function (path, opts, callback) {
        return callback();
      },
    };
  }

  it('test the on with a connection', function (done) {
    const secureData = require('../../../lib/system/component-instance-data').create(
      mockData(),
      'testComponent',
      { username: 'test' }
    );
    secureData.on('test/path', {}, function () {}, done);
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
