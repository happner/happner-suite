module.exports = {
  STATES: {
    WARMUP: 'WARMUP',
    WARMUP_CONNECTING: 'WARMUP/CONNECTING',
    CONNECTING: 'CONNECTING',
    SUBSCRIBING: 'SUBSCRIBING',
    STABLE: 'STABLE',
    STABLE_CONNECTING: 'STABLE/CONNECTING', //The cluster's minimum requirements are satisfied, but it is connecting to newly added nodes
    UNSTABLE: 'UNSTABLE', //minimum requirements were satisfied, no longer are.
    UNSTABLE_RECONNECTING: 'UNSTABLE/RECONNECTING',
    UNSTABLE_RESUBSCRIBING: 'UNSTABLE/RESUBSCRIBING',
    ISOLATED: 'ISOLATED',
    UNSTABLE_INSUFFICIENT_PEERS: 'UNSTABLE/INSUFFICIENT PEERS',
  },
};
