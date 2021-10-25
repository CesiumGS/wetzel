"use strict";
var defined = require('./defined');
var defaultValue = require('./defaultValue');
var sortObject = require('./sortObject');
var schema3 = require('./schema3Resolver');
var schema4 = require('./schema4Resolver');
var style = require('./style');
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

    var mode = enums.styleModeOption.Markdown;
    if (defined(options.styleMode) && options.styleMode === 'AsciiDoctor') {
        mode = enums.styleModeOption.AsciiDoctor;
    }
    style.setStyleMode(mode);

    if (defined(options.checkmark)) {
        style.setCheckmark(options.checkmark);
    }

    if (defined(options.mustKeyword)) {
        style.setMustKeyword(options.mustKeyword);
    }

    // Verify JSON Schema version
    var schemaRef = schema.$schema;
    var resolved = null;
    if (defined(schemaRef)) {
        if (schemaRef === 'http://json-schema.org/draft-03/schema') {
            resolved = schema3.resolve(schema, options.fileName, options.searchPath, options.ignorableTypes, options.debug);
        }
        else {
            resolved = schema4.resolve(schema, options.fileName, options.searchPath, options.ignorableTypes, options.debug);
            if ((!options.suppressWarnings) &&
                (schemaRef !== 'http://json-schema.org/draft-04/schema' &&
                schemaRef !== 'http://json-schema.org/draft-07/schema' &&
                schemaRef !== 'https://json-schema.org/draft/2020-12/schema')) {
                md += '> WETZEL_WARNING: Unrecognized JSON Schema.\n\n';
            }
        }
    }

    schema = resolved.schema;
    var orderedTypes = sortObject(resolved.referencedSchemas);
    for (let title in orderedTypes) {
        orderedTypes[title].children.sort();
    }

    // We need the reverse-sorted version so that when we do type searching we find the longest type first.
    var orderedTypesDescending = sortObject(resolved.referencedSchemas, false);

    if (options.writeTOC) {
        md += getTableOfContentsMarkdown(schema, orderedTypes, options.headerLevel);
    }

    for (let title in orderedTypes) {
        md += '\n\n';
        md += getSchemaMarkdown(
            orderedTypes[title].schema,
            orderedTypes[title].fileName,
            options.headerLevel + 1,
            options.suppressWarnings,
            options.schemaRelativeBasePath,
            orderedTypesDescending,
            options.autoLink,
            options.embedMode);
    }

    return md;
}

////////////////////////////////////////////////////////////////////////////////

/**
* @function getTableOfContentsMarkdown
* Print a table of contents indicating (and linking to) all of the types that are documented
* @param  {object} schema       The root schema that the documentation is for.
* @param  {object} orderedTypes The types for the TOC, as an ordered map from schema.title to objects
*                               containing the schema, the file name, parent titles and children titles
* @param  {int} headerLevel     The level that the header for the TOC should be displayed at.
* @return {string} The markdown for the table of contents.
*/
function getTableOfContentsMarkdown(schema, orderedTypes, headerLevel) {
    var md = style.getHeaderMarkdown(headerLevel) + ' Objects\n';
    for (var title in orderedTypes) {
        // Regardless of what the user chooses for how types are auto-linked, we'll always
        // link the table-of-contents options.
        const currentType = orderedTypes[title];
        if (title === schema.title || currentType.parents.length > 1 || currentType.parents.indexOf(schema.title) !== -1) {
            var typeName = currentType.schema.typeName;
            if (!defined(typeName)) {
                typeName = title.toLowerCase().replace(/ /g, ".");
            }
            const item = style.getTOCLink(title, typeName) + (title === schema.title ? ' (root object)' : '');
            md += style.bulletItem(item);
            if (title !== schema.title) {
                md += getRecursiveTOC(orderedTypes, title, 1);
            }
        }
    }
    return md;
}

/**
* @function getRecursiveTOC
* Appends children elements to the table of contents, if and only if the child has a single parent
* @param  {object} orderedTypes The types for the TOC, as an ordered map from schema.title to objects
*                               containing the schema, the file name, parent titles and children titles
* @param  {string} parentTitle    A string that contains the title of the parent object.
* @param  {int} depth             The number of indentation levels that should be applied.
* @return {string} The markdown for the table of contents.
*/
function getRecursiveTOC(orderedTypes, parentTitle, depth) {
    var md = '';
    for (var i = 0; i < orderedTypes[parentTitle].children.length; i++) {
        var currentTitle = orderedTypes[parentTitle].children[i];
        if (orderedTypes[currentTitle].parents.length === 1) {
            const currentType = orderedTypes[currentTitle];
            var typeName = currentType.schema.typeName;
            if (!defined(typeName)) {
                typeName = currentTitle.toLowerCase().replace(/ /g, ".");
            }
            const item = style.getTOCLink(currentTitle.replace(parentTitle + " ", ""), typeName);
            md += style.bulletItem(item, depth);
            md += getRecursiveTOC(orderedTypes, currentTitle, depth + 1);
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
* @param  {string} embedMode              Emum value indicating if we are embedding JSON schema include directives.
* @return {string}                        The markdown for the schema.
*/
function getSchemaMarkdown(schema, fileName, headerLevel, suppressWarnings, schemaRelativeBasePath, knownTypes, autoLink, embedMode) {
    var md = '';

    if (schema === undefined) {
        return md;
    }

    // Render section header
    md += style.getSectionMarkdown(schema, headerLevel, suppressWarnings, embedMode);

    // Check if we're generating an abbreviated document with JSON schema include directives.
    if (embedMode === enums.embedMode.writeIncludeStatements) {
        md += style.embedJsonSchema(fileName, schemaRelativeBasePath);
        return md;
    }

    // Render description
    var value = autoLinkDescription(schema.description, knownTypes, autoLink);
    if (defined(value)) {
        md += value + '\n\n';
    }

    // TODO: Add plugin point for custom JSON schema properties like gltf_*
    var extendedDescription = schema.gltf_sectionDescription;
    if (defined(extendedDescription)) {
        md += autoLinkDescription(extendedDescription, knownTypes, autoLink) + '\n\n';
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
        } else {
            md += 'Additional properties are allowed.\n\n';
            // TODO: display their schema
        }

        // Schema reference
        if (embedMode === enums.embedMode.referenceIncludeDocument) {
            md += style.bulletItem(style.bold('JSON schema') + ': ' + style.getSchemaEmbedLink(fileName, schema)) + '\n';
        } else if (defined(schemaRelativeBasePath)) {
            if (!schemaRelativeBasePath.endsWith('/')) {
                schemaRelativeBasePath += '/';
            }
            md += style.bulletItem(style.bold('JSON schema') + ': ' + style.getLinkMarkdown(fileName, schemaRelativeBasePath.replace(/\\/g, '/') + fileName)) + '\n';
        }

        // Render section for each property
        var title = defaultValue(schema.title, suppressWarnings ? '' : 'WETZEL_WARNING: title not defined');
        md += createPropertiesDetails(schema, title, headerLevel + 1, knownTypes, autoLink);
        md += createExamples(schema, headerLevel + 1);
    }

    return md;
}

////////////////////////////////////////////////////////////////////////////////

function createPropertiesSummary(schema, knownTypes, autoLink) {
    var md = '';

    if (schema.properties !== undefined && Object.keys(schema.properties).length > 0) {
        md += style.beginTable(style.typeValue(schema.title) + ' Properties', ['   ', 'Type', 'Description', 'Required']);

        var properties = schema.properties;
        for (var name in properties) {
            if (properties.hasOwnProperty(name)) {
                var property = properties[name];
                var summary = getPropertySummary(property, knownTypes, autoLink);

                md += style.addTableRow([
                    style.propertyNameSummary(name),
                    summary.formattedType,
                    defaultValue(summary.description, ''),
                    (summary.required === 'Yes' ? style.requiredIcon : '') + summary.required
                ]);
            }
        }

        md += style.endTable();
    }

    return md;
}

function createExamples(schema, headerLevel) {
    var examples = schema.examples;
    if (!defined(examples)) return '';
    var md = style.getHeaderMarkdown(headerLevel) + ' Examples' + '\n\n';
    for (const example of examples) {
        md += style.bulletItem(style.defaultValue(example, schema.type), 1);
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

            var variableTitle = schema.typeName;
            if (!defined(variableTitle)) {
                variableTitle = title;
            }

            md += headerMd + ' ' + variableTitle + '.' + name + '\n\n';

            // TODO: Add plugin point for custom JSON schema properties like gltf_*
            var detailedDescription = autoLinkDescription(property.gltf_detailedDescription, knownTypes, autoLink);
            if (defined(detailedDescription)) {
                md += detailedDescription + '\n\n';
            } else if (defined(summary.description)) {
                md += summary.description + '\n\n';
            }

            md += style.bulletItem(style.propertyDetails('Type') + ': ' + summary.formattedType, 0);

            var eachElementInTheArrayMust = 'Each element in the array' + style.mustKeyword;

            var uniqueItems = property.uniqueItems;
            if (defined(uniqueItems) && uniqueItems) {
                md += style.bulletItem(eachElementInTheArrayMust + 'be unique.', 1);
            }

            // TODO: items is a full schema
            var items = property.items;
            if (defined(items)) {
                // Downgrade newer schemas
                if (defined(items.exclusiveMinimum) && typeof items.exclusiveMinimum === 'number')
                {
                    items.minimum = items.exclusiveMinimum;
                    items.exclusiveMinimum = true;
                }
                if (defined(items.exclusiveMaximum) && typeof items.exclusiveMaximum === 'number')
                {
                    items.maximum = items.exclusiveMaximum;
                    items.exclusiveMaximum = true;
                }

                var itemsExclusiveMinimum = (defined(items.exclusiveMinimum) && items.exclusiveMinimum);
                var minString = itemsExclusiveMinimum ? 'greater than' : 'greater than or equal to';

                var itemsExclusiveMaximum = (defined(items.exclusiveMaximum) && items.exclusiveMaximum);
                var maxString = itemsExclusiveMaximum ? 'less than' : 'less than or equal to';

                if (defined(items.minimum) && defined(items.maximum)) {
                    md += style.bulletItem(eachElementInTheArrayMust + 'be ' + minString + ' ' +
                        style.minMax(items.minimum) + ' and ' + maxString + ' ' + style.minMax(items.maximum) + '.', 1);
                } else if (defined(items.minimum)) {
                    md += style.bulletItem(eachElementInTheArrayMust + 'be ' + minString + ' ' + style.minMax(items.minimum) + '.', 1);
                } else if (defined(items.maximum)) {
                    md += style.bulletItem(eachElementInTheArrayMust + 'be ' + maxString + ' ' + style.minMax(items.maximum) + '.', 1);
                }

                if (defined(items.minLength) && defined(items.maxLength)) {
                    md += style.bulletItem(eachElementInTheArrayMust + 'have length between ' + style.minMax(items.minLength) +
                        ' and ' + style.minMax(items.maxLength) + '.', 1);
                } else if (defined(items.minLength)) {
                    md += style.bulletItem(eachElementInTheArrayMust + 'have length greater than or equal to ' + style.minMax(items.minLength) + '.', 1);
                } else if (defined(items.maxLength)) {
                    md += style.bulletItem(eachElementInTheArrayMust + 'have length less than or equal to ' + style.minMax(items.maxLength) + '.', 1);
                }

                var itemsString = getEnumString(items, type, 2);
                if (defined(itemsString)) {
                    md += style.bulletItem(eachElementInTheArrayMust + 'be one of the following values:', 1) + itemsString;
                }
            }

            md += style.bulletItem(style.propertyDetails('Required') + ': ' + summary.required, 0);

            if (defined(property.exclusiveMinimum) && typeof property.exclusiveMinimum === 'number')
            {
                md += style.bulletItem(style.propertyDetails('Minimum') + ': ' + style.minMax(' > ' + property.exclusiveMinimum), 0);
            } else {
                var minimum = property.minimum;
                if (defined(minimum)) {
                    var exclusiveMinimum = (defined(property.exclusiveMinimum) && property.exclusiveMinimum);
                    md += style.bulletItem(style.propertyDetails('Minimum') + ': ' + style.minMax((exclusiveMinimum ? ' > ' : ' >= ') + minimum), 0);
                }
            }

            if (defined(property.exclusiveMaximum) && typeof property.exclusiveMaximum === 'number')
            {
                md += style.bulletItem(style.propertyDetails('Maximum') + ': ' + style.minMax(' < ' + property.exclusiveMaximum), 0);
            } else {
                var maximum = property.maximum;
                if (defined(maximum)) {
                    var exclusiveMaximum = (defined(property.exclusiveMaximum) && property.exclusiveMaximum);
                    md += style.bulletItem(style.propertyDetails('Maximum') + ': ' + style.minMax((exclusiveMaximum ? ' < ' : ' <= ') + maximum), 0);
                }
            }

            var format = property.format;
            if (defined(format)) {
                md += style.bulletItem(style.propertyDetails('Format') + ': ' + format, 0);
            }

            var pattern = property.pattern;
            if (defined(pattern)) {
                md += style.bulletItem(style.propertyDetails('Pattern') + ': ' + style.minMax(pattern), 0);
            }

            var minLength = property.minLength;
            if (defined(minLength)) {
                md += style.bulletItem(style.propertyDetails('Minimum Length') + style.minMax(': >= ' + minLength), 0);
            }

            var maxLength = property.maxLength;
            if (defined(maxLength)) {
                md += style.bulletItem(style.propertyDetails('Maximum Length') + style.minMax(': <= ' + maxLength), 0);
            }

            var enumString = getEnumString(property, type, 1);
            if (defined(enumString)) {
                md += style.bulletItem(style.propertyDetails('Allowed values') + ':', 0) + enumString;
            }

            var additionalProperties = property.additionalProperties;
            if (defined(additionalProperties) && (typeof additionalProperties === 'object')) {
                var additionalPropertiesType = getPropertyType(additionalProperties);
                if (defined(additionalPropertiesType)) {
                    // TODO: additionalProperties is really a full schema
                    var formattedType = style.typeValue(additionalPropertiesType);
                    if ((additionalProperties.type === 'object') && defined(property.title)) {
                        formattedType = style.linkType(property.title, property.title, autoLink);
                    }

                    md += style.bulletItem(style.propertyDetails('Type of each property') + ': ' + formattedType, 0);
                }
            }

            var examples = property.examples;
            if (defined(examples)) {
                md += style.bulletItem(style.propertyDetails('Examples') + ':');
                for (const example of examples) {
                    md += style.bulletItem(style.defaultValue(example, type), 1);
                }
            }

            // TODO: Add plugin point for custom JSON schema properties like gltf_*
            var webgl = property.gltf_webgl;
            if (defined(webgl)) {
                md += style.bulletItem(style.propertyGltfWebGL('Related WebGL functions') + ': ' + webgl, 0);
            }

            md += '\n';
        }
    }
    md += '\n';

    return md;
}

function getPropertySummary(property, knownTypes, autoLink) {
    var type = defaultValue(getPropertyType(property), 'any');
    var formattedType = style.linkType(style.typeValue(type), type, autoLink);

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

        var arrayInfo = '[' + insideBrackets + ']';

        if (defined(property.items) && defined(property.items.type)) {
            if ((property.items.type === 'object')) {
                type = getPropertyType(property.items);
                formattedType = style.linkType(style.typeValue(type), type, autoLink) + ' ';

                type += arrayInfo;
                formattedType += style.typeValue(arrayInfo);
            } else {
                type = property.items.type;
                formattedType = style.linkType(style.typeValue(type), type, autoLink) + ' ';

                type += arrayInfo;
                formattedType += style.typeValue(arrayInfo);
            }
        } else {
            type += arrayInfo;
            formattedType = style.typeValue(type);
        }
    }

    var description = autoLinkDescription(property.description, knownTypes, autoLink);

    var required;
    if (defined(property.required) && (property.required)) {
        required = style.requiredIcon + 'Yes';
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
        var constValue = element['const'];
        var enumValue = element['enum'];
        var enumDescription = element['description'];
        var enumString;

        // Check if 'const' has been used in place of 'enum'.
        if (defined(constValue)) {
            enumString = style.enumElement(constValue, type);
            if (defined(enumDescription)) {
                enumString += " " + enumDescription;
            }
        }
        else {
            // The likely scenario when there's no enum value is that it's the object
            // containing the _type_ of the enum.  Otherwise, it should be an array with
            // a single value in it.
            if (!defined(enumValue) || !Array.isArray(enumValue) || enumValue.length === 0) {
                continue;
            }

            enumString = style.enumElement(enumValue[0], type);
            if (defined(enumDescription)) {
                enumString += " " + enumDescription;
            }
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

    // If the type name was inserted in the schema based on a $ref,
    // then this type name will be returned
    var typeName = schema.typeName;
    if (defined(typeName)) {
        return typeName;
    }

    // For non-anyOf enum types, the type will be a regular property on the object.
    var type = schema.type;
    if (defined(type)) {
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
    var length = propertyAnyOf.length;
    for (var i = 0; i < length; ++i) {
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
* automatically add markdown link refences to those other types inline. This is an admittedly simple
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
