"use strict";
var defined = require('./defined');
var defaultValue = require('./defaultValue');
var path = require('path');
var fs = require('fs');

module.exports = replaceRef;

/**
* @function replaceRef
* Replaces json schema file references referenced with a $ref property
* with the actual file content from the referenced schema file.
* @todo Does not currently support absolute reference paths, only relative paths.
* @param  {object} schema - The parsed json schema file as an object
* @param  {string} basePath - The root path where any relative schema file references can be resolved
* @param  {string[]} ignorableTypes - An array of schema filenames that shouldn't get their own documentation section.
* @param  {object} schemaReferences - An object that will be populated with all schemas referenced by this object
* @return {object} The schema object with all schema file referenced replaced with the actual file content.
*/
function replaceRef(schema, basePath, ignorableTypes, schemaReferences) {
    schemaReferences = defaultValue(schemaReferences, {});

    var ref = schema.$ref;
    if (defined(ref)) {
        // TODO: $ref could also be absolute.
        var filePath = path.join(basePath, ref);
        var refSchema = JSON.parse(fs.readFileSync(filePath));

        // If a type is supposed to be ignored, that means that its contents should be applied
        // to the referencing schema, but it shouldn't be called out as a top-level type by itself
        // (meaning it would never show up in a table of contents or get its own documentation section).
        if (ignorableTypes.indexOf(ref.toLowerCase()) < 0) {
            schemaReferences[refSchema.title] = { schema: refSchema, fileName: ref };
        }
        
        return replaceRef(refSchema, basePath, ignorableTypes, schemaReferences);
    }

    for (var name in schema) {
        if (schema.hasOwnProperty(name)) {
            if (typeof schema[name] === 'object') {
                schema[name] = replaceRef(schema[name], basePath, ignorableTypes, schemaReferences);
            }
        }
    }

    return schema;
}
