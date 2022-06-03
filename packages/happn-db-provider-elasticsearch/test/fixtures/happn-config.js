const test = require('./test-helper').create();
module.exports = {
  get: function (dbPath, testId) {
    return {
      services: {
        data: {
          config: {
            autoUpdateDBVersion: true,
            datastores: [
              {
                name: 'elastic',
                provider: dbPath,
                isDefault: true,
                settings: {
                  host: test.getEndpoint(),
                  indexes: [
                    {
                      index: 'happner',
                      body: {
                        mappings: {},
                      },
                    },
                    {
                      index: 'sortedandlimitedindex1',
                      body: {
                        mappings: {
                          happner: {
                            properties: {
                              'data.field1': { type: 'keyword' },
                              'data.item_sort_id': { type: 'integer' },
                            },
                          },
                        },
                      },
                    },
                    {
                      index: 'sortedandlimitedindex2',
                      body: {
                        mappings: {
                          happner: {
                            properties: {
                              'data.field1': { type: 'keyword' },
                              'data.item_sort_id': { type: 'integer' },
                            },
                          },
                        },
                      },
                    },
                  ],
                  dataroutes: [
                    {
                      pattern:
                        '/1_eventemitter_embedded_sanity/' +
                        testId +
                        '/testsubscribe/data/complex*',
                      index: 'sortedandlimitedindex1',
                    },
                    {
                      pattern: `/complexsearch/${testId}/*`,
                      index: 'sortedandlimitedindex2',
                    },
                    {
                      dynamic: true, //dynamic routes generate a new index/type according to the items in the path
                      pattern: '/dynamic/{{index}}/{{type}}/*',
                    },
                    {
                      pattern: '*',
                      index: 'happner',
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    };
  },
};
