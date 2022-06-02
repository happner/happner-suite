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
  - TEN-49: add diagnostics log to caching service, refactored happn-3 caching layer
  - TEN-54: all systems tested on node v18

1.0.9 2022-06-02
-----------------
  - TEN-49: fixed persisted cache and loki provider issues, caused by revoked tokens
