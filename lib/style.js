"use strict";
const defined = require("./defined");
const defaultValue = require("./defaultValue");
const enums = require("./enums");

/* eslint-disable no-unused-vars */
const Style = {
  /**
   * @property {string} propertyReferenceAnchorPrefix - The prefix that will be used for internal anchors of the property reference
   */
  propertyReferenceAnchorPrefix: "reference-",

  /**
   * @property {string} schemaReferenceAnchorPrefix - The prefix that will be used for internal anchors of the embedded JSON schema
   */
  schemaReferenceAnchorPrefix: "schema-reference-",

  /**
   * @property {string} requiredIcon - The markdown string used for displaying the icon used to indicate a value is required.
   */
  requiredIcon: " &#10003; ",

  /**
   * @property {string} mustKeyword - The keyword used when a condition must be true.
   */
  mustKeyword: " must ",

  /**
   * @function setAnchorPrefixes
   * Set the prefix that will be inserted for all anchors (internal link targets)
   * that are generated.
   * @param {string} prefix The desired prefix
   */
  setAnchorPrefix: function (prefix) {
    this.propertyReferenceAnchorPrefix = prefix;
    // TODO This also has to be configurable
    this.schemaReferenceAnchorPrefix = prefix + "schema-";
  },

  /**
   * @function setCheckmark
   * Set the symbol used to indicate required properties.
   * @param {string} checkmark The desired symbol
   */
  setCheckmark: function (checkmark) {
    if (checkmark.length > 0) {
      this.requiredIcon = " " + checkmark + " ";
    } else {
      this.requiredIcon = "";
    }
  },

  /**
   * @function setMustKeyword
   * Set the keyword used in place of the word 'must'.
   * @param {string} mustKeyword The keyword used when a condition must be true.
   */
  setMustKeyword: function (mustKeyword) {
    if (mustKeyword.length > 0) {
      this.mustKeyword = " " + mustKeyword + " ";
    } else {
      this.mustKeyword = " must ";
    }
  },

  /**
   * @function getHeaderMarkdown
   * Gets the markdown syntax for the start of a header.
   * @param  {int} level - The header lever that is being requested
   * @return {string} The markdown string that should be placed prior to the title of the header
   */
  getHeaderMarkdown: function (level) {
    throw new Error("Should be implemented by subclasses");
  },

  /**
   * @function getSectionMarkdown
   * Gets the markdown syntax for the start of a section.
   * @param  {int} level - The header lever that is being requested
   * @param  {string} title - The title for the section
   * @param  {string} anchor - The anchor that should be inserted for the section
   * @return {string} The markdown string that should be placed as the start of the section
   */
  getSectionMarkdown: function (level, title, anchor) {
    throw new Error("Should be implemented by subclasses");
  },

  /**
   * @function bulletItem
   * Gets the markdown syntax for a bulleted item.
   * @param  {string} item - The item being bulleted.
   * @param  {int} indentationLevel - The number of indentation levels that should be applied
   * @return {string} The markdown string representing the item as a bulleted item at the proper indentation.
   */
  bulletItem: function (item, indentationLevel) {
    throw new Error("Should be implemented by subclasses");
  },

  /**
   * @function getInternalLinkMarkdown
   * Creates a markdown link
   * @param  {string} string - The string to be linked
   * @param  {string} link - The link that should be applied to the string
   * @return {string} The markdown with the specified string hyperlinked to the specified link.
   */
  getInternalLinkMarkdown: function (string, link) {
    throw new Error("Should be implemented by subclasses");
  },

  /**
   * @function getExternalLinkMarkdown
   * Creates a markdown link
   * @param  {string} string - The string to be linked
   * @param  {string} link - The link that should be applied to the string
   * @return {string} The markdown with the specified string hyperlinked to the specified link.
   */
  getExternalLinkMarkdown: function (string, link) {
    throw new Error("Should be implemented by subclasses");
  },

  /**
   * Creates a table header
   * @param {string} title - The name of this table
   * @param {array} columnList - An array of column names
   */
  beginTable: function (title, columnList) {
    throw new Error("Should be implemented by subclasses");
  },

  /**
   * Adds a row of cells to a table
   * @param {array} data - An array of data for cells on this row.
   */
  addTableRow: function (data) {
    throw new Error("Should be implemented by subclasses");
  },

  /**
   * Ends a table.
   */
  endTable: function () {
    throw new Error("Should be implemented by subclasses");
  },

  /**
   * @function styleBold
   * Returns back a markdown string that bolds the provided string.
   * @param  {string} string - The string to be bolded
   * @return {string} The bolded string in markdown syntax
   */
  styleBold: function (string) {
    if (defined(string) && string.length > 0) {
      return "**" + string + "**";
    }

    return "";
  },

  /**
   * @function styleCode
   * Returns back a markdown string that displays the provided object as code.
   * @param  {object} code - The object to be displayed as code. It might be a string, or a number, or ...
   * @return {string} The code in markdown code syntax
   */
  styleCode: function (code) {
    if (defined(code)) {
      // If it's an object, just serialize it.
      if (typeof code === "object") {
        // Someday may want to use a code fence if it's longer than, say, 88
        // chars, but that would require keeping track of the current
        // indentation. Not really how things are designed to work right
        // now. So add spaces but let it display as a single line for now.
        return (
          "`" +
          JSON.stringify(code, null, 1)
            .replace(/\n/g, "")
            .replace(/([{[]) /, "$1") +
          "`"
        );
      }

      // The object might be a string or it might be a number or something else.
      // Let's make sure it's a string first.
      const stringified = code.toString();

      if (stringified.length > 0) {
        return "`" + stringified + "`";
      }
    }

    return "";
  },

  /**
   * @function styleMinMax
   * Returns back a markdown string that displays the provided min/max values as code.
   * @param  {object} code - The object to be displayed as min/max code. It might be a string, or a number, or ...
   * @return {string} The code in markdown code syntax
   */
  styleMinMax: function (code) {
    throw new Error("Should be implemented by subclasses");
  },

  /**
   * @function styleCodeType
   * Returns back a markdown string that displays the provided string as code.
   * @param  {string} string - The string to be displayed as code
   * @param  {string} type - The type of the content in string (if it's a literal string, it will be formatted differently)
   * @return {string} The string in markdown code syntax
   */
  styleCodeType: function (string, type) {
    if (!defined(string) || string.length === 0) {
      return "";
    } else if (type === "string") {
      return this.styleCode('"' + string + '"');
    }

    return this.styleCode(string);
  },

  /**
   * Convert the given string into the string that will be used for
   * the anchors that serve as link targets in the resulting MD.
   *
   * @param {string} string The string
   * @return {string} The anchor name
   */
  createAnchorName: function (string) {
    return string
      .toLowerCase()
      .replace(/#/g, "")
      .replace(/ /g, "-")
      .replace(/\./g, "-")
      .replace(/\//g, "-");
  },

  /**
   * @function createAnchor
   * Returns a markdown string for an 'anchor' with the given name
   * @param  {striong} name - The name of the anchor
   * @return {string} The code in markdown code syntax
   */
  createAnchor: function (name) {
    throw new Error("Should be implemented by subclasses");
  },

  /**
   * For a given type name, generate the string that is used as the anchor
   * for the given type inside the property reference.
   *
   * This will serve as the string that is used for defining the anchor
   * (as the link target), as well as the fragment of a URL that points
   * to the respective anchor.
   *
   * @param {string} typeName The type name
   * @returns The anchor string
   */
  createPropertyReferenceAnchorStringForType: function (typeName) {
    return this.propertyReferenceAnchorPrefix + this.createAnchorName(typeName);
  },

  /**
   * For a given type name, generate the string that is used as the anchor
   * for the given type inside the JSON Schema reference.
   *
   * This will serve as the string that is used for defining the anchor
   * (as the link target), as well as the fragment of a URL that points
   * to the respective anchor.
   *
   * @param {string} typeName The type name
   * @returns The anchor string
   */
  createSchemaReferenceAnchorStringForType: function (typeName) {
    return this.schemaReferenceAnchorPrefix + this.createAnchorName(typeName);
  },

  /**
   * @function linkType
   * Finds any occurrence of type name in the provided string, and adds a markdown link to it.
   * @param  {string} string - The string that might be referencing a type
   * @param  {string} typeName - The type name whose reference within string should be linked.
   * @param  {string} autoLink - The enum value indicating how the auto-linking should be handled.
   * @return {string} The updated string, with any occurrences of the type name string linked via markdown.
   */
  linkType: function (string, typeName, autoLink) {
    if (
      defaultValue(autoLink, enums.autoLinkOption.off) ===
      enums.autoLinkOption.off
    ) {
      return string;
    } else if (!defined(string) || string.length === 0) {
      return string;
    } else if (!defined(typeName) || typeName.length === 0) {
      return string;
    }
    if (
      typeName === "integer" ||
      typeName === "string" ||
      typeName === "object" ||
      typeName === "number" ||
      typeName === "boolean"
    ) {
      return string;
    }
    const typeLink =
      this.propertyReferenceAnchorPrefix + this.createAnchorName(typeName);

    if (autoLink === enums.autoLinkOption.aggressive) {
      let regExp = new RegExp("([^`.]|^)" + typeName + "([ .]|$)");
      return string.replace(
        regExp,
        "$1" +
          this.getInternalLinkMarkdown(this.styleCode(typeName), typeLink) +
          "$2"
      );
    }
    let regExp = new RegExp("`" + typeName + "`");
    return string.replace(
      regExp,
      this.getInternalLinkMarkdown(this.styleCode(typeName), typeLink)
    );
  },

  embedJsonSchema: function (directory, fileName) {
    throw new Error("Should be implemented by subclasses");
  },

  inlineJsonSchema: function (directory, fileName) {
    throw new Error("Should be implemented by subclasses");
  },

  /**
   * @function bold
   * Bold the specified string
   * @param  {string} string - The string to be styled
   * @return {string} The string styled as bolded for display in markdown.
   */
  bold: function (string) {
    return this.styleBold(string);
  },

  /**
   * @function type
   * Format the type heading for display in markdown
   * @param  {string} string - The type heading to be styled
   * @return {string} The type heading styled for display in markdown.
   */
  type: function (string) {
    return this.styleBold(string);
  },

  /**
   * @function typeValue
   * Format a typeValue for display in markdown
   * @param  {string} string - The type value to be styled
   * @return {string} The typeValue styled for display in markdown.
   */
  typeValue: function (string) {
    return this.styleCode(string);
  },

  /**
   * @function propertiesSummary
   * Format the summary of properties for display in markdown
   * @param  {string} string - The summary of properties to be styled
   * @return {string} The summary of properties styled for display in markdown.
   */
  propertiesSummary: function (string) {
    return this.styleBold(string);
  },

  /**
   * @function propertyNameSummary
   * Format a property name for display in markdown
   * @param  {string} string - The property name summary to be styled
   * @return {string} The styled property name summary for display in markdown.
   */
  propertyNameSummary: function (string) {
    return this.styleBold(string);
  },

  /**
   * @function propertiesDetails
   * Format the details of properties for display in markdown
   * @param  {string} string - The details of properties to be styled
   * @return {string} The details of properties styled for display in markdown.
   */
  propertiesDetails: function (string) {
    return this.styleBold(string);
  },

  /**
   * @function propertyDetails
   * Format the details of a property for display in markdown
   * @param  {string} string - The property details to be styled
   * @return {string} The property details styled for display in markdown.
   */
  propertyDetails: function (string) {
    return this.styleBold(string);
  },

  /**
   * @function defaultValue
   * Format a defaultValue for display in markdown
   * @param  {string} string - The default value
   * @param  {type} string - The type of the default value
   * @return {string} The default value styled for display in markdown.
   */
  defaultValue: function (string, type) {
    return this.styleCodeType(string, type);
  },

  /**
   * @function enumElement
   * Format an enumElement for display in markdown
   * @param  {string} string - The enum element to be styled
   * @param  {type} string - The type of the enum element
   * @return {string} The enum element styled for display in markdown.
   */
  enumElement: function (string, type) {
    return this.styleCodeType(string, type);
  },

  /**
   * @function minMax
   * Format a minimum or maximum value for display in markdown
   * @param  {int} value - The minimum/maximum value to be styled
   * @return {string} The minimum or maximum value styled for display in markdown.
   */
  minMax: function (value) {
    return this.styleMinMax(value);
  },
};

module.exports = Style;
