require('../../__fixtures/utils/test_helper').describe({ timeout: 20000 }, (test) => {
  const happn = require('../../../lib/index');
  let instance;

  before('creates test instance', async () => {
    instance = await happn.service.create({ sercure: true });
  });

  after(async () => {
    await instance.stop();
  });

  it('test adding users without null, undedfined or problematic username username', async () => {
    try {
      let testUser = {
        password: 'TEST PWD',
      };

      await instance.services.security.users.upsertUser(testUser, { overwrite: true });
    } catch (e) {
      test.expect(e.toString()).to.eql('Error: username is null or undefined');
    }
    for (let emptyUsername of [undefined, null, '', 4]) {
      //_.isEmpty sees 4 as empty (?)
      let testUser = {
        username: emptyUsername,
        password: 'TEST PWD',
      };
      try {
        await instance.services.security.users.upsertUser(testUser, { overwrite: true });
      } catch (e) {
        test.expect(e.toString()).to.eql('Error: username is null or undefined');
      }
    }
    for (let invalidUsername of ['      ', { some: 'object' }, ['a', 'list']]) {
      let testUser = {
        username: invalidUsername, //long empty string
        password: 'TEST PWD',
        custom_data: {
          something: 'useful',
        },
      };
      try {
        await instance.services.security.users.upsertUser(testUser, { overwrite: true });
      } catch (e) {
        test.expect(e.toString()).to.eql('Error: username must be a non-empty string');
      }
    }
    //Check that instanfce is still working by adding and fetching a user
    let testUser = {
      username: 'AFTER_INVALID',
      password: 'TEST PWD',
    };
    await instance.services.security.users.upsertUser(testUser, { overwrite: true });
    let fetchedUser = await instance.services.security.users.getUser(testUser.username);
    test.expect(fetchedUser.username).to.be(testUser.username);
    test.expect(typeof fetchedUser.userid).to.be('string');
  });
});
