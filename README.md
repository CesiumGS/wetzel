# wetzel

Generate Markdown or AsciiDoctor documentation from JSON Schema

* [Purpose and Limitations](#purpose-and-limitations)
* [Example](#example)
* [Getting Started](#getting-started)
* [Command-Line Options](#command-line-options)
* [Common Usage](#common-usage)
* [Contributions](#contributions)

## Purpose and Limitations

This tool was developed to generate reference documentaiton for the [glTF](https://github.com/KhronosGroup/glTF) schema.  As such, it doesn't support the entire JSON Schema spec, only what is needed by the glTF schema.  Currently it accepts JSON Schema drafts 3, 4, 7, and 2020-12.

## Example

This JSON Schema:
```json
{
    "$schema" : "https://json-schema.org/draft/2020-12/schema",
    "title" : "example",
    "type" : "object",
    "description" : "Example description.",
    "properties" : {
        "byteOffset" : {
            "type" : "integer",
            "description" : "The offset relative to the start of the buffer in bytes.",
            "minimum" : 0,
            "default" : 0
        },
        "type" : {
            "type" : "string",
            "description" : "Specifies if the elements are scalars, vectors, or matrices.",
            "enum" : ["SCALAR", "VEC2", "VEC3", "VEC4", "MAT2", "MAT3", "MAT4"]
        }
    },
    "required" : ["type"],
    "additionalProperties" : false
}
```

can be used to generate this Markdown documentation:

* [`example`](#reference-example) (root object)


---------------------------------------
<a name="reference-example"></a>
## example

Example description.

**`example` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**byteOffset**|`integer`|The offset relative to the start of the buffer in bytes.|No, default: `0`|
|**type**|`string`|Specifies if the elements are scalars, vectors, or matrices.| &#10003; Yes|

Additional properties are not allowed.

### example.byteOffset

The offset relative to the start of the buffer in bytes.

* **Type**: `integer`
* **Required**: No, default: `0`
* **Minimum**: ` >= 0`

### example.type

Specifies if the elements are scalars, vectors, or matrices.

* **Type**: `string`
* **Required**:  &#10003; Yes
* **Allowed values**:
   * `"SCALAR"`
   * `"VEC2"`
   * `"VEC3"`
   * `"VEC4"`
   * `"MAT2"`
   * `"MAT3"`
   * `"MAT4"`

---

## Getting Started

Install [Node.js](https://nodejs.org/en/) if you don't already have it, clone this repo, and then:
```sh
cd wetzel
npm install
```
Run `node bin/wetzel.js` and pass it the path to a file with a JSON Schema, and the generated Markdown is output to the console.

It is useful to pipe the Markdown output to the clipboard and then paste into a temporary GitHub issue for testing.

On Mac:
```sh
wetzel ../glTF/specification/2.0/schema/accessor.schema.json -l 2 | pbcopy
```

On Windows:
```sh
wetzel.js ../glTF/specification/2.0/schema/accessor.schema.json -l 2 | clip
```

Run the tests:
```sh
npm run test
```

There's also a version [published on npm](https://www.npmjs.com/package/wetzel).

## Command-Line Options

* The `-l` option specifies the starting header level.
* The `-c` option lets you specify a custom symbol to place in front of required properties.
* The `-k` option replaces the word `must` with a specified keyword, such as `**MUST**`.
* The `-p` option lets you specify the relative path that should be used when referencing the schema, relative to where you store the documentation.
* The `-s` option lets you specify the path string that should be used when loading the schema reference paths.
* The `-e` option writes an additional output file that embeds the full text of JSON schemas (AsciiDoctor mode only).
* The `-m` option controls the output style mode. The default is `Markdown`, use `-m=a` for `AsciiDoctor` mode.
* The `-n` option will skip writing a Table of Contents.
* The `-w` option will suppress any warnings about potential documentation problems that wetzel normally prints by default.
* The `-d` option lets you specify the root filename that will be used for writing intermediate wetzel artifacts that are useful when doing wetzel development.
* The `-a` option will attempt to aggressively auto-link referenced type names in descriptions between each other.  If it's too agressive, you can add `=cqo` so that it only attempts to auto-link type names that are within "code-quotes only" (cqo) (e.g.: ``typeName``)
* The `-i` option lets you specify an array of schema filenames that might be referenced by others, but shouldn't get their own documentation section.

## Common Usage

This tool is used to generate the [glTF Properties Reference](https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#properties-reference) section and the [JSON Schema Reference Appendix](https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#appendix-a-json-schema-reference) of the glTF specification, using the [glTF JSON Schema files](https://github.com/KhronosGroup/glTF/tree/main/specification/2.0/schema) as its input data.

The process is initiated from a GitHub Action in the glTF repository ([`CI.yml`](https://github.com/KhronosGroup/glTF/blob/main/.github/workflows/CI.yml)).  This action runs glTF's [`Makefile`](https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/Makefile).  The `Makefile` calls wetzel with a command similar to the following:

```sh
~/bin/wetzel.js \
    -n -a=cqo -m=a \
    -p "schema" \
    -e "JsonSchemaReference.adoc" \
    -i '["gltfchildofrootproperty.schema.json", "gltfid.schema.json", "gltfproperty.schema.json"]' \
    -c "icon:check[]" \
    -k "**MUST**" \
    schema/glTF.schema.json > PropertiesReference.adoc
```

This will read `schema/glTF.schema.json` and all referenced sub-schemas, and produce two different output files:

- `PropertiesReference.adoc` - This becomes the [glTF Properties Reference](https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#properties-reference) section.

- `JsonSchemaReference.adoc` - This becomes the [JSON Schema Reference Appendix](https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#appendix-a-json-schema-reference).

These files are then included into glTF's [`Specification.adoc`](https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/Specification.adoc) using AsciiDoc include commands:

```adoc
[[properties-reference]]
= Properties Reference

// Generated with wetzel
include::PropertiesReference.adoc[]
```

and later:

```adoc
[appendix]
[[appendix-a-json-schema-reference]]
= JSON Schema Reference (Informative)

// Generated with wetzel
include::JsonSchemaReference.adoc[]
```

Finally, the `Makefile` uses `asciidoctor` to convert `Specification.adoc` and its included, generated documentation, into HTML and PDF forms of the final glTF specification document, which are then posted to the [glTF Registry](https://www.khronos.org/registry/glTF/).

## Contributions

Pull requests are appreciated!  Please use the same [Contributor License Agreement (CLA)](https://github.com/CesiumGS/cesium/blob/master/CONTRIBUTING.md) used for [Cesium](https://github.com/CesiumGS/cesium).

---

Developed by the Cesium team and external contributors.
<p align="center">
<a href="https://cesium.com/"><img src="doc/cesium.png" /></a>
</p>
