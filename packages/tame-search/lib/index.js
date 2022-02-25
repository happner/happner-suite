module.exports = TameSearch;
const commons = require('happn-commons');
const LRU = commons.lruCache;
const mongoFilter = commons.mongoFilter;
const clone = commons.fastClone;

TameSearch.prototype.subscribe = subscribe;
TameSearch.prototype.unsubscribe = unsubscribe;
TameSearch.prototype.subscribeAny = subscribeAny;
TameSearch.prototype.unsubscribeAll = unsubscribeAll;
TameSearch.prototype.unsubscribeAny = unsubscribeAny;

TameSearch.prototype.search = search;

TameSearch.prototype.defaults = defaults;
TameSearch.prototype.__initializeCaches = __initializeCaches;

TameSearch.prototype.incrementMeta = incrementMeta;
TameSearch.prototype.decrementMeta = decrementMeta;

TameSearch.prototype.getBinaryMask = getBinaryMask;
TameSearch.prototype.getWildcardCombinations = getWildcardCombinations;

TameSearch.prototype.getAllTopics = getAllTopics;
TameSearch.prototype.validateTopic = validateTopic;

TameSearch.prototype.searchAll = searchAll;

TameSearch.prototype.searchExplicit = searchExplicit;
TameSearch.prototype.subscribeExplicit = subscribeExplicit;
TameSearch.prototype.unsubscribeExplicit = unsubscribeExplicit;

TameSearch.prototype.getSubscriptionsByTopic = getSubscriptionsByTopic;

TameSearch.prototype.subscribeVariableDepth = subscribeVariableDepth;
TameSearch.prototype.unsubscribeVariableDepth = unsubscribeVariableDepth;
TameSearch.prototype.__getVariableDepthPermutationPaths = __getVariableDepthPermutationPaths;

TameSearch.prototype.updateSubscriberMeta = updateSubscriberMeta;
TameSearch.prototype.deleteSubscriberMeta = deleteSubscriberMeta;

function TameSearch(options) {
  Object.defineProperty(this, 'options', {
    value: this.defaults(options),
  });
  Object.defineProperty(this, 'subscriptions', {
    value: {},
  });
  Object.defineProperty(this, 'subscriptionsAny', {
    value: [],
  });
  Object.defineProperty(this, 'subscriptionsExplicit', {
    value: {},
  });
  Object.defineProperty(this, 'subscriptionsMeta', {
    value: {},
  });
  Object.defineProperty(this, 'subscriberMeta', {
    value: {},
  });

  this.__initializeCaches();
}

TameSearch.create = function (options) {
  return new TameSearch(options);
};

function __initializeCaches() {
  var cache = {
    search: new LRU({
      max: this.options.searchCache,
    }),
    permutation: new LRU({
      max: this.options.permutationCache,
    }),
  };

  Object.defineProperty(this, 'cache', {
    value: cache,
  });
  Object.defineProperty(this, 'binaryCombinationsCache', {
    value: {},
  });
}

function getAllTopics(subscriberKey) {
  if (subscriberKey) {
    if (!this.subscriberMeta[subscriberKey]) return [];
    return Object.keys(this.subscriberMeta[subscriberKey]).filter((topic) => {
      return topic !== '__totalSubscriptions';
    });
  }
  const allTopics = [];
  Object.keys(this.subscriptions).forEach((segmentCount) => {
    const segmentTopics = Object.keys(this.subscriptions[segmentCount]);
    segmentTopics.forEach((segmentTopic) => allTopics.push(segmentTopic));
  });
  return allTopics.concat(Object.keys(this.subscriptionsExplicit));
}

function validateTopic(topic) {
  if (typeof topic !== 'string') throw new Error('topic must be a string');
  if (topic[0] !== '/') topic = '/' + topic;
  return topic.toString();
}

function unsubscribeAll(subscriberKey, options) {
  const filter = options
    ? options.filter
      ? { subscriberKey, ...options.filter }
      : { subscriberKey }
    : { subscriberKey };
  var unsubscribeResults = this.getAllTopics(subscriberKey)
    .reduce((reduceTo, topic) => {
      return reduceTo.concat(
        this.unsubscribe(subscriberKey, topic, { filter, returnRemoved: true })
      );
    }, [])
    //remove duplicates
    .reduce(function (reduceTo, subscription) {
      if (reduceTo.indexOf(subscription) === -1) reduceTo.push(subscription);
      return reduceTo;
    }, [])
    .concat(this.unsubscribeAny(subscriberKey, { filter, returnRemoved: true }));

  return options && options.returnRemoved ? unsubscribeResults : unsubscribeResults.length;
}

function unsubscribeVariableDepth(subscriberKey, topic, options) {
  const depth =
    options && Number.isInteger(options.depth) ? options.depth : this.options.defaultVariableDepth;
  this.__getVariableDepthPermutationPaths(topic, depth).forEach((permutation) => {
    this.unsubscribe(subscriberKey, permutation, options);
  });
}

function unsubscribe(subscriberKey, topic, options) {
  if (subscriberKey == null) throw new Error('subscriberKey cannot be null');
  topic = validateTopic(topic);
  options = options || {};
  if (topic.indexOf('*') === -1) return this.unsubscribeExplicit(subscriberKey, topic, options);
  if (topic.substring(topic.length - 3) === '/**')
    return this.unsubscribeVariableDepth(subscriberKey, topic, options);

  const segments = topic.split('/').slice(1);
  if (!this.subscriptions[segments.length]) return 0;
  if (!this.subscriptions[segments.length][topic]) return 0;

  this.cache.search.clear();
  this.cache.permutation.clear();

  const subscriptions = this.subscriptions[segments.length][topic];
  const filter = options
    ? options.filter
      ? { subscriberKey, ...options.filter }
      : { subscriberKey }
    : { subscriberKey };
  const filtered = mongoFilter(filter, subscriptions);
  if (filtered.length === 0) return options.returnRemoved ? [] : 0;
  filtered.forEach((subscription) => {
    subscriptions.splice(subscriptions.indexOf(subscription), 1);
    this.deleteSubscriberMeta(subscriberKey, topic);
  });

  if (subscriptions.length === 0) delete this.subscriptions[segments.length][topic];

  this.decrementMeta(segments);
  return options.returnRemoved ? filtered : filtered.length;
}

function decrementMeta(segments) {
  if (!this.subscriptionsMeta[segments.length]) return;
  var binaryMask = this.getBinaryMask(segments);
  if (!this.subscriptionsMeta[segments.length][binaryMask]) return;
  this.subscriptionsMeta[segments.length][binaryMask] -= 1;
  if (this.subscriptionsMeta[segments.length][binaryMask] === 0)
    delete this.subscriptionsMeta[segments.length][binaryMask];
  if (Object.keys(this.subscriptionsMeta[segments.length]).length === 0)
    delete this.subscriptionsMeta[segments.length];
}

function getBinaryMask(segments) {
  var mask = '';
  for (var i = 0; i < segments.length; i++) mask += segments[i] === '*' ? 1 : 0;
  return mask;
}

function incrementMeta(segments) {
  if (!this.subscriptionsMeta[segments.length]) this.subscriptionsMeta[segments.length] = {};
  const binaryMask = this.getBinaryMask(segments);
  if (!this.subscriptionsMeta[segments.length][binaryMask]) {
    this.subscriptionsMeta[segments.length][binaryMask] = 1;
    return;
  }
  this.subscriptionsMeta[segments.length][binaryMask] += 1;
}

function subscribeExplicit(subscriberKey, topic, data) {
  if (this.subscriptionsExplicit[topic] == null) this.subscriptionsExplicit[topic] = [];
  this.subscriptionsExplicit[topic].push({ subscriberKey, ...data });
  this.updateSubscriberMeta(subscriberKey, topic);
}

function unsubscribeExplicit(subscriberKey, topic, options) {
  const explicitSubscriptions = this.subscriptionsExplicit[topic];
  if (explicitSubscriptions == null) return [];
  const filter = options
    ? options.filter
      ? { subscriberKey, ...options.filter }
      : { subscriberKey }
    : { subscriberKey };
  var filtered = mongoFilter(filter, explicitSubscriptions);
  filtered.forEach((subscription) => {
    explicitSubscriptions.splice(explicitSubscriptions.indexOf(subscription), 1);
    this.deleteSubscriberMeta(subscriberKey, topic);
  });
  if (explicitSubscriptions.length === 0) delete this.subscriptionsExplicit[topic];
  return options.returnRemoved ? filtered : filtered.length;
}

function __getVariableDepthPermutationPaths(path, depth) {
  var permutations = [];
  for (var i = 0; i <= depth; i++) {
    var permutationArray = [];
    if (i === 0) continue;
    for (var ii = 0; ii < i; ii++) permutationArray.push('*');
    permutations.push(path.replace('/**', '/' + permutationArray.join('/')));
  }
  return permutations;
}

function subscribeVariableDepth(subscriberKey, topic, data, options) {
  const depth =
    options && Number.isInteger(options.depth) ? options.depth : this.options.defaultVariableDepth;
  this.__getVariableDepthPermutationPaths(topic, depth).forEach((permutation) => {
    this.subscribe(subscriberKey, permutation, data, options);
  });
}

function updateSubscriberMeta(subscriberKey, topic) {
  if (!this.subscriberMeta[subscriberKey])
    this.subscriberMeta[subscriberKey] = { [topic]: 0, __totalSubscriptions: 0 };
  if (!this.subscriberMeta[subscriberKey][topic]) this.subscriberMeta[subscriberKey][topic] = 0;
  this.subscriberMeta[subscriberKey][topic]++;
  this.subscriberMeta[subscriberKey].__totalSubscriptions++;
}

function deleteSubscriberMeta(subscriberKey, topic) {
  if (!this.subscriberMeta[subscriberKey][topic]) return;
  this.subscriberMeta[subscriberKey][topic]--;
  if (this.subscriberMeta[subscriberKey][topic] === 0)
    delete this.subscriberMeta[subscriberKey][topic];
  this.subscriberMeta[subscriberKey].__totalSubscriptions--;
  if (this.subscriberMeta[subscriberKey].__totalSubscriptions === 0)
    delete this.subscriberMeta[subscriberKey];
}

function subscribe(subscriberKey, topic, data, options) {
  if (subscriberKey == null) throw new Error('subscriberKey cannot be null');
  topic = validateTopic(topic);
  if (data == null) throw new Error('subscription data cannot be null');
  if (data !== Object(data)) throw new Error('subscription data must be an object');
  if (topic.indexOf('*') === -1) return this.subscribeExplicit(subscriberKey, topic, data, options);
  if (topic.substring(topic.length - 3) === '/**')
    return this.subscribeVariableDepth(subscriberKey, topic, data, options);

  this.cache.search.clear();
  this.cache.permutation.clear();

  const segments = topic.split('/').slice(1);
  if (!this.subscriptions[segments.length]) this.subscriptions[segments.length] = {};
  if (!this.subscriptions[segments.length][topic]) this.subscriptions[segments.length][topic] = [];

  this.updateSubscriberMeta(subscriberKey, topic);
  this.subscriptions[segments.length][topic].push(clone({ subscriberKey, ...data }));
  this.incrementMeta(segments);
}

function searchAll(options) {
  if (!options) options = {};
  if (!options.filter) options.filter = {};
  return (
    this.getAllTopics()
      .reduce((reduceTo, topic) => {
        return reduceTo.concat(this.search(topic, options, true));
      }, [])
      //remove duplicates
      .reduce((reduceTo, subscription) => {
        if (reduceTo.indexOf(subscription) === -1) reduceTo.push(subscription);
        return reduceTo;
      }, [])
      .concat(mongoFilter(options.filter, this.subscriptionsAny))
  );
}

function searchExplicit(topic) {
  if (this.subscriptionsExplicit[topic] == null) return [];
  return this.subscriptionsExplicit[topic];
}

function getSubscriptionsByTopic(searchTopic, options) {
  const segments = searchTopic.split('/').slice(1);
  const subscriptions = this.subscriptions[segments.length];
  if (!subscriptions) return [];
  if (!subscriptions[searchTopic]) return [];
  var results = subscriptions[searchTopic];
  if (options && options.filter) results = mongoFilter(options.filter, results);
  return results;
}

function search(topic, options, excludeAny) {
  topic = validateTopic(topic);
  var results = [];
  if (this.cache.search.has(topic)) results = this.cache.search.get(topic);
  else {
    const segments = topic.split('/').slice(1);
    this.getWildcardCombinations(segments, topic).forEach((permutation) => {
      const found = this.subscriptions[segments.length][permutation];
      if (found) results = results.concat(found);
    });
    this.cache.search.set(topic, results);
  }
  results = results.concat(this.searchExplicit(topic));
  if (!excludeAny) results = results.concat(this.subscriptionsAny);
  if (options == null) return results;
  if (options.filter) results = mongoFilter(options.filter, results);
  if (options.clone) results = clone(results);
  return results;
}

function defaults(options) {
  if (!options) options = {};
  if (!options.searchCache) options.searchCache = 5000;
  if (!options.permutationCache) options.permutationCache = 5000;
  if (!options.defaultVariableDepth) options.defaultVariableDepth = 5;
  return options;
}

function subscribeAny(subscriberKey, subscription) {
  this.subscriptionsAny.push({ subscriberKey, ...subscription });
}

function unsubscribeAny(subscriberKey, options) {
  const filter = options
    ? options.filter
      ? { subscriberKey, ...options.filter }
      : { subscriberKey }
    : { subscriberKey };
  const filtered = mongoFilter(filter, this.subscriptionsAny);
  filtered.forEach((subscription) => {
    this.subscriptionsAny.splice(this.subscriptionsAny.indexOf(subscription), 1);
  });
  return options.returnRemoved ? filtered : filtered.length;
}

function getWildcardCombinations(segments, topic) {
  if (!this.subscriptionsMeta[segments.length]) return []; //no subscriptions with this segment length
  if (this.cache.permutation.has(topic)) return this.cache.permutation.get(topic);

  var possible = [];
  Object.keys(this.subscriptionsMeta[segments.length]).forEach(function (mask) {
    var possibility = [];
    segments.forEach(function (segment, segmentIndex) {
      if (mask[segmentIndex] === '1') return possibility.push('*');
      possibility.push(segment);
    });
    possible.push('/' + possibility.join('/'));
  });

  this.cache.permutation.set(topic, possible);
  return possible;
}
