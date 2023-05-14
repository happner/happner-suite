const test = require('../__fixtures/test-helper').create();
var HappnerClient = require('../..');

describe(test.name(__filename, 3), function () {
  var mockClusterComponent;
  var subscriptions;

  beforeEach(function () {
    subscriptions = {};
    mockClusterComponent = {
      happnService: {
        localClient: {
          get: test.sinon.stub(),
        },
      },
      peers: [],
      on: test.sinon.stub().callsFake((path) => {
        if (subscriptions[path]) return subscriptions[path]++;
        subscriptions[path] = 1;
      }),
    };
  });

  it('subscribes to peer add and remove', function (done) {
    var c = new HappnerClient();

    c.mount(mockClusterComponent);
    test.expect(subscriptions).to.eql({
      'peer/add': 1,
      'peer/remove': 1,
    });
    c.__operations.stop();
    c.__implementors.stop();
    done();
  });
});
