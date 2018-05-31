"use strict";
var defined = require('./defined');
var defaultValue = require('./defaultValue');
var path = require('path');
var fs = require('fs');

module.exports = replaceRef;

/**
 * Resolve relative $ref properties of the form '#/definitions/reference' or 'filename.schema.json#/definitions/reference'.
 */
function getRelativeRef(ref, basePath, schemaReferences, parentSchema) {
    var index = ref.indexOf('#');
    if (index < 0) {
        return;
    }

    var refSchema;
    var relativeRef = ref.substr(index + 2).split('/');
    var fileName = ref.substr(0, index);
    if (fileName.length === 0) {
        refSchema = schemaReferences[parentSchema].schema;
    } else {
        refSchema = JSON.parse(fs.readFileSync(path.join(basePath, fileName)));
    }

    for (var i = 0; i < relativeRef.length; ++i) {
        refSchema = refSchema[relativeRef[i]];
    }

    if (!defined(refSchema.id)) {
        refSchema.id = ref;
    }

    return refSchema;
}

/**
* @function replaceRef
* Replaces json schema file references referenced with a $ref property
* with the actual file content from the referenced schema file.
* @todo Does not currently support absolute reference paths, only relative paths.
* @param  {object} schema - The parsed json schema file as an object
* @param  {string} basePath - The root path where any relative schema file references can be resolved
* @param  {string[]} ignorableTypes - An array of schema filenames that shouldn't get their own documentation section.
* @param  {object} schemaReferences - An object that will be populated with all schemas referenced by this object
* @param  {string} parentTitle - A string that contains the title of the parent object
* @return {object} The schema object with all schema file referenced replaced with the actual file content.
*/
function replaceRef(schema, basePath, ignorableTypes, schemaReferences, parentTitle, parentSchema) {
    schemaReferences = defaultValue(schemaReferences, {});

    var ref = schema.$ref;
    if (defined(ref)) {
        if (!defined(parentSchema)) {
            parentSchema = parentTitle;
        }

        var refSchema = getRelativeRef(ref, basePath, schemaReferences, parentSchema);
        var isRelativeReference = true;

        if (!defined(refSchema)) {
            refSchema = JSON.parse(fs.readFileSync(path.join(basePath, ref)));
            isRelativeReference = false;
            parentSchema = refSchema.title;
        }

        // If a type is supposed to be ignored, that means that its contents should be applied
        // to the referencing schema, but it shouldn't be called out as a top-level type by itself
        // (meaning it would never show up in a table of contents or get its own documentation section).
        if (ignorableTypes.indexOf(ref.toLowerCase()) < 0) {
            if (refSchema.title in schemaReferences) {
                // update schema and fileName in case it was inserted by a child first
                schemaReferences[refSchema.title].schema = refSchema;
                schemaReferences[refSchema.title].fileName = ref;
                if (!isRelativeReference) {
                schemaReferences[refSchema.title].parents.push(parentTitle);
            }
            } else {
                schemaReferences[refSchema.title] = {
                    schema: refSchema,
                    fileName: ref,
                    parents: isRelativeReference ? [] : [parentTitle],
                    children: []
                };
            }

            if (parentTitle in schemaReferences) {
                if (!isRelativeReference) {
                    schemaReferences[parentTitle].children.push(refSchema.title);
                }
            } else {
                schemaReferences[parentTitle] = {
                    schema: undefined,
                    fileName: undefined,
                    parents: [],
                    children: isRelativeReference ? [] : [refSchema.title]
                };
            }
        }

        return replaceRef(refSchema, basePath, ignorableTypes, schemaReferences, schema.title === undefined ? parentTitle : schema.title, parentSchema);
    }

    for (var name in schema) {
        if (schema.hasOwnProperty(name)) {
            if (typeof schema[name] === 'object') {
                schema[name] = replaceRef(schema[name], basePath, ignorableTypes, schemaReferences, schema.title === undefined ? parentTitle : schema.title, parentSchema);
            }
        }
    }

    return schema;
}
