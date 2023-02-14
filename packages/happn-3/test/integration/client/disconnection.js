const test = require('../../__fixtures/utils/test_helper').create();
describe(test.testName(__filename, 3), function () {
  var happn = require('../../../lib/index');
  var service = happn.service;
  var happn_client = happn.client;
  var async = require('async');
  var expect = require('expect.js');

  var Service1;
  var Service2;

  before('should initialize the services', function (callback) {
    this.timeout(10000);
    try {
      service.create(
        {
          port: 55002,
        },
        function (e, happnInst) {
          if (e) return callback(e);

          Service1 = happnInst;

          service.create(
            {
              secure: true,
              port: 55003,
            },
            function (e, happnInst) {
              if (e) return callback(e);

              Service2 = happnInst;
              callback();
            }
          );
        }
      );
    } catch (e) {
      callback(e);
    }
  });

  after('stop services', async () => {
    if (Service1) await Service1.stop();
    if (Service2) await Service2.stop();
  });

  var getClients = function (service, clientCount, opts, callback) {
    var wsClientCollection = [];
    var localClientCollection = [];

    async.times(
      clientCount,
      function (count, countCB) {
        try {
          happn_client.create(opts, function (e, instance) {
            if (e) return callback(e);

            wsClientCollection.push(instance);

            service.services.session.localClient(opts, function (e, instance) {
              if (e) return callback(e);

              localClientCollection.push(instance);

              countCB();
            });
          });
        } catch (e) {
          countCB(e);
        }
      },
      function (e) {
        if (e) return callback(e);

        callback(null, wsClientCollection, localClientCollection);
      }
    );
  };

  it('should initialize the Service1 clients, disconnect all the clients and ensure we have no remaining client data', function (callback) {
    getClients(
      Service1,
      5,
      {
        port: 55002,
      },
      function (e) {
        if (e) return callback(e);

        Service1.services.session.disconnectAllClients(function (e) {
          if (e) return callback(e);
          expect(Service1.services.session.__sessions).to.eql({});
          callback();
        });
      }
    );
  });

  it('should initialize the Service2 clients, disconnect all the clients and ensure we have no remaining client data', function (callback) {
    getClients(
      Service2,
      5,
      {
        port: 55003,
        username: '_ADMIN',
        password: 'happn',
      },
      function (e) {
        if (e) return callback(e);
        expect(Object.keys(Service2.services.session.__sessions).length).to.eql(10);
        Service2.services.session.disconnectAllClients(function (e) {
          if (e) return callback(e);
          expect(Object.keys(Service2.services.session.__sessions).length).to.eql(0);
          callback();
        });
      }
    );
  });
});
