const helper = require('../../lib/base-test-helper').create();
const test = helper;
describe(helper.testName(), function () {
  it('can do an arbitrary filter', () => {
    let array = [{ value: 0 }, { value: 1 }, { value: 2, parent: { child: 1 } }];
    let mongoFilter = helper.commons.mongoFilter;
    let [sifted, sifted1, sifted2] = [
      mongoFilter({ value: { $gt: 0, $lt: 2 } }, array),
      mongoFilter({ 'parent.child': { $eq: 1 } }, array),
      mongoFilter({ parent: { child: 1 } }, array),
    ];
    test.expect(sifted).to.eql([{ value: 1 }]);
    test.expect(sifted1).to.eql(sifted2);
  });

  it('can do a profile based filter', () => {
    const schema = {
      $and: [{ 'user.username': { $eq: '_ADMIN' }, 'info.tokenNotAllowedForLogin': { $eq: true } }],
    };
    let profile = [
      {
        id: '88c086c0-529e-45a4-b034-e84c3c345be9',
        info: { _browser: false, _local: false },
        type: 0,
        user: {
          username: '_ADMIN',
          userid: 'c7c40393-df0b-4994-9faa-954ad640bce0',
          permissions: {},
          groups: { _ADMIN: { data: {} }, _MESH_ADM: { data: {} } },
        },
        timestamp: 1645776075865,
        parentId: '88c086c0-529e-45a4-b034-e84c3c345be9',
        origin: 'ribbonstinger_3ShEWgR1TDedx5VKN3o25w-0',
        policy: { 0: null, 1: null },
      },
    ];
    helper.expect(helper.commons.mongoFilter(schema, profile)).to.eql([]);

    profile = [
      {
        id: '88c086c0-529e-45a4-b034-e84c3c345be9',
        info: { _browser: false, _local: false, tokenNotAllowedForLogin: true },
        type: 0,
        user: {
          username: '_ADMIN',
          userid: 'c7c40393-df0b-4994-9faa-954ad640bce0',
          permissions: {},
          groups: { _ADMIN: { data: {} }, _MESH_ADM: { data: {} } },
        },
        timestamp: 1645776075865,
        parentId: '88c086c0-529e-45a4-b034-e84c3c345be9',
        origin: 'ribbonstinger_3ShEWgR1TDedx5VKN3o25w-0',
        policy: { 0: null, 1: null },
      },
    ];
    helper.expect(helper.commons.mongoFilter(schema, profile)).to.eql(profile);

    const nestedSchema = {
      $and: [
        {
          user: {
            username: '_ADMIN',
          },
          'info.tokenNotAllowedForLogin': { $eq: true },
        },
      ],
    };
    helper.expect(helper.commons.mongoFilter(nestedSchema, profile)).to.eql(profile);
    helper
      .expect(
        helper.commons.mongoFilter(
          {
            $and: [
              {
                user: {
                  username: { $eq: '_ADMIN' },
                },
                'info.tokenNotAllowedForLogin': { $eq: true },
              },
            ],
          },
          profile
        )
      )
      .to.eql(profile);

    helper
      .expect(
        helper.commons.mongoFilter(
          {
            $and: [
              {
                user: {
                  username: { $eq: 'nonexisting' },
                },
                'info.tokenNotAllowedForLogin': { $eq: true },
              },
            ],
          },
          profile
        )
      )
      .to.eql([]);
  });
});
