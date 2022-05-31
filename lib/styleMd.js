"use strict";
const defined = require("./defined");
const defaultValue = require("./defaultValue");
const Style = require("./style");
const fs = require("fs");
const path = require("path");

const StyleMd = function () {};

StyleMd.prototype = Object.create(Style);

StyleMd.prototype.getHeaderMarkdown = function (level) {
  let md = "";
  const ch = "#";
  for (let i = 0; i < level; ++i) {
    md += ch;
  }
  return md;
};

StyleMd.prototype.createAnchor = function (anchor) {
  return '<a name="' + anchor + '"></a>\n';
};

StyleMd.prototype.getSectionMarkdown = function (level, title, anchor) {
  let md = "";
  md += "---------------------------------------\n";
  md += this.createAnchor(anchor);
  md += this.getHeaderMarkdown(level) + " " + title + "\n\n";
  return md;
};

StyleMd.prototype.bulletItem = function (item, indentationLevel) {
  indentationLevel = defaultValue(indentationLevel, 0);
  return " ".repeat(indentationLevel * 4) + "* " + item + "\n";
};

StyleMd.prototype.getInternalLinkMarkdown = function (string, link) {
  if (!defined(string) || string.length === 0) {
    return "";
  } else if (!defined(link) || link.length === 0) {
    return string;
  }
  return "[" + string + "](" + link + ")";
};

StyleMd.prototype.getExternalLinkMarkdown = function (string, link) {
  if (!defined(string) || string.length === 0) {
    return "";
  } else if (!defined(link) || link.length === 0) {
    return string;
  }
  return "[" + string + "](" + link + ")";
};

StyleMd.prototype.beginTable = function (title, columnList) {
  let md = "";
  md += this.styleBold(title) + "\n\n";
  md += "|" + columnList.join("|") + "|\n";
  md += "|---".repeat(columnList.length) + "|\n";
  return md;
};

StyleMd.prototype.addTableRow = function (data) {
  return "|" + data.join("|") + "|\n";
};

StyleMd.prototype.endTable = function () {
  return "\n";
};

StyleMd.prototype.styleMinMax = function (code) {
  if (defined(code)) {
    // The object might be a string or it might be a number or something else.
    // Let's make sure it's a string first.
    const stringified = code.toString();
    if (stringified.length > 0) {
      return this.styleCode(stringified);
    }
  }
  return "";
};

StyleMd.prototype.embedJsonSchema = function (directory, fileName) {
  let md = "";
  if (!defined(directory)) {
    directory = "";
  } else if (!directory.endsWith("/")) {
    directory += "/";
  }
  md += this.getExternalLinkMarkdown(fileName, directory + fileName) + "\n";
  return md;
};

StyleMd.prototype.inlineJsonSchema = function (directory, fileName) {
  let md = "";
  try {
    const fullPath = path.join(directory ? directory : "", fileName);
    const contents = fs.readFileSync(fullPath);
    md += "```json";
    md += "\n";
    md += contents;
    md += "\n";
    md += "```";
    md += "\n";
  } catch (error) {
    md += error;
    console.log(error);
  }
  return md;
};

module.exports = StyleMd;
