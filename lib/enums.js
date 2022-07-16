"use strict";

const autoLinkOption = {
    'off': 'off',
    'aggressive': 'agressive',
    'codeQuoteOnly': 'codeQuoteOnly'
};

const styleModeOption = {
    'Markdown': 'Markdown',
    'AsciiDoctor' : 'AsciiDoctor'
};

const embedMode = {
    'none': 'none',
    'writeIncludeStatements': 'writeIncludeStatements',
    'referenceIncludeDocument': 'referenceIncludeDocument'
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
    embedMode: embedMode
};
