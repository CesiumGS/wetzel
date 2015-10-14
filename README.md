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
Run `node ./bin/wetzel.js` and pass it the path to a file with a JSON Schema, and the generated Markdown is output to the console.

It is useful to pipe the Markdown output to the clipboard and then paste into a temporary GitHub issue for testing.

On Mac:
```
node ./bin/wetzel.js ../glTF/specification/schema/accessor.schema.json -l 2 | pbcopy
```

On Windows:
```
node ./bin/wetzel.js ../glTF/specification/schema/accessor.schema.json -l 2 | clip
```

The `-l` option specifies the starting header level.

<a name="Limitations"></a>
## Limitations

This tool was developed to generate reference documentaiton for the [glTF](https://github.com/KhronosGroup/glTF) schema.  As such, it currently only supports JSON Schema 3 and doesn't support the entire JSON Schema spec.  However, wetzel is easy to hack on, just edit [lib/generateMarkdown.js](lib/generateMarkdown.js).

Pull requests are appreciated.  Please use the same [Contributor License Agreement (CLA)](https://github.com/AnalyticalGraphicsInc/cesium/blob/master/CONTRIBUTING.md) used for [Cesium](http://cesiumjs.org/).

---

Developed by the Cesium team.
<p align="center">
<a href="http://cesiumjs.org/"><img src="doc/cesium.png" /></a>
</p>

