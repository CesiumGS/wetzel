"use strict";
const defaultValue = require('./defaultValue');

module.exports = clone;

/**
* @function clone
* Creates a new instance of the specified object.
* @param  {object} object - The source object to be cloned.
* @param  {boolean} deep - Indicates if the clone should be recursive to all nested objects.
* @return {object} A new instance of the specified object.
*/
function clone(object, deep) {
    if (object === null || typeof object !== 'object') {
        return object;
    }

    deep = defaultValue(deep, false);

    const result = new object.constructor();
    for ( const propertyName in object) {
        if (object.hasOwnProperty(propertyName)) {
            let value = object[propertyName];
            if (deep) {
                value = clone(value, deep);
            }
            result[propertyName] = value;
        }
    }

    return result;
}
