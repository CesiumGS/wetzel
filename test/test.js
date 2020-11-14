/* global describe, it */
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
//const assert = require('assert');

const WETZEL_BIN = 'node ./bin/wetzel.js';
const SCHEMA_PREFIX = 'test/test-schemas/';
const OUT_PREFIX = process.env.OUT_PREFIX || 'test/test-output/';

describe('wetzel', function () {
    describe('generated output', function () {
        const index = JSON.parse(fs.readFileSync(path.join(SCHEMA_PREFIX, 'index.json')));
        const numSchemas = index.schemas.length;

        if (!fs.existsSync(OUT_PREFIX)){
            fs.mkdirSync(OUT_PREFIX);
        }

        for (let i = 0; i < numSchemas; ++i) {
            let schema = index.schemas[i];
            for (let option in index.options) {
                if (index.options.hasOwnProperty(option)) {
                    let outputName = schema.name + '-' + option;
                    let outputPathName = path.join(OUT_PREFIX, outputName);
                    let inputPathName = path.join(SCHEMA_PREFIX, schema.path);
                    let ignore = schema.ignore ? ('-i "' + schema.ignore + '"') : '';

                    it('should generate ' + outputName, function (done) {
                        const cmd = `${WETZEL_BIN} ${index.options[option]} ${ignore} ${inputPathName} > ${outputPathName}`;
                        //console.log(cmd);
                        exec(cmd, (error) => {
                            if (error) {
                                console.error('** ERROR ** ' + error);
                                done(error);
                                return;
                            }
                            done();
                        });
                    });
                }
            }
        }
    });
});
