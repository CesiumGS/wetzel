"use strict";
var path = require('path');
var defined = require('./defined');
var defaultValue = require('./defaultValue');
var sortObject = require('./sortObject');
var style = require('./style');
var schema3 = require('./schema3Resolver');
var schema4 = require('./schema4Resolver');
var enums = require('./enums');

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
    options.searchPath = defaultValue(options.searchPath, ['']);

    // Verify JSON Schema version
    var schemaRef = schema.$schema;
    var resolved = null;
    if (defined(schemaRef)) {
        if (schemaRef === 'http://json-schema.org/draft-03/schema') {
            resolved = schema3.resolve(schema, options.fileName, options.searchPath, options.ignorableTypes, options.debug);
        }
        else if (schemaRef === 'http://json-schema.org/draft-04/schema') {
            resolved = schema4.resolve(schema, options.fileName, options.searchPath, options.ignorableTypes, options.debug);
        }
        else {
            resolved = schema3.resolve(schema, options.fileName, options.searchPath, options.ignorableTypes, options.debug);
            md += '> WETZEL_WARNING: Only JSON Schema 3 or 4 is supported. Treating as Schema 3.\n\n';
        }
    }

    schema = resolved.schema;
    var orderedTypes = sortObject(resolved.referencedSchemas);
    for (let type in orderedTypes) {
        orderedTypes[type].children.sort();
    }

    // We need the reverse-sorted version so that when we do type searching we find the longest type first.
    var orderedTypesDescending = sortObject(resolved.referencedSchemas, false);

    md += getTableOfContentsMarkdown(schema, orderedTypes, options.headerLevel, options.rootObject);

    for (let type in orderedTypes) {
        md += '\n\n';
        md += getSchemaMarkdown(
            orderedTypes[type].schema,
            orderedTypes[type].fileName,
            options.headerLevel + 1,
            options.suppressWarnings,
            options.schemaRelativeBasePath,
            orderedTypesDescending,
            options.autoLink);
    }

    return md;
}

////////////////////////////////////////////////////////////////////////////////

/**
* @function getTableOfContentsMarkdown
* Print a table of contents indicating (and linking to) all of the types that are documented
* @param  {object} schema       The root schema that the documentation is for.
* @param  {object} orderedTypes The ordered collection of types for the TOC.
* @param  {int} headerLevel     The level that the header for the TOC should be displayed at.
* @return {string} The markdown for the table of contents.
*/
function getTableOfContentsMarkdown(schema, orderedTypes, headerLevel, showRootObject) {
    var md = style.getHeaderMarkdown(headerLevel) + ' Objects\n';
    var parentFile = orderedTypes[schema.title].fileName;
    for (var type in orderedTypes) {
        // Regardless of what the user chooses for how types are auto-linked, we'll always
        // link the table-of-contents options.
        if (type === schema.title || orderedTypes[type].parents.length > 1 
                || orderedTypes[type].parents.indexOf(schema.title) !== -1 
                || orderedTypes[type].fileName === parentFile) {
            md += style.bulletItem(style.linkType(style.typeValue(type), type, enums.autoLinkOption.codeQuoteOnly) + (showRootObject && type === schema.title ? ' (root object)' : ''));
            if (type !== schema.title) {
                md += getRecursiveTOC(orderedTypes, type, 1);
            }
        }
    }
    return md;
}

/**
* @function getRecursiveTOC
* Appends children elements to the table of contents, if and only if the child has a single parent
* @param  {object} orderedTypes The ordered collection of types for the TOC.
* @param  {string} parentType   A string that contains the type of the parent object.
* @param  {int} depth           The number of indentation levels that should be applied.
* @return {string} The markdown for the table of contents.
*/
function getRecursiveTOC(orderedTypes, parentType, depth) {
    var md = '';
    for (var i = 0; i < orderedTypes[parentType].children.length; i++) {
        var currentType = orderedTypes[parentType].children[i];
        if (orderedTypes[currentType].parents.length === 1) {
            md += style.bulletItem(style.getTOCLink(currentType.replace(parentType + " ", ""), currentType), depth);
            md += getRecursiveTOC(orderedTypes, currentType, depth + 1);
        }
    }
    return md;
}

/**
* @function getSchemaMarkdown
* Gets the markdown for the first-class elements of a schema.
* @param  {object} schema                 The schema being converted to markdown.
* @param  {string} fileName               The filename of the schema being converted to markdown.
* @param  {int} headerLevel               The starting level for the headers.
* @param  {boolean} suppressWarnings      Indicates if wetzel warnings should be printed in the documentation.
* @param  {string} schemaRelativeBasePath The path, relative to where this documentation lives, that the schema files can be found.
* Leave as null if you don't want the documentation to link to the schema files.
* @param  {object} knownTypes             The dictionary of types and their schema information.
* @param  {string} autoLink               Enum value indicating how the auto-linking should be handled.
* @return {string}                        The markdown for the schema.
*/
function getSchemaMarkdown(schema, fileName, headerLevel, suppressWarnings, schemaRelativeBasePath, knownTypes, autoLink) {
    var md = '';

    if (schema === undefined) {
        return md;
    }

    // Render section header
    var title = defaultValue(schema.title, suppressWarnings ? '' : 'WETZEL_WARNING: title not defined');
    md += style.getSectionMarkdown(title, headerLevel);

    // Render description
    var value = autoLinkDescription(schema.description, knownTypes, autoLink);
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
        md += createPropertiesSummary(schema, knownTypes, autoLink);

        value = schema.additionalProperties;
        if (defined(value) && !value) {
            md += 'Additional properties are not allowed.\n\n';
        } else if (defined(value) && (typeof value === 'object')) {
            var additionalPropertiesType = getPropertyType(value);
            md += 'Additional properties are allowed.\n\n';
            if (defined(additionalPropertiesType)) {
                // TODO: additionalProperties is really a full schema
                var formattedType = formatType(additionalPropertiesType, value, autoLink);
                if (defined(value.title)) {
                    formattedType = style.linkType(style.typeValue(value.title), value.title, autoLink);
                }

                md += '* ' + style.propertyDetails('Type of each property') + ': ' + formattedType + '\n';
            }
        } else {
            md += 'Additional properties are allowed.\n\n';
        }

        // Render section for each property
        md += createPropertiesDetails(schema, title, headerLevel + 1, knownTypes, autoLink);
    } else if (defined(schemaRelativeBasePath)) {
        md += style.bulletItem(style.bold('JSON schema') + ': ' + style.getLinkMarkdown(style.getCodeMarkdown(fileName), path.join(schemaRelativeBasePath, fileName).replace(/\\/g, '/'))) + '\n';

        // TODO: figure out how to auto-determine example reference
        //* **Example**: [bufferViews.json](schema/examples/bufferViews.json)
    }

    return md;
}

////////////////////////////////////////////////////////////////////////////////

function createPropertiesSummary(schema, knownTypes, autoLink) {
    var md = '';

    if (schema.properties !== undefined && Object.keys(schema.properties).length > 0) {
        md += style.propertiesSummary('Properties') + '\n\n';
        md += '|   |Type|Description|Required|\n';
        md += '|---|----|-----------|--------|\n';

        var properties = schema.properties;
        for (var name in properties) {
            if (properties.hasOwnProperty(name)) {
                var property = properties[name];
                var summary = getPropertySummary(property, knownTypes, autoLink);

                md += '|' + style.propertyNameSummary(name) +
                    '|' + summary.formattedType +
                    '|' + defaultValue(summary.description, '') +
                    '|' + (summary.required === 'Yes' ? style.requiredIcon : '') + summary.required + '|\n';
            }
        }

        md += '\n';
    }

    return md;
}

function createPropertiesDetails(schema, title, headerLevel, knownTypes, autoLink) {
    var headerMd = style.getHeaderMarkdown(headerLevel);
    var md = '';

    var properties = schema.properties;
    for (var name in properties) {
        if (properties.hasOwnProperty(name)) {
            var property = properties[name];
            var summary = getPropertySummary(property, knownTypes, autoLink);
            var type = summary.type;

            var variableTitle = title.replace(/ /g, '');
            md += headerMd + ' ' + variableTitle + '.' + name + (summary.required === 'Yes' ? style.requiredIcon : '') + '\n\n';

            // TODO: Add plugin point for custom JSON schema properties like gltf_*
            var detailedDescription = autoLinkDescription(property.gltf_detailedDescription, knownTypes, autoLink);
            if (defined(detailedDescription)) {
                md += detailedDescription + '\n\n';
            } else if (defined(summary.description)) {
                md += summary.description + '\n\n';
            }

            md += '* ' + style.propertyDetails('Type') + ': ' + summary.formattedType + '\n';

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

                var itemsString = getEnumString(items, type, 2);
                if (defined(itemsString)) {
                    md += '   * Each element in the array must be one of the following values:\n' + itemsString;
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

            var enumString = getEnumString(property, type, 1);
            if (defined(enumString)) {
                md += '* ' + style.propertyDetails('Allowed values') + ':\n' + enumString;
            }

            var additionalProperties = property.additionalProperties;
            if (defined(additionalProperties) && (typeof additionalProperties === 'object')) {
                var additionalPropertiesType = getPropertyType(additionalProperties);
                if (defined(additionalPropertiesType)) {
                    // TODO: additionalProperties is really a full schema
                    var formattedType = formatType(additionalPropertiesType, additionalProperties, autoLink);
                    if ((additionalProperties.type === 'object') && defined(property.title)) {
                        formattedType = style.linkType(property.title, property.title, autoLink);
                    }

                    md += '* ' + style.propertyDetails('Type of each property') + ': ' + formattedType + '\n';
                }
            }

            // TODO: Add plugin point for custom JSON schema properties like gltf_*
            var webgl = property.gltf_webgl;
            if (defined(webgl)) {
                md += '* ' + style.propertyGltfWebGL('Related WebGL functions') + ': ' + webgl + '\n';
            }

            md += '\n';
        }
    }
    md += '\n';

    return md;
}

function formatArrayType(type, property, autoLink) {
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

    var arrayInfo = '[' + insideBrackets + ']';

    var formattedType = '';
    if (defined(property.items) && defined(property.items.type)) {
        if ((property.items.type === 'object') && defined(property.items.title)) {
            type = property.items.title;
            formattedType = style.linkType(type, type, autoLink) + ' ';

            type += arrayInfo;
            formattedType += style.typeValue(arrayInfo);
        } else {
            type = property.items.type;
            formattedType = style.typeValue(type) + ' ';

            type += arrayInfo;
            formattedType += style.typeValue(arrayInfo);
        }
    } else {
        type += arrayInfo;
        formattedType = style.typeValue(type);
    }

    return formattedType;
}

function formatType(type, property, autoLink) {
    if (Array.isArray(type)) {
        var formattedType = '';
        for (var i in type) {
            if (type[i] instanceof Object) {
                formattedType += formatArrayType(type[i]['type'], type[i], autoLink) + ', ';
            } else {
                formattedType += style.typeValue(type[i]) + ', ';
            }
        }
        return formattedType.slice(0, -2);
    }

    if (type === 'array') {
        return formatArrayType(type, property, autoLink);
    }

    return style.typeValue(type);
}

function getPropertySummary(property, knownTypes, autoLink) {
    var type = defaultValue(getPropertyType(property), 'any');
    var formattedType = formatType(type, property, autoLink);
    var description = autoLinkDescription(property.description, knownTypes, autoLink);

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
        formattedType: formattedType,
        description: description,
        required: required
    };
}

/**
 * @function getEnumString
 * Gets the string describing the possible enum values.
 * Will try getting the information from the enum/gltf_enumNames properties, but if they don't exist,
 * it will fall back to trying to get the values from the anyOf object.
 * @param  {object} schema The schema object that may be of an enum type.
 * @param  {string} type The name of the object type for the enum values (e.g. string, integer, etc..)
 * @param  {integer} depth How deep the bullet points for enum values should be.  Maximum is 2.
 * @return {string} A string that enumerates all the possible enum values for this schema object.
 */
function getEnumString(schema, type, depth) {
    var propertyEnum = schema['enum'];
    if (!defined(propertyEnum)) {
        // It's possible that the enum value is defined using the anyOf construct instead.
        return getAnyOfEnumString(schema, type, depth);
    }

    var propertyEnumNames = schema['gltf_enumNames'];

    var allowedValues = '';
    var length = propertyEnum.length;
    for (var i = 0; i < length; ++i) {
        var element = style.enumElement(propertyEnum[i], type);
        if (defined(propertyEnumNames)) {
            element += " " + propertyEnumNames[i];
        }

        allowedValues += style.bulletItem(element, depth);
    }
    return allowedValues;
}

/**
 * @function getAnyOfEnumString
 * Gets the string describing the possible enum values, if they are defined within a JSON anyOf object.
 * @param  {object} schema The schema object that may be of an enum type.
 * @param  {string} type The name of the object type for the enum values (e.g. string, integer, etc..)
 * @param  {integer} depth How deep the bullet points for enum values should be.  Maximum is 2.
 * @return {string} A string that enumerates all the possible enum values for this schema object.
 */
function getAnyOfEnumString(schema, type, depth) {
    var propertyAnyOf = schema['anyOf'];
    if (!defined(propertyAnyOf)) {
        return undefined;
    }

    var allowedValues = '';
    var length = propertyAnyOf.length;
    for (var i = 0; i < length; ++i) {
        var element = propertyAnyOf[i];
        var enumValue = element['enum'];
        var enumDescription = element['description'];

        // The likely scenario when there's no enum value is that it's the object
        // containing the _type_ of the enum.  Otherwise, it should be an array with
        // a single value in it.
        if (!defined(enumValue) || !Array.isArray(enumValue) || enumValue.length === 0) {
            continue;
        }

        var enumString = style.enumElement(enumValue[0], type);
        if (defined(enumDescription)) {
            enumString += " " + enumDescription;
        }

        allowedValues += style.bulletItem(enumString, depth);
    }

    return allowedValues;
}

/**
 * @function getPropertyType
 * Determines the type of of a property, taking into account that it
 * might be defined within an anyOf property for enum values.
 * @param  {object} schema The schema object that may be of an enum type.
 * @return {string} The type of the enum
 */
function getPropertyType(schema) {
    // For non-anyOf enum types, the type will be a regular property on the object.
    var type = schema.type;
    if (defined(type)) {
        return type;
    }

    var i;
    var length;
    var propertyOneOf = schema['oneOf'];
    if (defined(propertyOneOf)) {
        type = [];
        length = propertyOneOf.length;
        for (i = 0; i < length; ++i) {
            var property = propertyOneOf[i];
            var oneOfType = property['type'];
            if (defined(oneOfType)) {
                if (oneOfType === 'array') {
                    type.push(property);
                } else {
                    type.push(oneOfType);
                }
            }
        }

        return type;
    }

    // For enums stored using anyOf, we'll need to get it from within anyOf.
    var propertyAnyOf = schema['anyOf'];
    if (!defined(propertyAnyOf)) {
        return undefined;
    }

    // The type will be defined as one of the objects contained within
    // the anyOf property, and the only property within that object with
    // a property name "type" indicating the type of the enum value.
    length = propertyAnyOf.length;
    for (i = 0; i < length; ++i) {
        type = propertyAnyOf[i]['type'];
        if (defined(type)) {
            break;
        }
    }

    return type;
}

/**
* @function autoLinkDescription
* This will take a string that describes a type that may potentially reference _other_ types, and then
* automatically add markdown link references to those other types inline. This is an admittedly simple
* (and potentially buggy) approach to the problem, but seems sufficient.
* @param  {string} description The string that should be auto-linked
* @param  {string[]} knownTypes  Array of known strings that are types that should be auto-linked if found.
* If there are multiple types with the same starting root string, it's imperative that the array is sorted such that the longer names are ordered first.
* @param  {string} autoLink Enum value indicating how the auto-linking should be handled.
* @return {string} The auto-linked description.
*/
function autoLinkDescription(description, knownTypes, autoLink) {
    for (var type in knownTypes) {
        description = style.linkType(description, type, autoLink);
    }

    return description;
}
