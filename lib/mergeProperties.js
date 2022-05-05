"use strict";
var defined = require('./defined');
var clone = require('./clone');
var defaultValue = require('./defaultValue');

module.exports = mergeProperties;

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
