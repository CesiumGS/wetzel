"use strict";
const defined = require("./defined");

module.exports = obtainReferencedSchemaEntries;

/**
 * Obtain all entries of the given repository that are directly
 * referenced from the given schema.
 *
 * The list will contain the entries for all schemas that are
 * directly referred to from the given schema, in the `$ref`,
 * the `additionalProperties`, or the `allOf`/`anyOf`/`oneOf`,
 * or `not` entries, or the `items` of the schema itself.
 *
 * @param {SchemaRepository} schemaRepository The schema repository
 * @param {SchemaEntry} entry The SchemaEntry
 * @param {object} schema The schema
 * @returns The array of directly referenced schema entries
 */
function obtainDirectReferencedSchemaEntries(schemaRepository, entry, schema) {
  let refSchemaEntries = [];
  
  const ref = schema.$ref;
  if (defined(ref)) {
    const refEntry = schemaRepository.resolveRef(entry, ref);
    refSchemaEntries.push(refEntry);
  }

  const type = schema.type;
  const items = schema.items;
  if (defined(type) && type === "array" && defined(items)) {
    refSchemaEntries = refSchemaEntries.concat(
      obtainDirectReferencedSchemaEntries(schemaRepository, entry, items)
    );
  }
  const additionalProperties = schema.additionalProperties;
  if (defined(additionalProperties)) {
    refSchemaEntries = refSchemaEntries.concat(
      obtainDirectReferencedSchemaEntries(
        schemaRepository,
        entry,
        additionalProperties
      )
    );
  }
  const allOf = schema.allOf;
  if (defined(allOf)) {
    for (let i = 0; i < allOf.length; i++) {
      const base = allOf[i];
      refSchemaEntries = refSchemaEntries.concat(
        obtainDirectReferencedSchemaEntries(schemaRepository, entry, base)
      );
    }
  }
  const oneOf = schema.oneOf;
  if (defined(oneOf)) {
    for (let i = 0; i < oneOf.length; i++) {
      const base = oneOf[i];
      refSchemaEntries = refSchemaEntries.concat(
        obtainDirectReferencedSchemaEntries(schemaRepository, entry, base)
      );
    }
  }
  const anyOf = schema.anyOf;
  if (defined(anyOf)) {
    for (let i = 0; i < anyOf.length; i++) {
      const base = anyOf[i];
      refSchemaEntries = refSchemaEntries.concat(
        obtainDirectReferencedSchemaEntries(schemaRepository, entry, base)
      );
    }
  }
  const not = schema.not;
  if (defined(not)) {
    refSchemaEntries = refSchemaEntries.concat(
      obtainDirectReferencedSchemaEntries(schemaRepository, entry, not)
    );
  }
  return refSchemaEntries;
}

/**
 * Obtain a list of all schema entries that are referenced directly
 * by the given schema or one of the `properties` or `definitions`
 * of the schema.
 * 
 * @param {SchemaRepository} schemaRepository The SchemaRepository
 * @param {SchemaEntry} entry The SchemaEntry
 * @param {object} schema The schema
 * @returns The array of referenced entries
 */
function obtainSingleSchemaReferencedEntries(schemaRepository, entry, schema) {
  let allRefSchemaEntries = [];

  const refSchemaEntries = obtainDirectReferencedSchemaEntries(
    schemaRepository,
    entry,
    schema
  );
  allRefSchemaEntries = allRefSchemaEntries.concat(refSchemaEntries);

  const properties = schema.properties;
  if (defined(properties)) {
    for (let name in properties) {
      if (properties.hasOwnProperty(name)) {
        const propertySchema = properties[name];
        const propertyRefSchemaEntries = obtainDirectReferencedSchemaEntries(
          schemaRepository,
          entry,
          propertySchema
        );
        allRefSchemaEntries = allRefSchemaEntries.concat(
          propertyRefSchemaEntries
        );
      }
    }
  }
  const definitions = schema.definitions;
  if (defined(definitions)) {
    for (let name in definitions) {
      if (definitions.hasOwnProperty(name)) {
        const definitionSchema = definitions[name];
        const definitionRefSchemaEntries = obtainDirectReferencedSchemaEntries(
          schemaRepository,
          entry,
          definitionSchema
        );
        allRefSchemaEntries = allRefSchemaEntries.concat(
          definitionRefSchemaEntries
        );
      }
    }
  }

  return allRefSchemaEntries;
}

/**
 * Recursively collect the entries that are referenced by the given
 * schema
 * 
 * @param {SchemaRepository} schemaRepository The SchemaRepository
 * @param {SchemaEntry} entry The SchemaEntry
 * @param {object} schema The schema
 * @param {string[]} processedFileNames The processed file names
 * @returns The array of referenced entries
 */
function obtainReferencedSchemaEntriesRecursive(
  schemaRepository,
  entry,
  schema,
  processedFileNames
) {
  if (processedFileNames.includes(entry.fileName)) {
    return [];
  }
  processedFileNames.push(entry.fileName);
  let resultEntries = obtainSingleSchemaReferencedEntries(
    schemaRepository,
    entry,
    schema,
  );
  let childEntries = [];
  for (let i = 0; i < resultEntries.length; i++) {
    const resultEntry = resultEntries[i];
    const nextEntries= obtainReferencedSchemaEntriesRecursive(
      schemaRepository,
      resultEntry,
      resultEntry.schema,
      processedFileNames
    );
    childEntries = childEntries.concat(nextEntries);
  }
  return resultEntries.concat(childEntries);
}

/**
 * Obtain all entries of the given repository that are referenced from 
 * the given entry.
 *
 * The list will contain the entries for all schemas that are
 * referred to from the given entry via `$ref`, `additionalProperties`, 
 * `allOf`/`anyOf`/`oneOf`, or `not` entries, or the `items` of the schema 
 * itself, any of its properties or definitions, or (recursively) any of 
 * its referenced schemas.
 *
 * @param {SchemaRepository} schemaRepository The schema repository
 * @param {SchemaEntry} entry The Schema entry
 * @returns The list of directly referenced schema entries
 */
function obtainReferencedSchemaEntries(schemaRepository, entry) {
  return obtainReferencedSchemaEntriesRecursive(
    schemaRepository,
    entry,
    entry.schema,
    []
  );
}
