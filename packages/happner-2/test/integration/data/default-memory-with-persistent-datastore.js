const happner2 = require('../../..');
let thisTest;
require('../../__fixtures/utils/test_helper').describe({ timeout: 20e3 }, (test) => {
  thisTest = test;
  it('should test persistency using convenience settings', function (done) {
    var c = getConfig(true);
    runTest(c, done);
  });

  it('should test persistency using normal settings', function (done) {
    var c = getConfig(false);
    runTest(c, done);
  });

  function runTest(c, done) {
    var mesh;
    thisTest.commons.async.series(
      [
        function (cb) {
          startMesh(c, function (err, _mesh) {
            mesh = _mesh;
            cb(err);
          });
        },
        function (cb) {
          mesh.exchange.myComponent.setData('a', { value: 1 }, cb);
        },
        function (cb) {
          mesh.exchange.myComponent.setData2('b', { value: 2 }, cb);
        },
        function (cb) {
          mesh.stop(cb);
        },
        function (cb) {
          startMesh(c, function (err, _mesh) {
            mesh = _mesh;
            cb(err);
          });
        },
        function (cb) {
          mesh.exchange.myComponent.getData('a', function (err, data) {
            data.should.property('value', 1);
            cb(err);
          });
        },
        function (cb) {
          mesh.exchange.myComponent.getData2('b', function (err, data) {
            thisTest.expect(data).to.be(null);
            cb(err);
          });
        },
        function (cb) {
          mesh.stop(cb);
        },
      ],
      done
    );
  }
});

function startMesh(c, cb) {
  happner2
    .create(c)
    .then(function (_mesh) {
      cb(null, _mesh);
    })
    .catch(cb);
}

function getConfig(useConvenienceSettings) {
  var filename = thisTest.commons.path.join(__dirname, '../tmp/' + thisTest.newid() + '.loki');

  var c = {
    happn: {
      port: 55000,
      secure: true,
      encryptPayloads: true,
      setOptions: {
        timeout: 60000,
      },
      services: {
        security: {
          config: {
            adminUser: {
              password: 'password',
            },
          },
        },
        connect: {
          config: {
            middleware: {
              security: {
                exclusions: ['/*'],
              },
            },
          },
        },
      },
    },
    modules: {
      myComponent: {
        instance: {
          setData: function ($happn, key, data, callback) {
            $happn.data.set('myData/' + key, data, {}, callback);
          },
          getData: function ($happn, key, callback) {
            $happn.data.get('myData/' + key, callback);
          },
          setData2: function ($happn, key, data, callback) {
            $happn.data.set('myOtherData/' + key, data, {}, callback);
          },
          getData2: function ($happn, key, callback) {
            $happn.data.get('myOtherData/' + key, callback);
          },
        },
      },
    },
    components: {
      myComponent: {
        data: {
          routes: {
            'myData/*': 'persist',
          },
        },
      },
    },
  };

  if (useConvenienceSettings) {
    c.happn.filename = filename;
    c.happn.defaultRoute = 'mem';
  } else {
    c.happn.services.data = {
      config: {
        datastores: [
          {
            name: 'memory',
            isDefault: true,
          },
          {
            name: 'persist',
            settings: {
              filename: filename,
            },
          },
        ],
      },
    };
  }

  return c;
}
