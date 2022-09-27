2.5.5 2017-03-21
----------------
  - activated primus destroy bug dodging

2.5.6 2017-03-21
----------------
  - activated primus destroy bug dodging

2.5.7 2017-03-23
----------------
  - onward release happn-3

2.6.0 2017-04-06
----------------
  - onward release happn-3

2.6.1 2017-04-18
----------------
  - onward release of happn-3

2.7.0 2017-05-20
----------------
  - added `config.services.proxy.config.defer` to not start proxy for use with happner-cluster

3.0.0 2017-08-19
----------------
  - update to happn-3 ^3.0.0
  - test node version 8

4.0.0 2017-11-08
----------------
  - update to happn-3 ^5.0.0

4.1.0 2017-11-25
----------------
  - update to happn-3 ^5.1.1
  - add happn-stats

non-release 2017-12-14
----------------------
  - expanded 19-restart-peer test to more aggressively test stabilize
  - removed benchmarket

4.2.0 2018-01-09
----------------
  - added configurable cluster proxy socket idle timeout

4.3.0 2018-03-27
----------------
  - add replication service

5.0.0 2018-04-12
----------------
  - onward release happn-3

6.0.0 2018-05-24
----------------
  - onward release happn-3

6.0.1 2018-06-28 - unpublished
------------------------------
  - issue #36 - replace http-proxy with bouncy. Enables handling non-standard binary payloads.

6.0.2 2018-06-29
----------------
  - rolling back bouncy update

6.1.0 2018-06-29
----------------
  - persistMembers membership service change

7.0.0 2018-19-10
----------------
  - happn-3 version 8.0.0

7.0.1 2018-09-16
----------------
  - happn-3 version 8.0.1

7.0.2 2018-10-27
----------------
  - happn-3 version 8.0.3

7.1.0 2018-10-27
----------------
  - happn-3 version 8.1.1

7.2.0 2018-11-17
----------------
  - happn-3 version 8.2.1

7.2.1 2018-11-17
----------------
  - happn-3 version 8.2.7

8.0.0 2019-03-01
----------------
  - happn-3 version 9.0.0

8.0.1 2019-03-01
----------------
  - happn-3 version 9.0.1

8.0.2 2019-03-01
----------------
  - happn-3 version 9.0.2

8.0.3 2019-04-26
----------------
  - happn-3 version 9.0.4
  - extended tests around cluster member persistence

8.1.0 2019-04-26
----------------
  - happn-3 version 10.0.0

8.1.1 2019-04-26
----------------
  - ws 7 fix

8.1.2 2019-04-26
----------------
  - ws error bubble fix
  - happner and happn upgrades

8.1.3 2019-08-21
----------------
  - issue with stable timeout not being cleared on stop

8.1.4 2019-09-27
----------------
  - updated happn-3 dependency

9.0.0 2019-11-28
----------------
  - happn-3 version 11.0.0, breaking: client disconnection on token revocation

9.0.1 2019-01-25
----------------
  - linting

9.0.2 2020-02-24
----------------
  - happn-3 version 11.2.0, zombie socket cleanup

9.0.3 2020-02-24
----------------
  - fix: member client will not double disconnect if server is stopped more than once
  - cleanup - removed dead code and comment from orchestrator

9.0.4 2020-06-24
----------------
  - dep: bumped happn-3 version 11.5.2
  - dep: changed sillyname dependency to happn-sillyname

9.0.5 2020-07-07
----------------
  - Added ability to set NETWORK_INTERFACE for utils/get-address

9.0.6 2020-10-04
----------------
  - happn-3 patch: selective security cache clearing and concurrency 1 queue on dataChanged event - SMC-1189
  - patch: SMC-1252 - cluster member restarts cause leak of peer admin

10.0.0 2020-11-04
-----------------
  - happn-cluster upgrade - SMC-1356 - batching of security updates

10.1.0 2020-11-04
-----------------
  - SMC-1285 - periodic health state logging
  - SMC-1284 - re-establishment of cluster member on socket failure

10.1.1 2021-03-31
-----------------
  - SMC-1808 - user permissions dependencies updated

10.2.0 2021-07-20
-----------------
  - SMC-1810 - nested permissions for set and on

10.3.0 2021-08-04
-----------------
  - SMC-3611 - getAddress now a closure with logger passed in, also allows nic id and address index to be defined - will resolve to an address with a warning if nic or address index does not match an existing item
  - SMC-3646 - set up coveralls and github actions

10.3.1 2021-08-27
------------------
- SMC-3242: happn-3 update fixed onBehalfOf and nested permissions issue

10.3.2 2021-09-11
------------------
- SMC-4044 - cookie events not dependent on client login

10.3.3 2021-09-20
------------------
- SMC-4146 - happn-3 upgrade 11.13.4

10.3.4 2021-09-28
-----------------
  - happn-3 upgrades:
  - fix: SMC-4209 - concurrency issue, user created logged on deleted, causes security directory update to fatal
  - fix: SMC-4208 - merge insert now uses upsert, moved constants out of data service

11.0.0 2021-10-07
-----------------
  - SMC-3823: mongo version 4 driver,
  - SMC-4309: removed persistMembers functionality

11.0.1 2021-11-11
-----------------
  - fix: SMC-4512 - happn-3 upgrade, db error causes fatal

11.1.0 2021-11-24
-----------------
  - happn-3 upgrade:
  - feature: SMC-2954 - Allows for configuration and use of multiple authentication providers.
  - fix: SMC-4386 -  upsertMultiplePermissions will now allow for removing permissions/prohibitions as well as upserting permissions or prohibitions

11.2.0 2021-12-02
-----------------
  - SMC-734: removed bitcore-lib and encrypted payloads

11.2.1 2021-12-04
-----------------
  - SMC-4466: removed bitcore-lib and encrypted payloads, update of happn-3

11.3.0 2022-01-04
-----------------
  - SMC-4550: updated happn-3 dependency

11.3.1 2022-01-10
-----------------
  - SMC-4938: lookup tables fail for rest request
  - SMC-4550: lookup tables security sync items

12.0.0 2022-03-01
-----------------
  - SMC-4198: monorepo upgrade

12.0.1 2022-03-03
-----------------
  - SMC-4198: git and npm ignore updates

12.0.2 2022-03-10
-----------------
  - SMC-5125: happn-3: Permissions-sets now accurately reflect templated paths

12.0.3 2022-03-29
-----------------
  - TEN-92, TEN-93: logging levels and events
  - TEN-102: loki snapshot  file redundancy

12.0.4 2022-04-06
-----------------
  - TEN-103: set default timeout on component loading wait warning to 30secs
  - TEN-104: errors are only logged on system failures

12.0.5 2022-05-04
-----------------
  - TEN-112: happn-3: group with permissions that have dots in them causes compaction failure

12.0.6 2022-05-06
-----------------
  - TEN-114: happn-3: enforce admin group save on startup

12.0.7 2022-05-09
-----------------
  - TEN-114: happner-2: enforce MESH_GST, MESH_ADMIN upsert on startup, ensures db dir

12.0.8 2022-05-26
-----------------
  - updates to commons libs, lint-fixes, updated all ip addresses in test to 127.0.0.1:
  - TEN-49: add diagnostics log to caching service, refactored happn-3 caching layer
  - TEN-54: all systems tested on node v18

12.0.9 2022-06-02
-----------------
  - TEN-49: fixed persisted cache and loki provider issues, caused by revoked tokens

12.0.10 2022-06-09
-----------------
  - TEN-31: further logging restrictions (info -> debug) and clustering allowances (debug -> info)

12.0.11 2022-06-28
-----------------
  - TEN-123: fix to getaddress - issue with bad breaking release in node 18.4

12.0.12 2022-07-14
-----------------
  - TEN-125: body-parser v1.20.0 causes memory leak

12.0.13 2022-08-07
-----------------
  - TEN-31: updated unit tests

12.0.14 2022-09-08
-----------------
  - TEN-130: happn-logger update

12.1.0 2022-10-22
-----------------
  - TEN-123: getAddress changes

