const test = require('../../__fixtures/utils/test_helper').create();
describe(test.testName(__filename, 3), function () {
  it('tests various regex matches', function () {
    let responseKey =
      '1549e063-ecdc-4463-8e2b-19915512668f:/_exchange/responses/meshname/component/method1/6792e00e-5ca8-4035-93a2-b91dc92ac40e/367687678:set';
    let responseRegex =
      /^(?<keyMask>[a-zA-Z0-9-]+:\/_exchange\/responses\/[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+)\/[0-9]+:set$/;
    test
      .expect(responseKey.match(responseRegex).groups.keyMask)
      .to.be(
        '1549e063-ecdc-4463-8e2b-19915512668f:/_exchange/responses/meshname/component/method1/6792e00e-5ca8-4035-93a2-b91dc92ac40e'
      );
  });
  it('tests various regex matches', function () {
    let responseKey =
      '772ad802-f2d3-4b07-8252-7ad7d4ae61f5:/_exchange/responses/meshname/component/method1/5d27417a-13f0-4890-8c5f-c5a3501da5dc/0:set';
    let responseRegex =
      /^(?<keyMask>[a-zA-Z0-9-]+:\/_exchange\/responses\/[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+)\/[0-9]+:set$/;
    test
      .expect(responseKey.match(responseRegex).groups.keyMask)
      .to.be(
        '772ad802-f2d3-4b07-8252-7ad7d4ae61f5:/_exchange/responses/meshname/component/method1/5d27417a-13f0-4890-8c5f-c5a3501da5dc'
      );
  });
});
