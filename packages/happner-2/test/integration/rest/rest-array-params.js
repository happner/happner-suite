require('../../__fixtures/utils/test_helper').describe({ timeout: 120e3, only: true }, (test) => {
  test.createServersBefore({
    secure: true,
    modules: {
      test: {
        instance: {
          remoteMethod: async (arg1, arg2, arg3, arg4) => {
            return `and a ${[arg1, arg2, arg3, arg4].join(', a ')}...and...`;
          },
          // eslint-disable-next-line no-unused-vars
          remoteMethodHappnOrigin: async ($happn, arg1, arg2, arg3, arg4, $origin) => {
            return `and a ${[arg1, arg2, arg3, arg4].join(', a ')}...and...`;
          },
          // eslint-disable-next-line no-unused-vars
          remoteMethodHappnOriginInterleaved: async (arg1, $happn, arg2, arg3, $origin, arg4) => {
            return `and a ${[arg1, arg2, arg3, arg4].join(', a ')}...and...`;
          },
        },
      },
    },
    components: {
      test: {},
    },
  });
  test.createHappnerSessionBefore('_ADMIN', 'happn');
  it('is able to do a rest based request using an array of arguments', async () => {
    test
      .expect(
        await test.httpPost(
          `http://127.0.0.1:55000/rest/method/test/remoteMethod?happn_token=${test.sessions[0].token}`,
          ['one', 'two', 'three', 'four']
        )
      )
      .to.be('and a one, a two, a three, a four...and...');
    test
      .expect(
        await test.httpPost(
          `http://127.0.0.1:55000/rest/method/test/remoteMethodHappnOrigin?happn_token=${test.sessions[0].token}`,
          ['one', 'two', 'three', 'four']
        )
      )
      .to.be('and a one, a two, a three, a four...and...');
    test
      .expect(
        await test.httpPost(
          `http://127.0.0.1:55000/rest/method/test/remoteMethodHappnOriginInterleaved?happn_token=${test.sessions[0].token}`,
          ['one', 'two', 'three', 'four']
        )
      )
      .to.be('and a one, a two, a three, a four...and...');
  });
  test.destroySessionsAfter();
  test.destroyServersAfter();
});
