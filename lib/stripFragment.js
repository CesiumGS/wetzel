"use strict";
const defined = require("./defined");

module.exports = stripFragment;

/**
 * Removes any fragment from the given URL (starting at `#`), if present.
 *
 * @param {String} url The URL
 * @returns The URL without fragment
 */
function stripFragment(url) {
  if (!defined(url)) {
    return undefined;
  }
  const hashIndex = url.indexOf("#");
  if (hashIndex !== -1) {
    return url.substring(0, hashIndex);
  }
  return url;
}
