"use strict";
var defined = require('./defined');

module.exports = defaultValue;

function defaultValue(a, b) {
    if (defined(a)) {
        return a;
    }
    return b;
}