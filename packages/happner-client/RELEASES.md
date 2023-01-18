1.1.6 2017-03-21
----------------
  - added __version to exchange
  - added __custom to exchange if cluster

1.1.7 2017-03-21
----------------
  - onward release of happn-3

1.2.0 2017-03-23
----------------
  - onward release of happn-3

1.2.3 2017-04-07
----------------
  - onward release of happn-3

1.2.4 2017-04-18
----------------
  - onward release of happn-3

2.0.0 2017-08-19
----------------
  - bumped happn-3 to ^3.0.0

3.0.0 2017-11-27
----------------
  - bumped happn-3 to ^5.1.1

3.0.1 2018-01-08
----------------
  - log dependencies met and unmet

4.0.0 2018-04-12
----------------
  - onward release of happn-3

5.0.0 2018-05-24
----------------
  - onward release of happn-3

5.0.1 2018-05-29
----------------
  - added check for client.session in implementors-provider

5.0.2 2018-05-29
----------------
  - onward release of happner-2

5.1.0 2018-06-08
----------------
  - new dataClient() access to actual happn-3 client

6.0.0 2018-09-10
----------------
  - happn-3 version 8.0.0

6.0.1 2018-09-10
----------------
  - happner-2 version up

6.0.2 2018-09-10
----------------
  - happner-2 version up

6.0.3 2018-09-10
----------------
  - happn-3 version 8.0.1

6.0.4 2018-10-29
----------------
  - happn-3 version 8.0.3

6.1.0 2018-11-06
----------------
  - happn-3 version 8.1.1

6.2.0 2018-11-17
----------------
  - happn-3 version 8.2.1

6.3.0 2018-11-17
----------------
  - happn-3 version 8.2.7
  - happner-2 version 9.3.0

7.0.0 2019-03-01
----------------
  - happn-3 version 9.0.0
  - happner-2 version 10.0.0

7.0.1 2019-03-19
----------------
  - happn-3 version 9.0.1

8.0.0 2019-06-25
----------------
  - happn-3 version 10.0.0

8.0.1 2019-06-25
----------------
  - happn-3 version 10.1.1

8.1.0 2019-07-25
----------------
  - happn-3 update

8.1.1 2019-08-02
----------------
  - removed let from client side code

8.1.2 2019-08-13
----------------
  - fixed __getUpdatedDependencyDescription method when description is not an array and component does not exist

9.0.0 2019-09-22
----------------
  - $origin checked as property of callback in happner-client.js
  - peer client url added as part of addPeer in implementors provider
  - peer url and description emitted as part of dependency-met event in implementors provider
  - breaking: peer arrival departure event keys changed

10.0.0 2019-11-28
-----------------
  - happn-3 version 11.0.0, breaking client disconnection on token revocation

11.0.0 2020-02-24
-----------------
  - bump happn-3 to version 11.2.0
  - breaking: peer/arrived/description event changed on logDependenciesMet, now for every dependency peer, not just the first one

11.0.1 2020-02-24
-----------------
  - bump happn-3 to version 11.3.2 for async@3

11.0.2 2020-06-04
-----------------
  - bump happn-3 to version 11.4.0
  - IE11 support in implementors provider

11.0.3 2020-06-05
-----------------
  - bump happn-3 to version 11.5.0

11.0.4 2020-06-17
-----------------
  - runaway promise warning - browser, due to operations provider not returning a promise

11.1.0 2020-06-24
-----------------
  - added coercedSatisfies to the semver implementation

11.1.1 2020-06-30
-----------------
  - removed bluebird dependency

11.1.2 2020-09-10
-----------------
  - patch: ignore brokered descriptions JIRA: SMC-989

11.1.3 2020-09-18
-----------------
  - patch: brokered descriptions are ignored - but the mesh carries on loading: JIRA: SMC-989

11.1.4 2020-09-18
-----------------
  - added coercedSatisfies to the semver implementation for local instances. SMC-1089
  - fixed unit test 03 to release mocha process
  - added node v14 to travis tests

11.1.5 2020-09-30
-----------------
  - SMC-1147: upped the default requestTimeout and responseTimeout to 1 minutes and 2 minutes respectively

11.1.6 2020-10-04
-----------------
  - happn-3 patch: selective security cache clearing and concurrency 1 queue on dataChanged event - SMC-1189

11.1.7 2020-11-19
-----------------
  - happn-3: feature: SMC-1269 - logging a JSON object on socket error
  - happn-3: feature: SMC-1321 - only print error message for fail to decode JSON socket error, also just warning

11.1.8 2020-11-19
-----------------
  - SMC-1482 - fix: redirected logs not in correct format

11.1.9 2020-12-03
-----------------
  - SMC-1565 to fix semver satisfies specific prerelease versions

11.2.0 2021-01-20
-----------------
  - SMC-917: modified implementors provider to emit startup/dependencies/… …
  - SMC-917: added events.once to implementors provider
  - smc-917 - prerelease publish
  - SMC-917: Added registerAndCheckDependencies method in ImplementorsPro… …
  - SMC-917: Added unit tests for SMC-917 changes to ./lib/provides/imple… …
  - SMC-917: ImplementorsProvidor: AddAndCheckDependencies now checks for… …
  - SMC-917: Chore: lint-fixed
  - SMC-917: Code review changes (minor)

11.3.0 2021-04-16
-----------------
  - SMC-1807 - light client
  - SMC-1807: updated travis - removed Node 10 support, added node 15 support

11.3.1 2021-05-24
-----------------
  - SMC-1807 - bumped package-lock to accomodate latest version of happner

11.4.0 2021-08-11
-----------------
  - SMC-3689: added $call override for peer dependencies and discoverMethods for peer dependency configurations
  - SMC-3646: updated github actions

11.5.0 2021-08-22
-----------------
  - SMC-3689: methods are now discovered if a component has not been configured in the dependencies
  - SMC-3689: cleaned up tests
  - SMC-3689: fixed bad require of utils in connection provider (breaks the browser client)

11.5.1 2021-09-20
-----------------
  - SMC-4161: user permissions cleaned up on user deletion

11.5.2 2021-09-28
-----------------
  - happn-3 upgrades:
  - fix: SMC-4209 - concurrency issue, user created logged on deleted, causes security directory update to fatal
  - fix: SMC-4208 - merge insert now uses upsert, moved constants out of data service

11.5.3 2021-10-12
-----------------
  - fix: SMC-4349 - inter-mesh $on fails due to argument mismatch

11.5.4 2021-10-14
-----------------
  - fix: SMC-4385 - remote method call timeouts now print call details (component, version, method)

11.5.5 2021-11-11
-----------------
  - fix: SMC-4512 - happn-3 upgrade, db error causes fatal

 11.5.6 2021-11-24
-----------------
  - happn-3 upgrade:
  - feature: SMC-2954 - Allows for configuration and use of multiple authentication providers.
  - fix: SMC-4386 -  upsertMultiplePermissions will now allow for removing permissions/prohibitions as well as upserting permissions or prohibitions

11.6.0 2021-11-29
-----------------
  - happn-3 upgrade:
  - feature: SMC-734: Updated happn-util-crypto - removed bitcore, changes to crypto calls, removed payload encryption
  - test: fixed browser test validation

11.6.1 2021-12-06
-----------------
  - fix: SMC-4749 - light client times out for secure requests - logging loading component

11.6.2 2021-12-06
-----------------
  - fix: SMC-4749 - light client times out for secure requests - logging loading method

11.6.3 2021-12-06
-----------------
  - fix: SMC-4749 - light client times out for secure requests - logging component source member

11.6.4 2021-12-06
-----------------
  - fix: SMC-4749 - light client times out for secure requests - logging api id

11.6.5 2022-01-04
-----------------
  - fix: SMC-4901 - bad cookieName set on session

11.6.6 2022-01-10
-----------------
  - SMC-4938: lookup tables fail for rest request

11.6.7 2022-01-19
-----------------
  - SMC-4550: Fix -correctly calling securityDirectoryChanged on permission removal and group/permission table unlinking - happn-3

12.0.0 2022-03-01
-----------------
  - SMC-4198: monorepo upgrade

12.0.1 2022-03-03
-----------------
  - SMC-4198: git and npm ignore updates

12.0.2 2022-03-08
-----------------
  - SMC-4198: updated dependencies

12.0.3 2022-03-16
----------------- 
  - TEN-34: updated happner-2

12.0.4 2022-03-29
-----------------
  - TEN-92, TEN-93: logging levels and events
  - TEN-102: loki snapshot  file redundancy
  - TEN-92: made all dependencies test dependencies

12.0.5 2022-04-06
-----------------
  - TEN-103: set default timeout on component loading wait warning to 30secs
  - TEN-104: errors are only logged on system failures

12.1.0 2022-04-08
-----------------
  - TEN-95: $call discovers components and methods in cluster

12.2.0 2022-04-12
-----------------
  - TEN-60: Wildcard-brokering
  - TEN-42: Rest-discovery

12.2.1 2022-05-04
-----------------
  - TEN-112: happn-3: group with permissions that have dots in them causes compaction failure

12.2.2 2022-05-06
-----------------
  - TEN-114: happn-3: enforce admin group save on startup

12.2.3 2022-05-09
-----------------
  - TEN-114: happner-2: enforce MESH_GST, MESH_ADMIN upsert on startup

12.2.4 2022-05-26
-----------------
  - updates to commons libs, lint fixes, due to:
  - TEN-49: add diagnostics log to caching service, refactored happn-3 caching layer
  - TEN-54: all systems tested on node v18

12.2.5 2022-06-02
-----------------
  - TEN-49: fixed persisted cache and loki provider issues, caused by revoked tokens

12.2.6 2022-06-09
-----------------
  - TEN-31: further logging restrictions (info -> debug) and clustering allowances (debug -> info)

12.2.7 2022-06-28
-----------------
  - TEN-123: fix to getaddress - issue with bad breaking release in node 18.4

12.2.8 2022-07-14
-----------------
  - TEN-125: body-parser v1.20.0 causes memory leak

12.3.0 2022-08-07
-----------------
  - TEN-31: onbehalf of / as

12.3.1 2022-09-01
-----------------
  - TEN-130: issues with sync init functions and defer startup

12.4.0 2022-10-22
-----------------
  - TEN-65, TEN-126: happn-3 updates

12.4.1 2022-10-03
-----------------
  - TEN-132, TEN-138: happn and happner updates

12.5.0 2022-10-12
-----------------
  - TEN-143: ws and primus update in happn-primus-wrapper
  - TEN-101: removed elasticsearch support

12.5.1 2022-10-29
-----------------
  - TEN-129: security service tests
  - TEN-141: fatal on security generate session
  - TEN-144: rest array arguments
  - TEN-146: preserve criteria on remove

12.5.2 2022-11-05
-----------------
  - TEN-135: mongo search does not sort by path

12.5.3 2022-11-24
-----------------
  - TEN-4: productionize summon (authType saved to user)
  - TEN-140: outdated pem module
  - TEN-148: document post array rest module

12.5.4 2022-11-26
-----------------
  - feat: Sqlite DB provider

12.5.5 2022-12-22
-----------------
  - feat: loki provider disaster recovery enhancements

<<<<<<< HEAD
12.5.6 2023-01-03
-----------------
  - feat: Summon productionization
=======
12.5.6 2023-01-11
-----------------
  - feat: loki archiving and plugins 
>>>>>>> develop
