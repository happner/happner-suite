var happn = require('../../../lib/index');
const { expect } = require('chai');

const name = 'test-name';

describe('OS-assigned port', function () {
  let happnInstance;
  let client;

  before('listens on OS-assigned port', async () => {
    happnInstance = await happn.service.create({ port: 0, name });
  });
  before('client connects on OS-assigned port', async () => {
    const port = happnInstance.services.happn.__info.port;
    client = await happn.client.create({ port });
  });

  after('stop client', () => client.disconnect());
  after('stop server', () => happnInstance.stop());

  it('listens/connects on self-assigned port', async function () {
    expect(client.serverInfo.name).eql(name);
  });
});
