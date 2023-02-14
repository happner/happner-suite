const { Op } = require('sequelize');

const testOpList = new Map([
  ['$eq', Op.eq],
  ['$lt', Op.lt],
  ['$gt', Op.gt],
  ['$lte', Op.lte],
  ['$gte', Op.gte],
  ['$eq', Op.eq],
  ['$in', Op.in],
  ['$nin', Op.notIn],
  ['$ne', Op.ne],
  ['$like', Op.like],
  ['$and', Op.and],
  ['$or', Op.or],
]);

require('happn-commons-test').describe({ timeout: 120e3 }, (test) => {
  const SqlizeQueryBuilder = require('../../lib/sqlize-query-builder');
  it('can transform nested ands and ors', () => {
    // breaking
    const testMongoQuery = {
      $or: [
        {
          logType: 'EDD_SIG',
        },
        {
          $and: [
            {
              logType: 'UNIT_UPDATE',
            },
            {
              eventName: {
                $nin: ['ledState', 'programmed', 'detonatorError'],
              },
            },
          ],
        },
      ],
    };
    const transformed = SqlizeQueryBuilder.build('.', testMongoQuery);
    test.expect(transformed).to.eql({
      [testOpList.get('$or')]: [
        {
          logType: 'EDD_SIG',
        },
        {
          [testOpList.get('$and')]: [
            {
              logType: 'UNIT_UPDATE',
            },
            {
              eventName: {
                [testOpList.get('$nin')]: ['ledState', 'programmed', 'detonatorError'],
              },
            },
          ],
        },
      ],
    });
  });
});
