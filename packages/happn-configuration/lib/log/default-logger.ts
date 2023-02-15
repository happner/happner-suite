/* eslint-disable no-console */
export default {
  info: (msg, data) => {
    data ? console.log(msg, data) : console.log(msg);
  },
  debug: (msg, data) => {
    data ? console.debug(msg, data) : console.debug(msg);
  },
  warn: (msg, data) => {
    data ? console.warn(msg, data) : console.warn(msg);
  },
  error: (msg, data) => {
    data ? console.error(msg, data) : console.error(msg);
  },
};
