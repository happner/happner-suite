module.exports = {
  logger: {
    createLogger: function () {
      return {
        $$TRACE: function () {},
        debug: function () {
          if (process.env.LOG_LEVEL === 'off');
        },
        info: function () {
          if (process.env.LOG_LEVEL === 'off');
        },
        warn: function () {
          if (process.env.LOG_LEVEL === 'off');
        },
        error: function () {
          if (process.env.LOG_LEVEL === 'off');
        },
        fatal: function () {
          if (process.env.LOG_LEVEL === 'off');
        },
      };
    },
  },
};
