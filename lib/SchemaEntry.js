"use strict";

/**
 * An entry in a SchemaRepository.
 * 
 * Each entry summarizes a schema and information about the source of the 
 * schema. The source is defined with a path consisting of a directory 
 * and a file name for the full schema, and a fragment that points 
 * to the part of the schema that is stored in this entry.
 * 
 * Each entry therefore provides a "context" for the contained schema.
 * This context can be used to resolve references, with the "directory"
 * and "fileName" roughly corresonding to the "Base URI" as defined in
 * https://json-schema.org/understanding-json-schema/structuring.html#base-uri
 */
 class SchemaEntry {

    constructor() {

        // The name of the file that contains the full schema
        this.fileName = '';

        // The directory that contains the schema file
        this.directory = '';

        // The fragment that points to the part of the full 
        // schema that is represented by this entry
        this.fragment = '';

        // The actual schema
        this.schema = undefined;

        // A type name for this entry, as generated with 
        // the `generateTypeName` function
        this.typeName = '';
    }
}

module.exports = SchemaEntry;