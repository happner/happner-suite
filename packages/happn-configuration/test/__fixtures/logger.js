"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
exports.default = {
    info: function (msg, data) {
        if (data)
            console.log(msg, data);
        else
            console.log(msg);
    },
    error: function (msg, data) {
        if (data)
            console.error(msg, data);
        else
            console.error(msg);
    },
};
