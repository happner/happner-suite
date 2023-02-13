require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3 }, function (test) {
  const request = require('request');
  const happn = require('../../../lib/index');
  const service = happn.service;

  const serverConfig = {
    secure: true,
    services: {
      security: {
        config: {
          sessionTokenSecret: 'h1_test-secret',
          profiles: [
            {
              name: 'short-session',
              session: {
                'user.username': {
                  $eq: 'user-short-session',
                },
              },
              policy: {
                ttl: '2 seconds',
              },
            },
          ],
        },
      },
    },
  };

  it('logs in with a stateless (web based) request, we revoke the token and ensure the revocation expires with the token ttl', async () => {
    const server = await getServer(serverConfig);

    await upsertUser(server, {
      username: 'user-short-session',
      password: 'user-short-session-password',
    });

    const result = await doRequest(
      '/auth/login?username=user-short-session&password=user-short-session-password',
      null,
      true
    );
    const token = JSON.parse(result.body).data;
    test.expect(token != null).to.be(true);
    await revokeToken(server, token);
    let revocation = await server.services.security.cache_revoked_tokens.get(token);
    delete revocation.timestamp;
    test.expect(revocation).to.eql({
      reason: 'test reason',
      ttl: 2000,
    });
    await test.delay(3000);
    let revocationCheckedAgain = await server.services.security.cache_revoked_tokens.get(token);
    test.expect(revocationCheckedAgain).to.eql(null);
    stopServer(server);
  });

  it('logs in with a stateful request, then does a series of logins with with the original token, we revoke the token and ensure all children sessions have been disconnected', async () => {
    const server = await getServer(serverConfig);
    await upsertUser(server, {
      username: 'user-short-session',
      password: 'user-short-session-password',
    });
    const client1 = await getClient({
      username: 'user-short-session',
      password: 'user-short-session-password',
    });
    const clientsSessionEvents = {};
    client1.onEvent('session-ended', (evt) => {
      clientsSessionEvents['session-ended-1'] = evt;
    });
    const client2 = await getClient({
      username: 'user-short-session',
      token: client1.session.token,
    });
    client2.onEvent('session-ended', (evt) => {
      clientsSessionEvents['session-ended-2'] = evt;
    });
    const client3 = await getClient({
      username: 'user-short-session',
      token: client1.session.token,
    });
    client3.onEvent('session-ended', (evt) => {
      clientsSessionEvents['session-ended-3'] = evt;
    });
    const client4 = await getClient({
      username: 'user-short-session',
      token: client1.session.token,
    });
    client4.onEvent('session-ended', (evt) => {
      clientsSessionEvents['session-ended-4'] = evt;
    });

    await revokeToken(server, client1.session.token);
    await test.delay(1000);

    test.expect(clientsSessionEvents).to.eql({
      'session-ended-1': {
        reason: 'token-revoked',
      },
      'session-ended-2': {
        reason: 'token-revoked',
      },
      'session-ended-3': {
        reason: 'token-revoked',
      },
      'session-ended-4': {
        reason: 'token-revoked',
      },
    });
    stopServer(server);
  });

  it('logs in with a stateless (web based) request, we revoke the token and ensure the revocation expires with the token ttl', async () => {
    const filename = `${test.tempDirectory()}/token-revocations.loki`;
    try {
      tryUnlink(filename);
      const fileConfig = { services: { data: { config: { filename } } } };
      let server = await getServer(test.commons._.merge(serverConfig, fileConfig));

      await upsertUser(server, {
        username: 'user-short-session',
        password: 'user-short-session-password',
      });

      const result = await doRequest(
        '/auth/login?username=user-short-session&password=user-short-session-password',
        null,
        true
      );
      const token = JSON.parse(result.body).data;
      test.expect(token != null).to.be(true);
      await revokeToken(server, token);
      stopServer(server);
      await test.delay(4e3);
      // restart the server - there should be a timed out revocation in the db
      server = await getServer(test.commons._.merge(serverConfig, fileConfig));
      let revocationCheckedAgain = await server.services.security.cache_revoked_tokens.get(token);
      test.expect(revocationCheckedAgain).to.eql(null);
      stopServer(server);
    } finally {
      tryUnlink(filename);
    }
  });

  function tryUnlink(filename) {
    try {
      test.commons.fs.unlinkSync(filename);
      test.commons.fs.unlinkSync(
        filename.replace('token-revocations.loki', 'temp_token-revocations.loki')
      );
    } catch (_e) {
      //do nothing
    }
  }

  function upsertUser(server, user) {
    return new Promise((resolve, reject) => {
      server.services.security.users.upsertUser(user, (e, upserted) => {
        if (e) return reject(e);
        resolve(upserted);
      });
    });
  }

  function getServer(config) {
    return new Promise((resolve, reject) => {
      service.create(config, function (e, instance) {
        if (e) return reject(e);
        resolve(instance);
      });
    });
  }

  function stopServer(server) {
    return new Promise((resolve, reject) => {
      server.stop((e) => {
        if (e) return reject(e);
        resolve();
      });
    });
  }

  function getClient(config) {
    return new Promise((resolve, reject) => {
      happn.client.create(config, (e, instance) => {
        if (e) return reject(e);
        resolve(instance);
      });
    });
  }

  function revokeToken(server, token) {
    return new Promise((resolve, reject) => {
      server.services.security.revokeToken(token, 'test reason', (e) => {
        if (e) return reject(e);
        resolve();
      });
    });
  }

  function doRequest(path, body, token) {
    var options = {
      url: 'http://127.0.0.1:55000' + path,
    };

    if (!token) options.url += '?happn_token=' + token;

    return new Promise((resolve, reject) => {
      request(options, function (error, response, body) {
        if (error) return reject(error);
        resolve({
          response,
          body,
        });
      });
    });
  }
});
