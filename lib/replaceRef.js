"use strict";
var defined = require('./defined');
var defaultValue = require('./defaultValue');
var path = require('path');
var fs = require('fs');

module.exports = replaceRef;

// TODO: allow this to be command-line configurable
var ignorableTypes = ['gltfid.schema.json', 'gltfchildofrootproperty.schema.json', 'gltfproperty.schema.json'];

/**
* @function replaceRef
* Replaces json schema file references referenced with a $ref property
* with the actual file content from the referenced schema file.
* @todo Does not currently support absolute reference paths, only relative paths.
* @param  {object} schema - The parsed json schema file as an object
* @param  {string} basePath - The root path where any relative schema file references can be resolved
* @param  {object} schemaReferences - An object that will be populated with all schemas referenced by this object
* @return {object} The schema object with all schema file referenced replaced with the actual file content.
*/
function replaceRef(schema, basePath, schemaReferences) {
    schemaReferences = defaultValue(schemaReferences, {});

    var ref = schema.$ref;
    if (defined(ref)) {
        // TODO: $ref could also be absolute.
        var filePath = path.join(basePath, ref);
        var refSchema = JSON.parse(fs.readFileSync(filePath));
        if (ignorableTypes.indexOf(ref.toLowerCase()) < 0) {
            schemaReferences[refSchema.title] = { schema: refSchema, fileName: ref };
        }
        
        return replaceRef(refSchema, basePath, schemaReferences);
    }

    for (var name in schema) {
        if (schema.hasOwnProperty(name)) {
            if (typeof schema[name] === 'object') {
                schema[name] = replaceRef(schema[name], basePath, schemaReferences);
            }
        }
    }

    return schema;
}
