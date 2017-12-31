"use strict";
var defaultValue = require('./defaultValue');

module.exports = getSortedObjectByKey;

/**
* @function getSortedObjectByKey
* Returns a new object that has the original object's keys/values sorted.
* @param  {object} object The object to be sorted by key.
* @param  {boolean} ascending Indicates if it should be sorted ascending (true) or descending (false)
* @return {object} The sorted object
*/
function getSortedObjectByKey(object, ascending) {
    ascending = defaultValue(ascending, true);

    var keys = Object.keys(object);

    var sortedKeys = keys.sort(ascending ? sortAscending : sortDescending);

    var sortedObject = {};
    for (var index in sortedKeys) {
        var key = sortedKeys[index];
        sortedObject[key] = object[key];
    }

    return sortedObject;
}

/**
* @function sortAscending
* Sort method used to sort keys in ascending order.
* @param  {type} key1 The first key to compare
* @param  {type} key2 The second key to compare
* @return {int} 0 of the keys are identical; -1 if key1 should be sorted earlier than key2; 1 otherwise.
*/
function sortAscending(key1, key2)
{
    key1 = key1.toLowerCase();
    key2 = key2.toLowerCase();
    if (key1 < key2) { return -1; }
    if (key1 > key2) { return 1; }
    return 0;
}

/**
* @function sortDescending
* Sort method used to sort keys in descending order.
* @param  {type} key1 The first key to compare
* @param  {type} key2 The second key to compare
* @return {int} 0 of the keys are identical; -1 if key1 should be sorted earlier than key2; 1 otherwise.
*/
function sortDescending(key1, key2)
{
    key1 = key1.toLowerCase();
    key2 = key2.toLowerCase();
    if (key1 > key2) { return -1; }
    if (key1 < key2) { return 1; }
    return 0;
}
