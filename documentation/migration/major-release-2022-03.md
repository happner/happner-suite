major release 2022-03
---------------------

affected versions:
------------------
- happn-3 v12-v13
- happn-cluster v11-v12
- happner-2 v11-v12
- happner-cluster v11-v12


known breaking changes:
---------------------------------

- the default data provider has changed to loki.
- the db provider package names have changed to the format: happn-db-provider-{{mongo || nedb || loki}}
- if your system was or is using nedb, you need to ensure that nedb is installed and configured as the default data provider - see db provider configuration below.
- the system will not automatically work with an nedb file, the nedb provider must be configured.
- nedb, mongo or elasticsearch must be installed on standalone systems if you want to use them, mongodb is installed by default on happner-cluster, and loki is installed by default on happn and happner.
- the system no longer migrates old nedb formats (v0) to v1 - the last version of the nedb database schema is used.

```bash
npm i happn-db-provider-nedb
npm i happn-db-provider-mongo
npm i happn-db-provider-elasticsearch
```

db provider configuration:
--------------------------
```javascript
    //configure db providers - of no configuration, the default db provider will be loki (system will fail if it is not installed)
    const happnConfig = {
      services: {
        data: {
          config: {
            datastores: [
                {
                    name: 'loki',
                    provider: 'happn-db-provider-loki',
                    patterns: [
                        '/goes-into-loki/*'
                    ],
                    settings: {
                        filename: process.env.LOKI_PERSIST_FILE,
                        fsync: true,
                    }
                },
                {
                    name: 'nedb',
                    provider: 'happn-db-provider-nedb',
                    patterns: [
                        '/goes-into-nedb/*'
                    ],
                    settings: {
                       // no settings - so memory store
                    }
                },
                {
                    name: 'elasticsearch',
                    provider: 'happn-db-provider-elasticsearch',
                    patterns: [
                        '/goes-into-elasticsearch/*'
                    ],
                    settings: {
                        host: process.env.ELASTIC_HOST,
                        indexes: []
                    }
                },
                {
                    name: 'mongo',
                    provider: 'happn-db-provider-mongo',
                    settings: {
                        collection: process.env.MONGO_COLLECTION,
                        database: process.env.MONGO_DATABASE,
                        url: process.env.MONGO_URL
                    },
                    isDefault: true,
                },
            ]
          }
        }
      }
    }
// use happn config to configure happner
let happnerConfig = {
    happn: happnConfig
}
```