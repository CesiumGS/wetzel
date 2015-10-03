"use strict";

module.exports = defined;

function defined(value) {
    return (value !== undefined) && (value !== null);
}