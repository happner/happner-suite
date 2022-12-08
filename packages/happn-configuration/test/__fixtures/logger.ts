/* eslint-disable no-console */
export default {
  info: (msg, data) => {
    if (data) console.log(msg, data);
    else console.log(msg);
  },
  error: (msg, data) => {
    if (data) console.error(msg, data);
    else console.error(msg);
  },
};
