#!/usr/bin/env node
"use strict";
var fs = require('fs');
var path = require('path');
var argv = require('minimist')(process.argv.slice(2), { boolean : ["w", "suppresswarnings" ]});
var defined = require('../lib/defined');
var defaultValue = require('../lib/defaultValue');
var enums = require('../lib/enums');
var generateMarkdown = require('../lib/generateMarkdown');

if (!defined(argv._[0]) || defined(argv.h) || defined(argv.help)) {
    var help = 'Usage: node ' + path.basename(__filename) + ' [path-to-json-schema-file] [OPTIONS]\n' +
        '  -l,  --headerLevel        Top-level header. Default: 1\n' +
        '  -c,  --checkmark          Symbol for required properties. Default: &#10003;\n' +
        '  -k,  --keyword            Use a particular keyword in place of "must", for example "**MUST**".\n' +
        '  -p,  --schemaPath         The path string that should be used when generating the schema reference paths.\n' +
        '  -s,  --searchPath         The path string that should be used when loading the schema reference paths.\n' +
        '  -e,  --embedOutput        The output path for a document that embeds JSON schemas directly (AsciiDoctor only).\n' +
        '  -m,  --outputMode         The output mode, Markdown (the default) or AsciiDoctor (a).\n' +
        '  -n,  --noTOC              Skip writing the Table of Contents.\n' +
        '  -a,  --autoLink           Aggressively auto-inter-link types referenced in descriptions.\n' +
        '                                Add =cqo to auto-link types that are in code-quotes only.\n' +
        '  -i                        An array of schema filenames (no paths) that should not get their own\n' +
        '                                table of contents entry, nor type listing (they are just used for\n' +
        '                                sharing properties across multiple other schemas)\n' +
        '  -d,  --debug              Provide a path, and this will save out intermediate processing\n' +
        '                                artifacts useful in debugging wetzel.\n' +
        '  -w,  --suppressWarnings   Will not print out WETZEL_WARNING strings indicating identified\n' +
        '                                conversion problems. Default: false\n' +
        '  --describeEnums            List enum values in the description column of the summary table. Default: false\n' +
        '  --summary                 Only write the summary and skip the detailed section, useful for a more concise documentation. Default: false\n'
    process.stdout.write(help);
    return;
}

var filepath = argv._[0];
var schema = JSON.parse(fs.readFileSync(filepath));

var autoLink = enums.autoLinkOption.off;
switch (defaultValue(argv.a, argv.autoLink)) {
    case true:
        autoLink = enums.autoLinkOption.aggressive;
        break;
    case "=cqo":
    case "cqo":
        autoLink = enums.autoLinkOption.codeQuoteOnly;
        break;
}

var styleModeArgument = defaultValue(argv.m, argv.outputMode);
if (styleModeArgument === 'a' || styleModeArgument === '=a') {
    styleModeArgument = enums.styleModeOption.AsciiDoctor;
}

// We're expecting users to pass in an array as a "string", but we aren't expecting them
// to pass it in as a correctly JSON-escaped string.  Therefore, we need to replace single
// or double-quotes with a backslash-double-quote, and then we can parse the object.
var ignorableTypesString = defaultValue(argv.i, '[]');
ignorableTypesString = ignorableTypesString.replace(/'/g, '\"');
ignorableTypesString = ignorableTypesString.replace(/"/g, '\"');
var ignorableTypes = JSON.parse(ignorableTypesString);

var searchPath = ['', path.dirname(filepath)];
if (defined(argv.s) || defined(argv.searchPath)) {
    searchPath.push(defaultValue(argv.s, argv.searchPath));
}

var embedOutput = defaultValue(defaultValue(argv.e, argv.embedOutput), null);

var options = {
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
    ignorableTypes: ignorableTypes,
    describeEnums: defaultValue(argv.describeEnums, false),
    summaryOnly: defaultValue(argv.summary, false)
};

if (defined(embedOutput)) {
    options.embedMode = enums.embedMode.writeIncludeStatements;
    options.ignorableTypes = [];
    fs.writeFileSync(embedOutput, generateMarkdown(options));
    options.embedMode = enums.embedMode.referenceIncludeDocument;
    options.ignorableTypes = ignorableTypes;
}

process.stdout.write(generateMarkdown(options));
