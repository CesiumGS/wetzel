# wetzel

Generate Markdown documentation from JSON Schema

* [Example](#Example)
* [Getting Started](#Getting-Started)
* [Limitations](#Limitations)

<a name="Example"></a>
## Example

This JSON Schema:
```json
{
    "$schema" : "http://json-schema.org/draft-03/schema",
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
            "enum" : ["SCALAR", "VEC2", "VEC3", "VEC4", "MAT2", "MAT3", "MAT4"],
            "required" : true
        }
    },
    "additionalProperties" : false
}
```

is used to generate this Markdown documentation:

# example

Example description.

**Properties**

|   |Type|Description|Required|
|---|----|-----------|--------|
|**byteOffset**|`integer`|The offset relative to the start of the buffer in bytes.|No, default: `0`|
|**type**|`string`|Specifies if the elements are scalars, vectors, or matrices.| :white_check_mark: Yes|

Additional properties are not allowed.

## example.byteOffset

The offset relative to the start of the buffer in bytes.

* **Type**: `integer`
* **Required**: No, default: `0`
* **Minimum**:` >= 0`

## example.type :white_check_mark:

Specifies if the elements are scalars, vectors, or matrices.

* **Type**: `string`
* **Required**: Yes
* **Allowed values**: `"SCALAR"`, `"VEC2"`, `"VEC3"`, `"VEC4"`, `"MAT2"`, `"MAT3"`, `"MAT4"`

---

<a name="Getting-Started"></a>
## Getting Started

Install [Node.js](https://nodejs.org/en/) if you don't already have it, clone this repo, and then:
```
cd wetzel
npm install
```
Run `node bin/wetzel.js` and pass it the path to a file with a JSON Schema, and the generated Markdown is output to the console.

It is useful to pipe the Markdown output to the clipboard and then paste into a temporary GitHub issue for testing.

On Mac:
```
wetzel ../glTF/specification/2.0/schema/accessor.schema.json -l 2 | pbcopy
```

On Windows:
```
wetzel.js ../glTF/specification/2.0/schema/accessor.schema.json -l 2 | clip
```

Options:
* The `-l` option specifies the starting header level.
* The `-p` option lets you specify the relative path that should be used when referencing the schema, relative to where you store the documentation.
* The `-w` option will suppress any warnings about potential documentation problems that wetzel normally prints by default.
* The `-d` option lets you specify the root filename that will be used for writing intermediate wetzel artifacts that are useful when doing wetzel development.

<a name="common-usage"></a>
## Common Usage

The most common way to use this tool is to generate the entire glTF documentation.
To do that, you simply need to pass-in the root schema file (glTF.schema.json):

```
wetzel ../gltf/specification/2.0/schema/glTF.schema.json -p schema/ | clip
```

That will generate documentation for glTF.schema.json, as well as all referenced schemas,
all in a single set of markdown with inter-type linking.  By specifying the `-p` parameter,
you've indicated where the actual json schema files will live relative to the documentation
so that the type documentation can directly link to the type json file.

<a name="Limitations"></a>
## Limitations

This tool was developed to generate reference documentaiton for the [glTF](https://github.com/KhronosGroup/glTF) schema.  As such, it currently only supports JSON Schema 3 and 4, and doesn't support the entire JSON Schema spec.  However, wetzel is easy to hack on, just edit [lib/generateMarkdown.js](lib/generateMarkdown.js).

## Contributions

Pull requests are appreciated.  Please use the same [Contributor License Agreement (CLA)](https://github.com/AnalyticalGraphicsInc/cesium/blob/master/CONTRIBUTING.md) used for [Cesium](http://cesiumjs.org/).

---

Developed by the Cesium team.
<p align="center">
<a href="http://cesiumjs.org/"><img src="doc/cesium.png" /></a>
</p>
