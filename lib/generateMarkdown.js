"use strict";
var defined = require('./defined');
var defaultValue = require('./defaultValue');

module.exports = generateMarkdown;

function generateMarkdown(options) {
    var schema = options.schema;
    var headerLevel = defaultValue(options.headerLevel, 1);
    var markdown = '';
    var value;

    // Verify JSON Schema version
    value = schema['$schema'];
    if (defined(value)) {
        if (value !== 'http://json-schema.org/draft-03/schema') {
            markdown += 'WETZEL_WARNING: only JSON Schema 3 is supported.\n\n'
        }
    }

    // Render title
    value = schema['title'];
    if (defined(value)) {
        markdown += getHeaderMarkdown(headerLevel) + ' ' + value + '\n\n'
    } else {
        markdown += 'WETZEL_WARNING: title not defined.\n\n'
    }

    value = schema['description'];
    if (defined(value)) {
        markdown += value + '\n\n';
    }

    // Render type.
    var schemaType = schema['type'];
    if (defined(schemaType)) {
        markdown += styleType('Type') + ': ' + schemaType + '\n\n';

        // Render each property if the type is object.
        if (schemaType === 'object') {
            // Render table with summary of each property
            markdown += createPropertiesSummary(schema);

            value = schema['additionalProperties'];
            if (defined(value) && !value) {
                markdown += 'Additional properties are not allowed.\n\n'
            } else {
                markdown += 'Additional properties are allowed.\n\n'
            }

            // Render section for each property
            markdown += createPropertiesDetails(schema, headerLevel + 1);
        }
    }

    return markdown;
}

////////////////////////////////////////////////////////////////////////////////

function createPropertiesSummary(schema) {
    var md = '';
    md += stylePropertiesSummary('Properties Summary') + '\n\n';
    md += '||Type|Description|Required|\n';
    md += '|---|---|---|---|\n';

    var properties = schema['properties'];
    for (var name in properties) {
        if (properties.hasOwnProperty(name)) {
            var property = properties[name];
            var summary = getPropertySummary(property);

            md += '|' + stylePropertyNameSummary(name) + '|' + summary.type + '|' + defaultValue(summary.description, '') + '|' + summary.required + '|\n';
        }
    }
    md += '\n';

    return md;
}

function createPropertiesDetails(schema, headerLevel) {
    var headerMd = getHeaderMarkdown(headerLevel);
    var md = '';
    md += stylePropertiesDetails('Properties Details') + '\n\n';

    var properties = schema['properties'];
    for (var name in properties) {
        if (properties.hasOwnProperty(name)) {
            var property = properties[name];
            var summary = getPropertySummary(property);

            md += headerMd + ' ' + name + '\n\n';
            if (defined(summary.description)) {
                md += summary.description + '\n\n';
            }

            md += '* ' + stylePropertyDetails('Type') + ': ' + summary.type + '\n';
            md += '* ' + stylePropertyDetails('Required') + ': ' + summary.required + '\n';

            var type = property['maximum'];
            if (type === 'integer') {
                var minimum = property['minimum'];
                if (defined(minimum)) {
                    md += '* ' + stylePropertyDetails('Minimum') + ': ' + minimum + '\n';
                }

                var maximum = property['maximum'];
                if (defined(maximum)) {
                    md += '* ' + stylePropertyDetails('Maximum') + ': ' + maximum + '\n';
                }
            } else if (type === 'string') {
                var minLength = property['minLength'];
                if (defined(minLength)) {
                    md += '* ' + stylePropertyDetails('Minimum Length') + ': ' + minLength + '\n';
                }
            }

            md += '\n';
        }
    }
    md += '\n';

    return md;
}

function getPropertySummary(property) {
    var type = defaultValue(property['type'], 'WETZEL_WARNING: type not defined');
    if (type === 'array') {
        var insideBrackets = '';
        if ((defined(property.minItems)) && (property.minItems === property.maxItems)) {
            // Min and max are the same so the array is constant size
            insideBrackets = property.minItems;
        } else if (defined(property.minItems) && defined(property.maxItems)) {
            // Min and max define a range
            insideBrackets = property.minItems + '-' + property.maxItems;
        } else if (defined(property.minItems)) {
            // Only min is defined
            insideBrackets = property.minItems + '-*';
        } else if (defined(property.maxItems)) {
            // Only max is defined
            insideBrackets = '*-' + property.maxItems;
        }

        if (defined(property.items) && defined(property.items.type)) {
            type = property.items.type;
        }

        type += '[' + insideBrackets + ']';
    }

    var description = property['description'];

    var required;
    if (defined(property['required']) && (property['required'])) {
        required = 'Yes';
    } else {
        var propertyDefault = property['default'];
        if (defined(propertyDefault)) {
            required = 'No, default: ' + propertyDefault;
        } else {
            required = 'No';
        }
    }

    return {
        type : type,
        description : description,
        required : required
    };
}

////////////////////////////////////////////////////////////////////////////////
// Styles

function getHeaderMarkdown(level) {
    var md = '';
    for (var i = 0; i < level; ++i) {
        md += '#';
    }

    return md;
}

function styleBold(string) {
    return '**' + string + '**';
}

var styleType = styleBold;
var stylePropertiesSummary = styleBold;
var stylePropertyNameSummary = styleBold;
var stylePropertiesDetails = styleBold;
var stylePropertyDetails = styleBold;