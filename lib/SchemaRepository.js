"use strict";
const defined = require("./defined");
const defaultValue = require("./defaultValue");
const jsonpointer = require("jsonpointer");
const obtainFileName = require("./obtainFileName");
const obtainFragment = require("./obtainFragment");
const obtainReferencedSchemaEntries = require("./obtainReferencedSchemaEntries");
const generateTypeName = require("./generateTypeName");
const path = require("path");
const SchemaEntry = require("./SchemaEntry");
const stripFragment = require("./stripFragment");
const fs = require("fs");

/**
 * A repository for JSON schemas.
 *
 * It offers two public functions:
 *
 * The `resolve` function allows obtaining a `SchemaEntry` based on a URL.
 *
 * The `resolveRef` function allows obtaining a `SchemaEntry` based on
 * a given `SchemaEntry`, and the value of a `$ref` that appears in the
 * schema of this entry. The `SchemaEntry` here serves as the "context"
 * in which the `$ref` should be resolved, including the base URL that
 * the containing schema was obtained from.
 *
 * @param {String[]} searchPaths The array of search paths. Default: Empty array.
 */
class SchemaRepository {
  /**
   * Creates a new instance that will look up references by attempting to
   * resolve them against the given search paths.
   *
   * @param {string[]} searchPaths The search paths
   */
  constructor(searchPaths) {
    // The dictionary that maps URLs to entries
    this.entries = {};

    // The array of strings representing the paths that will be
    // searched when `resolve` is called with a relative URL
    this.searchPaths = defaultValue(searchPaths, []);
  }
}

/**
 * Add the specified schema to this schema repository.
 *
 * This will add an entry for the given URL, as well as entries
 * for each schema that is directly or indirectly referred to
 * by the corresponding schema.
 *
 * @param {string} rootSchemaUrl The root schema URL
 */
SchemaRepository.prototype.addRootSchema = function (rootSchemaUrl) {
  console.log("Adding root schema " + rootSchemaUrl);

  this.resolve(rootSchemaUrl);
  const rootEntry = this.resolve(rootSchemaUrl);
  obtainReferencedSchemaEntries(this, rootEntry);
};

/**
 * Try to resolve a fragment against an entry.
 *
 * It returns the entry that the fragment refers to, or 'undefined'
 * if the given fragment does not point into a valid path in the
 * schema of the given entry.
 *
 * @param {SchemaEntry} entry The schema repository entry
 * @param {string} fragment The fragment
 * @returns The entry that describes what the fragment points to
 */
function resolveFragment(entry, fragment) {
  const urlSchema = jsonpointer.get(entry.schema, fragment);
  if (!defined(urlSchema)) {
    return undefined;
  }
  const typeName = generateTypeName(entry.fileName, fragment);
  const fragmentEntry = new SchemaEntry();
  fragmentEntry.fileName = entry.fileName;
  fragmentEntry.directory = entry.directory;
  fragmentEntry.fragment = fragment;
  fragmentEntry.schema = urlSchema;
  fragmentEntry.typeName = typeName;
  return fragmentEntry;
}

/**
 * Resolves a URL for a JSON schema.
 *
 * This will return an object containing
 *
 * - `fileName`: The name of the file that the URL refers to
 * - `directory`: The path where the file was found
 * - `fragment`: This will always be the empty string here
 * - `schema`: The _whole_ JSON schema from this file
 * - `typeName`: A name for the type that is defined with this schema
 *
 * (The actual part of the schema that the URL refers to can be
 * obtained using the fragment of the given URL string)
 *
 * @param {String} url The URL
 * @param {String[]} searchPaths An array of paths that should be used for searching
 * the referenced files
 * @returns The result
 * @throws {Error} If the URL cannot be resolved
 */
function resolveUrlFile(url, searchPaths) {
  if (path.isAbsolute(url)) {
    const fullUrlFileName = stripFragment(url);
    const directory = path.dirname(fullUrlFileName);
    const fullUrlFileSchema = JSON.parse(fs.readFileSync(fullUrlFileName));
    const urlFileName = obtainFileName(url);
    const typeName = generateTypeName(urlFileName, "");

    const entry = new SchemaEntry();
    entry.fileName = urlFileName;
    entry.directory = directory;
    entry.schema = fullUrlFileSchema;
    entry.fragment = "";
    entry.typeName = typeName;
    return entry;
  }
  for (let searchPath of searchPaths) {
    const urlFileName = obtainFileName(url);
    try {
      // Replace backslashes (from Windows) with slashes
      const fullUrlFileName = path
        .join(searchPath, urlFileName)
        .replace(/\\/g, "/");
      const fullUrlFileSchema = JSON.parse(fs.readFileSync(fullUrlFileName));
      const typeName = generateTypeName(urlFileName, "");

      const entry = new SchemaEntry();
      entry.fileName = urlFileName;
      entry.directory = searchPath;
      entry.schema = fullUrlFileSchema;
      entry.fragment = "";
      entry.typeName = typeName;
      return entry;
    } catch (ex) {
      // Keep searching in the searchPaths
    }
  }
  const message = `Unable to resolve URL ${url}`;
  //console.log(message);
  throw new Error(message);
}

/**
 * Resolve a JSON schema URL
 *
 * This will try to look up the given URL in the given schema repository.
 * If this entry does not exist yet, if will resolve the file that the URL
 * refers to, read its contents, and return a `SchemaEntry` object for
 * the given URL. (This may be a only part of a larger schema, if the
 * given URL contains a fragment!)
 *
 * @param {String} url The URL
 * @param {String[]} searchPaths An array of paths that should be
 * used for searching the referenced files
 */
SchemaRepository.prototype.resolve = function (url) {
  if (defined(this.entries[url])) {
    return this.entries[url];
  }

  const urlFileName = obtainFileName(url);
  let fullUrlFileEntry = this.entries[urlFileName];
  if (!defined(fullUrlFileEntry)) {
    fullUrlFileEntry = resolveUrlFile(url, this.searchPaths);
    this.entries[urlFileName] = fullUrlFileEntry;
  }

  const fragment = obtainFragment(url);
  return resolveFragment(fullUrlFileEntry, fragment);
};

/**
 * Create an array containing the entries that are considered to be
 * "parents" of the given entry, when trying to resolve a fragment
 * that appears in the schema of the given entry.
 *
 * TODO: This is not entirely right. There is no "inheritance" in
 * JSON schema, and this function does not recursively walk up
 * the "inheritance" hierarchy. Right now, the are entries that
 * correspond to the "$ref" and the "allOf[i].$ref" elements of
 * the schema of the given entry.
 *
 * @param {SchemaEntry} entry The start entry
 * @returns The array of parent entries
 */
SchemaRepository.prototype.computeParentEntries = function (entry) {
  let parentEntries = [entry];

  if (entry.fragment !== "") {
    const parentEntry = this.entries[entry.fileName];
    parentEntries.push(parentEntry);
  }

  if (defined(entry.schema.$ref)) {
    const refFileName = obtainFileName(entry.schema.$ref);
    if (refFileName !== "" && refFileName !== entry.fileName) {
      const parentEntry = this.resolveRef(entry, entry.schema.$ref);
      parentEntries = [parentEntry].concat(parentEntries);
    }
  }
  if (defined(entry.schema.allOf)) {
    for (let base in entry.schema.allOf) {
      if (defined(base.$ref)) {
        const parentEntry = this.resolveRef(entry, base.$ref);
        parentEntries = [parentEntry].concat(parentEntries);
      }
    }
  }
  return parentEntries;
};

/**
 * Resolve a reference from a `$ref` inside a schema, in the context
 * of a given schema entry.
 *
 * If the reference cannot be resolved, then a warning is printed,
 * and `undefined` is returned.
 *
 * @param {SchemaEntry} entry The entry
 * @param {string} ref The string from the `$ref`
 * @returns The resolved `SchemaEntry`.
 */
SchemaRepository.prototype.resolveRef = function (entry, ref) {
  const fileName = obtainFileName(ref);
  if (fileName.length === 0) {
    const fragment = obtainFragment(ref);

    // The 'fragment' may be something like '/definitions/example'.
    // This fragment has to be resolved against the schema ...
    // - of the containing entry
    // - of any schema that is a '$ref' or 'allOf' of the containing schema
    // whatever succeeds first.
    const parentEntries = this.computeParentEntries(entry);
    for (let i = 0; i < parentEntries.length; i++) {
      const parentEntry = parentEntries[i];
      const result = resolveFragment(parentEntry, fragment);
      if (defined(result)) {
        return result;
      }
    }
    const message = `WARNING: Could not resolve ${ref}`;
    console.log(message);
    return undefined;
  }
  return this.resolve(ref, fileName);
};

module.exports = SchemaRepository;
