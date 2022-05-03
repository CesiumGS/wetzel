"use strict";
var defined = require('./defined');
var defaultValue = require('./defaultValue');
var enums = require('./enums');
var Style = require('./style');

const StyleAdoc = function(){};

StyleAdoc.prototype = Object.create(Style);

StyleAdoc.prototype.getHeaderMarkdown = function(level) {
    var md = '';
    var ch = '=';
    for (var i = 0; i < level; ++i) {
        md += ch;
    }
    return md;
};

StyleAdoc.prototype.getSectionMarkdown = function(schema, level, suppressWarnings, embedMode) {
    var md = '';

    // JSON embedded schemas don't get a horizontal rule here, because
    // there will be page breaks between them instead.
    if (embedMode !== enums.embedMode.writeIncludeStatements) {
        md += "'''\n";
    }

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

    md += '[#' + reference + this.createAnchorName(typeName) + ']\n';
    md += this.getHeaderMarkdown(level) + ' ' + title + '\n\n';

    return md;
};

StyleAdoc.prototype.bulletItem = function(item, indentationLevel) {
    indentationLevel = defaultValue(indentationLevel, 0);
    return ('*'.repeat(indentationLevel + 1)) + ' ' + item + '\n';
};

StyleAdoc.prototype.getLinkMarkdown = function(string, link) {
    if ((!defined(string) || string.length === 0)) {
        return '';
    } else if ((!defined(link) || link.length === 0)) {
        return string;
    }
    if (link[0] === '#') {
        return '<<' + link.substring(1) + ',' + string + '>>';
    }
    return 'link:' + link + '[' + string + ']';
};

StyleAdoc.prototype.beginTable = function(title, columnList) {
    var md = '';
    md += '.' + title + '\n';
    md += '|===\n';
    md += '|' + columnList.join('|') + '\n\n';
    return md;
};

StyleAdoc.prototype.addTableRow = function(data) {
    return data.map(d => '|' + d + '\n').join('') + '\n';
};

StyleAdoc.prototype.endTable = function() {
    return '|===\n\n';
};

StyleAdoc.prototype.styleMinMax = function(code) {
    if (defined(code)) {
        // The object might be a string or it might be a number or something else.
        // Let's make sure it's a string first.
        var stringified = code.toString();

        if (stringified.length > 0) {
            stringified = stringified.replace(/</g, '&lt;');
            stringified = stringified.replace(/>/g, '&gt;');
            stringified = stringified.trim();
            return this.styleCode(stringified);
        }
    }
    return '';
};

StyleAdoc.prototype.embedJsonSchema = function(fileName, schemaRelativeBasePath) {
    var md = '';
    if (!defined(schemaRelativeBasePath)) {
        schemaRelativeBasePath = '';
    } else if (!schemaRelativeBasePath.endsWith('/')) {
        schemaRelativeBasePath += '/';
    }

    md += '[source,json]\n';
    md += '----\n';
    md += 'include::' + schemaRelativeBasePath + fileName + '[]\n';
    md += '----\n\n';
    md += "<<<\n";  // Page break between embedded JSON schema files

    return md;
};

module.exports = StyleAdoc;
