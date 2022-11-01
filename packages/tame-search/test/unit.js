var expect = require('expect.js');
var TameSearch = require('..');

describe('tame-search unit', function () {

  it('tests initialization, undefined options', function (done) {
    var tameSearch = new TameSearch();
    expect(tameSearch.options.searchCache).to.be(5000);
    expect(tameSearch.options.permutationCache).to.be(5000);
    done();
  });

  it('tests initialization, defined options', function (done) {
    var tameSearch = new TameSearch({searchCache: 10000, permutationCache: 10000});
    expect(tameSearch.options.searchCache).to.be(10000);
    expect(tameSearch.options.permutationCache).to.be(10000);
    done();
  });

  it('tests initialization, mixed options', function (done) {
    var tameSearch = new TameSearch({searchCache: 10000});
    expect(tameSearch.options.searchCache).to.be(10000);
    expect(tameSearch.options.permutationCache).to.be(5000);
    done();
  });

  it('initializes the caches', function (done) {
    var tameSearch = new TameSearch({searchCache: 10000});
    expect(tameSearch.cache.search.max).to.be(10000);
    expect(tameSearch.cache.permutation.max).to.be(5000);
    done();
  });

  it('tests getting wildcard combinations', function(done){
    var tameSearch = new TameSearch({permutationCache: 1000});
    expect(tameSearch.getWildcardCombinations(['my','test','path','1'], '/my/test/path/1')).to.eql([]);
    tameSearch.subscribe('test-subscriber', '/my/test/path/*', {test:1});
    expect(tameSearch.getWildcardCombinations(['my','test','path','1'], '/my/test/path/1')).to.eql([
      '/my/test/path/*']);
    tameSearch.subscribe('test-subscriber', '/*/test/path/1', {test:1});
    expect(tameSearch.getWildcardCombinations(['my','test','path','1'], '/my/test/path/1')).to.eql([
      '/*/test/path/1',
      '/my/test/path/*']);
    tameSearch.unsubscribe('test-subscriber', '/*/test/path/1');
    expect(tameSearch.getWildcardCombinations(['my','test','path','1'], '/my/test/path/1')).to.eql(['/my/test/path/*']);
    done();
  });

  it('ensures the meta indexes are being pruned and updated as necessary', function(done){
    var tameSearch = new TameSearch({permutationCache: 1000});
    tameSearch.subscribe('test-subscriber', '/my/test/path/*', {test:1});
    tameSearch.subscribe('test-subscriber', '/my/test/path/*', {test:2});
    expect(tameSearch.subscriptionsMeta[4]['0001']).to.be(2);
    tameSearch.unsubscribe('test-subscriber', '/my/test/path/*', {filter:{test:1}});
    expect(tameSearch.subscriptionsMeta[4]['0001']).to.be(1);
    tameSearch.unsubscribe('test-subscriber', '/my/test/path/*', {filter:{test:2}});
    expect(tameSearch.subscriptionsMeta[4]).to.be(undefined);
    done();
  });

  it('tests the getAllTopics function', function(done){
    var tameSearch = new TameSearch({permutationCache: 1000});
    tameSearch.subscribe('test-subscriber', '/my/test/path/*', {test:1});
    tameSearch.subscribe('test-subscriber', '/my/test/path/*', {test:2});
    tameSearch.subscribe('test-subscriber', '/my/test/*/*', {test:3});
    expect(tameSearch.getAllTopics().sort()).to.eql(['/my/test/*/*', '/my/test/path/*']);
    done();
  });

  it('tests the search getSubscriptionsByTopic update function', function(done){
    var tameSearch = new TameSearch({permutationCache: 1000});
    tameSearch.subscribe('test-subscriber', '/my/test/path/*', {test:1, custom:0});
    tameSearch.subscribe('test-subscriber', '/my/test/path/*', {test:2, custom:0});
    tameSearch.subscribe('test-subscriber', '/my/test/path/*', {test:3, custom:0});
    expect(tameSearch.getSubscriptionsByTopic('/my/test/path/*', {filter:{test:1}})).to.eql([{test:1, custom:0, subscriberKey: 'test-subscriber'}]);
    done();
  });

  it('tests the search subscriptions we are able to update some data', function(done){
    var tameSearch = new TameSearch({permutationCache: 1000});
    tameSearch.subscribe('test-subscriber', '/my/test/path/*', {test:1, custom:0});
    tameSearch.subscribe('test-subscriber', '/my/test/path/*', {test:2, custom:0});
    tameSearch.subscribe('test-subscriber', '/my/test/path/*', {test:3, custom:0});
    var subscription = tameSearch.getSubscriptionsByTopic('/my/test/path/*', {filter:{test:1}})[0];
    subscription.custom++;
    subscription.custom++;
    var modified = tameSearch.getSubscriptionsByTopic('/my/test/path/*', {filter:{test:1}})[0];
    expect(modified.custom).to.be(2);
    done();
  });
});
