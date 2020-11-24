"use strict";
var fs = require('fs');
var defined = require('./defined');
var defaultValue = require('./defaultValue');
var clone = require('./clone');
var replaceRef = require('./replaceRef');

module.exports = { resolve: resolve };

/**
* @function resolve
* Normalizes the json-schema-04 object provided for use with wetzel markdown generation,
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
        fs.writeFileSync(debugOutputPath + ".schema4.expanded.json", JSON.stringify(schemaClone), function (err) {
            if (err) { console.log(err); }
        });
    }

    resolveInheritance(schemaClone);
    if (null !== debugOutputPath) {
        fs.writeFileSync(debugOutputPath + ".schema4.resolved.json", JSON.stringify(schemaClone), function (err) {
            if (err) { console.log(err); }
        });
    }

    normalizeRequired(schemaClone);
    if (null !== debugOutputPath) {
        fs.writeFileSync(debugOutputPath + ".schema4.requiredNormalized.json", JSON.stringify(schemaClone), function (err) {
            if (err) { console.log(err); }
        });
    }

    // Need to process all of the individual referenced schemas as well so that they're ready for conversion.
    for (var title in referencedSchemas) {
        if (referencedSchemas[title].schema !== undefined) {
            resolveInheritance(referencedSchemas[title].schema);
            normalizeRequired(referencedSchemas[title].schema);
        }
    }

    return {
        schema: schemaClone,
        referencedSchemas: referencedSchemas
    };
}

////////////////////////////////////////////////////////////////////////////////

/**
* @function resolveInheritance
* Recursively finds schemas being referenced within the 'allOf' properties and merges
* those properties into the referencing part of the schema.
* @param  {object} derived - The json schema object that may have an 'allOf' property that needs resolving.
* @return {object} The resolved json schema object.
*/
function resolveInheritance(derived) {
    var base = derived['allOf'];
    if (defined(base)) {
        resolveInheritance(base);

        for (var singleBase in base) {
            mergeProperties(derived, base[singleBase]);
        }

        delete derived['allOf'];
    }

    for (var name in derived) {
        if (derived.hasOwnProperty(name)) {
            if (typeof derived[name] === 'object') {
                resolveInheritance(derived[name]);
            }
        }
    }
}

/**
* @function mergeProperties
* Recusively takes properties within a schema reference ("the base") and merges the contents of
* those properties into the derived schema.
* @param  {object} derived - The schema that contains a reference to the 'base' schema.
* @param  {object} base - The schema that was being referenced by 'derived'.
* @return {object} The merged schema with the 'base' schema reference removed since the contents
* have been merged into 'derived'.
*/
function mergeProperties(derived, base) {
    for (let name in base) {
        if (base.hasOwnProperty(name)) {
            let baseProperty = base[name];

            // Inherit from the base schema.  The derived joins existing values if it has the same property.
            if (typeof baseProperty === 'object') {
                if (Array.isArray(baseProperty)) {
                    derived[name] = defaultValue(derived[name], []);
                    let cloned = clone(baseProperty, true);
                    derived[name] = derived[name].concat(cloned);
                } else {
                    derived[name] = defaultValue(derived[name], {});
                    let derivedProperty = derived[name];

                    for (let n in baseProperty) {
                        let cloned = clone(baseProperty[n], true);
                        if (baseProperty.hasOwnProperty(n)) {
                            if (defined(derivedProperty[n])) {
                                derivedProperty[n] = Object.assign(derivedProperty[n], cloned);
                            } else {
                                derivedProperty[n] = cloned;
                            }
                        }
                    }
                }
            } else if (name !== 'typeName' || derived.title === base.title) {
                let cloned = clone(baseProperty, true);
                if (!defined(derived[name])) {
                    derived[name] = cloned;
                }
            }
        }
    }
}

////////////////////////////////////////////////////////////////////////////////

/**
* @function normalizeRequired
* Schema3 used a bool attribute on an individual property to indicate if it was
* required or not.  Schema4 uses an array attribute on the parent root that
* references properties by name that should be considered required.  We'll normalize
* to bool attributes on the individual properties so that the markdown generation
* logic can be shared amongst the different schema resolvers.
* @param  {object} schema - The json schema object that needs the 'required' properties to be normalized.
* @return {object} The normalized json schema object
*/
function normalizeRequired(schema) {
    if (schema._normalizedRequired) {
        return schema;
    }
    schema._normalizedRequired = true;
    if (!defined(schema.properties) || !schema.hasOwnProperty('properties')) {
        return schema;
    }

    // Transfer required to a local variable.
    var requiredProperties = Array.isArray(schema.required) ? schema.required : [];
    schema.required = undefined;

    for (var name in schema.properties) {
        if (schema.properties.hasOwnProperty(name)) {
            var property = schema.properties[name];
            property = normalizeRequired(property);

            if (requiredProperties.indexOf(name) >= 0) {
                property.required = true;
            }
        }
    }

    return schema;
}
