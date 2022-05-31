"use strict";
const defined = require("./defined");
const stripFragment = require("./stripFragment");

module.exports = obtainFileName;

/**
 * Obtains the file name from a URL.
 *
 * This will strip any fragment from the URL (starting at `#`), and
 * return the part after the last slash `/` (or the full URL without
 * the fragment if there is no slash)
 *
 * @param {String} url The URL
 * @returns The file name
 */
function obtainFileName(url) {
  if (!defined(url)) {
    return undefined;
  }
  let result = stripFragment(url);
  const slashIndex = result.lastIndexOf("/");
  if (slashIndex !== -1) {
    result = result.substring(slashIndex + 1);
  }
  return result;
}
