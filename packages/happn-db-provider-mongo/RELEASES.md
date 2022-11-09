1.0.0 2022-03-01
-----------------
  - SMC-4198: monorepo upgrade

1.0.1 2022-03-03
-----------------
  - SMC-4198: git and npm ignore updates

1.0.2 2022-03-08
-----------------
  - SMC-4198: updated dependencies

1.0.3 2022-03-29
-----------------
  - TEN-92, TEN-93: logging levels and events
  - TEN-102: loki snapshot  file redundancy
  - TEN-92: made all dependencies test dependencies

1.0.4 2022-04-06
-----------------
  - TEN-103: set default timeout on component loading wait warning to 30secs
  - TEN-104: errors are only logged on system failures

1.0.5 2022-05-04
-----------------
  - TEN-112: happn-3: group with permissions that have dots in them causes compaction failure

1.0.6 2022-05-06
-----------------
  - TEN-114: happn-3: enforce admin group save on startup

1.0.7 2022-05-09
-----------------
  - TEN-114: happner-2: enforce MESH_GST, MESH_ADMIN upsert on startup, ensures db dir

1.0.8 2022-05-26
-----------------
  - updates to commons libs, lint fixes, due to:
  - TEN-49: add diagnostics log to caching service, refactored happn-3 caching layer
  - TEN-54: all systems tested on node v18

1.0.9 2022-06-02
-----------------
  - TEN-49: fixed persisted cache and loki provider issues, caused by revoked tokens

1.0.10 2022-06-09
-----------------
  - TEN-31: further logging restrictions (info -> debug) and clustering allowances (debug -> info)

1.0.11 2022-06-28
-----------------
  - TEN-123: fix to getaddress - issue with bad breaking release in node 18.4

1.0.12 2022-07-14
-----------------
  - TEN-125: body-parser v1.20.0 causes memory leak

1.0.13 2022-08-07
-----------------
  - TEN-31: onbehalf of / as

1.0.14 2022-09-08
-----------------
  - TEN-130: updated logger dependency

1.0.15 2022-09-22
-----------------
  - TEN-65, TEN-126: happn-3 updates

1.0.16 2022-10-03
-----------------
  - TEN-132, TEN-138: happn and happner updates

1.0.17 2022-10-12
-----------------
  - TEN-143: ws and primus update in happn-primus-wrapper
  - TEN-101: removed elasticsearch support

1.1.0 2022-10-29
-----------------
  - TEN-146: preserve criteria on remove

1.1.1 2022-11-04
-----------------
- TEN-135: do not insert default sort by path

1.1.2 2022-11-08
-----------------
  - TEN-12: mongo-based membership strategy (dev dependencies changes)