"use strict";
const defined = require("./defined");

module.exports = obtainTypeDescriptionsForProperty;

/**
 * Creates a string indicating the array size for the given object.
 *
 * The object - usually a property or a definition - may have `minItems`
 * and `maxItems` properties. Depending on their definedness and value,
 * a string `[minItems]`, `[minItems-maxItems]`, `[minItems-*]`
 * or `[*-maxItems]` will be returned.
 *
 * @param {object} object The object
 * @returns The array size info
 */
function createArraySizeInfoString(object) {
  let insideBrackets = "";
  if (defined(object.minItems) && object.minItems === object.maxItems) {
    // Min and max are the same so the array is constant size
    insideBrackets = object.minItems;
  } else if (defined(object.minItems) && defined(object.maxItems)) {
    // Min and max define a range
    insideBrackets = object.minItems + "-" + object.maxItems;
  } else if (defined(object.minItems)) {
    // Only min is defined
    insideBrackets = object.minItems + "-*";
  } else if (defined(object.maxItems)) {
    // Only max is defined
    insideBrackets = "*-" + object.maxItems;
  }
  const arraySizeInfo = "[" + insideBrackets + "]";
  return arraySizeInfo;
}

/**
 * XXX TODO Document this (or refactor it in a way so that it
 * does not require as much documentation...)
 *
 * @param {SchemaRespository} schemaRepository The schema repository
 * @param {SchemaEntry} entry The SchemaEntry
 * @param {object} propertySchema The schema of the property
 * @returns The type descriptions
 */
function obtainTypeDescriptionsForProperty(
  schemaRepository,
  entry,
  propertySchema
) {
  const type = propertySchema.type;
  if (type === "array") {
    if (defined(propertySchema.items)) {
      const elementTypeDescriptions = obtainTypeDescriptionsForProperty(
        schemaRepository,
        entry,
        propertySchema.items
      );
      if (elementTypeDescriptions.length > 1) {
        console.log("WARNING: Multiple element types for array");
      }
      const arraySizeInfo = createArraySizeInfoString(propertySchema);
      const elementTypeDescription = elementTypeDescriptions[0];
      const elementTypeName = elementTypeDescription.typeName;
      const typeDescription = {
        type: elementTypeDescription.type,
        typeName: elementTypeName,
        arraySizeInfo: arraySizeInfo,
      };
      return [typeDescription];
    }
  }

  // Fallback for old wetzel behavior:
  // For enums stored using anyOf, we'll need to get it from within anyOf.
  const anyOf = propertySchema.anyOf;
  if (defined(anyOf)) {
    // The type will be defined as one of the objects contained within
    // the anyOf property, and the only property within that object with
    // a property name "type" indicating the type of the enum value.
    const length = anyOf.length;
    for (let i = 0; i < length; ++i) {
      const type = anyOf[i].type;
      if (defined(type)) {
        const typeDescription = {
          type: type,
          typeName: type,
          arraySizeInfo: undefined,
        };
        return [typeDescription];
      }
    }
  }

  // Fallback for old wetzel behavior:
  // Try to derive the type from 'allOf' ...
  const allOf = propertySchema.allOf;
  if (defined(allOf)) {
    if (allOf.length > 1) {
      console.log(
        "WARNING: Found multiple types in allOf, using first one",
        allOf
      );
    }
    if (allOf.length > 0) {
      const baseTypeDescriptions = obtainTypeDescriptionsForProperty(
        schemaRepository,
        entry,
        allOf[0]
      );
      return baseTypeDescriptions;
    }
  }

  if (defined(propertySchema.$ref)) {
    // TODO Whether or not the 'ref' should be used, or whether this is in fact
    // a local schema with properties (and therefore a type definition)
    // is near impossible to distinguish...
    /*
    if (defined(propertySchema.properties) && Object.keys(propertySchema.properties).length > 0) {

      console.log("Not using ref " + propertySchema.$ref + " because there are other properteis"); //, propertySchema);
      const typeDescription = {
        type : 'object',
        typeName : 'object',
        arraySizeInfo : undefined
      };
      return [ typeDescription ];
    }
    */

    const refEntry = schemaRepository.resolveRef(entry, propertySchema.$ref);
    const typeDescription = {
      type: refEntry.schema.type,
      typeName: refEntry.typeName,
      arraySizeInfo: undefined,
    };
    return [typeDescription];
  }

  const oneOf = propertySchema.oneOf;
  if (defined(oneOf)) {
    let typeDescriptions = [];
    for (let i = 0; i < oneOf.length; i++) {
      const base = oneOf[i];
      const baseTypeDescriptions = obtainTypeDescriptionsForProperty(
        schemaRepository,
        entry,
        base
      );
      typeDescriptions = typeDescriptions.concat(baseTypeDescriptions);
    }
    return typeDescriptions;
  }

  if (defined(propertySchema.type)) {
    /*
    if (propertySchema.type === 'object') {
      console.log(
        "INFO: Using 'object' as type description",
        propertySchema
      );
    }
    */

    const typeDescription = {
      type: propertySchema.type,
      typeName: propertySchema.type,
      arraySizeInfo: undefined,
    };
    return [typeDescription];
  }

  // TODO Warning here?
  console.log("WARNING: No proper type description possible", propertySchema);
  const typeDescription = {
    type: "object",
    typeName: "object",
    arraySizeInfo: undefined,
  };
  return [typeDescription];
}
