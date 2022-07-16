#!/usr/bin/env node
"use strict";
const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2), { boolean : ["w", "suppresswarnings" ]});
const defined = require('../lib/defined');
const defaultValue = require('../lib/defaultValue');
const enums = require('../lib/enums');
const generateMarkdown = require('../lib/generateMarkdown');

if (!defined(argv._[0]) || defined(argv.h) || defined(argv.help)) {
    const help = `Usage: node ${  path.basename(__filename)  } [path-to-json-schema-file] [OPTIONS]\n` +
        `  -l,  --headerLevel        Top-level header. Default: 1\n` +
        `  -c,  --checkmark          Symbol for required properties. Default: &#10003;\n` +
        `  -k,  --keyword            Use a particular keyword in place of "must", for example "**MUST**".\n` +
        `  -p,  --schemaPath         The path string that should be used when generating the schema reference paths.\n` +
        `  -s,  --searchPath         The path string that should be used when loading the schema reference paths.\n` +
        `  -e,  --embedOutput        The output path for a document that embeds JSON schemas directly (AsciiDoctor only).\n` +
        `  -m,  --outputMode         The output mode, Markdown (the default) or AsciiDoctor (a).\n` +
        `  -n,  --noTOC              Skip writing the Table of Contents.\n` +
        `  -a,  --autoLink           Aggressively auto-inter-link types referenced in descriptions.\n` +
        `                                Add =cqo to auto-link types that are in code-quotes only.\n` +
        `  -i                        An array of schema filenames (no paths) that should not get their own\n` +
        `                                table of contents entry, nor type listing (they are just used for\n` +
        `                                sharing properties across multiple other schemas)\n` +
        `  -d,  --debug              Provide a path, and this will save out intermediate processing\n` +
        `                                artifacts useful in debugging wetzel.\n` +
        `  -w,  --suppressWarnings   Will not print out WETZEL_WARNING strings indicating identified\n` +
        `                                conversion problems. Default: false\n`;
    process.stdout.write(help);
    return;
}

const filepath = argv._[0];
const schema = JSON.parse(fs.readFileSync(filepath));

let autoLink = enums.autoLinkOption.off;
switch (defaultValue(argv.a, argv.autoLink)) {
    case true:
        autoLink = enums.autoLinkOption.aggressive;
        break;
    case "=cqo":
    case "cqo":
        autoLink = enums.autoLinkOption.codeQuoteOnly;
        break;
}

let styleModeArgument = defaultValue(argv.m, argv.outputMode);
if (styleModeArgument === 'a' || styleModeArgument === '=a') {
    styleModeArgument = enums.styleModeOption.AsciiDoctor;
}

// We're expecting users to pass in an array as a "string", but we aren't expecting them
// to pass it in as a correctly JSON-escaped string.  Therefore, we need to replace single
// or double-quotes with a backslash-double-quote, and then we can parse the object.
let ignorableTypesString = defaultValue(argv.i, '[]');
ignorableTypesString = ignorableTypesString.replace(/'/g, '\"');
ignorableTypesString = ignorableTypesString.replace(/"/g, '\"');
const ignorableTypes = JSON.parse(ignorableTypesString);

const searchPath = ['', path.dirname(filepath)];
if (defined(argv.s) || defined(argv.searchPath)) {
    searchPath.push(defaultValue(argv.s, argv.searchPath));
}

const embedOutput = defaultValue(defaultValue(argv.e, argv.embedOutput), null);

const options = {
    schema: schema,
    filePath: filepath,
    fileName: path.basename(filepath),
    searchPath: searchPath,
    styleMode: styleModeArgument,
    writeTOC: !defaultValue(defaultValue(argv.n, argv.noTOC), false),
    headerLevel: defaultValue(defaultValue(argv.l, argv.headerLevel), 1),
    checkmark: defaultValue(defaultValue(argv.c, argv.checkmark), null),
    mustKeyword: defaultValue(defaultValue(argv.k, argv.keyword), null),
    schemaRelativeBasePath: defaultValue(defaultValue(argv.p, argv.schemaPath), null),
    embedMode: enums.embedMode.none,
    debug: defaultValue(defaultValue(argv.d, argv.debug), null),
    suppressWarnings: defaultValue(defaultValue(argv.w, argv.suppressWarnings), false),
    autoLink: autoLink,
    ignorableTypes: ignorableTypes
};

if (defined(embedOutput)) {
    options.embedMode = enums.embedMode.writeIncludeStatements;
    options.ignorableTypes = [];
    fs.writeFileSync(embedOutput, generateMarkdown(options));
    options.embedMode = enums.embedMode.referenceIncludeDocument;
    options.ignorableTypes = ignorableTypes;
}

process.stdout.write(generateMarkdown(options));
