"use strict";
const defined = require("./defined");

module.exports = generateTypeName;

/**
 * Generates a name of a "type", as it is used in the generated
 * documentation.
 *
 * The source and form of such a "type name" is somewhat arbitrary.
 * It is used as the displayed part of a link inside the generated
 * documentation. But for historical reasons, it is also used as
 * a sort of an "identifier" for what actually will be linked in
 * the documentation. Therefore, the type name should uniquely
 * identify a part of a schema that constitutes a "type".
 *
 * The current approach is based on the name of the file that
 * contains the schema, and the fragment that points to the part
 * of the schema that defines the type. (The latter is intended
 * for disambiguation when a file defines multiple "types" in
 * its `definitions`).
 *
 * Details are intentionally not "specified" here, but some examples
 * if generated type names might be:
 * 
 * - `glTFProperty.schema.json`: `glTFProperty`.
 * - `accessor.sparse.schema.json`: `accessor.sparse`
 * - `example.schema.json#/defintions/exampleProperty`:
 *   `example-definitions-exampleProperty`
 *
 * @param {string} fileName The file name
 * @param {string} fragment The fragment
 * @returns The type name
 */
function generateTypeName(fileName, fragment) {
  let typeName = "";
  const indexOfFileExtension = fileName.indexOf(".schema.json");
  if (indexOfFileExtension !== -1) {
    typeName = fileName.substring(0, indexOfFileExtension);
  }
  if (defined(fragment) && fragment.length != 0) {
    typeName += fragment;
  }
  typeName = typeName.replace(/#/, "").replace(/ /g, "-").replace(/\//g, "-");
  return typeName;
}
