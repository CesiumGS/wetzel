"use strict";
const defined = require("./defined");
const styleMd = require("./styleMd");
const styleAdoc = require("./styleAdoc");
const enums = require("./enums");
const obtainTypeDescriptionsForProperty = require("./obtainTypeDescriptionsForProperty");
const defaultValue = require("./defaultValue");
const SchemaResolver = require("./SchemaResolver");

/**
 * A class for generating Markdown (or AsciiDoc) from JSON Schema.
 *
 * At construction, it receives a SchemaRepository that contains all the
 * type information that is required for generating the documentation.
 *
 * It offers three main ("public") functions:
 *
 * - `generateTableOfContentsMarkdown` Generates the table of contents
 *    for the top-level types in the schema repository
 * - `generateFullPropertyReferenceMarkdown` Generates the property
 *    reference for all types in the schema repository
 * - `generateFullJsonSchemaReferenceMarkdown` Generates the documentation
 *    that contains the "inlined" or "embedded" JSON schema files
 *
 * (This is based on `generateMarkdown` from the pre-refactoring state)
 */
class MarkdownGenerator {
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

    // The Style that determines details about the Markdown-
    // and AsciiDoc ouput
    this.style = new styleMd();
    if (
      defined(options.styleMode) &&
      options.styleMode === enums.styleModeOption.AsciiDoctor
    ) {
      this.style = new styleAdoc();
    }
    if (defined(options.fragmentPrefix)) {
      this.style.setAnchorPrefix(options.fragmentPrefix);
    }
    if (defined(options.checkmark)) {
      this.style.setCheckmark(options.checkmark);
    }
    if (defined(options.mustKeyword)) {
      this.style.setMustKeyword(options.mustKeyword);
    }

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

    // The type names that should be linked (i.e. the knownTypeNames
    // excluding the ignorableTypeNames).
    // Note: For historical reasons, this list will be sorted by the
    // string length of the type names!
    this.linkedTypeNames = undefined;

    // Other stuff... (TODO Document that!)
    this.autoLink = options.autoLink;
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
MarkdownGenerator.prototype.computeTopLevelTypes = function () {
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
 MarkdownGenerator.prototype.computeKnownTypeNames = function () {
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
              console.log("WARNING: Duplicate type name: " + definitionTypeName);
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
 * Initialize the `this.topLevelTypes`, `this.knownTypeNames` and
 * `this.linkedTypeNames` if they have not been initialized yet,
 * based on the current contents of the SchemaRepository
 */
MarkdownGenerator.prototype.initializeTypes = function () {
  if (defined(this.topLevelTypes)) {
    return;
  }
  this.topLevelTypes = this.computeTopLevelTypes();
  this.knownTypeNames = this.computeKnownTypeNames();

  // Determine the type names for which (internal) links
  // should be created when they appear as the type of
  // a property.
  const ignoredTypeNames = this.ignorableTypeNames;
  this.linkedTypeNames = this.knownTypeNames.filter(function (e) {
    return !ignoredTypeNames.includes(e);
  });

  // Sort the linked type names by their length, ascendingly
  // TODO This sorting is required for 'autoLinkDescription',
  // but this should be better tested and documented!
  this.linkedTypeNames = this.linkedTypeNames.sort(function (a, b) {
    return a.length - b.length;
  });

  // Print a short summary:
  console.log("Known type names:");
  for (let i = 0; i < this.knownTypeNames.length; i++) {
    const n = this.knownTypeNames[i];
    const linked = this.linkedTypeNames.includes(n) ? " (linked)" : "";
    console.log("  " + n + linked);
  }
};

/**
 * Generate the markdown for the table of contents.
 *
 * This will contain all top-level types that are currently stored in the
 * schema repository (and that are not marked as "ignorable"), with each
 * entry being generated using 'createTableOfContentsEntryMarkdown'.
 */
MarkdownGenerator.prototype.generateTableOfContentsMarkdown = function (
  headerLevel,
  rootTypeName
) {
  this.initializeTypes();

  let md = "";

  md += this.style.getHeaderMarkdown(headerLevel) + " Objects\n\n";

  const topLevelTypeNames = Object.keys(this.topLevelTypes);
  for (let i = 0; i < topLevelTypeNames.length; i++) {
    const typeName = topLevelTypeNames[i];
    if (!this.ignorableTypeNames.includes(typeName)) {
      const entry = this.topLevelTypes[typeName];
      const isRoot = typeName === rootTypeName;
      md += this.createTableOfContentsEntryMarkdown(entry, isRoot);
    }
  }
  return md;
};

/**
 * Create the markdown for one entry of the table of contents
 *
 * @param {SchemaEntry} entry The entry
 * @param {boolean} isRoot Whether this should be marked as the "root object"
 * @returns The markdown
 */
MarkdownGenerator.prototype.createTableOfContentsEntryMarkdown = function (
  entry,
  isRoot
) {
  const schema = entry.schema;
  const title = schema.title;
  const typeName = entry.typeName;
  const anchor =
    this.style.createPropertyReferenceAnchorStringForType(typeName);
  const formattedTitle = this.style.styleCode(title);
  let md = "";
  const item =
    this.style.getInternalLinkMarkdown(formattedTitle, anchor) +
    (isRoot ? " (root object)" : "");
  md += this.style.bulletItem(item);
  return md;
};

/**
 * Generate the JSON schema reference, which contains the actual JSON
 * schema, embedded or inlined (depending on the embedMode). This will
 * be what the `JSON Schema: <link>` will point to.
 *
 * @param {integer} headerLevel The header level
 * @param {string} embedMode The `enums.embedMode`
 * @returns The JSON schema reference
 */
MarkdownGenerator.prototype.generateFullJsonSchemaReferenceMarkdown = function (
  headerLevel,
  embedMode
) {
  this.initializeTypes();

  let md = "";

  const topLevelTypeNames = Object.keys(this.topLevelTypes).sort();
  for (let i = 0; i < topLevelTypeNames.length; i++) {
    const typeName = topLevelTypeNames[i];
    md += this.generateSingleJsonSchemaReferenceMarkdown(
      typeName,
      headerLevel,
      embedMode
    );
    md += "\n\n";
  }
  return md;
};

/**
 * Generate the JSON schema reference for the type with the given name.
 * This contains the actual JSON schema for the specified type,
 * embedded or inlined (depending on the embedMode)
 *
 * @param {string} typeName
 * @param {integer} headerLevel The header level
 * @param {string} embedMode The `enums.embedMode`
 * @returns The JSON schema reference
 */
MarkdownGenerator.prototype.generateSingleJsonSchemaReferenceMarkdown =
  function (typeName, headerLevel, embedMode) {
    this.initializeTypes();

    let md = "";

    const entry = this.topLevelTypes[typeName];
    console.log("Generating JSON Schema reference for " + typeName);

    const schema = entry.schema;

    // Create the section header
    const sectionTitle = "JSON Schema for " + schema.title;
    const anchor =
      this.style.createSchemaReferenceAnchorStringForType(typeName);
    md += this.style.getSectionMarkdown(headerLevel, sectionTitle, anchor);

    // Embed or inline the actual JSON schema
    const directory = entry.directory;
    const fileName = entry.fileName;
    if (embedMode === enums.embedMode.writeIncludeStatements) {
      md += this.style.embedJsonSchema(directory, fileName);
    }
    if (embedMode === enums.embedMode.inlineFileContents) {
      md += this.style.inlineJsonSchema(directory, fileName);
    }

    return md;
  };

/**
 * Generate the property reference for all (non-ignored) top-level types
 */
MarkdownGenerator.prototype.generateFullPropertyReferenceMarkdown = function (
  headerLevel,
  embedMode
) {
  this.initializeTypes();

  let md = "";

  const topLevelTypeNames = Object.keys(this.topLevelTypes).sort();
  for (let i = 0; i < topLevelTypeNames.length; i++) {
    const typeName = topLevelTypeNames[i];
    if (this.ignorableTypeNames.includes(typeName)) {
      console.log("Skipping property reference for ignored type " + typeName);
    } else {
      md += this.generateSinglePropertyReferenceMarkdown(
        typeName,
        headerLevel,
        embedMode
      );
      md += "\n\n";
    }
  }
  return md;
};

/**
 * Generate the property reference for the top-level type with the
 * given name, as it is looked up in `this.topLevelTypes`
 *
 * @param {string} typeName The name of the type
 * @param {integer} headerLevel The header level
 * @param {string} embedMode The `enums.embedMode`
 * @returns
 */
MarkdownGenerator.prototype.generateSinglePropertyReferenceMarkdown = function (
  typeName,
  headerLevel,
  embedMode
) {
  this.initializeTypes();

  let md = "";

  const entry = this.topLevelTypes[typeName];
  console.log("Generating property reference for " + typeName);

  const schema = entry.schema;

  // Start the section with the schema title and an anchor
  const title = schema.title;
  const anchor =
    this.style.createPropertyReferenceAnchorStringForType(typeName);
  md += this.style.getSectionMarkdown(headerLevel, title, anchor);

  // Add the description (including special glTF descriptions)
  md += this.createDescriptionMarkdown(schema);

  // Prepare the markdown for the link to the JSON schema
  let schemaLinkMarkdown = "";
  if (embedMode !== enums.embedMode.none) {
    schemaLinkMarkdown = this.createSchemaLinkMarkdown(entry, embedMode);
  }

  // Create the actual properties reference
  md += this.createPropertiesReferenceMarkdown(
    entry,
    schema,
    headerLevel + 1,
    schemaLinkMarkdown
  );

  // Create the reference for the `definitions` of the current schema
  md += this.createDefinitionsReferenceMarkdown(entry, schema, headerLevel + 1);

  md += "\n\n";
  return md;
};

/**
 * Create the markdown that contains the link to the JSON schema
 *
 * @param {SchemaEntry} entry The SchemaEntry
 * @param {string} embedMode The `enums.embedMode`
 * @returns The generated markdown
 */
MarkdownGenerator.prototype.createSchemaLinkMarkdown = function (entry) {
  let md = "";

  // TODO Handle the former "schemaRelativeBasePath"
  const typeName = entry.typeName;
  const anchor = this.style.createSchemaReferenceAnchorStringForType(typeName);
  const title = this.style.styleCode(entry.fileName);
  let linkMarkdown = this.style.getInternalLinkMarkdown(title, anchor);

  md += this.style.bulletItem(
    this.style.bold("JSON schema") + ": " + linkMarkdown + "\n"
  );
  return md;
};

/**
 * Create the markdown string containing the `schema.description`.
 *
 * NOTE: This is intended for the "property details" section, and
 * will also add the special descriptions that are stored in
 * `gltf_sectionDescription` and information about the WebGL
 * functions that is stored in `gltf_webgl`.
 *
 * @param {schema} schema The schema
 * @returns The generated string
 */
MarkdownGenerator.prototype.createDescriptionMarkdown = function (schema) {
  let md = "";

  // Render description
  const description = this.autoLinkDescription(schema.description);
  if (defined(description)) {
    md += description + "\n\n";
  }

  // TODO: Add plugin point for custom JSON schema properties like gltf_*
  const extendedDescription = schema.gltf_sectionDescription;
  if (defined(extendedDescription)) {
    md += this.autoLinkDescription(extendedDescription) + "\n\n";
  }

  // TODO: Add plugin point for custom JSON schema properties like gltf_*
  const webgl = schema.gltf_webgl;
  if (defined(webgl)) {
    md +=
      this.style.styleBold("Related WebGL functions") + ": " + webgl + "\n\n";
  }

  return md;
};

/**
 * Creates the markdown for the properties of a schema.
 *
 * @param  {SchemaEntry} entry The SchemaEntry
 * @param  {object} schema The schema being converted to markdown.
 * @param  {integer} headerLevel The starting level for the headers.
 * @param  {string} schemaLinkMarkdown The markdown for the link to the actual JSON schema
 * @return {string} The markdown for the schema.
 */
MarkdownGenerator.prototype.createPropertiesReferenceMarkdown = function (
  entry,
  schema,
  headerLevel,
  schemaLinkMarkdown
) {
  let md = "";

  const allProperties = this.schemaResolver.resolveAllProperties(entry, schema);
  const allRequired = this.schemaResolver.resolveAllRequired(entry, schema);

  // Render table with summary of each property
  md += this.createPropertiesSummaryTableMarkdown(
    entry,
    schema.title,
    allProperties,
    allRequired
  );

  // Add additional properties and property names.
  md += this.createAdditionalPropertiesDetailsMarkdown(
    entry,
    schema,
    "Type of additional properties"
  );

  if (defined(schemaLinkMarkdown)) {
    md += schemaLinkMarkdown;
  }

  md += "\n";

  // Render one section for each property
  md += this.createPropertiesDetailsMarkdown(
    entry,
    allProperties,
    allRequired,
    headerLevel
  );

  // TODO Whatever that is...
  md += this.createExamples(schema, headerLevel);

  return md;
};

MarkdownGenerator.prototype.createPropertiesSummaryTableMarkdown = function (
  entry,
  title,
  allProperties,
  allRequired
) {
  let md = "";

  if (Object.keys(allProperties).length <= 0) {
    return md;
  }

  md += this.style.beginTable(this.style.typeValue(title) + " Properties", [
    "   ",
    "Type",
    "Description",
    "Required",
  ]);

  for (let name in allProperties) {
    if (allProperties.hasOwnProperty(name)) {
      let property = allProperties[name];
      const isRequired = allRequired.includes(name);

      // Collect all basic properties of the property, to
      // generate the summary
      property = this.schemaResolver.resolveBasicProperties(entry, property);

      const nameMd = this.style.propertyNameSummary(name);
      const typeMd = this.createPropertyTypeMarkdown(entry, property);
      const descriptionMd = this.autoLinkDescription(property.description);
      const requiredMd = this.createPropertyRequirednessMarkdown(
        property,
        isRequired
      );
      md += this.style.addTableRow([nameMd, typeMd, descriptionMd, requiredMd]);
    }
  }

  md += this.style.endTable();

  return md;
};

MarkdownGenerator.prototype.createPropertiesDetailsMarkdown = function (
  entry,
  allProperties,
  allRequired,
  headerLevel
) {
  let md = "";

  for (let name in allProperties) {
    if (allProperties.hasOwnProperty(name)) {
      const property = allProperties[name];
      const isRequired = allRequired.includes(name);

      md += this.createPropertyDetailsMarkdown(
        entry,
        property,
        isRequired,
        name,
        headerLevel
      );
    }
  }
  md += "\n";
  return md;
};

MarkdownGenerator.prototype.createPropertyDetailsMarkdown = function (
  entry,
  property,
  isRequired,
  name,
  headerLevel
) {
  let md = "";

  // Collect all basic properties of the property
  property = this.schemaResolver.resolveBasicProperties(entry, property);

  // Create the header of the form "<typeName>.<propertyName>"
  // (TODO Maybe this form should be configurable...)
  const headerMd = this.style.getHeaderMarkdown(headerLevel);
  const propertyTitle = entry.typeName + "." + name;
  md += headerMd + " " + propertyTitle + "\n\n";

  // TODO: Add plugin point for custom JSON schema properties like gltf_*
  const detailedDescription = this.autoLinkDescription(
    property.gltf_detailedDescription
  );
  if (defined(detailedDescription)) {
    md += detailedDescription + "\n\n";
  } else if (defined(property.description)) {
    md += property.description + "\n\n";
  }

  const formattedTypeName = this.createPropertyTypeMarkdown(entry, property);
  md += this.style.bulletItem(
    this.style.propertyDetails("Type") + ": " + formattedTypeName,
    0
  );

  md += this.createArrayDetailsMarkdown(entry, property);

  const requiredness = this.createPropertyRequirednessMarkdown(
    property,
    isRequired
  );
  md += this.style.bulletItem(
    this.style.propertyDetails("Required") + ": " + requiredness,
    0
  );
  md += this.createBasicSchemaMarkdown(entry, property, 0);

  md += "\n";

  return md;
};

/**
 * Creates markdown with bullet points containing details about array-related
 * properties of the given schema.
 *
 * This includes information about
 * - the uniqueness of array items
 * - numeric minimum/maximum values for the items
 * - minimum/maximum string length for the items
 * - an enumeration of possible enum values for the items
 *
 * @param {SchemaEntry} entry The SchemaEntry
 * @param {object} schema The schema
 * @returns The generated markdown
 */
MarkdownGenerator.prototype.createArrayDetailsMarkdown = function (
  entry,
  schema
) {
  let md = "";

  // Mention whether items must be unique
  const uniqueItems = schema.uniqueItems;
  if (defined(uniqueItems) && uniqueItems) {
    const eachElementInTheArrayMust =
      "Each element in the array" + this.style.mustKeyword;
    md += this.style.bulletItem(eachElementInTheArrayMust + "be unique.", 1);
  }

  // Create the bullet points describing further item properties
  let items = schema.items;
  if (defined(items)) {
    // Collect all basic properties of the items
    items = this.schemaResolver.resolveBasicProperties(entry, items);

    md += this.createItemsNumericMinMaxMarkdown(items);
    md += this.createItemsMinMaxStringLengthMarkdown(items);
    md += this.createItemsEnumValuesMarkdown(items);
  }
  return md;
};

/**
 * Create a markdown string containing information about the limits of
 * numeric array items.
 *
 * The result will be a list of bullet points, indicating the minimum and
 * maximum value of numeric array items.
 *
 * The input can be given with ranges for numeric values being defined using
 * the draft-04 style, or the draft/2020-12 style. See
 * https://json-schema.org/understanding-json-schema/reference/numeric.html#range
 * for details.
 *
 * @param  {object} items The "items" part of the schema
 * @return {string} A string that describes the numeric limits
 */
MarkdownGenerator.prototype.createItemsNumericMinMaxMarkdown = function (
  items
) {
  let md = "";

  // In draft-04, minimum/maximum are numbers and exclusiveMinimum/exclusiveMaximum
  // are booleans that indicate the exclusiveness.
  // In draft/2020-12, exclusiveMinimum/exclusiveMaximum are numbers that are used for
  // the exclusive case (while minimum/maximum are only used for the inclusive case)
  // Extract this information regardless of the schema version here:
  let minimum; // number
  let maximum; // number
  let exclusiveMinimum; // boolean
  let exclusiveMaximum; // boolean
  if (
    defined(items.exclusiveMinimum) &&
    typeof items.exclusiveMinimum === "number"
  ) {
    minimum = items.exclusiveMinimum;
    exclusiveMinimum = true;
  } else {
    minimum = items.minimum;
    exclusiveMinimum = items.exclusiveMinimum === true;
  }
  if (
    defined(items.exclusiveMaximum) &&
    typeof items.exclusiveMaximum === "number"
  ) {
    maximum = items.exclusiveMaximum;
    exclusiveMaximum = true;
  } else {
    maximum = items.maximum;
    exclusiveMaximum = items.exclusiveMaximum === true;
  }

  const eachElementInTheArrayMust =
    "Each element in the array" + this.style.mustKeyword;

  const minString = exclusiveMinimum
    ? "greater than"
    : "greater than or equal to";
  const maxString = exclusiveMaximum ? "less than" : "less than or equal to";

  if (defined(minimum) && defined(maximum)) {
    md += this.style.bulletItem(
      eachElementInTheArrayMust +
        "be " +
        minString +
        " " +
        this.style.styleCode(minimum) +
        " and " +
        maxString +
        " " +
        this.style.styleCode(maximum) +
        ".",
      1
    );
  } else if (defined(minimum)) {
    md += this.style.bulletItem(
      eachElementInTheArrayMust +
        "be " +
        minString +
        " " +
        this.style.styleCode(minimum) +
        ".",
      1
    );
  } else if (defined(maximum)) {
    md += this.style.bulletItem(
      eachElementInTheArrayMust +
        "be " +
        maxString +
        " " +
        this.style.styleCode(maximum) +
        ".",
      1
    );
  }
  return md;
};

/**
 * Create a markdown string containing information about the minimum
 * and maximum length of string array items.
 *
 * The result will be a list of bullet points indicating the minimum
 * and maximum length of the string array items.
 *
 * @param  {object} items The "items" part of the schema
 * @return {string} A string that describes the string lengths
 */
MarkdownGenerator.prototype.createItemsMinMaxStringLengthMarkdown = function (
  items
) {
  let md = "";

  const eachElementInTheArrayMust =
    "Each element in the array" + this.style.mustKeyword;

  if (defined(items.minLength) && defined(items.maxLength)) {
    md += this.style.bulletItem(
      eachElementInTheArrayMust +
        "have length " +
        " between " +
        this.style.styleCode(items.minLength) +
        " and " +
        this.style.styleCode(items.maxLength) +
        ".",
      1
    );
  } else if (defined(items.minLength)) {
    md += this.style.bulletItem(
      eachElementInTheArrayMust +
        "have length " +
        "greater than or equal to " +
        this.style.styleCode(items.minLength) +
        ".",
      1
    );
  } else if (defined(items.maxLength)) {
    md += this.style.bulletItem(
      eachElementInTheArrayMust +
        "have length " +
        "less than or equal to " +
        this.style.styleCode(items.maxLength) +
        ".",
      1
    );
  }
  return md;
};

/**
 * Create a markdown string containing a bullet point list enumerating
 * the possible 'enum' values for array items.
 *
 * @param  {object} items The "items" part of the schema
 * @return {string} A string that describes the enum values
 */
MarkdownGenerator.prototype.createItemsEnumValuesMarkdown = function (items) {
  let md = "";

  const itemsString = this.getEnumString(items, 2);
  if (defined(itemsString)) {
    const eachElementInTheArrayMust =
      "Each element in the array" + this.style.mustKeyword;
    md +=
      this.style.bulletItem(
        eachElementInTheArrayMust + "be one of the following values:",
        1
      ) + itemsString;
  }
  return md;
};

/**
 * Creates markdown for what is considered "basic" schema info for a
 * single property (or definition) in wetzel, in the context of the
 * "property defails" section.
 *
 * This contains bullet points about...
 * - minimum/maximum numeric values
 * - string format, pattern, minimum and maximum length
 * - minimum and maximum number of properties
 * - allowed enum values
 * - some information about additional properties
 *
 * @param {SchemaEntry} entry The SchemaEntry
 * @param {object} schema The schema (usually a property or definition)
 * @param {integer} depth The indentation depth of bullet point lists
 * @returns The generated markdown
 */
MarkdownGenerator.prototype.createBasicSchemaMarkdown = function (
  entry,
  schema,
  depth
) {
  let md = "";

  md += this.createNumericMinimumMarkdown(schema, depth);
  md += this.createNumericMaximumMarkdown(schema, depth);

  const format = schema.format;
  if (defined(format)) {
    md += this.style.bulletItem(
      this.style.propertyDetails("Format") +
        ": " +
        this.style.styleCode(format),
      depth
    );
  }

  const pattern = schema.pattern;
  if (defined(pattern)) {
    md += this.style.bulletItem(
      this.style.propertyDetails("Pattern") +
        ": " +
        this.style.styleCode(pattern),
      depth
    );
  }

  const minLength = schema.minLength;
  if (defined(minLength)) {
    md += this.style.bulletItem(
      this.style.propertyDetails("Minimum Length") +
        ": " +
        this.style.minMax(">= " + minLength),
      depth
    );
  }

  const maxLength = schema.maxLength;
  if (defined(maxLength)) {
    md += this.style.bulletItem(
      this.style.propertyDetails("Maximum Length") +
        ": " +
        this.style.minMax("<= " + maxLength),
      depth
    );
  }

  const minProperties = schema.minProperties;
  if (defined(minProperties)) {
    md += this.style.bulletItem(
      this.style.propertyDetails("Minimum number of properties") +
        ": " +
        this.style.styleCode(minProperties),
      depth
    );
  }

  const maxProperties = schema.maxProperties;
  if (defined(maxProperties)) {
    md += this.style.bulletItem(
      this.style.propertyDetails("Maximum number of properties") +
        ": " +
        this.style.styleCode(maxProperties),
      depth
    );
  }

  const enumString = this.getEnumString(schema, depth + 1);
  if (defined(enumString)) {
    md +=
      this.style.bulletItem(
        this.style.propertyDetails("Allowed values") + ": ",
        depth
      ) + enumString;
  }

  if (
    defined(schema.additionalProperties) &&
    typeof schema.additionalProperties === "object"
  ) {
    md += this.createAdditionalPropertiesDetailsMarkdown(
      entry,
      schema,
      "Type of each property"
    );
  }

  // TODO: Add plugin point for custom JSON schema properties like gltf_*
  const webgl = schema.gltf_webgl;
  if (defined(webgl)) {
    md += this.style.bulletItem(
      this.style.styleBold("Related WebGL functions") + ": " + webgl,
      depth
    );
  }

  return md;
};

/**
 * Creates a markdown string containig a bullet item that describes
 * the numeric minimum value of the given property.
 *
 * The input can be given with ranges for numeric values being defined using
 * the draft-04 style, or the draft/2020-12 style. See
 * https://json-schema.org/understanding-json-schema/reference/numeric.html#range
 * for details.
 *
 * @param {object} property The property
 * @param {number} depth The indentation depth for the bullet points
 * @returns The markdown string
 */
MarkdownGenerator.prototype.createNumericMinimumMarkdown = function (
  property,
  depth
) {
  let md = "";
  if (
    defined(property.exclusiveMinimum) &&
    typeof property.exclusiveMinimum === "number"
  ) {
    md += this.style.bulletItem(
      this.style.propertyDetails("Minimum") +
        ": " +
        this.style.minMax(" > " + property.exclusiveMinimum),
      depth
    );
  } else {
    const minimum = property.minimum;
    if (defined(minimum)) {
      const exclusiveMinimum =
        defined(property.exclusiveMinimum) && property.exclusiveMinimum;
      md += this.style.bulletItem(
        this.style.propertyDetails("Minimum") +
          ": " +
          this.style.minMax((exclusiveMinimum ? " > " : " >= ") + minimum),
        depth
      );
    }
  }
  return md;
};

/**
 * Creates a markdown string containig a bullet item that describes
 * the numeric maximum value of the given property.
 *
 * The input can be given with ranges for numeric values being defined using
 * the draft-04 style, or the draft/2020-12 style. See
 * https://json-schema.org/understanding-json-schema/reference/numeric.html#range
 * for details.
 *
 * @param {object} property The property
 * @param {number} depth The indentation depth for the bullet points
 * @returns The markdown string
 */
MarkdownGenerator.prototype.createNumericMaximumMarkdown = function (
  property,
  depth
) {
  let md = "";
  if (
    defined(property.exclusiveMaximum) &&
    typeof property.exclusiveMaximum === "number"
  ) {
    md += this.style.bulletItem(
      this.style.propertyDetails("Maximum") +
        ": " +
        this.style.minMax(" < " + property.exclusiveMaximum),
      depth
    );
  } else {
    const maximum = property.maximum;
    if (defined(maximum)) {
      const exclusiveMaximum =
        defined(property.exclusiveMaximum) && property.exclusiveMaximum;
      md += this.style.bulletItem(
        this.style.propertyDetails("Maximum") +
          ": " +
          this.style.minMax((exclusiveMaximum ? " < " : " <= ") + maximum),
        depth
      );
    }
  }
  return md;
};

/**
 * Create markdown with information about the 'aditionalProperties' of the
 * given schema.
 *
 *
 * @param {object} schema The schema
 * @param {SchemaEntry} entry The SchemaEntry
 * @param {string} detailsHeader TODO document
 * @returns The generated markdown
 */
MarkdownGenerator.prototype.createAdditionalPropertiesDetailsMarkdown =
  function (entry, schema, detailsHeader) {
    const additionalProperties = schema.additionalProperties;
    if (defined(additionalProperties) && !additionalProperties) {
      return this.style.bulletItem(
        this.style.propertyDetails("Additional properties are not allowed.")
      );
    }
    if (
      !defined(additionalProperties) ||
      typeof additionalProperties !== "object"
    ) {
      return this.style.bulletItem(
        this.style.propertyDetails("Additional properties are allowed.")
      );
    }

    const additionalPropertiesTypeDescriptions =
      obtainTypeDescriptionsForProperty(
        this.schemaRepository,
        entry,
        additionalProperties,
        this.linkedTypeNames
      );

    // TODO Properly handle the fact that this is an array!
    let additionalPropertiesTypeName =
      additionalPropertiesTypeDescriptions[0].typeName;
    if (!this.linkedTypeNames.includes(additionalPropertiesTypeName)) {
      additionalPropertiesTypeName =
        additionalPropertiesTypeDescriptions[0].type;
    }
    let formattedType = this.style.typeValue(additionalPropertiesTypeName);
    formattedType = this.style.linkType(
      formattedType,
      additionalPropertiesTypeName,
      this.autoLink
    );

    return (
      this.style.bulletItem(
        this.style.propertyDetails("Additional properties are allowed.")
      ) +
      this.style.bulletItem(
        this.style.propertyDetails(detailsHeader) + ": " + formattedType,
        0
      )
    );
  };

/**
 * XXX TODO Document this (see obtainTypeDescriptionsForProperty)
 *
 * @param {SchemaEntry} entry The SchemaEntry
 * @param {object} property The property schema
 * @returns The generated markdown
 */
MarkdownGenerator.prototype.createPropertyTypeMarkdown = function (
  entry,
  property
) {
  let md = "";

  const typeDescriptions = obtainTypeDescriptionsForProperty(
    this.schemaRepository,
    entry,
    property
  );

  if (typeDescriptions.length > 1) {
    md += "One of ";
  }
  for (let i = 0; i < typeDescriptions.length; i++) {
    const typeDescription = typeDescriptions[i];
    const typeName = typeDescription.typeName;
    if (i > 0) {
      md += ", ";
    }
    if (this.linkedTypeNames.includes(typeName)) {
      md += this.style.linkType(
        this.style.typeValue(typeName),
        typeName,
        this.autoLink
      );
    } else {
      const type = typeDescription.type;
      md += this.style.typeValue(type);
    }
    const arraySizeInfo = typeDescription.arraySizeInfo;
    if (defined(arraySizeInfo)) {
      md += " " + this.style.typeValue(arraySizeInfo);
    }
  }
  return md;
};

/**
 * Creates a markdown string that describes the "requiredness" of
 * a property.
 *
 * If the property is required, then this is the 'required icon' + "Yes".
 * Otherwise, it is 'No', with additional information about the
 * default value of the property (if present).
 *
 * @param {property} property The property
 * @param {boolean} isRequired Whether the property is required
 * @returns The resulting markdown string
 */
MarkdownGenerator.prototype.createPropertyRequirednessMarkdown = function (
  property,
  isRequired
) {
  let md;
  if (isRequired === true) {
    md = this.style.requiredIcon + "Yes";
  } else {
    const propertyDefault = property.default;
    if (defined(propertyDefault)) {
      let defaultString;
      if (Array.isArray(propertyDefault)) {
        defaultString = "[" + propertyDefault.toString() + "]";
      } else if (typeof propertyDefault === "object") {
        defaultString = JSON.stringify(propertyDefault);
      } else {
        defaultString = propertyDefault;
      }
      md =
        "No, default: " + this.style.defaultValue(defaultString, property.type);
    } else {
      md = "No";
    }
  }
  return md;
};

/**
 * @function getEnumString
 * Gets the string describing the possible enum values.
 * Will try getting the information from the enum/gltf_enumNames properties, but if they don't exist,
 * it will fall back to trying to get the values from the anyOf object.
 * @param  {object} schema The schema object that may be of an enum type.
 * @param  {integer} depth How deep the bullet points for enum values should be.  Maximum is 2.
 * @return {string} A string that enumerates all the possible enum values for this schema object.
 */
MarkdownGenerator.prototype.getEnumString = function (schema, depth) {
  const propertyEnum = schema["enum"];
  if (!defined(propertyEnum)) {
    // It's possible that the enum value is defined using the anyOf construct instead.
    return this.getAnyOfEnumString(schema, depth);
  }

  // TODO This was used in glTF 1.0 as a different approach to associate
  // the enum constant values with names (like GL_TRIANGLES), and might
  // be omitted now...
  const propertyEnumNames = schema["gltf_enumNames"];
  const type = schema.type;
  let allowedValues = "";
  const length = propertyEnum.length;
  for (let i = 0; i < length; ++i) {
    let element = this.style.enumElement(propertyEnum[i], type);
    if (defined(propertyEnumNames)) {
      element += " " + propertyEnumNames[i];
    }
    allowedValues += this.style.bulletItem(element, depth);
  }
  return allowedValues;
};

/**
 * @function getAnyOfEnumString
 * Gets the string describing the possible enum values, if they are defined within a JSON anyOf object.
 * @param  {object} schema The schema object that may be of an enum type.
 * @param  {integer} depth How deep the bullet points for enum values should be.  Maximum is 2.
 * @return {string} A string that enumerates all the possible enum values for this schema object.
 */
MarkdownGenerator.prototype.getAnyOfEnumString = function (schema, depth) {
  const propertyAnyOf = schema["anyOf"];
  if (!defined(propertyAnyOf)) {
    return undefined;
  }

  // Try to determine the type from the only element that
  // contains a `type` property, which is a string indicating
  // the type
  let type = "object";
  const length = propertyAnyOf.length;
  for (let i = 0; i < length; ++i) {
    const element = propertyAnyOf[i];
    if (defined(element.type)) {
      type = element.type;
      break;
    }
  }

  let allowedValues = "";
  for (let i = 0; i < length; ++i) {
    const element = propertyAnyOf[i];
    const constValue = element["const"];
    const enumValue = element["enum"];
    const enumDescription = element["description"];
    let enumString;

    // Check if 'const' has been used in place of 'enum'.
    if (defined(constValue)) {
      enumString = this.style.enumElement(constValue, type);
      if (defined(enumDescription)) {
        enumString += " " + enumDescription;
      }
    } else {
      // The likely scenario when there's no enum value is that it's the object
      // containing the _type_ of the enum.  Otherwise, it should be an array with
      // a single value in it.
      if (
        !defined(enumValue) ||
        !Array.isArray(enumValue) ||
        enumValue.length === 0
      ) {
        continue;
      }

      enumString = this.style.enumElement(enumValue[0], type);
      if (defined(enumDescription)) {
        enumString += " " + enumDescription;
      }
    }

    allowedValues += this.style.bulletItem(enumString, depth);
  }

  return allowedValues;
};

/**
 * Creates... some markdown.
 *
 * TODO: Comment....
 *
 * @param {object} schema The schema
 * @param {integer} headerLevel The header level
 * @returns Some markdown
 */
MarkdownGenerator.prototype.createExamples = function (schema, headerLevel) {
  const examples = schema.examples;
  if (!defined(examples)) return "";
  let md = this.style.getHeaderMarkdown(headerLevel) + " Examples" + "\n\n";
  for (const example of examples) {
    md += this.style.bulletItem(
      this.style.defaultValue(example, schema.type),
      0
    );
  }
  return md;
};

/**
 * @function autoLinkDescription
 * This will take a string that describes a type that may potentially reference _other_ types, and then
 * automatically add markdown link refences to those other types inline. This is an admittedly simple
 * (and potentially buggy) approach to the problem, but seems sufficient.
 * @param  {string} description The string that should be auto-linked
 * If there are multiple types with the same starting root string, it's imperative that the array is sorted such that the longer names are ordered first.
 * @return {string} The auto-linked description.
 */
MarkdownGenerator.prototype.autoLinkDescription = function (description) {
  if (this.autoLink === enums.autoLinkOption.aggressive) {
    for (let typeName of this.linkedTypeNames) {
      description = this.style.linkType(description, typeName, this.autoLink);
    }
  }
  return description;
};

/**
 * Create the markdown for the 'definitions' in the given schema.
 *
 * If the given schema contains 'definitions', then they will be
 * listed similar to the "top-level" types, including information
 * about the defined types and their properties.
 *
 * @param {SchemaEntry} entry The SchemaEntry
 * @param {object} schema The schema that may contain 'definitions'
 * @param {integer} headerLevel The header level for the sections
 * @returns The generated markdown
 */
MarkdownGenerator.prototype.createDefinitionsReferenceMarkdown = function (
  entry,
  schema,
  headerLevel
) {
  let md = "";

  // Check if there are definitions
  const definitions = schema.definitions;
  if (!defined(definitions)) {
    return md;
  }
  if (Object.keys(definitions).length <= 0) {
    return md;
  }

  // Create a header for the following definitions
  const title = schema.title;
  const headerMd = this.style.getHeaderMarkdown(headerLevel);
  md +=
    headerMd +
    " " +
    this.style.styleBold(this.style.typeValue(title) + " Definitions") +
    "\n\n";

  // Create the documentation for each definition
  for (let name in definitions) {
    if (definitions.hasOwnProperty(name)) {
      // Resolve the entry that corresponds to the
      // type that is defined with the definition
      const definitionEntry = this.schemaRepository.resolveRef(
        entry,
        "#/definitions/" + name
      );

      md += this.createDefinitionDetailsMarkdown(
        definitionEntry,
        headerLevel + 1
      );
      md += this.createPropertiesReferenceMarkdown(
        definitionEntry,
        definitionEntry.schema,
        headerLevel + 1,
        undefined
      );
      md += "\n\n";
    }
  }
  md += "\n";
  return md;
};

/**
 * Create markdown with details about a 'definition' that was found in
 * another schema.
 * 
 * This is similar to what is generated with createPropertiesReferenceMarkdown
 * for the top-level types (but it is PART of the top-level documentation!).
 * It lists all the properties of the definition itself, as if it was
 * a top-level type.
 *
 * @param {SchemaEntry} definitionEntry The SchemaEntry for the definition
 * @param {integer} headerLevel The header level
 * @returns The generated markdown
 */
MarkdownGenerator.prototype.createDefinitionDetailsMarkdown = function (
  definitionEntry,
  headerLevel
) {
  let md = "";

  let definition = definitionEntry.schema;

  // Resolve the basic properties that will be required for
  // the following documentation
  definition = this.schemaResolver.resolveBasicProperties(
    definitionEntry,
    definition
  );

  // Create the header for the definition
  const headerMd = this.style.getHeaderMarkdown(headerLevel);
  const typeName = definitionEntry.typeName;
  const anchor =
    this.style.createPropertyReferenceAnchorStringForType(typeName);
  md += this.style.createAnchor(anchor);
  const definitionTitle = typeName;
  md += headerMd + " " + definitionTitle + "\n\n";

  // Add the desciption
  md += this.createDescriptionMarkdown(definition);

  // Add information about the ("base") type
  const formattedTypeName = this.createPropertyTypeMarkdown(
    definitionEntry,
    definition
  );
  md += this.style.bulletItem(
    this.style.propertyDetails("Type") + ": " + formattedTypeName,
    0
  );

  // Add the basic schema markdown, and some further information
  // that is required only for 'definitions'
  md += this.createArrayDetailsMarkdown(definitionEntry, definition);
  md += this.createBasicSchemaMarkdown(definitionEntry, definition, 0);
  md += this.createMinMaxItemsMarkdown(definition, 0);

  md += "\n";

  return md;
};

/**
 * Creates a markdown string with bullet points indicating the
 * `minItems` and `maxItems` properties of the given schema.
 *
 * @param {object} schema The schema
 * @param {*} depth The indentation depth for the bullet points
 * @returns The markdown string
 */
MarkdownGenerator.prototype.createMinMaxItemsMarkdown = function (
  schema,
  depth
) {
  let md = "";

  const minItems = schema.minItems;
  if (defined(minItems)) {
    md += this.style.bulletItem(
      this.style.propertyDetails("Minimum items") + ": " + minItems,
      depth
    );
  }
  const maxItems = schema.maxItems;
  if (defined(maxItems)) {
    md += this.style.bulletItem(
      this.style.propertyDetails("Maximum items") + ": " + maxItems,
      depth
    );
  }

  return md;
};

module.exports = MarkdownGenerator;
