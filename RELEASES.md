3.1.1 2024-07-16
-----------------
- fix: loki provider fsync not releasing file handles

3.1.0 2024-03-27
-----------------
  - happn-db-provider-loki: new file-size compaction threshold

3.0.3 2023-08-05
-----------------
  - happn-3: auth provider changes

3.0.2 2023-07-25
-----------------
  - happner-2: MESH_GST permissions updated not to have {{id}} in path

3.0.1 2023-07-21
-----------------
  - happner-2: response subscription filter fix

3.0.0 2023-05-24
-----------------
  - fix: happn-3 resetpassword
  - feat: happner-2 resetpassword

2.8.0 2023-04-29
-----------------
  - feat: happn-3 changePassword in client
  - feat: happn-3 resetPassword supported by auth provider

2.7.1 2023-04-14
-----------------
  - fix: happner-2 rest stringify ignores special characters

2.7.0 2023-03-03
-----------------
  - feat: token revocation and logout
  - fix: token revocation cluster fix

2.6.0 2023-02-18
-----------------
  - fix: get user without params
  - feat: switch off packager watching
  - doc: configurable payload
  - feat: use array of params with as in http rpc


2.5.0 2023-02-06
-----------------
  - feat: auth provider enhancements

2.4.0  2023-01-11
-----------------
  - feat: loki archiving and plugins

2.3.1  2022-12-22
-----------------
  - feat: loki provider disaster recovery enhancements


2.3.0 2022-11-26
-----------------
  - feat: Sqlite DB provider

2.2.0 2022-11-24
----------------
- TEN-140: outdated pem module
- TEN-148: document post array rest module
- TEN-4: productionize summon
- happn-3: 13.7.0
- happn-db-provider-mongo: 1.1.2
- happn-cluster: 12.2.3
- happner-cluster: 12.3.3
- happner-client: 12.5.3
- happner-2: 12.5.2

2.1.1 2022-11-04
-----------------
- TEN-135: do not insert default mongo sort by path
- happn-3: 13.6.1
- happn-db-provider-mongo: 1.1.1
- happn-cluster: 12.2.2
- happner-cluster: 12.3.2
- happner-client: 12.5.2
- happner-2: 12.5.1

2.1.0 2022-10-29
-----------------
- TEN-129: security service tests
- TEN-141: fatal on security generate session
- TEN-144: rest array arguments
- TEN-146: preserve criteria on remove
- happn-commons: 1.2.0
- happn-commons-test: 1.1.1
- happn-3: 13.6.0
- happn-db-provider-mongo: 1.1.0
- happn-db-provider-nedb: 1.1.0
- happn-db-provider-loki: 1.1.0
- happn-cluster: 12.2.1
- happner-cluster: 12.3.1
- happner-client: 12.5.1
- happner-2: 12.5.0
- happn-nedb: 2.0.7
- tame-search: 3.0.6
- happn-util-crypto: 3.0.6
- happn-logger: 12.2.1

2.0.0 2022-10-12
-----------------
- TEN-143: ws and primus update in happn-primus-wrapper
- TEN-101: removed elasticsearch support
- happn-3: 13.5.0
- happn-db-provider-mongo: 1.0.17
- happn-db-provider-nedb: 1.0.7
- happn-primus-wrapper: 9.0.0
- happn-cluster: 12.2.0
- happner-cluster: 12.3.0
- happner-client: 12.5.0
- happner-2: 12.4.0
- happn-nedb: 2.0.6

1.8.0 2022-10-03
-----------------
- TEN-132: authorization cache key regex mask
- TEN-138: api/client call fails when auth delegation switched on
- happn-3: 13.4.0
- happn-cluster: 12.1.1
- happn-db-provider-elasticsearch: 1.0.16
- happn-db-provider-mongo: 1.0.16
- happner-2: 12.3.0
- happner-client: 12.4.1
- happner-cluster: 12.2.3

1.7.0 2022-09-22
-----------------
- TEN-65: bad options on data get
- TEN-126: reconnect on error
- TEN-123: getAddress changes
- happn-3: 13.3.0
- happn-cluster: 12.0.15
- happn-db-provider-elasticsearch: 1.0.15
- happn-db-provider-mongo: 1.0.15
- happner-2: 12.2.2
- happner-client: 12.4.0
- happner-cluster: 12.2.2
- redis-lru-cache: 1.0.15

1.6.0 2022-09-01
-----------------
- TEN-130: issues with sync init functions and defer startup
- happner-2: 12.2.1
- happner-cluster: 12.2.1
- happn-3: 13.2.1
- happn-cluster: 12.0.14
- happn-db-provider-elasticsearch: 1.0.14
- happn-db-provider-mongo: 1.0.14
- happn-logger: 2.2.0
- happner-client: 12.3.1

1.5.0 2022-08-07
----------------
- TEN-31: on behalf of
- happn-3: 13.2.0
- happner-2: 12.2.0
- happner-client: 12.3.0
- happner-cluster: 12.2.0
- happn-cluster: 12.0.13
- happn-db-provider-elasticsearch: 1.0.13
- happn-db-provider-mongo: 1.0.13

1.4.0 2022-07-14
----------------
- TEN-125: memory leak, body-parser
- happn-3: 13.1.4
- happn-commons-test: 1.1.0
- happn-db-provider-loki: 1.0.7
- happn-db-provider-elasticsearch: 1.0.12
- happn-db-provider-mongo: 1.0.12
- happn-db-provider-nedb: 1.0.6
- happn-logger: 2.1.1
- happn-util-crypto: 3.0.5
- happn-nedb: 2.0.5
- happner-2: 12.1.9
- happner-client: 12.2.8
- redis-lru-cache: 1.0.12
- happner-cluster: 12.1.9
- happn-cluster: 12.0.12

1.3.3 2022-06-28
----------------
- happner-cluster: 12.1.8
- happn-cluster: 12.0.11

1.3.2 2022-06-09
----------------
- happn-3: 13.1.2
- happn-cluster: 12.0.10
- happn-db-provider-elasticsearch: 1.0.10
- happn-db-provider-mongo: 1.0.10
- happner-2: 12.1.7
- happner-client: 12.2.6
- happner-cluster: 12.1.6
- redis-lru-cache: 1.0.10

1.3.1 2022-06-02
----------------
- happn-3: 13.1.1
- happn-db-provider-loki: 1.0.6
- happn-db-provider-elasticsearch: 1.0.9
- happn-db-provider-mongo: 1.0.9
- happner-2: 12.1.6
- happner-client: 12.2.5

1.3.0 2022-05-27
-----------------
- happn-3: 13.1.0
- happn-cluster: 12.0.8
- happn-commons: 1.1.0
- happn-commons-test: 1.0.4
- happn-db-provider-elasticsearch: 1.0.8
- happn-db-provider-loki: 1.0.5
- happn-db-provider-mongo: 1.0.8
- happn-db-provider-nedb: 1.0.5
- happner-2: 12.1.5
- happner-client: 12.2.4
- happner-cluster: 12.1.5
- redis-lru-cache: 1.0.7

1.2.3 2022-05-09
-----------------
- happn-db-provider-elasticsearch: 1.0.7
- happn-db-provider-mongo: 1.0.7
- happn-db-provider-loki: 1.0.4
- happn-db-provider-nedb: 1.0.4 
- happn-3: 13.0.9
- happn-cluster: 12.0.7
- happner-2: 12.1.4
- happner-client: 12.2.3
- happner-cluster: 12.1.4
- redis-lru-cache: 1.0.7

1.2.2 2022-05-06
----------------
- happn-3: 13.0.8

1.2.1 2022-05-04
----------------
- happn-3: 13.0.7

1.2.0 2022-04-12
-----------------
- happner-2: 12.1.1
- happner-client: 12.2.0
- happner-cluster: 12.1.1

