## Objects
* [`Image`](#reference-image) (root object)


---------------------------------------
<a name="reference-image"></a>
### Image

Image data used to create a texture. Image **MAY** be referenced by an URI (or IRI) or a buffer view index.

**`Image` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**uri**|`string`|The URI (or IRI) of the image.|No|
|**mimeType**|`string`|The image's media type. This field **MUST** be defined when `bufferView` is defined.|No|
|**bufferView**|`integer`|The index of the bufferView that contains the image. This field **MUST NOT** be defined when `uri` is defined.|No|
|**fraction**|`number`|A number that **MUST** be between zero and one.|No|
|**moreFractions**|`number` `[3]`|An array of three fractional numbers.|No, default: `[0.1,0.2,0.3]`|

**`Image` Pattern Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**`/^(?:rgb\|hex\|hsl\|rgba\|hsla)Color/`**|`string`|The background color for the image|No|
|**`/^(?:height\|width)$/`**|`string`|A dimension for the image|No|

Additional properties are allowed.

* **JSON schema**: [image.schema.json](schema/image.schema.json)

#### Image.uri

The URI (or IRI) of the image.  Relative paths are relative to the current glTF asset.  Instead of referencing an external file, this field **MAY** contain a `data:`-URI. This field **MUST NOT** be defined when `bufferView` is defined.

* **Type**: `string`
* **Required**: No
* **Format**: iri-reference
* **Examples**:
    * `"https://raw.githubusercontent.com/KhronosGroup/glTF/main/specification/figures/gltf.png"`

#### Image.mimeType

The image's media type. This field **MUST** be defined when `bufferView` is defined.

* **Type**: `string`
* **Required**: No
* **Allowed values**:
    * `"image/jpeg"`
    * `"image/png"`

#### Image.bufferView

The index of the bufferView that contains the image. This field **MUST NOT** be defined when `uri` is defined.

* **Type**: `integer`
* **Required**: No
* **Minimum**: ` >= 0`
* **Examples**:
    * `3`
    * `0`

#### Image.fraction

A number that **MUST** be between zero and one.

* **Type**: `number`
* **Required**: No
* **Minimum**: ` > 0`
* **Maximum**: ` < 1`

#### Image.moreFractions

An array of three fractional numbers.

* **Type**: `number` `[3]`
    * Each element in the array must be greater than `0` and less than `1`.
* **Required**: No, default: `[0.1,0.2,0.3]`
* **Examples**:
    * `[1.3, 4.03, 42]`
    * `[18, 0.1, 1.1]`


#### Image.`/^(?:rgb\|hex\|hsl\|rgba\|hsla)Color/`

The background color for the image

* **Type**: `string`
* **Required**: No
* **Examples**:
    * `"rgb(255, 99, 71)"`
    * `"#ff6347"`
    * `"hsl(9, 100%, 64%)"`

#### Image.`/^(?:height\|width)$/`

A dimension for the image

* **Type**: `string`
* **Required**: No
* **Examples**:
    * `"10"`
    * `"400px"`


### Examples

* `{"uri": "https://raw.githubusercontent.com/KhronosGroup/glTF/main/specification/figures/gltf.png", "mimeType": "image/png"}`
* `{"bufferView": 2, "fraction": 0.3, "moreFractions": [  1.1,  2.2,  3.3 ]}`
