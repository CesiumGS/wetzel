"use strict";
var fs = require('fs');
var defined = require('./defined');
var mergeProperties = require('./mergeProperties');
var clone = require('./clone');
var replaceRef = require('./replaceRef');

module.exports = { resolve: resolve };

/**
* @function resolve
* Normalizes the json-schema-03 object provided for use with wetzel markdown generation,
* by replacing json schema references ($ref) with the actual content, and then merging
* in the properties as-needed.
* @param  {object} schema - The parsed json schema file as an object
* @param  {string} fileName - The name of this schema file.
* @param  {string[]} searchPath - The path list where any relative schema file references could be resolved
* @param  {string[]} ignorableTypes - An array of schema filenames that shouldn't get their own documentation section.
* @param  {string} debugOutputPath [null] - If specified, intermediate processing artificats will be saved at this location for wetzel debugging purposes.
* @return {object} The resolved schema object and its referenced schemas, as a map from the schema.title to objects
* that contain the schema, the file name, the parents titles and the children titles
*/
function resolve(schema, fileName, searchPath, ignorableTypes, debugOutputPath) {
    // work off a cloned schema so that we're not modifying input objects
    var schemaClone = clone(schema, true);
    var referencedSchemas = {};

    if (null !== debugOutputPath) {
        fs.writeFileSync(debugOutputPath + ".original.json", JSON.stringify(schemaClone), function (err) {
            if (err) { console.log(err); }
        });
    }

    referencedSchemas[schema.title] = { schema: schemaClone, fileName: fileName, parents: [], children: [] };
    schemaClone = replaceRef(schemaClone, searchPath, ignorableTypes, referencedSchemas);
    if (null !== debugOutputPath) {
        fs.writeFileSync(debugOutputPath + ".schema3.expanded.json", JSON.stringify(schemaClone), function (err) {
            if (err) { console.log(err); }
        });
    }

    extend(schemaClone);
    if (null !== debugOutputPath) {
        fs.writeFileSync(debugOutputPath + ".schema3.resolved.json", JSON.stringify(schemaClone), function (err) {
            if (err) { console.log(err); }
        });
    }

    // Need to process all of the individual referenced schemas as well so that they're ready for conversion.
    for (var title in referencedSchemas) {
        if (referencedSchemas[title].schema !== undefined) {
            extend(referencedSchemas[title].schema);
        }
    }

    return {
        schema: schemaClone,
        referencedSchemas: referencedSchemas
    };
}

////////////////////////////////////////////////////////////////////////////////

/**
* @function extend
* Recursively finds schemas being referenced within the 'extends' property and merges
* those properties into the referencing part of the schema.
* @param  {object} derived - The json schema object that may have an 'extends' property that needs resolving.
* @return {object} The resolved json schema object.
*/
function extend(derived) {
    var base = derived['extends'];
    if (defined(base)) {
        delete derived['extends'];
        
        if (Array.isArray(base)) {
            for (var singleBase in base) {
                mergeProperties(derived, base[singleBase]);
            }
        } else  {
            mergeProperties(derived, base);
        }
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

