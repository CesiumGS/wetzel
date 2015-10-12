#!/usr/bin/env node
"use strict";
var fs = require('fs');
var path = require('path');
var argv = require('minimist')(process.argv.slice(2));
var defined = require('../lib/defined');
var defaultValue = require('../lib/defaultValue');
var generateMarkdown = require('../');

if (!defined(argv._[0]) || defined(argv.h) || defined(argv.help)) {
    var help = 'Usage: node ' + path.basename(__filename) + ' [path-to-json-schema-file] [OPTIONS]\n' +
               '  -l, --headerLevel      Top-level header. Default: 1';
    process.stdout.write(help);
    return;
}

var filename = argv._[0];
var schema = JSON.parse(fs.readFileSync(filename));

process.stdout.write(generateMarkdown({
    schema : schema,
    basePath : path.dirname(filename),
    headerLevel : defaultValue(defaultValue(argv.l, argv.headerLevel), 1)
}));