"use strict";

const autoLinkOption = {
  /**
   * Do not perform any auto-linking
   */
  off: "off",

  /**
   * Aggressively try to create a link for every appearance
   * of a type name inside a 'description' of a property.
   *
   * (This is not tested extensively)
   */
  aggressive: "agressive",

  /**
   * Selectively link certain appearances of "type names"
   */
  codeQuoteOnly: "codeQuoteOnly",
};

const styleModeOption = {
  /**
   * The generated output should be Markdown
   */
  Markdown: "Markdown",

  /**
   * The generated output should be AsciiDoc. Without 'tor'.
   */
  AsciiDoctor: "AsciiDoctor",
};

const embedMode = {

  /**
   * Do not include any JSON schema reference (and no links to it)
   */
  none: "none",

  /**
   * Generate the JSON schema reference by writing `include` statements
   * (this only works for AsciiDoc output!)
   */
  writeIncludeStatements: "writeIncludeStatements",

  /**
   * Generate the JSON schema reference by writing the contents of the
   * schema file (as 'code') into the generated output.
   */
  inlineFileContents: "inlineFileContents",
};

module.exports = {
  /**
   * Indicates the possible resulting values for the autoLink commandline parameter
   */
  autoLinkOption: autoLinkOption,

  /**
   * Indicates the output style mode, Markdown or AsciiDoctor.
   */
  styleModeOption: styleModeOption,

  /**
   * Indicates if we're writing a JSON schema include document, or referencing one.
   */
  embedMode: embedMode,
};
