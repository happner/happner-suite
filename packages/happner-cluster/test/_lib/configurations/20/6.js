const delay = require('await-delay');
module.exports = {
  modules: {
    component6: {
      instance: {
        initialize: async () => {
          this.state = { initialized: true };
        },
        start: async () => {
          this.state = this.state || {};
          this.state.started = true;
        },
        use: async () => {
          return 6;
        },
        is: async () => {
          if (!this.state) this.state = {};
          return this.state;
        },
      },
    },
    component7: {
      instance: {
        initialize: async () => {
          await delay(8e3);
        },
        start: async () => {
          this.state = this.state || {};
          this.state.started = true;
        },
        use: async () => {
          return 7;
        },
      },
    },
  },
  components: {
    component6: {
      initMethod: 'initialize',
      startMethod: 'start',
      dependencies: {
        component7: {
          version: '*',
        },
      },
    },
    component7: {
      initMethod: 'initialize',
      startMethod: 'start',
      dependencies: {},
    },
  },
};
