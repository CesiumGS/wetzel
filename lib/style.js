"use strict";
var defined = require('./defined');

module.exports = {
    getHeaderMarkdown: getHeaderMarkdown,

    /**
    * @function type
    * Format the type heading for display in markdown
    * @param  {string} string - The type heading to be styled
    * @return {string} The type heading styled for display in markdown.
    */
    type: styleBold,

    /**
    * @function typeValue
    * Format a typeValue for display in markdown
    * @param  {string} string - The type value to be styled
    * @return {string} The typeValue styled for display in markdown.
    */
    typeValue: styleCode,

    /**
    * @function propertiesSummary
    * Format the summary of properties for display in markdown
    * @param  {string} string - The summary of properties to be styled
    * @return {string} The summary of properties styled for display in markdown.
    */
    propertiesSummary: styleBold,

    /**
    * @function propertyNameSummary
    * Format a property name for display in markdown
    * @param  {string} string - The property name summary to be styled
    * @return {string} The styled property name summary for display in markdown.
    */
    propertyNameSummary: styleBold,

    /**
    * @function propertiesDetails
    * Format the details of properties for display in markdown
    * @param  {string} string - The details of properties to be styled
    * @return {string} The details of properties styled for display in markdown.
    */
    propertiesDetails: styleBold,

    /**
    * @function propertyDetails
    * Format the details of a property for display in markdown
    * @param  {string} string - The property details to be styled
    * @return {string} The property details styled for display in markdown.
    */
    propertyDetails: styleBold,

    /**
    * @function propertyGltfWebGL
    * Format a glTF WebGL property for display in markdown
    * @param  {string} string - The glTF WebGL property to be styled
    * @return {string} The glTF WebGL property styled for display in markdown.
    */
    propertyGltfWebGL: styleBold,

    /**
    * @function defaultValue
    * Format a defaultValue for display in markdown
    * @param  {string} string - The default value
    * @param  {type} string - The type of the default value
    * @return {string} The default value styled for display in markdown.
    */
    defaultValue: styleCodeType,

    /**
    * @function enumElement
    * Format an enumElement for display in markdown
    * @param  {string} string - The enum element to be styled
    * @param  {type} string - The type of the enum element
    * @return {string} The enum element styled for display in markdown.
    */
    enumElement: styleCodeType,

    /**
    * @function minMax
    * Format a minimum or maximum value for display in markdown
    * @param  {string} string - The minimum/maximum value to be styled
    * @return {string} The minimum or maximum value styled for display in markdown.
    */
    minMax: styleCode,

    /**
    * @property {string} The markdown string used for displaying the icon used to indicate a value is required.
    */
    requiredIcon: ' :white_check_mark: '
}

/**
* @function getHeaderMarkdown
* Gets the markdown syntax for the start of a header.
* @param  {int} level - The header lever that is being requested
* @return {string} The markdown string that should be placed prior to the title of the header
*/
function getHeaderMarkdown(level) {
    var md = '';
    for (var i = 0; i < level; ++i) {
        md += '#';
    }

    return md;
}

/**
* @function styleBold
* Returns back a markdown string that bolds the provided string.
* @param  {string} string - The string to be bolded
* @return {string} The bolded string in markdown syntax
*/
function styleBold(string) {
    if (defined(string) && string.length > 0) {
        return '**' + string + '**';
    }

    return '';
}

/**
* @function styleCode
* Returns back a markdown string that displays the provided string as code.
* @param  {string} string - The string to be displayed as code
* @return {string} The string in markdown code syntax
*/
function styleCode(string) {
    if (defined(string) && string.length > 0) {
        return '`' + string + '`'
    }

    return '';
}

/**
* @function styleCodeType
* Returns back a markdown string that displays the provided string as code.
* @param  {string} string - The string to be displayed as code
* @param  {string} type - The type of the content in string (if it's a literal string, it will be formatted differently)
* @return {string} The string in markdown code syntax
*/
function styleCodeType(string, type) {
    if (!defined(string) || string.length === 0) {
        return '';
    } else if (type === 'string') {
        return styleCode('"' + string + '"');
    }

    return styleCode(string);
}
