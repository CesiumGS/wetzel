#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const minimist = require("minimist");
const defined = require("../lib/defined");
const defaultValue = require("../lib/defaultValue");
const enums = require("../lib/enums");
const SchemaRepository = require("../lib/SchemaRepository");
const MarkdownGenerator = require("../lib/MarkdownGenerator");

const parsedArguments = minimist(process.argv.slice(2));

/**
 * Parse an string that represents an array of file paths, and create
 * an array of strings with these file paths, taking different forms
 * of single- or double quotes into account.
 *
 * We're expecting users to pass in an array as a "string", but we aren't expecting them
 * to pass it in as a correctly JSON-escaped string.  Therefore, we need to replace single
 * or double-quotes with a backslash-double-quote, and then we can parse the object.
 *
 * If the given argument is undefined, then an empty array will be returned.
 *
 * @param {String} pathsArrayString The string
 * @returns The array
 */
function parsePathsArray(pathsArrayString) {
  if (!defined(pathsArrayString)) {
    return [];
  }
  let escapedPathsArrayString = pathsArrayString.replace(/'/g, '"');
  escapedPathsArrayString = escapedPathsArrayString.replace(/"/g, '\"');
  const pathsArray = JSON.parse(escapedPathsArrayString);
  return pathsArray;
}

function printHelp() {
  const help =
    "Usage: node wetzel.js [path-to-json-schema-file] [OPTIONS]\n" +
    "  -l,  --headerLevel        Top-level header. Default: 1\n" +
    "  -o,  --outputFile         The output file\n" +
    "  -c,  --checkmark          Symbol for required properties. Default: &#10003;\n" +
    '  -k,  --keyword            Use a particular keyword in place of "must", for example "**MUST**".\n' +
    "  -s,  --searchPath         The path string that should be used when loading the schema reference paths.\n" +
    "  -S,  --searchPaths        An array of path strings that should be used when loading the schema reference paths.\n" +
    "  -e,  --embedOutput        The output path for a document that embeds JSON schemas directly (AsciiDoctor only).\n" +
    "  -E,  --EmbedOutput        The same as 'e', but inlining the file contents instead of using include statements\n" +
    "  -m,  --outputMode         The output mode, Markdown (the default) or AsciiDoctor (a).\n" +
    "  -n,  --noTOC              Skip writing the Table of Contents.\n" +
    "  -a,  --autoLink           Aggressively auto-inter-link types referenced in descriptions.\n" +
    "                                Add =cqo to auto-link types that are in code-quotes only.\n" +
    "  -i                        An array of type names that should not get their own\n" +
    "                                table of contents entry, nor type listing (they are just used for\n" +
    "                                sharing properties across multiple other schemas)\n" +
    "  -f,  --fragmentPrefix     A prefix for the fragments and anchors that are created for internal links.\n";
  console.log(help);
}

function parseOptions(args) {
  if (!defined(args._[0]) || defined(args.h) || defined(args.help)) {
    printHelp();
    return undefined;
  }

  // Somewhat hacky: Handle a single input file (i.e. a string),
  // or an array of input files....
  let inputFilePaths;
  const inputFilesArgument = args._[0].trim();
  if (inputFilesArgument.startsWith("[")) {
    inputFilePaths = parsePathsArray(inputFilesArgument);
  } else {
    inputFilePaths = [inputFilesArgument];
  }

  let autoLink = enums.autoLinkOption.off;
  switch (defaultValue(args.a, args.autoLink)) {
    case true:
      autoLink = enums.autoLinkOption.aggressive;
      break;
    case "=cqo":
    case "cqo":
      autoLink = enums.autoLinkOption.codeQuoteOnly;
      break;
  }

  let styleMode = enums.styleModeOption.Markdown;
  let styleModeArgument = defaultValue(args.m, args.outputMode);
  if (styleModeArgument === "a" || styleModeArgument === "=a") {
    styleMode = enums.styleModeOption.AsciiDoctor;
  }

  const ignorableTypeNames = parsePathsArray(args.i);

  let searchPaths = [""];
  if (defined(args.s) || defined(args.searchPath)) {
    searchPaths.push(defaultValue(args.s, args.searchPath));
  }
  for (let i = 0; i < inputFilePaths.length; i++) {
    searchPaths.push(path.dirname(inputFilePaths[i]));
  }
  if (defined(args.S) || defined(args.searchPaths)) {
    const additionalSearchPathsString = defaultValue(args.S, args.searchPaths);
    const additionalSearchPaths = parsePathsArray(additionalSearchPathsString);
    searchPaths = searchPaths.concat(additionalSearchPaths);
  }

  let embedOutputFile;
  let inlineEmbeddedOutput = false;
  if (defined(args.e) || defined(args.embedOutput)) {
    embedOutputFile = defaultValue(
      defaultValue(args.e, args.embedOutput),
      null
    );
  }
  if (defined(args.E) || defined(args.EmbedOutput)) {
    embedOutputFile = defaultValue(
      defaultValue(args.E, args.EmbedOutput),
      null
    );
    inlineEmbeddedOutput = true;
  }

  let outputFilePath;
  if (defined(args.o) || defined(args.outputFile)) {
    outputFilePath = defaultValue(defaultValue(args.o, args.outputFile), null);
  } else {
    console.warn("No output file specified");
    printHelp();
    return undefined;
  }

  let fragmentPrefix;
  if (defined(args.f) || defined(args.fragmentPrefix)) {
    fragmentPrefix = defaultValue(args.f, args.fragmentPrefix);
  }

  const options = {
    inputFilePaths: inputFilePaths,
    outputFilePath: outputFilePath,
    searchPaths: searchPaths,
    styleMode: styleMode,
    writeTOC: !defaultValue(defaultValue(args.n, args.noTOC), false),
    headerLevel: defaultValue(defaultValue(args.l, args.headerLevel), 1),
    checkmark: defaultValue(defaultValue(args.c, args.checkmark), null),
    mustKeyword: defaultValue(defaultValue(args.k, args.keyword), null),
    embedMode: enums.embedMode.none,
    autoLink: autoLink,
    fragmentPrefix: fragmentPrefix,
    ignorableTypeNames: ignorableTypeNames,
    embedOutputFile: embedOutputFile,
    inlineEmbeddedOutput: inlineEmbeddedOutput,
  };
  return options;
}

function run() {
  const options = parseOptions(parsedArguments);
  if (!defined(options)) {
    return;
  }

  // Create the SchemaRepository and populate it with all
  // input file paths
  const schemaRepository = new SchemaRepository(options.searchPaths);
  for (let i = 0; i < options.inputFilePaths.length; i++) {
    schemaRepository.addRootSchema(options.inputFilePaths[i]);
  }

  // Create the markdown generator
  const markdownGenerator = new MarkdownGenerator(schemaRepository, options);

  // Create the JSON Schema reference markdown, if requested,
  // which contains the actual JSON schema files
  let embedMode = enums.embedMode.none;
  if (defined(options.embedOutputFile)) {
    if (options.inlineEmbeddedOutput) {
      embedMode = enums.embedMode.inlineFileContents;
    } else {
      embedMode = enums.embedMode.writeIncludeStatements;
    }
    const schemaReferenceMarkdown = 
      markdownGenerator.generateFullJsonSchemaReferenceMarkdown(options.headerLevel, embedMode);
    fs.writeFileSync(options.embedOutputFile, schemaReferenceMarkdown);
  }

  // Generate the main property reference, including all property 
  // references for the types that have been found from the input
  // file paths
  let propertyReferenceMarkdown = '';
  if (options.writeTOC) {
    propertyReferenceMarkdown += markdownGenerator.generateTableOfContentsMarkdown(options.headerLevel);
  }
  propertyReferenceMarkdown += 
    markdownGenerator.generateFullPropertyReferenceMarkdown(options.headerLevel, embedMode);
  fs.writeFileSync(options.outputFilePath, propertyReferenceMarkdown);

}

run(); // wetzel, run!
