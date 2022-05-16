/* eslint-disable no-console */
describe('browsertest_01_happner_client', function () {
  this.timeout(100e3);

  it('connects and disonnects 10 clients', async () => {
    let users = Array.from(Array(10).keys()).map((int) => ({
      username: 'user' + int.toString(),
      password: 'pass',
    }));
    let clients = [];
    for (let user of users) {
      let client = new Happner.HappnerClient();
      await client.connect(null, user);
      clients.push(client);
    }
    await delay(3000);
    for (let client of clients) {
      await client.disconnect({ reconnect: false });
    }
    await delay(3000);
  });

  function delay(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
});
/* eslint-enable no-console */
