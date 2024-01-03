module.exports = {
  STOPPED: 0,
  DISCOVERING: 1,
  CONNECTING: 2, // the required dependency services are appearing in the latest database entries
  STABLE: 3,
  UNSTABLE: 4,
  FAILED_DISCOVER: 5,
  FAILED_DISCOVER_TIMEOUT: 6,
  FAILED_CONNECTING: 7,
  FAILED_PULSE: 8,
};
