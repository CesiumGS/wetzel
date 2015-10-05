"use strict";
var fs = require('fs');
var path = require('path');
var defined = require('./defined');
var defaultValue = require('./defaultValue');
var clone = require('./clone');

module.exports = generateMarkdown;

function generateMarkdown(options) {
    var schema = options.schema;
    var basePath = defaultValue(options.basePath, '');
    var headerLevel = defaultValue(options.headerLevel, 1);
    var markdown = '';
    var value;

    schema = replaceRef(basePath, schema);
    extend(schema);

    // Verify JSON Schema version
    value = schema['$schema'];
    if (defined(value)) {
        if (value !== 'http://json-schema.org/draft-03/schema') {
            markdown += 'WETZEL_WARNING: only JSON Schema 3 is supported.\n\n'
        }
    }

    // Render title
    var title = defaultValue(schema['title'], 'WETZEL_WARNING: title not defined');
    markdown += getHeaderMarkdown(headerLevel) + ' ' + title + '\n\n'

    // Render description
    value = schema['description'];
    if (defined(value)) {
        markdown += value + '\n\n';
    }

    // Render type
    var schemaType = schema['type'];
    if (defined(schemaType)) {
        markdown += styleType('Type') + ': ' + styleTypeValue(schemaType) + '\n\n';

        // Render each property if the type is object
        if (schemaType === 'object') {
            // Render table with summary of each property
            markdown += createPropertiesSummary(schema);

            value = schema['additionalProperties'];
            if (defined(value) && !value) {
                markdown += 'Additional properties are not allowed.\n\n'
            } else {
                markdown += 'Additional properties are allowed.\n\n'
                // TODO: display their schema
            }

            // Render section for each property
            markdown += createPropertiesDetails(schema, title, headerLevel + 1);
        }
    }

    return markdown;
}

////////////////////////////////////////////////////////////////////////////////

function createPropertiesSummary(schema) {
    var md = '';
    md += stylePropertiesSummary('Properties') + '\n\n';
    md += '|   |Type|Description|Required|\n';
    md += '|---|----|-----------|--------|\n';

    var properties = schema['properties'];
    for (var name in properties) {
        if (properties.hasOwnProperty(name)) {
            var property = properties[name];
            var summary = getPropertySummary(property);

            md += '|' + stylePropertyNameSummary(name) +
                  '|' + styleTypeValue(summary.type) +
                  '|' + defaultValue(summary.description, '') +
                  '|' + summary.required + '|\n';
        }
    }
    md += '\n';

    return md;
}

function createPropertiesDetails(schema, title, headerLevel) {
    var headerMd = getHeaderMarkdown(headerLevel);
    var md = '';

    var properties = schema['properties'];
    for (var name in properties) {
        if (properties.hasOwnProperty(name)) {
            var property = properties[name];
            var type = property['type'];
            var summary = getPropertySummary(property);

            md += headerMd + ' ' + title + '.' + name + '\n\n';
            if (defined(summary.description)) {
                md += summary.description + '\n\n';
            }

            md += '* ' + stylePropertyDetails('Type') + ': ' + styleTypeValue(summary.type) + '\n';
            md += '* ' + stylePropertyDetails('Required') + ': ' + summary.required + '\n';

            var minimum = property['minimum'];
            if (defined(minimum)) {
                md += '* ' + stylePropertyDetails('Minimum') + ': ' + minimum + '\n';
            }

            var maximum = property['maximum'];
            if (defined(maximum)) {
                md += '* ' + stylePropertyDetails('Maximum') + ': ' + maximum + '\n';
            }

            var format = property['format'];
            if (defined(format)) {
                md += '* ' + stylePropertyDetails('Format') + ': ' + format + '\n';
            }

            var minLength = property['minLength'];
            if (defined(minLength)) {
                md += '* ' + stylePropertyDetails('Minimum Length') + ': ' + minLength + '\n';
            }

            var propertyEnum = property['enum'];
            if (defined(propertyEnum)) {
                var allowedValues = '';
                var length = propertyEnum.length;
                for (var i = 0; i < length; ++i) {
                    allowedValues += styleEnumElement(propertyEnum[i], type);
                    if (i !== length - 1) {
                        allowedValues += ', ';
                    }
                }
                md += '* ' + stylePropertyDetails('Allowed values') + ': ' + allowedValues + '\n';
            }

		    var additionalProperties = property['additionalProperties'];
		    if (defined(additionalProperties) && (typeof additionalProperties === 'object')) {
		    	if (defined(additionalProperties['type'])) {
		    		// TODO: additionalProperties is really a full schema
		    		md += '* ' + stylePropertyDetails('Type of each property') + ': ' + styleTypeValue(additionalProperties['type']) + '\n';
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
            required = 'No, default: ' + styleDefaultValue(propertyDefault, type);
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

function styleCode(string) {
    return '`' + string + '`';
}

function styleCodeType(string, type) {
    if (type === 'string') {
        return '`"' + string + '"`';
    }

    return '`' + string + '`';
}

var styleType = styleBold;
var styleTypeValue = styleCode;
var stylePropertiesSummary = styleBold;
var stylePropertyNameSummary = styleBold;
var stylePropertiesDetails = styleBold;
var stylePropertyDetails = styleBold;
var styleDefaultValue = styleCodeType;
var styleEnumElement = styleCodeType;

////////////////////////////////////////////////////////////////////////////////

function replaceRef(basePath, schema) {
    var ref = schema['$ref'];
    if (defined(ref)) {
        // TODO: $ref could also be absolute.
        var filename = path.join(basePath, ref);
        var refSchema = JSON.parse(fs.readFileSync(filename));
        return replaceRef(basePath, refSchema);
    }

    for (var name in schema) {
        if (schema.hasOwnProperty(name)) {
            if (typeof schema[name] === 'object') {
                schema[name] = replaceRef(basePath, schema[name]);
            }
        }
    }

    return schema;
}

function extend(derived) {
    var base = derived['extends'];
    if (defined(base)) {
        delete derived['extends'];
        // TODO: extends could be an array
        mergeProperties(derived, base);

        extend(derived);
    }

    for (var name in derived) {
        if (derived.hasOwnProperty(name)) {
            if (typeof derived[name] === 'object') {
                extend(derived[name]);
            }
        }
    }
}

function mergeProperties(derived, base) {
    for (var name in base) {
        if (base.hasOwnProperty(name)) {
            var baseProperty = base[name];

            // Inherit from the base schema.  The derived schema overrides if it has the same property.
            if (typeof baseProperty === 'object') {
                derived[name] = defaultValue(derived[name], {});
                var derivedProperty = derived[name];

                for (var n in baseProperty) {
                    if (baseProperty.hasOwnProperty(n)) {
                        if (!defined(derivedProperty[n])) {
                            derivedProperty[n] = clone(baseProperty[n], true);
                        }
                    }
                }
            } else {
                if (!defined(derived[name])) {
                    derived[name] = clone(baseProperty, true);
                }
            }
        }
    }
}