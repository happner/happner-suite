require('../../__fixtures/utils/test_helper').describe({ timeout: 30e3 }, (test) => {
  const test_file_call = test.newTempFilename('nedb');
  const test_file_interval = test.newTempFilename('nedb');
  test.tryDeleteTestFilesAfter([test_file_call, test_file_interval]);

  var Helper = require('../../__fixtures/utils/test_helper');
  var test_helper = new Helper();

  var config_call = {
    happn: {
      port: 55006,
      services: {
        data: {
          config: {
            autoUpdateDBVersion: true,
            datastores: [
              {
                name: 'nedb',
                provider: 'happn-db-provider-nedb',
                settings: {
                  filename: test_file_call,
                },
              },
            ],
          },
        },
      },
    },
    components: {
      data: {},
    },
  };

  var config_interval = {
    happn: {
      port: 55007,
      services: {
        data: {
          config: {
            autoUpdateDBVersion: true,
            datastores: [
              {
                name: 'nedb',
                provider: 'happn-db-provider-nedb',
                settings: {
                  filename: test_file_interval,
                  compactInterval: 10000, //compact every 5 seconds
                },
              },
            ],
          },
        },
      },
    },
    components: {
      data: {},
    },
  };
  var callMeshInstance;
  var callMeshClient;

  function getFileSize(filepath) {
    var stats = test.commons.fs.statSync(filepath);

    if (!stats) return 0;
    if (!stats.size) return 0;

    return stats.size;
  }

  // test.printOpenHandlesAfter(5e3);

  before(function (done) {
    test_helper.startHappnerInstance('1-compact-dbfile', config_call, function (e, mesh, client) {
      if (e) return done(e);
      callMeshInstance = mesh;
      callMeshClient = client;
      test_helper.startHappnerInstance(
        '1-compact-dbfile',
        config_interval,
        function (
          e /*,
          mesh,
          client
          */
        ) {
          if (e) return done(e);
          done();
        }
      );
    });
  });

  after(function (done) {
    test_helper.stopHappnerInstances('1-compact-dbfile', done);
  });

  it('should add and update some data, check the filesize - then call compact and check the size is smaller', function (done) {
    test.commons.async.series(
      [
        function (callback) {
          callMeshClient.exchange.data.set('/some/test/data', { test: 1 }, callback);
        },
        function (callback) {
          callMeshClient.exchange.data.set('/some/test/data', { test: 2 }, callback);
        },
        function (callback) {
          callMeshClient.exchange.data.set('/some/test/data', { test: 3 }, callback);
        },
        function (callback) {
          callMeshClient.exchange.data.set('/some/test/data', { test: 4 }, callback);
        },
        function (callback) {
          callMeshClient.exchange.data.set('/some/test/data', { test: 5 }, callback);
        },
      ],
      function (e) {
        if (e) return done(e);
        var fileSizeUncompacted = getFileSize(test_file_call);

        callMeshInstance.exchange.system.compactDBFile(function (e) {
          if (e) return done(e);

          var fileSizeCompacted = getFileSize(test_file_call);
          test.expect(fileSizeCompacted < fileSizeUncompacted).to.be(true);

          done();
        });
      }
    );
  });

  it('should add and update some data on the interval system, then wait for 15 seconds and check the filesize is the expected compact size', function (done) {
    test.commons.async.series(
      [
        function (callback) {
          callMeshClient.exchange.data.set('/some/test/data', { test: 1 }, callback);
        },
        function (callback) {
          callMeshClient.exchange.data.set('/some/test/data', { test: 2 }, callback);
        },
        function (callback) {
          callMeshClient.exchange.data.set('/some/test/data', { test: 3 }, callback);
        },
        function (callback) {
          callMeshClient.exchange.data.set('/some/test/data', { test: 4 }, callback);
        },
        function (callback) {
          callMeshClient.exchange.data.set('/some/test/data', { test: 5 }, callback);
        },
        function (callback) {
          callMeshClient.exchange.data.set('/some/test/data', { test: 1 }, callback);
        },
        function (callback) {
          callMeshClient.exchange.data.set('/some/test/data', { test: 2 }, callback);
        },
        function (callback) {
          callMeshClient.exchange.data.set('/some/test/data', { test: 3 }, callback);
        },
        function (callback) {
          callMeshClient.exchange.data.set('/some/test/data', { test: 4 }, callback);
        },
        function (callback) {
          callMeshClient.exchange.data.set('/some/test/data', { test: 5 }, callback);
        },
      ],
      function (e) {
        if (e) return done(e);

        var fileSizeUncompacted = getFileSize(test_file_interval);

        setTimeout(function () {
          var fileSizeCompacted = getFileSize(test_file_interval);
          test.expect(fileSizeCompacted < fileSizeUncompacted).to.be(true);
          done();
        }, 15000);
      }
    );
  });
});
