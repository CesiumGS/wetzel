"use strict";
var fs = require('fs');
var path = require('path');
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
* @param  {string} basePath - The root path where any relative schema file references can be resolved
* @param  {string} debugOutputPath [null] - If specified, intermediate processing artificats will be saved at this location for wetzel debugging purposes.
* @return {object} The resolved schema object
*/
function resolve(schema, basePath, debugOutputPath) {
    if (null !== debugOutputPath) {
        fs.writeFileSync(debugOutputPath + ".original.json", JSON.stringify(schema), function (err) {
            if (err) { console.log(err); }
        });
    }

    schema = replaceRef(schema, basePath);
    if (null !== debugOutputPath) {
        fs.writeFileSync(debugOutputPath + ".schema4.expanded.json", JSON.stringify(schema), function (err) {
            if (err) { console.log(err); }
        });
    }

    resolveInheritance(schema);
    if (null !== debugOutputPath) {
        fs.writeFileSync(debugOutputPath + ".schema4.resolved.json", JSON.stringify(schema), function (err) {
            if (err) { console.log(err); }
        });
    }

    normalizeRequired(schema);
    if (null !== debugOutputPath) {
        fs.writeFileSync(debugOutputPath + ".schema4.requiredNormalized.json", JSON.stringify(schema), function (err) {
            if (err) { console.log(err); }
        });
    }

    return schema;
}

////////////////////////////////////////////////////////////////////////////////

/**
* @function resolveInheritance
* Recursively finds schemas being referenced within the 'allOf' properties and merges
* those properties into the referencing part of the schema.
* @param  {object} derived - The json schema object that may have an 'allOf' property that needs resolving.
* @return {object} The resolved json schema object.
* @todo Consider adding support for 'anyOf' and 'oneOf' as well.  These currently aren't used by glTF.
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
    for (var name in base) {
        if (base.hasOwnProperty(name)) {
            var baseProperty = base[name];

            // Inherit from the base schema.  The derived joins existing values if it has the same property.
            if (typeof baseProperty === 'object') {
                if (Array.isArray(baseProperty)) {
                    derived[name] = defaultValue(derived[name], []);
                    var cloned = clone(baseProperty, true);
                    derived[name] = derived[name].concat(cloned);
                } else {
                    derived[name] = defaultValue(derived[name], {});
                    var derivedProperty = derived[name];

                    for (var n in baseProperty) {
                        var cloned = clone(baseProperty[n], true);
                        if (baseProperty.hasOwnProperty(n)) {
                            if (defined(derivedProperty[n])) {
                                derivedProperty[n] = Object.assign(derivedProperty[n], cloned);
                            } else {
                                derivedProperty[n] = cloned;
                            }
                        }
                    }
                }
            } else {
                var cloned = clone(baseProperty, true);
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
* By design, this isn't recursively normalizing the schema.  We only care about
* the first level within the schema, as we'll re-process the nested schemas
* separately.
* @param  {object} schema - The json schema object that needs the 'required' properties to be normalized.
* @return {object} The normalized json schema object
*/
function normalizeRequired(schema) {
    for (var name in schema.properties) {
        if (schema.properties.hasOwnProperty(name)){
            var property = schema.properties[name];
            if (!defined(property.required) &&
                defined(schema.required) &&
                Array.isArray(schema.required) &&
                schema.required.indexOf(name) >= 0)
            {
                property.required = true;
            }
        }
    }

    return schema;
}

