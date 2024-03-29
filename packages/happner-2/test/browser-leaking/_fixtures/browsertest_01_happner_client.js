/* eslint-disable no-console */

describe('browsertest_01_happner_client', function () {
  this.timeout(100e3);

  it('connects and disconnects clients', async () => {
    let users = Array.from(Array(3).keys()).map((int) => ({
      username: 'user' + int.toString(),
      password: 'pass',
    }));
    let clients = [];
    for (let user of users) {
      /* eslint-disable-next-line no-undef */
      let client = new Happner.HappnerClient();
      await client.connect(null, user);
      clients.push(client);
    }
    await delay(35000);
  });

  function delay(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
});
/* eslint-enable no-console */
