"use strict";
var fs = require('fs');
var path = require('path');
var defined = require('./defined');
var defaultValue = require('./defaultValue');
var clone = require('./clone');
var style = require('./style');
var schema3 = require('./schema3Resolver');
var schema4 = require('./schema4Resolver');

module.exports = generateMarkdown;

/**
* @function generateMarkdown
* Generates the markdown content to represent the json schema provided within the options parameter.
* @param  {object} options - The set of configuration options to be fed into the generator.
* @return {string} The full markdown content based on the requested options.
*/
function generateMarkdown(options) {
    var md = '';
    var schema = options.schema;
    options.basePath = defaultValue(options.basePath, '');

    // Verify JSON Schema version
    var schemaRef = schema.$schema;
    if (defined(schemaRef)) {
        if (schemaRef === 'http://json-schema.org/draft-03/schema') {
            schema = schema3.resolve(schema, options.basePath, options.debug);
        }
        else if (schemaRef === 'http://json-schema.org/draft-04/schema') {
            schema = schema4.resolve(schema, options.basePath, options.debug);
        }
        else
        {
            schema = schema3.resolve(schema, options.basePath, options.debug);
            md += '> WETZEL_WARNING: Only JSON Schema 3 or 4 is supported. Treating as Schema 3.\n\n';
        }
    }

    // Render title
    var title = defaultValue(schema.title, options.suppressWarnings ? '' : 'WETZEL_WARNING: title not defined');
    md += style.getHeaderMarkdown(options.headerLevel) + ' ' + title + '\n\n';

    // Render description
    var value = schema.description;
    if (defined(value)) {
        md += value + '\n\n';
    }

    // Render type
    var schemaType = schema.type;
    if (defined(schemaType)) {
        //      md += styleType('Type') + ': ' + style.typeValue(schemaType) + '\n\n';
    }

    // TODO: Add plugin point for custom JSON schema properties like gltf_*
    var webgl = schema.gltf_webgl;
    if (defined(webgl)) {
        md += style.propertyGltfWebGL('Related WebGL functions') + ': ' + webgl + '\n\n';
    }

    // Render each property if the type is object
    if (schemaType === 'object') {
        // Render table with summary of each property
        md += createPropertiesSummary(schema, options.suppressWarnings);

        value = schema.additionalProperties;
        if (defined(value) && !value) {
            md += 'Additional properties are not allowed.\n\n';
        } else {
            md += 'Additional properties are allowed.\n\n';
            // TODO: display their schema
        }

        // Render section for each property
        md += createPropertiesDetails(schema, '', options.headerLevel + 1, options.suppressWarnings);
    }

    return md;
}

////////////////////////////////////////////////////////////////////////////////

function createPropertiesSummary(schema, suppressWarnings) {
    var md = '';
    md += style.propertiesSummary('Properties') + '\n\n';
    md += '|   |Type|Description|Required|\n';
    md += '|---|----|-----------|--------|\n';

    var propertiesKeys = ['properties', 'patternProperties'];

    for (var i = 0; i < propertiesKeys.length; i++) {
        var properties = schema[propertiesKeys[i]];
        // console.log(properties);

        for (var name in properties) {
            if (properties.hasOwnProperty(name)) {
                var property = properties[name];
                var summary = getPropertySummary(property, suppressWarnings);

                // if (property.type === 'object') {
                //     md += createPropertiesSummary(property, suppressWarnings);
                // }

                md += '|' + style.propertyNameSummary(name) +
                    '|' + style.typeValue(summary.type) +
                    '|' + defaultValue(summary.description, '') +
                    '|' + (summary.required === 'Yes' ? style.requiredIcon : '') + summary.required + '|\n';
            }
        }
        md += '\n';
    }

    return md;
}

function createPropertiesDetails(schema, title, headerLevel, suppressWarnings) {
    var headerMd = style.getHeaderMarkdown(headerLevel);
    var md = '';

    var propertiesKeys = ['properties', 'patternProperties'];
    for (var i = 0; i < propertiesKeys.length; i++) {
        var properties = schema[propertiesKeys[i]];
        for (var name in properties) {
            if (properties.hasOwnProperty(name)) {
                var property = properties[name];
                var type = property.type;
                var summary = getPropertySummary(property, suppressWarnings);
                var objectPath = title + '.' + name;

                md += headerMd + ' ' + '`' + objectPath + '`' + (summary.required === 'Yes' ? style.requiredIcon : '') + '\n\n';

                // TODO: Add plugin point for custom JSON schema properties like gltf_*
                var detailedDescription = property.gltf_detailedDescription;
                if (defined(detailedDescription)) {
                    md += detailedDescription + '\n\n';
                } else if (defined(summary.description)) {
                    md += summary.description + '\n\n';
                }

                md += '* ' + style.propertyDetails('Type') + ': ' + style.typeValue(summary.type) + '\n';

                var uniqueItems = property.uniqueItems;
                if (defined(uniqueItems) && uniqueItems) {
                    md += '   * Each element in the array must be unique.\n';
                }

                // TODO: items is a full schema
                var items = property.items;
                if (defined(items)) {
                    var itemsExclusiveMinimum = (defined(items.exclusiveMinimum) && items.exclusiveMinimum);
                    var minString = itemsExclusiveMinimum ? 'greater than' : 'greater than or equal to';

                    var itemsExclusiveMaximum = (defined(items.exclusiveMaximum) && items.exclusiveMaximum);
                    var maxString = itemsExclusiveMaximum ? 'less than' : 'less than or equal to';

                    if (defined(items.minimum) && defined(items.maximum)) {
                        md += '   * Each element in the array must be ' + minString + ' ' + style.minMax(items.minimum) + ' and ' + maxString + ' ' + style.minMax(items.maximum) + '.\n';
                    } else if (defined(items.minimum)) {
                        md += '   * Each element in the array must be ' + minString + ' ' + style.minMax(items.minimum) + '.\n';
                    } else if (defined(items.maximum)) {
                        md += '   * Each element in the array must be ' + maxString + ' ' + style.minMax(items.maximum) + '.\n';
                    }

                    if (defined(items.minLength) && defined(items.maxLength)) {
                        md += '   * Each element in the array must have length between ' + style.minMax(items.minLength) + ' and ' + style.minMax(items.maxLength) + '.\n';
                    } else if (defined(items.minLength)) {
                        md += '   * Each element in the array must have length greater than or equal to ' + style.minMax(items.minLength) + '.\n';
                    } else if (defined(items.maxLength)) {
                        md += '   * Each element in the array must have length less than or equal to ' + style.minMax(items.maxLength) + '.\n';
                    }

                    var itemsString = getEnumString(items, type);
                    if (defined(itemsString)) {
                        md += '   * Each element in the array must be one of the following values: ' + itemsString + '.\n';
                    }
                }

                md += '* ' + style.propertyDetails('Required') + ': ' + summary.required + '\n';

                var minimum = property.minimum;
                if (defined(minimum)) {
                    var exclusiveMinimum = (defined(property.exclusiveMinimum) && property.exclusiveMinimum);
                    md += '* ' + style.propertyDetails('Minimum') + ': ' + style.minMax((exclusiveMinimum ? ' > ' : ' >= ') + minimum) + '\n';
                }

                var maximum = property.maximum;
                if (defined(maximum)) {
                    var exclusiveMaximum = (defined(property.exclusiveMaximum) && property.exclusiveMaximum);
                    md += '* ' + style.propertyDetails('Maximum') + ': ' + style.minMax((exclusiveMaximum ? ' < ' : ' <= ') + maximum) + '\n';
                }

                var format = property.format;
                if (defined(format)) {
                    md += '* ' + style.propertyDetails('Format') + ': ' + format + '\n';
                }

                // TODO: maxLength
                var minLength = property.minLength;
                if (defined(minLength)) {
                    md += '* ' + style.propertyDetails('Minimum Length') + style.minMax(': >= ' + minLength) + '\n';
                }

                var enumString = getEnumString(property, type);
                if (defined(enumString)) {
                    md += '* ' + style.propertyDetails('Allowed values') + ': ' + enumString + '\n';
                }

                var additionalProperties = property.additionalProperties;
                if (defined(additionalProperties) && (typeof additionalProperties === 'object')) {
                    if (defined(additionalProperties.type)) {
                        // TODO: additionalProperties is really a full schema
                        md += '* ' + style.propertyDetails('Type of each property') + ': ' + style.typeValue(additionalProperties.type) + '\n';
                    }
                }

                // TODO: Add plugin point for custom JSON schema properties like gltf_*
                var webgl = property.gltf_webgl;
                if (defined(webgl)) {
                    md += '* ' + style.propertyGltfWebGL('Related WebGL functions') + ': ' + webgl + '\n';
                }

                md += '\n';

                if (type === 'object') {
                    var subTitle = defaultValue(objectPath, suppressWarnings ? '' : 'WETZEL_WARNING: title not defined');
                    md += createPropertiesDetails(property, subTitle, headerLevel + 1, suppressWarnings);
                }
            }
        }
    }
    md += '\n';

    return md;
}

function getPropertySummary(property, suppressWarnings) {
    var type = defaultValue(property.type, suppressWarnings ? '' : 'WETZEL_WARNING: type not defined');
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

    var description = property.description;

    var required;
    if (defined(property.required) && (property.required)) {
        required = 'Yes';
    } else {
        var propertyDefault = property.default;
        if (defined(propertyDefault)) {
            var defaultString;
            if (Array.isArray(propertyDefault)) {
                defaultString = '[' + propertyDefault.toString() + ']';
            } else if (typeof propertyDefault === 'object') {
                defaultString = JSON.stringify(propertyDefault);
            } else {
                defaultString = propertyDefault;
            }

            required = 'No, default: ' + style.defaultValue(defaultString, type);
        } else {
            required = 'No';
        }
    }

    return {
        type: type,
        description: description,
        required: required
    };
}

function getEnumString(schema, type) {
    var propertyEnum = schema['enum'];
    if (!defined(propertyEnum)) {
        return undefined;
    }

    var propertyEnumNames = schema['gltf_enumNames'];

    var allowedValues = '';
    var length = propertyEnum.length;
    for (var i = 0; i < length; ++i) {
        var element = propertyEnum[i];
        if (defined(propertyEnumNames)) {
            element += " (" + propertyEnumNames[i] + ")";
        }

        allowedValues += style.enumElement(element, type);
        if (i !== length - 1) {
            allowedValues += ', ';
        }
    }
    return allowedValues;
}
