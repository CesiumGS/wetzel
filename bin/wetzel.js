#!/usr/bin/env node
"use strict";
var fs = require('fs');
var path = require('path');
var argv = require('minimist')(process.argv.slice(2), { boolean : ["w", "suppresswarnings" ]});
var defined = require('../lib/defined');
var defaultValue = require('../lib/defaultValue');
var generateMarkdown = require('../');

if (!defined(argv._[0]) || defined(argv.h) || defined(argv.help)) {
    var help = 'Usage: node ' + path.basename(__filename) + ' [path-to-json-schema-file] [OPTIONS]\n' +
        '  -l,  --headerLevel        Top-level header. Default: 1\n' +
        '  -d,  --debug              Provide a path, and this will save out intermediate processing artifacts useful in debugging wetzel.' +
        '  -w,  --suppressWarnings   Will not print out WETZEL_WARNING strings indicating identified conversion problems. Default: false';
    process.stdout.write(help);
} else {
  var filename = argv._[0];
  var schema = JSON.parse(fs.readFileSync(filename));

  generateMarkdown({
      schema: schema,
      filePath: filename,
      basePath: path.dirname(filename),
      headerLevel: defaultValue(defaultValue(argv.l, argv.headerLevel), 1),
      debug: defaultValue(defaultValue(argv.d, argv.debug), null),
      suppressWarnings: defaultValue(defaultValue(argv.w, argv.suppressWarnings), false),
  }, function (err, md) {
    if (err) {
        process.stderr.write(err);
        process.exit(2);
    } else {
        process.stdout.write(md);
    }
  });
}
