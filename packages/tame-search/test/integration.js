var TameSearch = require('..');
require('happn-commons-test').describe({ timeout: 5000 }, (test) => {
  it('adds a subscription', function (done) {
    var tameSearch = new TameSearch();
    tameSearch.subscribe('testSubscriberKey', '/test/1', { test: 'data' });
    test.expect(tameSearch.subscriptionsExplicit['/test/1'][0]).to.eql({
      subscriberKey: 'testSubscriberKey',
      test: 'data',
    });
    done();
  });

  it('adds and finds a subscription', function (done) {
    var tameSearch = TameSearch.create();
    tameSearch.subscribe('testSubscriberKey', '/test/2', { test: 'data' });
    test.expect(tameSearch.search('/test/2')[0].test).to.be('data');
    done();
  });

  it('adds and finds a subscription without a leading /', function (done) {
    var tameSearch = TameSearch.create();
    tameSearch.subscribe('testSubscriberKey', 'test/2', { test: 'data' });
    test.expect(tameSearch.search('test/2')[0].test).to.be('data');
    done();
  });

  it('adds and finds and removes subscriptions without a leading /', function (done) {
    var tameSearch = TameSearch.create();
    tameSearch.subscribe('testSubscriberKey', 'test/2', { test: 'data' });
    tameSearch.subscribe('testSubscriberKey', '/test/2', { test: 'data1' });
    test.expect(tameSearch.search('test/2')).to.eql([
      { test: 'data', subscriberKey: 'testSubscriberKey' },
      { test: 'data1', subscriberKey: 'testSubscriberKey' },
    ]);
    test
      .expect(tameSearch.unsubscribe('testSubscriberKey', 'test/2', { returnRemoved: true }))
      .to.eql([
        { test: 'data', subscriberKey: 'testSubscriberKey' },
        { test: 'data1', subscriberKey: 'testSubscriberKey' },
      ]);
    done();
  });

  it('adds and finds and removes subscriptions with a leading /', function (done) {
    var tameSearch = TameSearch.create();
    tameSearch.subscribe('testSubscriberKey', 'test/2', { test: 'data' });
    tameSearch.subscribe('testSubscriberKey', '/test/2', { test: 'data1' });
    test.expect(tameSearch.search('/test/2')).to.eql([
      { test: 'data', subscriberKey: 'testSubscriberKey' },
      { test: 'data1', subscriberKey: 'testSubscriberKey' },
    ]);
    test
      .expect(tameSearch.unsubscribe('testSubscriberKey', '/test/2', { returnRemoved: true }))
      .to.eql([
        { test: 'data', subscriberKey: 'testSubscriberKey' },
        { test: 'data1', subscriberKey: 'testSubscriberKey' },
      ]);
    done();
  });

  it('adds and finds a wildcard subscription', function (done) {
    var tameSearch = new TameSearch();
    tameSearch.subscribe('testSubscriberKey', '/test/*', { test: 'data' });
    test.expect(tameSearch.search('/test/2')[0].test).to.be('data');
    done();
  });

  it('adds and does not find a subscription', function (done) {
    var tameSearch = new TameSearch();
    tameSearch.subscribe('testSubscriberKey', '/test/2', { test: 'data' });
    test.expect(tameSearch.search('/test1/2').length).to.be(0);
    done();
  });

  it('adds and does not find a wildcard subscription', function (done) {
    var tameSearch = new TameSearch();
    tameSearch.subscribe('testSubscriberKey', '/test/*', { test: 'data' });
    test.expect(tameSearch.search('/test1/2').length).to.be(0);
    done();
  });

  it('adds and finds a subscription, then removes the subscription and does not find it', function (done) {
    var tameSearch = new TameSearch();
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 1 });
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 2 });
    test.expect(tameSearch.search('/test/2')[0].ref).to.be(1);
    test.expect(tameSearch.search('/test/2').length).to.be(2);
    tameSearch.unsubscribe('testSubscriberKey', '/test/*', { filter: { ref: 1 } });
    test.expect(tameSearch.search('/test/2').length).to.be(1);
    done();
  });

  it('adds multiple and finds a subscription with a filter, then removes the subscriptions without a filter and does not find them', function (done) {
    var tameSearch = new TameSearch();
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 1 });
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 2 });
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 3 });
    test.expect(tameSearch.search('/test/2', { filter: { ref: 3 } }).length).to.be(1);
    test.expect(tameSearch.search('/test/2').length).to.be(3);
    test.expect(tameSearch.unsubscribe('testSubscriberKey', '/test/*')).to.be(3);
    test.expect(tameSearch.search('/test/2').length).to.be(0);
    done();
  });

  it('adds multiple and finds a subscription with a filter, then removes the subscriptions without a filter and does not find them, with returnRemoved:true', function (done) {
    var tameSearch = new TameSearch();
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 1 });
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 2 });
    tameSearch.subscribe('testSubscriberKey1', '/test/*', { ref: 3 });
    test.expect(tameSearch.search('/test/2', { filter: { ref: 3 } }).length).to.be(1);
    test.expect(tameSearch.search('/test/2').length).to.be(3);
    test
      .expect(tameSearch.unsubscribe('testSubscriberKey', '/test/*', { returnRemoved: true }))
      .to.eql([
        { ref: 1, subscriberKey: 'testSubscriberKey' },
        { ref: 2, subscriberKey: 'testSubscriberKey' },
      ]);
    test
      .expect(tameSearch.search('/test/2'))
      .to.eql([{ ref: 3, subscriberKey: 'testSubscriberKey1' }]);
    done();
  });

  it('adds and finds a subscription with a filter, then removes the subscription and does not find it', function (done) {
    var tameSearch = new TameSearch();
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 1 });
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 2 });
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 3 });
    test.expect(tameSearch.search('/test/2', { filter: { ref: 3 } }).length).to.be(1);
    test.expect(tameSearch.search('/test/2').length).to.be(3);
    test
      .expect(tameSearch.unsubscribe('testSubscriberKey', '/test/*', { filter: { ref: 1 } }))
      .to.be(1);
    test.expect(tameSearch.search('/test/2').length).to.be(2);
    done();
  });

  it('adds and finds a subscription with a filter, then removes the subscription and does not find it, with returnRemoved:true', function (done) {
    var tameSearch = new TameSearch();
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 1 });
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 2 });
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 3 });
    test.expect(tameSearch.search('/test/2', { filter: { ref: 3 } }).length).to.be(1);
    test.expect(tameSearch.search('/test/2').length).to.be(3);
    test
      .expect(
        tameSearch.unsubscribe('testSubscriberKey', '/test/*', {
          filter: { ref: 1 },
          returnRemoved: true,
        })
      )
      .to.eql([{ ref: 1, subscriberKey: 'testSubscriberKey' }]);
    test.expect(tameSearch.search('/test/2').length).to.be(2);
    done();
  });

  it('adds and finds a subscription with a filter, then removes the middle subscription and does not find it', function (done) {
    var tameSearch = new TameSearch();
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 1 });
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 2 });
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 3 });
    test.expect(tameSearch.search('/test/2', { filter: { ref: 3 } }).length).to.be(1);
    test.expect(tameSearch.search('/test/2').length).to.be(3);
    test
      .expect(tameSearch.unsubscribe('testSubscriberKey', '/test/*', { filter: { ref: 2 } }))
      .to.be(1);
    test.expect(tameSearch.search('/test/2').length).to.be(2);
    test.expect(tameSearch.search('/test/2')[0].ref).to.be(1);
    test.expect(tameSearch.search('/test/2')[1].ref).to.be(3);
    done();
  });

  it('tests the unsubscribeAll method', function (done) {
    var tameSearch = new TameSearch();
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 1, topLevelRef: 2 });
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 2, topLevelRef: 1 });
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 3, topLevelRef: 2 });
    tameSearch.subscribe('testSubscriberKey', '/test/*/*', { ref: 4, topLevelRef: 1 });
    test.expect(tameSearch.search('/test/2', { filter: { topLevelRef: 2 } }).length).to.be(2);
    test
      .expect(tameSearch.unsubscribeAll('testSubscriberKey', { filter: { topLevelRef: 2 } }))
      .to.be(2);
    test.expect(tameSearch.search('/test/2', { filter: { topLevelRef: 2 } }).length).to.be(0);
    test.expect(tameSearch.search('/test/2', { filter: { topLevelRef: 1 } }).length).to.be(1);
    test.expect(tameSearch.search('/test/2/1', { filter: { topLevelRef: 1 } }).length).to.be(1);
    test
      .expect(
        tameSearch.unsubscribeAll('testSubscriberKey', {
          filter: { topLevelRef: 1 },
          returnRemoved: true,
        })
      )
      .to.eql([
        { ref: 2, topLevelRef: 1, subscriberKey: 'testSubscriberKey' },
        { ref: 4, topLevelRef: 1, subscriberKey: 'testSubscriberKey' },
      ]);
    test.expect(tameSearch.search('/test/2', { filter: { topLevelRef: 1 } }).length).to.be(0);
    test.expect(tameSearch.search('/test/2/1', { filter: { topLevelRef: 1 } }).length).to.be(0);
    done();
  });

  it('tests the unsubscribeAll method 2', function (done) {
    var tameSearch = new TameSearch();
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 1, topLevelRef: 2 });
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 2, topLevelRef: 1 });
    tameSearch.subscribe('testSubscriberKey', '/test/1', { ref: 3, topLevelRef: 2 });
    tameSearch.subscribe('testSubscriberKey', '/test/*/*', { ref: 4, topLevelRef: 1 });
    test.expect(tameSearch.search('/test/2', { filter: { topLevelRef: 2 } }).length).to.be(1);
    test
      .expect(tameSearch.unsubscribeAll('testSubscriberKey', { filter: { topLevelRef: 2 } }))
      .to.be(2);
    test.expect(tameSearch.search('/test/2', { filter: { topLevelRef: 2 } }).length).to.be(0);
    test.expect(tameSearch.search('/test/2', { filter: { topLevelRef: 1 } }).length).to.be(1);
    test.expect(tameSearch.search('/test/2/1', { filter: { topLevelRef: 1 } }).length).to.be(1);
    test
      .expect(
        tameSearch.unsubscribeAll('testSubscriberKey', {
          filter: { topLevelRef: 1 },
          returnRemoved: true,
        })
      )
      .to.eql([
        { ref: 2, topLevelRef: 1, subscriberKey: 'testSubscriberKey' },
        { ref: 4, topLevelRef: 1, subscriberKey: 'testSubscriberKey' },
      ]);
    test.expect(tameSearch.search('/test/2', { filter: { topLevelRef: 1 } }).length).to.be(0);
    test.expect(tameSearch.search('/test/2/1', { filter: { topLevelRef: 1 } }).length).to.be(0);
    done();
  });

  it('tests the searchAll method', function (done) {
    var tameSearch = new TameSearch();
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 1, topLevelRef: 2 });
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 2, topLevelRef: 1 });
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 3, topLevelRef: 2 });
    tameSearch.subscribe('testSubscriberKey', '/test/*/*', { ref: 4, topLevelRef: 1 });
    tameSearch.subscribe('testSubscriberKey', '/blah/*/*', { ref: 5, topLevelRef: 1 });
    tameSearch.subscribe('testSubscriberKey', '/etc/*/*', { ref: 6, topLevelRef: 2 });
    tameSearch.subscribe('testSubscriberKey', '/etc/*/*', { ref: 7, topLevelRef: 2 });
    test.expect(tameSearch.searchAll({ filter: { topLevelRef: 2 } }).length).to.be(4);
    test.expect(tameSearch.searchAll({ filter: { topLevelRef: 1 } }).length).to.be(3);
    done();
  });

  it('tests the searchAll method 2', function (done) {
    var tameSearch = new TameSearch();
    tameSearch.subscribe('testSubscriberKey', '/test/*', { ref: 1, topLevelRef: 2 });
    tameSearch.subscribe('testSubscriberKey', '/test/1', { ref: 2, topLevelRef: 1 });
    test.expect(tameSearch.searchAll({ filter: { topLevelRef: 2 } }).length).to.be(1);
    test.expect(tameSearch.searchAll({ filter: { topLevelRef: 1 } }).length).to.be(1);
    done();
  });

  it('tests the subscribeAny method', function (done) {
    var tameSearch = new TameSearch();
    tameSearch.subscribeAny('testSubscriberKey', { ref: 1, topLevelRef: 2 });
    tameSearch.subscribeAny('testSubscriberKey', { ref: 2, topLevelRef: 1 });
    tameSearch.subscribe('testSubscriberKey', '/test/1', { ref: 3, topLevelRef: 1 });
    tameSearch.subscribe('testSubscriberKey', '/test/2', { ref: 4, topLevelRef: 2 });
    test.expect(tameSearch.search('/test/1', { filter: { topLevelRef: 1 } }).length).to.be(2);
    test.expect(tameSearch.search('/test/1').length).to.be(3);
    test.expect(tameSearch.searchAll({ filter: { topLevelRef: 1 } }).length).to.be(2);
    test.expect(tameSearch.searchAll().length).to.be(4);
    done();
  });

  it('tests the unsubscribeAny method', function (done) {
    var tameSearch = new TameSearch();
    tameSearch.subscribeAny('testSubscriberKey', { ref: 1, topLevelRef: 2 });
    tameSearch.subscribeAny('testSubscriberKey', { ref: 2, topLevelRef: 1 });
    tameSearch.subscribeAny('testSubscriberKey', { ref: 3, topLevelRef: 1 });
    tameSearch.subscribe('testSubscriberKey', '/test/1', { ref: 3, topLevelRef: 1 });
    test.expect(tameSearch.search('/test/1').length).to.be(4);
    tameSearch.unsubscribeAny('testSubscriberKey', { filter: { topLevelRef: 1 } });
    test.expect(tameSearch.search('/test/1').length).to.be(2);
    tameSearch.unsubscribeAll('testSubscriberKey', { filter: { topLevelRef: 2 } });
    test.expect(tameSearch.search('/test/1').length).to.be(1);
    tameSearch.unsubscribeAll('testSubscriberKey', { filter: { topLevelRef: 1 } });
    test.expect(tameSearch.search('/test/1').length).to.be(0);
    done();
  });

  it('test subscription validation', function (done) {
    var tameSearch = TameSearch.create();
    try {
      tameSearch.subscribe('testSubscriberKey');
    } catch (e) {
      test.expect(e.toString()).to.be('Error: topic must be a string');
    }
    try {
      tameSearch.subscribe('testSubscriberKey', 'test/path');
    } catch (e) {
      test.expect(e.toString()).to.be('Error: subscription data cannot be null');
    }
    try {
      tameSearch.subscribe('testSubscriberKey', '/test', 'some arb key');
    } catch (e) {
      test.expect(e.toString()).to.be('Error: subscription data must be an object');
    }
    done();
  });

  it('tests variable depth subscribes and unsubscribes, default depth', function () {
    var tameSearch = TameSearch.create();
    tameSearch.subscribe('testSubscriberKey', '/test/1/**', {
      test: 'data',
      subscriberKey: 'testSubscriberKey',
    });
    test
      .expect(tameSearch.search('/test/1/2/3'))
      .to.eql([{ test: 'data', subscriberKey: 'testSubscriberKey' }]);
    test
      .expect(tameSearch.search('/test/1/2/3/4'))
      .to.eql([{ test: 'data', subscriberKey: 'testSubscriberKey' }]);
    test
      .expect(tameSearch.search('/test/1/2/3/4/5'))
      .to.eql([{ test: 'data', subscriberKey: 'testSubscriberKey' }]);
    test
      .expect(tameSearch.search('/test/1/2/3/4/5/6'))
      .to.eql([{ test: 'data', subscriberKey: 'testSubscriberKey' }]);
    test.expect(tameSearch.search('/test/1')).to.eql([]);
    test.expect(tameSearch.search('/test/1/2/3/4/5/6/7')).to.eql([]);
    tameSearch.unsubscribe('testSubscriberKey', '/test/1/**');
    test.expect(tameSearch.search('/test/1/2/3')).to.eql([]);
    test.expect(tameSearch.search('/test/1/2/3/4')).to.eql([]);
    test.expect(tameSearch.search('/test/1/2/3/4/5')).to.eql([]);
    test.expect(tameSearch.search('/test/1/2/3/4/5/6')).to.eql([]);
    test.expect(tameSearch.search('/test/1')).to.eql([]);
    test.expect(tameSearch.search('/test/1/2/3/4/5/6/7')).to.eql([]);
    tameSearch.subscribe('testSubscriberKey', '/test/1/**', {
      test: 1,
      subscriberKey: 'testSubscriberKey',
    });
    tameSearch.subscribe('testSubscriberKey', '/test/1/**', {
      test: 2,
      subscriberKey: 'testSubscriberKey',
    });
    test.expect(tameSearch.search('/test/1/2/3')).to.eql([
      { test: 1, subscriberKey: 'testSubscriberKey' },
      { test: 2, subscriberKey: 'testSubscriberKey' },
    ]);
    test.expect(tameSearch.search('/test/1/2/3/4')).to.eql([
      { test: 1, subscriberKey: 'testSubscriberKey' },
      { test: 2, subscriberKey: 'testSubscriberKey' },
    ]);
    test.expect(tameSearch.search('/test/1/2/3/4/5')).to.eql([
      { test: 1, subscriberKey: 'testSubscriberKey' },
      { test: 2, subscriberKey: 'testSubscriberKey' },
    ]);
    test.expect(tameSearch.search('/test/1/2/3/4/5/6')).to.eql([
      { test: 1, subscriberKey: 'testSubscriberKey' },
      { test: 2, subscriberKey: 'testSubscriberKey' },
    ]);
    test.expect(tameSearch.search('/test/1')).to.eql([]);
    test.expect(tameSearch.search('/test/1/2/3/4/5/6/7')).to.eql([]);
    tameSearch.unsubscribe('testSubscriberKey', '/test/1/**', { filter: { test: 1 } });
    test
      .expect(tameSearch.search('/test/1/2/3'))
      .to.eql([{ test: 2, subscriberKey: 'testSubscriberKey' }]);
    test
      .expect(tameSearch.search('/test/1/2/3/4'))
      .to.eql([{ test: 2, subscriberKey: 'testSubscriberKey' }]);
    test
      .expect(tameSearch.search('/test/1/2/3/4/5'))
      .to.eql([{ test: 2, subscriberKey: 'testSubscriberKey' }]);
    test
      .expect(tameSearch.search('/test/1/2/3/4/5/6'))
      .to.eql([{ test: 2, subscriberKey: 'testSubscriberKey' }]);
    test.expect(tameSearch.search('/test/1')).to.eql([]);
    test.expect(tameSearch.search('/test/1/2/3/4/5/6/7')).to.eql([]);
  });

  it('tests variable depth subscribes and unsubscribes, specified depth', function () {
    var tameSearch = TameSearch.create();
    tameSearch.subscribe('testSubscriberKey', '/test/1/**', { test: 'data' }, { depth: 6 });
    test
      .expect(tameSearch.search('/test/1/2/3'))
      .to.eql([{ test: 'data', subscriberKey: 'testSubscriberKey' }]);
    test
      .expect(tameSearch.search('/test/1/2/3/4'))
      .to.eql([{ test: 'data', subscriberKey: 'testSubscriberKey' }]);
    test
      .expect(tameSearch.search('/test/1/2/3/4/5'))
      .to.eql([{ test: 'data', subscriberKey: 'testSubscriberKey' }]);
    test
      .expect(tameSearch.search('/test/1/2/3/4/5/6'))
      .to.eql([{ test: 'data', subscriberKey: 'testSubscriberKey' }]);
    test.expect(tameSearch.search('/test/1')).to.eql([]);
    test
      .expect(tameSearch.search('/test/1/2/3/4/5/6/7'))
      .to.eql([{ test: 'data', subscriberKey: 'testSubscriberKey' }]);
    test.expect(tameSearch.search('/test/1/2/3/4/5/6/7/8')).to.eql([]);
    tameSearch.unsubscribe('testSubscriberKey', '/test/1/**', { depth: 6 });
    test.expect(tameSearch.search('/test/1/2/3')).to.eql([]);
    test.expect(tameSearch.search('/test/1/2/3/4')).to.eql([]);
    test.expect(tameSearch.search('/test/1/2/3/4/5')).to.eql([]);
    test.expect(tameSearch.search('/test/1/2/3/4/5/6')).to.eql([]);
    test.expect(tameSearch.search('/test/1')).to.eql([]);
    test.expect(tameSearch.search('/test/1/2/3/4/5/6/7')).to.eql([]);
    tameSearch.subscribe('testSubscriberKey', '/test/1/**', { test: 1 }, { depth: 6 });
    tameSearch.subscribe('testSubscriberKey', '/test/1/**', { test: 2 }, { depth: 6 });
    test.expect(tameSearch.search('/test/1/2/3')).to.eql([
      { test: 1, subscriberKey: 'testSubscriberKey' },
      { test: 2, subscriberKey: 'testSubscriberKey' },
    ]);
    test.expect(tameSearch.search('/test/1/2/3/4')).to.eql([
      { test: 1, subscriberKey: 'testSubscriberKey' },
      { test: 2, subscriberKey: 'testSubscriberKey' },
    ]);
    test.expect(tameSearch.search('/test/1/2/3/4/5')).to.eql([
      { test: 1, subscriberKey: 'testSubscriberKey' },
      { test: 2, subscriberKey: 'testSubscriberKey' },
    ]);
    test.expect(tameSearch.search('/test/1/2/3/4/5/6')).to.eql([
      { test: 1, subscriberKey: 'testSubscriberKey' },
      { test: 2, subscriberKey: 'testSubscriberKey' },
    ]);
    test.expect(tameSearch.search('/test/1')).to.eql([]);
    test.expect(tameSearch.search('/test/1/2/3/4/5/6/7')).to.eql([
      { test: 1, subscriberKey: 'testSubscriberKey' },
      { test: 2, subscriberKey: 'testSubscriberKey' },
    ]);
    test.expect(tameSearch.search('/test/1/2/3/4/5/6/7/8')).to.eql([]);
    tameSearch.unsubscribe('testSubscriberKey', '/test/1/**', { filter: { test: 1 }, depth: 6 });
    test
      .expect(tameSearch.search('/test/1/2/3'))
      .to.eql([{ test: 2, subscriberKey: 'testSubscriberKey' }]);
    test
      .expect(tameSearch.search('/test/1/2/3/4'))
      .to.eql([{ test: 2, subscriberKey: 'testSubscriberKey' }]);
    test
      .expect(tameSearch.search('/test/1/2/3/4/5'))
      .to.eql([{ test: 2, subscriberKey: 'testSubscriberKey' }]);
    test
      .expect(tameSearch.search('/test/1/2/3/4/5/6'))
      .to.eql([{ test: 2, subscriberKey: 'testSubscriberKey' }]);
    test.expect(tameSearch.search('/test/1')).to.eql([]);
    test
      .expect(tameSearch.search('/test/1/2/3/4/5/6/7'))
      .to.eql([{ test: 2, subscriberKey: 'testSubscriberKey' }]);
  });

  it('tests variable depth subscribes and unsubscribes, specified default depth', function () {
    var tameSearch = TameSearch.create({ defaultVariableDepth: 6 });
    tameSearch.subscribe('testSubscriberKey', '/test/1/**', { test: 'data' });
    test
      .expect(tameSearch.search('/test/1/2/3'))
      .to.eql([{ test: 'data', subscriberKey: 'testSubscriberKey' }]);
    test
      .expect(tameSearch.search('/test/1/2/3/4'))
      .to.eql([{ test: 'data', subscriberKey: 'testSubscriberKey' }]);
    test
      .expect(tameSearch.search('/test/1/2/3/4/5'))
      .to.eql([{ test: 'data', subscriberKey: 'testSubscriberKey' }]);
    test
      .expect(tameSearch.search('/test/1/2/3/4/5/6'))
      .to.eql([{ test: 'data', subscriberKey: 'testSubscriberKey' }]);
    test.expect(tameSearch.search('/test/1')).to.eql([]);
    test
      .expect(tameSearch.search('/test/1/2/3/4/5/6/7'))
      .to.eql([{ test: 'data', subscriberKey: 'testSubscriberKey' }]);
    test.expect(tameSearch.search('/test/1/2/3/4/5/6/7/8')).to.eql([]);
    tameSearch.unsubscribe('testSubscriberKey', '/test/1/**');
    test.expect(tameSearch.search('/test/1/2/3')).to.eql([]);
    test.expect(tameSearch.search('/test/1/2/3/4')).to.eql([]);
    test.expect(tameSearch.search('/test/1/2/3/4/5')).to.eql([]);
    test.expect(tameSearch.search('/test/1/2/3/4/5/6')).to.eql([]);
    test.expect(tameSearch.search('/test/1')).to.eql([]);
    test.expect(tameSearch.search('/test/1/2/3/4/5/6/7')).to.eql([]);
    tameSearch.subscribe('testSubscriberKey', '/test/1/**', { test: 1 });
    tameSearch.subscribe('testSubscriberKey', '/test/1/**', { test: 2 });
    test.expect(tameSearch.search('/test/1/2/3')).to.eql([
      { test: 1, subscriberKey: 'testSubscriberKey' },
      { test: 2, subscriberKey: 'testSubscriberKey' },
    ]);
    test.expect(tameSearch.search('/test/1/2/3/4')).to.eql([
      { test: 1, subscriberKey: 'testSubscriberKey' },
      { test: 2, subscriberKey: 'testSubscriberKey' },
    ]);
    test.expect(tameSearch.search('/test/1/2/3/4/5')).to.eql([
      { test: 1, subscriberKey: 'testSubscriberKey' },
      { test: 2, subscriberKey: 'testSubscriberKey' },
    ]);
    test.expect(tameSearch.search('/test/1/2/3/4/5/6')).to.eql([
      { test: 1, subscriberKey: 'testSubscriberKey' },
      { test: 2, subscriberKey: 'testSubscriberKey' },
    ]);
    test.expect(tameSearch.search('/test/1')).to.eql([]);
    test.expect(tameSearch.search('/test/1/2/3/4/5/6/7')).to.eql([
      { test: 1, subscriberKey: 'testSubscriberKey' },
      { test: 2, subscriberKey: 'testSubscriberKey' },
    ]);
    test.expect(tameSearch.search('/test/1/2/3/4/5/6/7/8')).to.eql([]);
    tameSearch.unsubscribe('testSubscriberKey', '/test/1/**', { filter: { test: 1 } });
    test
      .expect(tameSearch.search('/test/1/2/3'))
      .to.eql([{ test: 2, subscriberKey: 'testSubscriberKey' }]);
    test
      .expect(tameSearch.search('/test/1/2/3/4'))
      .to.eql([{ test: 2, subscriberKey: 'testSubscriberKey' }]);
    test
      .expect(tameSearch.search('/test/1/2/3/4/5'))
      .to.eql([{ test: 2, subscriberKey: 'testSubscriberKey' }]);
    test
      .expect(tameSearch.search('/test/1/2/3/4/5/6'))
      .to.eql([{ test: 2, subscriberKey: 'testSubscriberKey' }]);
    test.expect(tameSearch.search('/test/1')).to.eql([]);
    test
      .expect(tameSearch.search('/test/1/2/3/4/5/6/7'))
      .to.eql([{ test: 2, subscriberKey: 'testSubscriberKey' }]);
  });

  it('tests undefined unsubscribe', function () {
    var tameSearch = TameSearch.create({ defaultVariableDepth: 6 });
    tameSearch.subscribe('testSubscriberKey', '/test/1/**', { test: 'data' });
    tameSearch.unsubscribe('testSubscriberKey', '/test/1/**', { filter: { test: undefined } });
  });
});
