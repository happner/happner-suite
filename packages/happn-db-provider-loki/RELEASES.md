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

1.0.4 2022-05-09
-----------------
  - TEN-114: happner-2: enforce MESH_GST, MESH_ADMIN upsert on startup, ensures db dir

1.0.5 2022-05-26
-----------------
  - Updates to happn-commons and happn-commons-test, due to:
  - TEN-49: add diagnostics log to caching service, refactored happn-3 caching layer
  - TEN-54: all systems tested on node v18

1.0.6 2022-06-02
-----------------
  - TEN-49: fixed persisted cache and loki provider issues, caused by revoked tokens

1.0.7 2022-07-14
-----------------
  - TEN-125: body-parser v1.20.0 causes memory leak

1.1.0 2022-10-29
-----------------
  - TEN-146: preserve criteria on remove

1.1.1 2022-11-26
-----------------
  - feat: Sqlite DB provider

1.1.2 2022-12-22
-----------------
  - fix: recovery only loads temp if fails in snapshot import
  - fix: we release all events when reader hits a failure
  - fix: we ignore empty strings when re-loading temp files

1.2.0 2023-01-11
-----------------
  - feat: loki archiving
  - feat: loki plugins

1.2.1 2023-01-18
-----------------
  - TEN-4: summon productionization

1.2.2 2023-08-05
-----------------
- feat: fixed mesh_gst paths in happner-2

1.3.0 2024-03-27
-----------------
- feat: loki provider has new file-size compaction threshold

