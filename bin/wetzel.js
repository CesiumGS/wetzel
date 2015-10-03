#!/usr/bin/env node
"use strict";
var fs = require('fs');
var path = require('path');
var argv = require('minimist')(process.argv.slice(2));
var defined = require('../lib/defined');
var generateMarkdown = require('../');

if (!defined(argv._[0]) || defined(argv.h) || defined(argv.help)) {
    var help = 'Usage: node ' + path.basename(__filename) + ' [path-to-json-schema-file]';
    process.stdout.write(help);
    return;
}

var inputPath = argv._[0];
var schema = JSON.parse(fs.readFileSync(inputPath));

process.stdout.write(generateMarkdown({
	schema : schema
}));