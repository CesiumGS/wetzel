"use strict";
const fs = require("fs");
const path = require("path");
const defined = require("./defined");
const obtainTypeDescriptionsForProperty = require("./obtainTypeDescriptionsForProperty");
const defaultValue = require("./defaultValue");
const SchemaResolver = require("./SchemaResolver");

const typeOverrides = {
  class: {
    typeScriptTypeName: "MetadataClass",
    subdirectory: "Metadata",
  },
  "class.property": {
    typeScriptTypeName: "ClassProperty",
    subdirectory: "Metadata",
  },
  "enum.value": {
    typeScriptTypeName: "EnumValue",
    subdirectory: "Metadata",
  },
  enum: {
    typeScriptTypeName: "MetadataEnum",
    subdirectory: "Metadata",
  },
  schema: {
    typeScriptTypeName: "Schema",
    subdirectory: "Metadata",
  },
  definitions: {
    typeScriptTypeName: "any",
    isBuiltIn: true,
  },
  templateUri: {
    typeScriptTypeName: "string",
    isBuiltIn: true,
  },
  buffer: {
    typeScriptTypeName: "BufferObject",
  },
  "definitions-definitions-anyValue": {
    typeScriptTypeName: "any",
    isBuiltIn: true,
  },
  "definitions-definitions-booleanArray1D": {
    typeScriptTypeName: "any",
    isBuiltIn: true,
  },
  "definitions-definitions-noDataValue": {
    typeScriptTypeName: "any",
    isBuiltIn: true,
  },
  "definitions-definitions-numericArray1D": {
    typeScriptTypeName: "any",
    isBuiltIn: true,
  },
  "definitions-definitions-numericArray2D": {
    typeScriptTypeName: "any",
    isBuiltIn: true,
  },
  "definitions-definitions-numericValue": {
    typeScriptTypeName: "any",
    isBuiltIn: true,
  },
  "definitions-definitions-stringArray1D": {
    typeScriptTypeName: "any",
    isBuiltIn: true,
  },
  extension: {
    typeScriptTypeName: "{ [key: string]: { [key: string]: any } }",
    isBuiltIn: true,
  },
  extras: {
    typeScriptTypeName: "{ [key: string]: any }",
    isBuiltIn: true,
  },
  featureTable: {
    subdirectory: "TileFormats",
  },
  batchTable: {
    subdirectory: "TileFormats",
  },
  "i3dm.featureTable": {
    typeScriptTypeName: "I3dmFeatureTable",
    subdirectory: "TileFormats",
  },
  "pnts.featureTable": {
    typeScriptTypeName: "PntsFeatureTable",
    subdirectory: "TileFormats",
  },
  "b3dm.featureTable": {
    typeScriptTypeName: "B3dmFeatureTable",
    subdirectory: "TileFormats",
  },
  "featureTable-definitions-binaryBodyOffset": {
    typeScriptTypeName: "BinaryBodyOffset",
    subdirectory: "TileFormats",
  },
  "featureTable-definitions-binaryBodyReference": {
    typeScriptTypeName: "BinaryBodyReference",
    subdirectory: "TileFormats",
  },
  "featureTable-definitions-property": {
    typeScriptTypeName: "any",
    isBuiltIn: true,
  },
  "featureTable-definitions-globalPropertyBoolean": {
    typeScriptTypeName: "boolean",
    isBuiltIn: true,
  },
  "featureTable-definitions-globalPropertyNumber": {
    typeScriptTypeName: "number",
    isBuiltIn: true,
  },
  "featureTable-definitions-globalPropertyInteger": {
    typeScriptTypeName: "number",
    isBuiltIn: true,
  },
  "featureTable-definitions-globalPropertyCartesian3": {
    typeScriptTypeName: "BinaryBodyOffset | number[]",
    isBuiltIn: true,
  },
  "featureTable-definitions-globalPropertyCartesian4": {
    typeScriptTypeName: "BinaryBodyOffset | number[]",
    isBuiltIn: true,
  },
  "batchTable-definitions-binaryBodyReference": {
    typeScriptTypeName: "BinaryBodyReference",
    subdirectory: "TileFormats",
  },
  "batchTable-definitions-property": {
    typeScriptTypeName: "any",
    isBuiltIn: true,
  },
  style: {
    subdirectory: "Style",
  },
  "style.booleanExpression": {
    typeScriptTypeName: "string",
    isBuiltIn: true,
  },
  "style.colorExpression": {
    typeScriptTypeName: "string",
    isBuiltIn: true,
  },
  "style.conditions": {
    typeScriptTypeName: "string[]",
    isBuiltIn: true,
  },
  "style.conditions.condition": {
    typeScriptTypeName: "string[]",
    isBuiltIn: true,
  },
  "style.expression": {
    typeScriptTypeName: "string",
    isBuiltIn: true,
  },
  "style.meta": {
    typeScriptTypeName: "{ [key: string]: string }",
    isBuiltIn: true,
  },
};

/**
 * A class for generating TypeScript from JSON Schema.
 *
 * At construction, it receives a SchemaRepository that contains all the
 * type information that is required for generating the code.
 */
class TypeScriptGenerator {
  /**
   * Creates a new instance
   *
   * @param {SchemaRepository} schemaRepository The schema repository
   * @param {object} options Only documented via code. Sorry.
   */
  constructor(schemaRepository, options) {
    // The SchemaRepository that will be used to resolve
    // references that appear in the schemas
    this.schemaRepository = schemaRepository;

    // The SchemaRepository that will be used to resolve
    // schemas internally
    this.schemaResolver = new SchemaResolver(schemaRepository);

    // The list of names of types which should not receive a "top-level" entry.
    // The type names are defined as of 'generateTypeName', and stored as
    // the 'typeName' in each SchemaEntry
    this.ignorableTypeNames = defaultValue(options.ignorableTypeNames, []);

    // A dictionary that maps names of top-level types (as they are found in the
    // SchemaEntry) to the respective entry
    this.topLevelTypes = undefined;

    // The known type names. These are the keys of the topLevelTypes,
    // and the type names of definitions
    this.knownTypeNames = undefined;
  }
}

/**
 * Generate the type name for a `definition` that is found in
 * a schema for which the given type name was already generated.
 *
 * @param {string} typeName
 * @param {string} definitionName
 * @returns The definition type name
 */
function generateDefinitionTypeName(typeName, definitionName) {
  return typeName + "-definitions-" + definitionName;
}

/**
 * Computes what will be stored as `this.topLevelTypes`: A dictionary
 * that maps type names (as defined in the SchemaEntry) to the
 * respective schema, for all entries that are currently found
 * in the SchemaRepository, and for the `definitions` that they
 * contain.
 *
 * @returns The dictionary of known types
 */
TypeScriptGenerator.prototype.computeTopLevelTypes = function () {
  let topLevelTypes = {};

  const entries = this.schemaRepository.entries;
  for (let url in entries) {
    if (entries.hasOwnProperty(url)) {
      const entry = entries[url];
      const typeName = entry.typeName;
      if (topLevelTypes.hasOwnProperty(typeName)) {
        console.log("WARNING: Duplicate type name: " + typeName);
      }
      topLevelTypes[typeName] = entry;
    }
  }
  return topLevelTypes;
};

/**
 * Computes what will be stored as `this.knownTypeNames`: A list
 * of names of top-level types, and type names of 'definitions'
 *
 * @returns The array of known type names
 */
TypeScriptGenerator.prototype.computeKnownTypeNames = function () {
  let knownTypeNames = [];

  const entries = this.schemaRepository.entries;
  for (let url in entries) {
    if (entries.hasOwnProperty(url)) {
      const entry = entries[url];
      const typeName = entry.typeName;
      //console.log("Entry for " + url + " will have type name '" + typeName + "'");
      if (knownTypeNames.includes(typeName)) {
        console.log("WARNING: Duplicate type name: " + typeName);
      }
      knownTypeNames.push(typeName);

      const definitions = entry.schema.definitions;
      if (defined(definitions)) {
        for (let name in definitions) {
          if (definitions.hasOwnProperty(name)) {
            const definitionTypeName = generateDefinitionTypeName(
              typeName,
              name
            );
            if (knownTypeNames.includes(definitionTypeName)) {
              console.log(
                "WARNING: Duplicate type name: " + definitionTypeName
              );
            }
            knownTypeNames.push(definitionTypeName);
          }
        }
      }
    }
  }
  knownTypeNames.sort();
  return knownTypeNames;
};

/**
 * Initialize the `this.topLevelTypes` and `this.knownTypeNames`
 * if they have not been initialized yet, based on the current
 * contents of the SchemaRepository
 */
TypeScriptGenerator.prototype.initializeTypes = function () {
  if (defined(this.topLevelTypes)) {
    return;
  }
  this.topLevelTypes = this.computeTopLevelTypes();
  this.knownTypeNames = this.computeKnownTypeNames();

  // Print a short summary:
  console.log("Known type names:");
  for (let i = 0; i < this.knownTypeNames.length; i++) {
    const n = this.knownTypeNames[i];
    console.log("  " + n);
  }
};

/**
 * Generate the typescript files for all (non-ignored) top-level types
 *
 * @param outputPath The output path (directory)
 */
TypeScriptGenerator.prototype.generateTypeScriptFiles = function (outputPath) {
  this.initializeTypes();

  const typeNames = Object.keys(this.topLevelTypes);
  for (let i = 0; i < typeNames.length; i++) {
    const typeName = typeNames[i];
    console.log("Handling type " + typeName);
    if (this.ignorableTypeNames.includes(typeName)) {
      console.log("Skipping ignored type " + typeName);
    } else {
      const typeOverride = typeOverrides[typeName];
      if (typeOverride?.isBuiltIn) {
        console.log(
          "Skipping " +
            typeName +
            " because it is mapped to the built-in type " +
            typeOverride.typeScriptTypeName
        );
      } else {
        const entry = this.topLevelTypes[typeName];
        this.generateSingleTypeScriptFile(outputPath, entry);

        // Check if there are definitions
        const definitions = entry.schema.definitions;
        if (defined(definitions)) {
          for (let name in definitions) {
            if (definitions.hasOwnProperty(name)) {
              // Resolve the entry that corresponds to the
              // type that is defined with the definition
              const definitionEntry = this.schemaRepository.resolveRef(
                entry,
                "#/definitions/" + name
              );
              this.generateSingleTypeScriptFile(outputPath, definitionEntry);
            }
          }
        }
      }
    }
  }
};

/**
 * Generate the typescript file for the given type entry
 *
 * @param {string} outputPath The output path
 * @param {SchemaEntry} entry The entry
 */
TypeScriptGenerator.prototype.generateSingleTypeScriptFile = function (
  outputPath,
  entry
) {
  const typeName = entry.typeName;
  const typeOverride = typeOverrides[typeName];
  if (typeOverride?.isBuiltIn) {
    console.log(
      "Skipping " +
        typeName +
        " because it is mapped to the built-in type " +
        typeOverride.typeScriptTypeName
    );
    return;
  }

  const fileName = this.generateTypeScriptTypeName(typeName) + ".ts";

  console.log("Generating " + fileName + " for type " + typeName);

  const ts = this.generateSingleTypeScriptFileContents(entry);

  let fullFileName = path.resolve(outputPath, fileName);

  if (typeOverride?.subdirectory) {
    fullFileName = path.resolve(
      outputPath,
      typeOverride?.subdirectory,
      fileName
    );
  }
  const dirName = path.dirname(fullFileName);
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }
  fs.writeFileSync(fullFileName, ts);
};

TypeScriptGenerator.prototype.isBuiltInType = function (typeName) {
  if (typeName === "number") {
    return true;
  }
  if (typeName === "integer") {
    return true;
  }
  if (typeName === "string") {
    return true;
  }
  if (typeName === "boolean") {
    return true;
  }
  if (typeName === "object") {
    return true;
  }
  const typeOverride = typeOverrides[typeName];
  return typeOverride?.isBuiltIn;
};

TypeScriptGenerator.prototype.generateTypeScriptTypeName = function (
  typeName,
  dictionaryValueType
) {
  if (typeName === "number") {
    return "number";
  }
  if (typeName === "integer") {
    return "number";
  }
  if (typeName === "string") {
    return "string";
  }
  if (typeName === "boolean") {
    return "boolean";
  }
  if (typeName === "object") {
    if (dictionaryValueType) {
      return "{ [key: string]: " + dictionaryValueType + "}";
    }
    return "object";
  }

  const typeOverride = typeOverrides[typeName];
  if (typeOverride?.typeScriptTypeName) {
    console.log(
      'Overriding type name "' +
        typeName +
        '" with "' +
        typeOverride.typeScriptTypeName +
        '"'
    );
    return typeOverride.typeScriptTypeName;
  }

  const isAlphanumeric = /^[a-z0-9]+$/i;
  let result = "";
  let makeUpperCase = true;
  for (let i = 0; i < typeName.length; i++) {
    let c = typeName[i];

    if (isAlphanumeric.test(c)) {
      if (makeUpperCase) {
        result += c.toUpperCase();
        makeUpperCase = false;
      } else {
        result += c;
      }
    } else {
      makeUpperCase = true;
    }
  }
  return result;
};

/**
 * Generate the typescript file contents for the given type entry
 *
 * @param {SchemaEntry} entry The entry
 * @returns The code
 */
TypeScriptGenerator.prototype.generateSingleTypeScriptFileContents = function (
  entry
) {
  let ts = "";

  const typeName = entry.typeName;
  const schema = entry.schema;

  console.log("Generating code for " + typeName);

  let importedTypeNames = {};

  // Add the TSDoc for the type itself
  ts += this.createDescriptionComment(schema, "", ["@internal"]);

  // Define the type
  const typeScriptTypeName = this.generateTypeScriptTypeName(typeName);
  ts += "export interface " + typeScriptTypeName;
  ts += this.createExtendsDeclaration(entry, importedTypeNames);
  ts += " {" + "\n";
  ts += this.createPropertiesTypeScript(entry, schema, importedTypeNames);

  ts += "}" + "\n";
  ts += "\n";

  const importStatements = this.generateImportStatements(
    typeName,
    importedTypeNames
  );
  ts = importStatements + ts;

  ts += "\n\n";
  return ts;
};

TypeScriptGenerator.prototype.generateImportStatements = function (
  importingTypeName,
  importedTypeNames
) {
  let ts = "";
  const importingTypeOverride = typeOverrides[importingTypeName];
  const importingPath = importingTypeOverride?.subdirectory ?? "./";
  const keys = Object.keys(importedTypeNames);
  for (const key of keys) {
    if (this.isBuiltInType(key)) {
      continue;
    }
    if (key === importingTypeName) {
      continue;
    }
    const typeScriptTypeName = this.generateTypeScriptTypeName(key);
    const importedTypeOverride = typeOverrides[key];
    const importedPath = importedTypeOverride?.subdirectory ?? "./";

    let basePath = path.relative(importingPath, importedPath);
    if (basePath === "") {
      basePath = ".";
    } else if (basePath != "..") {
      basePath = "./" + basePath;
    }
    ts += `import { ${typeScriptTypeName} } from "${basePath}/${typeScriptTypeName}";\n`;
  }
  ts += "\n";
  return ts;
};

/**
 * Create the "extends" declaration for the given type.
 *
 * ```
 * interface X  extends Y, Z { }
 *             ^            ^
 *             | this part  |
 * ```
 * @param {SchemaEntry} entry The entry
 * @param {object} importedTypeNames A dictionary where this
 * method will add `typeName:true` for all extended types
 * @returns The string
 */
TypeScriptGenerator.prototype.createExtendsDeclaration = function (
  entry,
  importedTypeNames
) {
  const schema = entry.schema;

  let ts = "";
  const baseTypeEntries = this.schemaResolver.resolveDirectBaseTypeEntries(
    entry,
    schema
  );
  if (baseTypeEntries.length !== 0) {
    ts += " extends ";
    for (let i = 0; i < baseTypeEntries.length; i++) {
      if (i > 0) {
        ts += ", ";
      }
      const baseTypeEntry = baseTypeEntries[i];
      const baseTypeTypeScriptTypeName = this.generateTypeScriptTypeName(
        baseTypeEntry.typeName
      );
      importedTypeNames[baseTypeEntry.typeName] = true;
      ts += baseTypeTypeScriptTypeName;
    }
  }
  return ts;
};

TypeScriptGenerator.prototype.pragmaticallyBreakLines = function (
  input,
  limit
) {
  if (!input) {
    return [];
  }
  const words = input.split(/[ ,]+/);
  const lines = [];
  let currentLine;
  for (const word of words) {
    let nextLine;
    if (currentLine !== undefined) {
      nextLine = currentLine + " " + word;
    } else {
      nextLine = word;
    }
    if (nextLine.length > limit) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  }
  lines.push(currentLine);
  return lines;
};

/**
 * Create the TSDoc comment string containing the `schema.description`
 * (and maybe additional information, we'll see...)
 *
 * @param {schema} schema The schema
 * @param {string} indentation The indentation
 * @param {string[]} additionalLines Additional lines to add
 * @returns The generated string
 */
TypeScriptGenerator.prototype.createDescriptionComment = function (
  schema,
  indentation,
  additionalLines
) {
  let ts = "";

  const lines = this.pragmaticallyBreakLines(schema.description, 70);
  ts += indentation + "/**" + "\n";
  for (const line of lines) {
    ts += indentation + " * " + line + "\n";
  }
  for (const line of additionalLines) {
    ts += indentation + " * " + line + "\n";
  }
  ts += indentation + " */" + "\n";

  return ts;
};

/**
 * Creates the TypeScript code for the properties of the given type
 *
 * @param  {SchemaEntry} entry The SchemaEntry
 * @param  {object} schema The schema
 * @param {object} importedTypeNames A dictionary where this
 * method will add `typeName:true` for all required types
 * @return {string} The code
 */
TypeScriptGenerator.prototype.createPropertiesTypeScript = function (
  entry,
  schema,
  importedTypeNames
) {
  let ts = "";

  const allProperties = schema.properties;
  const allRequired = this.schemaResolver.resolveAllRequired(entry, schema);
  for (let name in allProperties) {
    if (allProperties.hasOwnProperty(name)) {
      const property = allProperties[name];
      const isRequired = allRequired.includes(name);

      ts += this.createPropertyTypeScript(
        entry,
        property,
        isRequired,
        name,
        importedTypeNames
      );
    }
  }

  return ts;
};

/**
 * Creates the TypeScript code for a property of the given type
 *
 * @param  {SchemaEntry} entry The SchemaEntry
 * @param  {object} property The property
 * @param  {boolean} isRequired Whether the property is required
 * @param  {string} name The name of the property
 * @param {object} importedTypeNames A dictionary where this
 * method will add `typeName:true` for all required types
 * @return {string} The code
 */
TypeScriptGenerator.prototype.createPropertyTypeScript = function (
  entry,
  property,
  isRequired,
  name,
  importedTypeNames
) {
  let ts = "";

  // For the case that the type is a dictionary with a known
  // value type, determine this value type, so that the
  // type definition for TypeScript can be
  // { [key: string]: DictionaryValueType }
  let dictionaryValueType = undefined;
  if (property.additionalProperties) {
    const additionalPropertiesTypeDescriptions =
      obtainTypeDescriptionsForProperty(
        this.schemaRepository,
        entry,
        property.additionalProperties
      );
    if (additionalPropertiesTypeDescriptions.length === 0) {
      dictionaryValueType = undefined;
    } else if (additionalPropertiesTypeDescriptions.length === 1) {
      dictionaryValueType = this.generateTypeScriptTypeName(
        additionalPropertiesTypeDescriptions[0].typeName,
        undefined
      );
      importedTypeNames[
        additionalPropertiesTypeDescriptions[0].typeName
      ] = true;
    } else {
      dictionaryValueType = "any";
    }
  }

  // Add the TSDoc comment for the property
  ts += this.createDescriptionComment(property, "  ", []);

  // Obtain the type descriptions
  const typeDescriptions = obtainTypeDescriptionsForProperty(
    this.schemaRepository,
    entry,
    property
  );

  // Multiple types
  if (typeDescriptions.length > 1) {
    // Multiple types are modeled with `any`, if they are not "oneOf"
    if (!property.oneOf) {
      ts += "  " + name + ":any;\n";
    } else {
      let propertyTypeScriptType = "";
      for (let i = 0; i < typeDescriptions.length; i++) {
        if (i > 0) {
          propertyTypeScriptType += " | ";
        }
        const typeDescription = typeDescriptions[i];
        importedTypeNames[typeDescription.typeName] = true;
        propertyTypeScriptType += this.generateTypeScriptTypeName(
          typeDescription.typeName,
          dictionaryValueType
        );
        if (typeDescription.arraySizeInfo) {
          propertyTypeScriptType += "[]";
        }
      }
      ts += "  " + name;
      if (!isRequired) {
        ts += "?";
      }
      ts += ":" + propertyTypeScriptType;
      ts += ";\n";
    }
  } else {
    // Single types and arrays are modeled with
    // example?: Type[];
    const typeDescription = typeDescriptions[0];
    importedTypeNames[typeDescription.typeName] = true;
    let propertyTypeScriptType = this.generateTypeScriptTypeName(
      typeDescription.typeName,
      dictionaryValueType
    );
    if (typeDescription.arraySizeInfo) {
      propertyTypeScriptType += "[]";
    }
    ts += "  " + name;
    if (!isRequired) {
      ts += "?";
    }
    ts += ":" + propertyTypeScriptType;
    ts += ";\n";
  }
  ts += "\n";
  return ts;
};

module.exports = TypeScriptGenerator;
