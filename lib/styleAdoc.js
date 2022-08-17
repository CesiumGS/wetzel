"use strict";
const defined = require("./defined");
const defaultValue = require("./defaultValue");
const Style = require("./style");
const fs = require("fs");
const path = require("path");

const StyleAdoc = function () {};

StyleAdoc.prototype = Object.create(Style);

StyleAdoc.prototype.getHeaderMarkdown = function (level) {
  let md = "";
  const ch = "=";
  for (let i = 0; i < level; ++i) {
    md += ch;
  }
  return md;
};

StyleAdoc.prototype.createAnchor = function (anchor) {
  return "[#" + anchor + "]\n";
};

StyleAdoc.prototype.getSectionMarkdown = function (level, title, anchor) {
  let md = "";
  md += this.createAnchor(anchor);
  md += this.getHeaderMarkdown(level) + " " + title + "\n\n";
  return md;
};

StyleAdoc.prototype.bulletItem = function (item, indentationLevel) {
  indentationLevel = defaultValue(indentationLevel, 0);
  return "*".repeat(indentationLevel + 1) + " " + item + "\n";
};

StyleAdoc.prototype.getInternalLinkMarkdown = function (string, link) {
  if (!defined(string) || string.length === 0) {
    return "";
  } else if (!defined(link) || link.length === 0) {
    return string;
  }
  return "<<" + link + "," + string + ">>";
};

StyleAdoc.prototype.getExternalLinkMarkdown = function (string, link) {
  if (!defined(string) || string.length === 0) {
    return "";
  } else if (!defined(link) || link.length === 0) {
    return string;
  }
  return "link:" + link + "[" + string + "]";
};

StyleAdoc.prototype.beginTable = function (title, columnList) {
  let md = "";
  md += "." + title + "\n";
  md += "|===\n";
  md += "|" + columnList.join("|") + "\n\n";
  return md;
};

StyleAdoc.prototype.addTableRow = function (data) {
  return data.map((d) => "|" + d + "\n").join("") + "\n";
};

StyleAdoc.prototype.endTable = function () {
  return "|===\n\n";
};

StyleAdoc.prototype.styleMinMax = function (code) {
  if (defined(code)) {
    // The object might be a string or it might be a number or something else.
    // Let's make sure it's a string first.
    let stringified = code.toString();

    if (stringified.length > 0) {
      stringified = stringified.replace(/</g, "&lt;");
      stringified = stringified.replace(/>/g, "&gt;");
      stringified = stringified.trim();
      return this.styleCode(stringified);
    }
  }
  return "";
};

StyleAdoc.prototype.embedJsonSchema = function (directory, fileName) {
  let md = "";
  if (!defined(directory)) {
    directory = "";
  } else if (!directory.endsWith("/")) {
    directory += "/";
  }

  md += "[%unnumbered]\n";
  md += "[source,json]\n";
  md += "----\n";
  md += "include::" + directory + fileName + "[]\n";
  md += "----\n\n";
  md += "<<<\n"; // Page break between embedded JSON schema files.

  return md;
};

StyleAdoc.prototype.inlineJsonSchema = function (directory, fileName) {
  let md = "";
  try {
    const fullPath = path.join(directory ? directory : "", fileName);
    const contents = fs.readFileSync(fullPath);
    md += "[%unnumbered]\n";
    md += "[source,json]";
    md += "\n";
    md += "----";
    md += "\n";
    md += contents;
    md += "\n";
    md += "----";
    md += "\n";
  } catch (error) {
    md += error;
    console.log(error);
  }
  return md;
};

module.exports = StyleAdoc;
