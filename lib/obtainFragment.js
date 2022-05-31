"use strict";
const defined = require("./defined");

module.exports = obtainFragment;

/**
 * Obtains the fragment from the given URL.
 *
 * This returns the part after the first `#` (or the empty string,
 * if there is no fragment)
 *
 * @param {String} url The URL
 * @returns The fragment
 */
function obtainFragment(url) {
  if (!defined(url)) {
    return undefined;
  }
  const hashIndex = url.indexOf("#");
  if (hashIndex !== -1) {
    return url.substring(hashIndex + 1);
  }
  return "";
}
