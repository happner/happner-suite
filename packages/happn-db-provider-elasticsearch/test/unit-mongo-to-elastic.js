const MongoToElastic = require('../lib/mongo-to-elastic');
require('./fixtures/test-helper').describe({ timeout: 5e3 }, function(test) {

  it('ensures that spaces in the query path are correctly escaped', () => {
    test
      .expect(
        MongoToElastic.convertCriteria({
          path: '/TEST/PATH/TEST LEAF/*'
        })
      )
      .to.eql('( path:/\\/TEST\\/PATH\\/TEST LEAF\\/.*/ ) ');
    test
      .expect(
        MongoToElastic.convertCriteria({
          path: '/TEST/PATH/TEST LEAF/1/2/3'
        })
      )
      .to.eql('( path:"/TEST/PATH/TEST LEAF/1/2/3" ) ');
    test
      .expect(
        MongoToElastic.convertCriteria({
          path: '/TEST/PATH/TEST LEAF/*',
          $and: [{ test: { $lte: 1 } }, { test: { $gte: 0 } }]
        })
      )
      .to.eql(
        '( path:/\\/TEST\\/PATH\\/TEST LEAF\\/.*/ )  AND ( ( ( ( test:<=1 )  )  AND ( ( test:>=0 )  )  ) ) '
      );
    test
      .expect(
        MongoToElastic.convertCriteria({
          path: '/TEST/PATH/TEST LEAF/1/2/3',
          $and: [{ test: { $lte: 1 } }, { test: { $gte: 0 } }]
        })
      )
      .to.eql(
        '( path:"/TEST/PATH/TEST LEAF/1/2/3" )  AND ( ( ( ( test:<=1 )  )  AND ( ( test:>=0 )  )  ) ) '
      );
  });
});
