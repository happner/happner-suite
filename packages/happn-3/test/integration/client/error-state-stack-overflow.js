require('../../__fixtures/utils/test_helper').describe({ timeout: 40e3 }, (test) => {
  test.createInstanceBefore({
    secure: true,
  });

  test.createAdminWSSessionBefore();

  it('gets the client into an error state, we can reconnect without issue', async () => {
    const waitForReconnect = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('timed out'));
      }, 5e3);
      test.sessions[0].onEvent('reconnect-successful', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
    test.sessions[0].handle_error(new Error('test error'));
    await waitForReconnect;
  });

  it('disconnects the server - lets the client go through a few reconnect cycles', async () => {
    test.expect(await subscribeAndSet()).to.be('ok');
    test.destroyAllInstances();
    await test.delay(5e3);
    test.expect(await subscribeAndSet()).to.not.be('ok');
    test.expect(await subscribeAndSet()).to.not.be('ok');
    test.expect(await subscribeAndSet()).to.not.be('ok');
    await test.delay(5e3);
    test.createInstance({ secure: true });
    await test.delay(10e3);
    test.expect(await subscribeAndSet()).to.be('ok');
  });

  function subscribeAndSet() {
    return new Promise((resolve) => {
      test.sessions[0].once(
        '/test/*',
        (data) => {
          resolve(data.response);
        },
        (e) => {
          if (e) return resolve(e.message);
          test.sessions[0].publish('/test/1', { response: 'ok' }, (e) => {
            if (e) return resolve(e.message);
          });
        }
      );
    });
  }

  test.destroyAllSessionsAfter();
  test.destroyAllInstancesAfter();
});
