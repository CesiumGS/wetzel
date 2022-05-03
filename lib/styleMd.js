"use strict";
var defined = require('./defined');
var defaultValue = require('./defaultValue');
var enums = require('./enums');
var Style = require('./style');

const StyleMd = function(){};

StyleMd.prototype = Object.create(Style);

StyleMd.prototype.getHeaderMarkdown = function(level) {
    var md = '';
    var ch = '#';
    for (var i = 0; i < level; ++i) {
        md += ch;
    }
    return md;
};

StyleMd.prototype.getSectionMarkdown = function(schema, level, suppressWarnings, embedMode) {
    var md = '';
    md += '---------------------------------------\n';

    var title = defaultValue(schema.title, suppressWarnings ? '' : 'WETZEL_WARNING: title not defined');
    var typeName = schema.typeName;
    if (!defined(typeName)) {
        typeName = title.toLowerCase().replace(/ /g, ".");
    }

    var reference = this.anchorPrefix;
    if (embedMode === enums.embedMode.writeIncludeStatements) {
        reference = this.anchorSchemaPrefix;
        title = 'JSON Schema for ' + title;
    }

    md += '<a name="' + reference + this.createAnchorName(typeName) + '"></a>\n';
    md += this.getHeaderMarkdown(level) + ' ' + title + '\n\n';

    return md;
};

StyleMd.prototype.bulletItem = function(item, indentationLevel) {
    indentationLevel = defaultValue(indentationLevel, 0);
    return (' '.repeat(indentationLevel * 4)) + '* ' + item + '\n';
};

StyleMd.prototype.getLinkMarkdown = function(string, link) {
    if ((!defined(string) || string.length === 0)) {
        return '';
    } else if ((!defined(link) || link.length === 0)) {
        return string;
    }
    return '[' + string + '](' + link + ')';
};

StyleMd.prototype.beginTable = function(title, columnList) {
    var md = '';
    md += this.styleBold(title) + '\n\n';
    md += '|' + columnList.join('|') + '|\n';
    md += '|---'.repeat(columnList.length) + '|\n';
    return md;
};

StyleMd.prototype.addTableRow = function(data) {
    return '|' + data.join('|') + '|\n';
};

StyleMd.prototype.endTable = function() {
    return '\n';
};

StyleMd.prototype.styleMinMax = function(code) {
    if (defined(code)) {
        // The object might be a string or it might be a number or something else.
        // Let's make sure it's a string first.
        var stringified = code.toString();

        if (stringified.length > 0) {
            return this.styleCode(stringified);
        }
    }
    return '';
};

StyleMd.prototype.embedJsonSchema = function(fileName, schemaRelativeBasePath) {
    var md = '';
    if (!defined(schemaRelativeBasePath)) {
        schemaRelativeBasePath = '';
    } else if (!schemaRelativeBasePath.endsWith('/')) {
        schemaRelativeBasePath += '/';
    }
    md += this.getLinkMarkdown(fileName, schemaRelativeBasePath + fileName) + '\n';
    return md;
};

module.exports = StyleMd;

