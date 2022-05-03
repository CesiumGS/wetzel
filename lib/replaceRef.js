"use strict";
var defined = require('./defined');
var defaultValue = require('./defaultValue');
var path = require('path');
var fs = require('fs');
var jsonpointer = require('jsonpointer');

module.exports = replaceRef;

/**
 * Removes any fragment from the given URL (starting at `#`), if present.
 * 
 * @param {String} url The URL
 * @returns The URL without fragment
 */
function stripFragment(url) {
    if (!defined(url)) {
        return undefined;
    }
    const hashIndex = url.indexOf('#');
    if (hashIndex !== -1)
    {
        return url.substring(0, hashIndex);
    }
    return url;
}

/**
 * Obtains the file name from a URL.
 * 
 * This will strip any fragment from the URL (starting at `#`), and
 * return the part after the last slash `/` (or the full URL without
 * the fragment if there is no slash) 
 * 
 * @param {String} url The URL
 * @returns The file name
 */
function obtainFileName(url) {
    if (!defined(url)) {
        return undefined;
    }
    let result = stripFragment(url);
    const slashIndex = result.indexOf('/');
    if (slashIndex !== -1)  {
        result = result.substring(slashIndex + 1);
    }
    return result;
}

/**
 * Obtains the fragment from the given URL. 
 * 
 * This returns the part after the `#` (or the empty string,
 * if there is no fragment)
 * 
 * @param {String} url The URL
 * @returns The fragment
 */
function obtainFragment(url) {
    if (!defined(url)) {
        return undefined;
    }
    const hashIndex = url.indexOf('#');
    if (hashIndex !== -1) {
        return url.substring(hashIndex + 1);
    }
    return '';
}

/**
 * Obtains the file name that the given reference refers to.
 * 
 * If the reference is absolute or contains a file name, then the file name
 * is returned. Otherwise (if the reference is only a fragment containing
 * a JSON pointer) then the given file name is returned.
 *
 * @param {String} ref The JSON schema reference
 * @param {String} fileName The name of the file containing the JSON schema reference
 * @returns The file that the reference should be resolved against.
 */
function obtainRefFileName(ref, fileName) {
    if (path.isAbsolute(ref)) {
        return obtainFileName(ref);
    }
    let refFileName = obtainFileName(ref);
    if (refFileName.length === 0) {
        refFileName = fileName;
    }
    return refFileName;
}

/**
 * Resolves a JSON reference against the file that the reference refers to.
 * 
 * This will return an object containing `{ fileName, schema }`, where
 * the `fileName` is the name of the file that the reference refers to,
 * and `schema` will be the _whole_ schema from this file. 
 * 
 * (The actual part of the schema that the reference refers to can be 
 * obtained using the fragment of the given reference string)
 * 
 * @param {String} ref The JSON schema reference
 * @param {String} fileName The name of the file containing the JSON schema reference
 * @param {String[]} searchPaths An array of paths that should be used for searching
 * the referenced files
 * @returns The result
 */
function resolveRefFile(ref, fileName, searchPaths) {   
    if (path.isAbsolute(ref)) {
        const fullRefFileName = stripFragment(ref);
        const fullRefFileSchema = JSON.parse(fs.readFileSync(fullRefFileName));
        const refFileName = obtainRefFileName(ref, fileName);
        return {
            fileName : refFileName,
            schema : fullRefFileSchema,
        };
    } 
    for (let searchPath of searchPaths) {
        const refFileName = obtainRefFileName(ref, fileName);
        try {
            const fullRefFileName = path.join(searchPath, refFileName);
            const fullRefFileSchema = JSON.parse(fs.readFileSync(fullRefFileName));
            return {
                fileName : refFileName,
                schema : fullRefFileSchema,
            };
        } catch (ex) { 
            // Keep searching in the searchPaths
        }
    }
    const message = `Unable to resolve $ref ${ref}`;
    //console.log(message);
    throw new Error(message);
}

/**
 * Resolve a JSON schema reference.
 * 
 * This will try to look up the given reference in the given schema repository.
 * If this entry does not exist yet, if will resolve the file that the reference
 * refers to, read its contents, and return an object containing `{ fileName, schema }`, 
 * where the `fileName` is the name of the file that the reference refers to,
 * and `schema` will be the actual part of schema that the reference refers to.
 * 
 * @param {String} ref The JSON schema reference
 * @param {String} fileName The name of the file containing the JSON schema reference
 * @param {String[]} searchPaths An array of paths that should be used for searching
 * the referenced files
 * @param {Object} schemaRepository A repository for the schemas
 * @returns The result
 */
function resolveRef(ref, fileName, searchPaths, schemaRepository) {
    if (defined(schemaRepository[ref])) {
        return schemaRepository[ref];
    }
    const refFileName = obtainRefFileName(ref, fileName);
    const fragment = obtainFragment(ref);

    let fullRefFileEntry = schemaRepository[refFileName];
    if (!defined(fullRefFileEntry)) {
        fullRefFileEntry = resolveRefFile(ref, fileName, searchPaths);
        schemaRepository[refFileName] = fullRefFileEntry;
    }
    const fullRefFileSchema = fullRefFileEntry.schema;
    const refSchema = jsonpointer.get(fullRefFileSchema, fragment);
    const refEntry = {
        fileName : refFileName,
        schema : refSchema
    };
    schemaRepository[ref] = refEntry;
    return refEntry;
}

/**
* @function replaceRef
* Replaces json schema file references referenced with a $ref property
* with the actual file content from the referenced schema file.
* @param  {object} schema - The parsed json schema file as an object
* @param  {string} fileName - The name of the parsed JSON schema file
* @param  {string[]} searchPaths - The path list where any relative schema file references could be resolved
* @param  {string[]} ignorableTypes - An array of schema filenames that shouldn't get their own documentation section.
* @param  {object} schemaReferences - An object that will be populated with all schemas referenced by this object
* @param  {object} schemaRepository - An object that will be populated with all referenced schemas
* @param  {string} parentTitle - A string that contains the title of the parent object
* @param  {object} root - The root schema
* @return {object} The schema object with all schema file referenced replaced with the actual file content.
*/
function replaceRef(schema, fileName, searchPaths, ignorableTypes, schemaReferences, schemaRepository, parentTitle, root) {

    if (!root) {
        root = schema;
    }

    schemaReferences = defaultValue(schemaReferences, {});

    const ref = schema.$ref;
    if (defined(ref) && !defined(schemaRepository[ref])) {

        const resolveRefResult = resolveRef(ref, fileName, searchPaths, schemaRepository);

        //console.log(`Resolved $ref ${ref}`, resolveRefResult);

        const refFileName = resolveRefResult.fileName;
        const refSchema = resolveRefResult.schema;

        if (!defined(refSchema)) {
            throw new Error(`Unable to find $ref ${ref}`);
        }
        if (!defined(refSchema.title)) {
            throw new Error(`No title found in $ref ${ref}`);
        }

        // If a type is supposed to be ignored, that means that its contents should be applied
        // to the referencing schema, but it shouldn't be called out as a top-level type by itself
        // (meaning it would never show up in a table of contents or get its own documentation section).
        if (ignorableTypes.indexOf(ref.toLowerCase()) < 0) {
            if (refSchema.title in schemaReferences) {
                // update schema and refFileName in case it was inserted by a child first
                schemaReferences[refSchema.title].schema = refSchema;
                schemaReferences[refSchema.title].fileName = refFileName;
                schemaReferences[refSchema.title].parents.push(parentTitle);
            }
            else {
                schemaReferences[refSchema.title] = { schema: refSchema, fileName: refFileName, parents: [parentTitle], children: [] };
            }

            if (parentTitle in schemaReferences) {
                schemaReferences[parentTitle].children.push(refSchema.title);
            }
            else {
                schemaReferences[parentTitle] = { schema: undefined, fileName: undefined, parents: [], children: [refSchema.title] };
            }

            // From a reference named "simpleExample.type.schema.json",
            // extract the "simpleExample.type" part as the type name.
            // If the reference contains a fragment, then this fragment
            // is appended to the type name, to disambiguate types that
            // are defined in the same file, like 
            // fileName.schema.json#/definitions/typeA   and 
            // fileName.schema.json#/definitions/typeB
            if (!refSchema.typeName) {
                var typeName = refFileName;
                var indexOfFileExtension = refFileName.indexOf(".schema.json");
                if (indexOfFileExtension !== -1) {
                    typeName = refFileName.slice(0, indexOfFileExtension);
                }
                const fragment = obtainFragment(ref);
                if (fragment.length != 0) {
                    typeName += fragment;
                }
                refSchema.typeName = typeName;
            }
        }

        return replaceRef(refSchema, refFileName, searchPaths, ignorableTypes, schemaReferences, schemaRepository, schema.title === undefined ? parentTitle : schema.title, root);
    }

    for (var name in schema) {
        if (schema.hasOwnProperty(name)) {
            if (typeof schema[name] === 'object') {
                schema[name] = replaceRef(schema[name], fileName, searchPaths, ignorableTypes, schemaReferences, schemaRepository, schema.title === undefined ? parentTitle : schema.title, root);
            }
        }
    }

    return schema;
}
