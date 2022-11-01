tame-search
-----------

premise
-------

key/value in-memory pub/sub store that allows for a strict wildcard scheme. useful for a searchable subscription store for a pub/sub system. Essentially the system stores wildcard subscriptions, and is able to match them to incoming queries,

installation
------------

```bash
    npm i tame-search --save
```

example
-------

```javascript

    var opts = {
      searchCache:1000, //size of LRU cache used to store search results, default 5000
      permutationCache:1000 //size of LRU cache to store path permutations, default 5000
    };

    var tameSearch = require('tame-search').create(opts); //opts are optional

    //add a subscription for a specific subscriber key
    tameSearch.subscribe('test-subscriber', '/test/*/*', {ref: 'my reference id: 0'});
    tameSearch.subscribe('test-subscriber', '/test/*/*', {ref: 'my reference id: 1'});
    tameSearch.subscribe('test-subscriber', '/test/1/*', {ref: 'my reference id: 2'});

    var results = tameSearch.search('/test/1/2');
    /*
    results:
    [
      {ref: 'my reference id: 0', subscriberKey: 'test-subscriber' },
      {ref: 'my reference id: 1', subscriberKey: 'test-subscriber' },
      {ref: 'my reference id: 2', subscriberKey: 'test-subscriber' }
    ]
    NB: the subscriberKey field is used by the system - and is a special field which cannot be part of the subscription data - it will be overwritten
    */

    results = tameSearch.search('/test/1/2', {filter:{ref: 'my reference id: 2'}});//mongo style filter

    //results:
    /*
    [
      {ref: 'my reference id: 2', subscriberKey: 'test-subscriber' }
    ]
    */

    tameSearch.unsubscribe('test-subscriber', '/test/*/*', {filter:{ref: 'my reference id: 2'}});//unsubscribes subscription with ref 'my reference id: 2'

    results = tameSearch.search('/test/1/2');

    //results now:
    /*
    [
      {ref: 'my reference id: 0', subscriberKey: 'test-subscriber' },
      {ref: 'my reference id: 1', subscriberKey: 'test-subscriber' }
    ]
    */

    //or

    tameSearch.unsubscribe('test-subscriber', '/test/*/*'); //unsubscribes all '/test/*/*' subscriptions

    results = tameSearch.search('/test/1/2');

    //results now:
    /*
    [
      {ref: 'my reference id: 2', subscriberKey: 'test-subscriber' }
    ]
    */
```

extra subscribe options
--------------------

__subscribe to any topic__
*it is possible to subscribe to any topic, using the subscribeAny method*
```javascript

var tameSearch = new TameSearch();

tameSearch.subscribeAny('test-subscriber', {ref: 1, topLevelRef:2});

tameSearch.subscribeAny('test-subscriber', {ref: 2, topLevelRef:1});

tameSearch.subscribe('test-subscriber', '/test/1', {ref: 3, topLevelRef:1});

tameSearch.subscribe('test-subscriber', '/test/2', {ref: 4, topLevelRef:2});

tameSearch.search('/test/1', {filter: {topLevelRef: 1}});
//returns:
// [
//   {ref: 3, topLevelRef:1, subscriberKey: 'test-subscriber' },
//   {ref: 2, topLevelRef:1, subscriberKey: 'test-subscriber' } //NB: notes how this is included with all search results
// ]

//to remove an any subscribe you can use the unsubscribeAny method:
tameSearch.unsubscribeAny('test-subscriber', {filter:{topLevelRef:1}});

tameSearch.search('/test/1', {filter: {topLevelRef: 1}});
//now returns:
// [
//   {ref: 3, topLevelRef:1, subscriberKey: 'test-subscriber' }
// ]

```


extra search options
--------------------

__search all items__
*as opposed to the regular search it is possible to find all matching subscriptions without using the path as the filter, but rather using the filter option, this will return all items that match the filter, regardless of their subscription path*
```javascript

var tameSearch = new TameSearch();

tameSearch.subscribe('test-subscriber', '/test/*', {ref: 1, topLevelRef:2});
tameSearch.subscribe('test-subscriber', '/test/*', {ref: 2, topLevelRef:1});
tameSearch.subscribe('test-subscriber', '/test/*', {ref: 3, topLevelRef:2});
tameSearch.subscribe('test-subscriber', '/test/*/*', {ref: 4, topLevelRef:1});
tameSearch.subscribe('test-subscriber', '/blah/*/*', {ref: 5, topLevelRef:1});
tameSearch.subscribe('test-subscriber', '/etc/*/*', {ref: 6, topLevelRef:2});
tameSearch.subscribe('test-subscriber', '/etc/*/*', {ref: 7, topLevelRef:2});

tameSearch.searchAll({filter: {topLevelRef: 2}})
//returns:
// [
//   {ref: 1, topLevelRef:2, subscriberKey: 'test-subscriber' },
//   {ref: 3, topLevelRef:2, subscriberKey: 'test-subscriber' },
//   {ref: 6, topLevelRef:2, subscriberKey: 'test-subscriber' },
//   {ref: 7, topLevelRef:2, subscriberKey: 'test-subscriber' }
// ]
```

extra unsubscribe options
-------------------------

__unsubscribe with returnRemoved:__
*by default unsubscribe just returns the count of items removed from the subscriptions, add the returnRemoved:true option to return items removed from the subscription list*
```javascript

var tameSearch = new TameSearch();

tameSearch.subscribe('test-subscriber', '/test/*', {ref: 1});
tameSearch.subscribe('test-subscriber', '/test/*', {ref: 2});
tameSearch.subscribe('test-subscriber', '/test/*', {ref: 3});
tameSearch.search('/test/2', {filter: {ref: 3}});

// returns:
// [{ ref: 1, subscriberKey: 'test-subscriber' }]

tameSearch.unsubscribe('/test/*', {filter: {ref: 1}, returnRemoved:true});
// returns:
// [{ ref: 1, subscriberKey: 'test-subscriber' }]
//instead of 1
```

__variable depth trailing wildcards:__
*if a trailing wildcard is a double (glob style) the subscription will be for made for further levels of the topic up to a specific depth*
```javascript

var tameSearch = TameSearch.create({defaultVariableDepth:5});//defaultVariableDepth default is 5

tameSearch.subscribe('test-subscriber', '/test/1/**', {test:'data'}, {depth:6}); 
//NB: will only work for a trailing wildcard (last 2 characters
// in the topic) - ie: /this/is/a/**/bad/path 

//is the same as:

tameSearch.subscribe('test-subscriber', '/test/1/*', {test:'data'});
tameSearch.subscribe('test-subscriber', '/test/1/*/*', {test:'data'});
tameSearch.subscribe('test-subscriber', '/test/1/*/*/*', {test:'data'});
tameSearch.subscribe('test-subscriber', '/test/1/*/*/*/*', {test:'data'});
tameSearch.subscribe('test-subscriber', '/test/1/*/*/*/*/*', {test:'data'});
tameSearch.subscribe('test-subscriber', '/test/1/*/*/*/*/*/*', {test:'data'});

//and

tameSearch.subscribe('test-subscriber', '/test/1/**', {test:'data'});

//is the same as:

tameSearch.subscribe('test-subscriber', '/test/1/*', {test:'data'});
tameSearch.subscribe('test-subscriber', '/test/1/*/*', {test:'data'});
tameSearch.subscribe('test-subscriber', '/test/1/*/*/*', {test:'data'});
tameSearch.subscribe('test-subscriber', '/test/1/*/*/*/*', {test:'data'});
tameSearch.subscribe('test-subscriber', '/test/1/*/*/*/*/*', {test:'data'});

// you unsubscribe using almost the same syntax

tameSearch.unsubscribe('test-subscriber', '/test/1/**', {depth:6});

//is the same as:

tameSearch.unsubscribe('test-subscriber', '/test/1/*');
tameSearch.unsubscribe('test-subscriber', '/test/1/*/*');
tameSearch.unsubscribe('test-subscriber', '/test/1/*/*/*');
tameSearch.unsubscribe('test-subscriber', '/test/1/*/*/*/*');
tameSearch.unsubscribe('test-subscriber', '/test/1/*/*/*/*/*');
tameSearch.unsubscribe('test-subscriber', '/test/1/*/*/*/*/*/*');

// you can use a filter in the unsubscribe to ensure only a specific of items is unsubscribed

tameSearch.subscribe('test-subscriber', '/test/1/**', {test:'data', key:1});
tameSearch.subscribe('test-subscriber', '/test/1/**', {test:'data', key:2});

tameSearch.unsubscribe('test-subscriber', '/test/1/**', {filter:{key:1}});
//will only subscribe all variable depth items with a key:1

```

__unsubscribe from all paths:__
*you can unsubscribe from all paths, using a filter*
```javascript
var tameSearch = new TameSearch();
tameSearch.subscribe('test-subscriber', '/test/*', {ref: 1, topLevelRef:1});
tameSearch.subscribe('test-subscriber', '/test/*/*', {ref: 2, topLevelRef:1});
tameSearch.subscribe('test-subscriber', '/test/*/*/*', {ref: 3, topLevelRef:2});
tameSearch.unsubscribeAll('test-subscriber', {filter:{topLevelRef:1}, returnRemoved:true})
// returns:
// [{ ref: 1, topLevelRef:1, subscriberKey: 'test-subscriber' }, { ref: 2, topLevelRef:1, subscriberKey: 'test-subscriber' }]
```

rules / caveats
---------------

NB: a leading / is ignored when subscribing, unsubscribing and searching:

```javascript

    tameSearch.subscribe('test-subscriber', 'test/1/*/3', {ref:1});
    tameSearch.subscribe('test-subscriber', '/test/1/*/3', {ref:2});

    tameSearch.search('/test/1/*/3')
    //returns:
    // [
    //   { ref:1, subscriberKey: 'test-subscriber' },
    //   { ref:2, subscriberKey: 'test-subscriber' }
    // ]
```

difference between unsubscribeAny and unsubscribeAll
*This could be confusing: unsubscribeAny removes specifically "any" subscriptions and ignores topic based ones, unsubscribeAll will remove topic and "any" type subscriptions*

```javascript

var tameSearch = new TameSearch();
tameSearch.subscribeAny('test-subscriber', {ref: 1, topLevelRef:2});
tameSearch.subscribeAny('test-subscriber', {ref: 5, topLevelRef:2});
tameSearch.subscribeAny('test-subscriber', {ref: 2, topLevelRef:1});
tameSearch.subscribe('test-subscriber', '/test/1', {ref: 3, topLevelRef:1});
tameSearch.subscribe('test-subscriber', '/test/2', {ref: 4, topLevelRef:2});
tameSearch.search('/test/1', {filter: {topLevelRef: 1}});
//returns:
// [
//   { ref: 3, topLevelRef:1, subscriberKey: 'test-subscriber' },
//   { ref: 2, topLevelRef:1, subscriberKey: 'test-subscriber' } 
// ]
// NB: note how the last item in the results is always included with the search results as it is subscribed to any search event

tameSearch.unsubscribeAny('test-subscriber', {filter:{topLevelRef:1}});

tameSearch.search('/test/1', {filter: {topLevelRef: 1}});
//now returns:
// [
//   { ref: 3, topLevelRef:1, subscriberKey: 'test-subscriber' }
// ]

tameSearch.search('/test/2', {filter: {topLevelRef: 2}});
//returns:
// [
//   { ref: 1, topLevelRef:2, subscriberKey: 'test-subscriber' },
//   { ref: 5, topLevelRef:2, subscriberKey: 'test-subscriber' },
//   { ref: 4, topLevelRef:2, subscriberKey: 'test-subscriber' }
// ]

//NB: notice that the unsubscribeAll method removes both "any" and topic type subscriptions
tameSearch.unsubscribeAll('test-subscriber', {filter:{topLevelRef:2}});

tameSearch.search('/test/2', {filter: {topLevelRef: 2}});
//now returns:
// []  

```

comparison is done only on paths that have a matching number of / segment dividers, ie:

```javascript

    tameSearch.search('/test/1'); //will not return subscriptions like /test/*/*, only test/1 or test/*

```

wildcards mean nothing in the search string (for now)

```
    tameSearch.search('/test/*'); //will not return the subscription "/test/1" or "/test/2", only "/test/*" because the paths match
```

subscriberKey argument is required for subscribe and unsubscribe methods, and subscription reference data must be an object

```javascript
  tameSearch.subscribe(undefined, '/test/1/*/*', { test : 'data' }) //will not work, no subscriberKey
  tameSearch.subscribe('test-subscriber', '/test/1/*/*') //will not work
  tameSearch.subscribe('test-subscriber', '/test/1/*/*','string value') //will not work
  //instead do
  tameSearch.subscribe('/test/1/*/*',{ value:'string value' })

```
