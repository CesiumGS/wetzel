"use strict";
const defined = require("./defined");
const defaultValue = require("./defaultValue");

/**
 * A class that offers functions for resolving "schema inheritance".
 *
 * Implementation note: There is no "inheritance" in JSON schema.
 * This implementation might be wrong on a bazillion levels and
 * in a bazillion cases. But it should at least be "less wrong"
 * than the original approach of `replaceRef`, `resolveInheritance`
 * and `mergeProperties`.
 */
class SchemaResolver {
  /**
   * Creates a new instance that will look up references using
   * the given SchemaRepository
   *
   * @param {SchemaRepository} The schemaRespository
   */
  constructor(schemaRepository) {
    this.schemaRepository = schemaRepository;
  }
}

/**
 * Resolve the basic properties that are "inherited" in the given schema.
 * 
 * (This refers to the properties of the JavaScript object. Not to
 * the `properties` of a JSON schema object)
 *
 * This will collect all properties from the `$ref`- and `allOf` schemas
 * and put them into the resulting object, and finally put all properties
 * from the given object into the resulting object (because they will
 * "override" the "inherited" ones).
 * 
 * This is intended to be called immediately before generating the
 * documentation that documents these "inherited" properties.
 *
 * @param {SchemaEntry} entry The SchemaEntry
 * @param {object} schema The schema
 * @returns The resolved schema
 */
SchemaResolver.prototype.resolveBasicProperties = function (entry, schema) {
  let resolved = {};

  // Put all properties from `$ref` schemas into the resolved schema
  if (defined(schema.$ref)) {
    const refEntry = this.schemaRepository.resolveRef(entry, schema.$ref);
    const base = refEntry.schema;
    const resolvedBase = this.resolveBasicProperties(refEntry, base);
    Object.assign(resolved, resolvedBase);
  }

  // Put all properties from `$allOf` schemas into the resolved schema
  const allOf = schema.allOf;
  if (defined(allOf)) {
    for (let i = 0; i < allOf.length; i++) {
      const base = allOf[i];
      const resolvedBase = this.resolveBasicProperties(entry, base);
      Object.assign(resolved, resolvedBase);
    }
  }

  // Overwrite the properties in the resolved schema with those
  // from the given schema
  Object.assign(resolved, schema);

  return resolved;
};

/**
 * Resolve the entries that represent direct base types
 * of the given entry.
 * 
 * These are the entries that are referred to in a direct
 * `schema.$ref`, or in `allOf`
 * 
 * @param {SchemaEntry} entry The SchemaEntry
 * @param {object} schema The schema
 * @returns The base type entries
 */
SchemaResolver.prototype.resolveDirectBaseTypeEntries = function (entry, schema) {
  let result = [];

  if (defined(schema.$ref)) {
    const refEntry = this.schemaRepository.resolveRef(entry, schema.$ref);
    result.push(refEntry);
  }

  const allOf = schema.allOf;
  if (defined(allOf)) {
    for (let i = 0; i < allOf.length; i++) {
      const base = allOf[i];
      result.push(base);
    }
  }
  return result;
};


/**
 * Resolve the `properties` that are "inherited" in the given schema.
 * 
 * (This refers to the `properties` of a JSON schema object)
 *
 * This will return a dictionary that contains all `properties` of
 * the given schema, as well as all `properties` from schemas that
 * are referenced via its `$ref` or `allOf` keywords.
 *
 * @param {SchemaEntry} entry The SchemaEntry
 * @param {objec5} schema The schema
 * @returns The dictionary of all properties
 */
SchemaResolver.prototype.resolveAllProperties = function (entry, schema) {
  let allProperties = {};

  // Collect the `properties` and `definitions` from the given schema
  Object.assign(allProperties, schema.properties);

  // Put all properties from `$ref` schemas into the resolved schema,
  // and collect the `properties`/`definitions` from the `$ref` schemas
  if (defined(schema.$ref)) {
    const refEntry = this.schemaRepository.resolveRef(entry, schema.$ref);
    const base = refEntry.schema;
    const baseProperties = this.resolveAllProperties(refEntry, base);
    Object.assign(allProperties, baseProperties);
  }

  // Put all properties from `$allOf` schemas into the resolved schema,
  // and collect the `properties`/`definitions` from the `$allOf` schemas
  const allOf = schema.allOf;
  if (defined(allOf)) {
    for (let i = 0; i < allOf.length; i++) {
      const base = allOf[i];
      const baseProperties = this.resolveAllProperties(entry, base);
      Object.assign(allProperties, baseProperties);
    }
  }

  return allProperties;
};

/**
 * Resolve the names of properties that are `required` in the given schema.
 *
 * This will return an array that contains all `required` names of
 * the given schema, as well as all `required` names from schemas that
 * are referenced via its `$ref` or `allOf` keywords.
 *
 * @param {SchemaEntry} entry The SchemaEntry
 * @param {object} schema The schema
 * @returns The array of all `required` property names
 */
SchemaResolver.prototype.resolveAllRequired = function (entry, schema) {
  // Start with the `required` of the givens chema
  let allRequired = defaultValue(schema.required, []);

  // Add the `required` values from the `$ref` schemas
  if (defined(schema.$ref)) {
    const refEntry = this.schemaRepository.resolveRef(entry, schema.$ref);
    const base = refEntry.schema;
    const baseRequired = this.resolveAllRequired(refEntry, base);
    allRequired = allRequired.concat(baseRequired);
  }

  // Add the `required` values from the `allOf` schemas
  const allOf = schema.allOf;
  if (defined(allOf)) {
    for (let i = 0; i < allOf.length; i++) {
      const base = allOf[i];
      const baseRequired = this.resolveAllRequired(entry, base);
      allRequired = allRequired.concat(baseRequired);
    }
  }
  return allRequired;
};

module.exports = SchemaResolver;
