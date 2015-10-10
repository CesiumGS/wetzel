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
    var md = '';
    var value;

    schema = replaceRef(basePath, schema);
    extend(schema);

    // Verify JSON Schema version
    value = schema['$schema'];
    if (defined(value)) {
        if (value !== 'http://json-schema.org/draft-03/schema') {
            md += 'WETZEL_WARNING: only JSON Schema 3 is supported.\n\n'
        }
    }

    // Render title
    var title = defaultValue(schema['title'], 'WETZEL_WARNING: title not defined');
    md += getHeaderMarkdown(headerLevel) + ' ' + title + '\n\n'

    // Render description
    value = schema['description'];
    if (defined(value)) {
        md += value + '\n\n';
    }

    // Render type
    var schemaType = schema['type'];
    if (defined(schemaType)) {
        md += styleType('Type') + ': ' + styleTypeValue(schemaType) + '\n\n';
    }

    // TODO: Add plugin point for custom JSON schema properties like gltf_*
    var webgl = schema['gltf_webgl'];
    if (defined(webgl)) {
        md += stylePropertyGltfWebGL('Related WebGL functions') + ': ' + webgl + '\n\n';
    }

    // Render each property if the type is object
    if (schemaType === 'object') {
        // Render table with summary of each property
        md += createPropertiesSummary(schema);

        value = schema['additionalProperties'];
        if (defined(value) && !value) {
            md += 'Additional properties are not allowed.\n\n'
        } else {
            md += 'Additional properties are allowed.\n\n'
            // TODO: display their schema
        }

        // Render section for each property
        md += createPropertiesDetails(schema, title, headerLevel + 1);
    }

    return md;
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
                  '|' + (summary.required === 'Yes' ? requiredIcon : '') + summary.required + '|\n';
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

            md += headerMd + ' ' + title + '.' + name + (summary.required === 'Yes' ? requiredIcon : '') + '\n\n';
            if (defined(summary.description)) {
                md += summary.description + '\n\n';
            }

            md += '* ' + stylePropertyDetails('Type') + ': ' + styleTypeValue(summary.type) + '\n';

            var uniqueItems = property['uniqueItems'];
            if (defined(uniqueItems) && uniqueItems) {
            	md += '   * Each element in the array must be unique.\n';
            }

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

            // TODO: Add plugin point for custom JSON schema properties like gltf_*
            var webgl = property['gltf_webgl'];
            if (defined(webgl)) {
                md += '* ' + stylePropertyGltfWebGL('Related WebGL functions') + ': ' + webgl + '\n';
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
        	var defaultString;
        	if (!Array.isArray(propertyDefault)) {
        		defaultString = propertyDefault;
        	} else {
        		defaultString = '[' + propertyDefault.toString() + ']';
        	}

            required = 'No, default: ' + styleDefaultValue(defaultString, type);
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
var stylePropertyGltfWebGL = styleBold;
var styleDefaultValue = styleCodeType;
var styleEnumElement = styleCodeType;

var requiredIcon = ' :white_check_mark: ';

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