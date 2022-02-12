require('../../__fixtures/utils/test_helper').describe({ timeout: 10e3 }, (test) => {
  let socketClientSessionId;

  const sessionEventsTest = function (serviceConfig, callback) {
    if (typeof serviceConfig === 'function') {
      callback = serviceConfig;
      serviceConfig = {};
    }
    var eventsFired = {};
    var serviceInstance;
    var stopped = false;

    var checkSocketEventStructure = function (eventData, protocol, username) {
      test.expect(eventData.id).to.be(socketClientSessionId);
      test.expect(eventData.legacyPing).to.be(false);
      test.expect(Number.isInteger(eventData.msgCount)).to.be(true);
      test.expect(eventData.protocol).to.be(protocol || `happn_${test.happnPackage.protocol}`);
      test.expect(eventData.browser).to.be(false);
      test.expect(eventData.intraProc).to.be(false);
      test.expect(eventData.sourceAddress).to.be('127.0.0.1');
      test.expect(eventData.sourcePort > 0).to.be(true);
      test.expect(eventData.upgradeUrl != null).to.be(true);
      if (username) test.expect(eventData.user.username).to.be(username);
    };

    const checkAllEventsFired = function (callback) {
      return () => {
        checkSocketEventStructure(eventsFired['connect-socket'], 'happn');
        checkSocketEventStructure(eventsFired['session-configured-socket']);

        if (serviceConfig.secure)
          checkSocketEventStructure(eventsFired['authentic-socket'], null, '_ADMIN');
        else checkSocketEventStructure(eventsFired['authentic-socket']);

        if (serviceConfig.secure)
          checkSocketEventStructure(eventsFired['disconnect-socket'], null, '_ADMIN');
        else checkSocketEventStructure(eventsFired['disconnect-socket']);

        test.expect(JSON.stringify(eventsFired, null, 2).indexOf('token":')).to.be(-1);
        test.expect(JSON.stringify(eventsFired, null, 2).indexOf('password')).to.be(-1);
        test.expect(JSON.stringify(eventsFired, null, 2).indexOf('privateKey')).to.be(-1);
        test.expect(JSON.stringify(eventsFired, null, 2).indexOf('keyPair')).to.be(-1);
        test.expect(JSON.stringify(eventsFired, null, 2).indexOf('secret')).to.be(-1);

        if (stopped) return callback();
        stopped = true;
        return serviceInstance.stop(callback);
      };
    };

    test.Mesh.create(serviceConfig, (e, happnInst) => {
      if (e) return callback(e);

      serviceInstance = happnInst;

      serviceInstance._mesh.happn.server.services.session.on('connect', function (data) {
        eventsFired['connect-socket'] = data;
      });

      serviceInstance._mesh.happn.server.services.session.on('authentic', function (data) {
        eventsFired['authentic-socket'] = data;
      });

      serviceInstance._mesh.happn.server.services.session.on('disconnect', function (data) {
        eventsFired['disconnect-socket'] = data;
      });

      serviceInstance._mesh.happn.server.services.session.on('session-configured', function (data) {
        eventsFired['session-configured-socket'] = data;
      });

      const socketClient = new test.Mesh.MeshClient({
        secure: true,
      });

      socketClient.login({ username: '_ADMIN', password: 'happn' }, (e) => {
        if (e) return callback(e);
        socketClientSessionId = socketClient.data.session.id;
        socketClient.disconnect(() => {
          setTimeout(checkAllEventsFired(callback), 2000);
        });
      });
    });
  };

  it('test session events on a secure mesh', function (callback) {
    sessionEventsTest(
      {
        secure: true,
      },
      callback
    );
  });
});
