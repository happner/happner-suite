module.exports = {
  happn: {
    name: 'orch01',
    services: {
      subscription: {
        getRecipients: () => {},
      },
      publisher: {
        processPublish: () => {},
      },
    },
  },
  endpoint: '1.2.3.4:5678',
  config: {
    replicate: ['*'],
  },
  __stateUpdate: () => {},
  removeMember: () => {},
  localClient: { some: 'object' },
  getLoginConfig: () => {
    return {
      protocol: 'http',
    };
  },
  log: {
    debug: console.log,
    error: console.log,
    info: console.log,
    warn: console.log,
    fatal: console.log,
  },
};
