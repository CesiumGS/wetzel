/* global describe, it */
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const assert = require('assert');

const WETZEL_BIN = 'node ./bin/wetzel.js';
const SCHEMA_PREFIX = 'test/test-schemas/';
const GOLDEN_PREFIX = 'test/test-golden/';
const OUT_PREFIX = process.env.OUT_PREFIX || 'test/test-output/';

/**
 * These tests do not follow typical unit testing guidelines. The final end user never
 * actually runs wetzel itself, they simply read a document that was produced by wetzel.
 * As such, we don't bother to probe the innards of wetzel to check if each little API
 * entry point works. Instead, we have sample schema inputs, and "golden" outputs that
 * wetzel is expected to produce from those inputs.
 *
 * If you hack up the inside of wetzel completely, but the resulting output document
 * has no diffs at all from what was there before, the tests all pass. If you make an
 * intentional change to wetzel output, the golden outputs will likewise need to be
 * updated, revealing the intended change as git diffs. And most importantly, if
 * some changes to wetzel have unintended concequences for its output formatting,
 * those will be flagged as test failures. Keep your diffs clean!
 *
 * This is basically the strategy that was manually used to test wetzel PRs prior
 * to any test framework being connected.
 */

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
                    let names = option.split(',');
                    let outputName = schema.name + '-' + names[0];
                    let outputPathName = path.join(OUT_PREFIX, outputName);
                    let goldenPathName = path.join(GOLDEN_PREFIX, outputName);
                    let inputPathName = path.join(SCHEMA_PREFIX, schema.path);
                    let ignore = schema.ignore ? ('-i "' + schema.ignore + '"') : '';
                    let embedOutputName = schema.name + '-' + (names[1] || '');
                    let embedOutputPathName = path.join(OUT_PREFIX, embedOutputName);
                    let embedGoldenPathName = path.join(GOLDEN_PREFIX, embedOutputName);
                    let additionalOptions = schema.additionalOptions ? schema.additionalOptions : '';
                    it('should generate ' + outputName, function (done) {
                        const options = index.options[option].replace('{EMBED}', embedOutputPathName);
                        const cmd = `${WETZEL_BIN} ${options} ${additionalOptions} ${ignore} ${inputPathName} > ${outputPathName}`;
                        exec(cmd, (error) => {
                            if (error) {
                                console.error('** ERROR ** ' + error);
                                done(error);
                                return;
                            }
                            done();
                        });
                    });

                    it('should match golden ' + outputName, function () {
                        // Main output test
                        let outputText = fs.readFileSync(outputPathName).toString();
                        assert.ok(outputText.length > 1);
                        let goldenText = fs.readFileSync(goldenPathName).toString();
                        assert.strictEqual(outputText, goldenText);
                    });

                    if (names.length > 1) {
                        // Embed test
                        it('should match embedded golden ' + embedOutputName, function () {
                            let embedOutputText = fs.readFileSync(embedOutputPathName).toString();
                            assert.ok(embedOutputText.length > 1);
                            let embedGoldenText = fs.readFileSync(embedGoldenPathName).toString();
                            assert.strictEqual(embedOutputText, embedGoldenText);
                        });
                    }
                }
            }
        }
    });
});
