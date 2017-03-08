"use strict";
var defined = require('./defined');
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
* @return {object} The schema object with all schema file referenced replaced with the actual file content.
*/
function replaceRef(schema, basePath) {
    var ref = schema.$ref;
    if (defined(ref)) {
        // TODO: $ref could also be absolute.
        var filename = path.join(basePath, ref);
        var refSchema = JSON.parse(fs.readFileSync(filename));
        return replaceRef(refSchema, basePath);
    }

    for (var name in schema) {
        if (schema.hasOwnProperty(name)) {
            if (typeof schema[name] === 'object') {
                schema[name] = replaceRef(schema[name], basePath);
            }
        }
    }

    return schema;
}
