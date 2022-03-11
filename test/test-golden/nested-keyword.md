# Objects
* [`Buffer View`](#reference-bufferview)
* [`Extension`](#reference-extension)
* [`Extras`](#reference-extras)
* [`Image`](#reference-image)
* [`Material`](#reference-material)
    * [`PBR Metallic Roughness`](#reference-material-pbrmetallicroughness)
* [`nestedTest`](#reference-nestedtest) (root object)


---------------------------------------
<a name="reference-bufferview"></a>
## Buffer View

A view into a buffer.

**`Buffer View` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**byteOffset**|`integer`|The offset into the buffer in bytes.|No, default: `0`|
|**byteLength**|`integer`|The length of the bufferView in bytes.| &#10003; Yes|
|**byteStride**|`integer`|The stride, in bytes.|No|
|**target**|`integer`|This is a test of some enums.|No|
|**name**|`string`|The user-defined name of this object.|No|
|**extensions**|`extension`|Dictionary object with extension-specific objects.|No|
|**extras**|`extras`|Application-specific data.|No|

* **Additional properties are allowed.**
### bufferView.byteOffset

The offset into the buffer in bytes.

* **Type**: `integer`
* **Required**: No, default: `0`
* **Minimum**: ` >= 0`

### bufferView.byteLength

The length of the bufferView in bytes.

* **Type**: `integer`
* **Required**:  &#10003; Yes
* **Minimum**: ` >= 1`

### bufferView.byteStride

The stride, in bytes, between vertex attributes.  This is the detailed description of the property.

* **Type**: `integer`
* **Required**: No
* **Minimum**: ` >= 4`
* **Maximum**: ` <= 252`
* **Related WebGL functions**: `vertexAttribPointer()` stride parameter

### bufferView.target

This is a test of some enums.

* **Type**: `integer`
* **Required**: No
* **Allowed values**:
    * `34962` ARRAY_BUFFER
    * `34963` ELEMENT_ARRAY_BUFFER
* **Related WebGL functions**: `bindBuffer()`

### bufferView.name

The user-defined name of this object.  This is the detailed description of the property.

* **Type**: `string`
* **Required**: No

### bufferView.extensions

Dictionary object with extension-specific objects.

* **Type**: `extension`
* **Required**: No
* **Additional properties are allowed.**
* **Type of each property**: `object`

### bufferView.extras

Application-specific data.

* **Type**: `extras`
* **Required**: No




---------------------------------------
<a name="reference-extension"></a>
## Extension

Dictionary object with extension-specific objects.

* **Additional properties are allowed.**
* **Type of additional properties**: `object`



---------------------------------------
<a name="reference-extras"></a>
## Extras

Application-specific data.

**Implementation Note:** Although extras may have any type, it is common for applications to store and access custom data as key/value pairs. As best practice, extras should be an Object rather than a primitive value for best portability.



---------------------------------------
<a name="reference-image"></a>
## Image

Image data used to create a texture. Image can be referenced by URI or `bufferView` index. `mimeType` is required in the latter case.

**`Image` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**uri**|`string`|The uri of the image.|No|
|**mimeType**|`string`|The image's MIME type. Required if `bufferView` is defined.|No|
|**bufferView**|`integer`|The index of the bufferView that contains the image. Use this instead of the image's uri property.|No|
|**fraction**|`number`|A number that must be between zero and one.|No|
|**name**|`string`|The user-defined name of this object.|No|
|**extensions**|`extension`|Dictionary object with extension-specific objects.|No|
|**extras**|`extras`|Application-specific data.|No|

* **Additional properties are allowed.**
### image.uri

The uri of the image.  This is the detailed description of the property.

* **Type**: `string`
* **Required**: No
* **Format**: uriref

### image.mimeType

The image's MIME type. Required if `bufferView` is defined.

* **Type**: `string`
* **Required**: No
* **Allowed values**:
    * `"image/jpeg"`
    * `"image/png"`

### image.bufferView

The index of the bufferView that contains the image. Use this instead of the image's uri property.

* **Type**: `integer`
* **Required**: No
* **Minimum**: ` >= 0`

### image.fraction

A number that must be between zero and one.

* **Type**: `number`
* **Required**: No
* **Minimum**: ` > 0`
* **Maximum**: ` < 1`

### image.name

The user-defined name of this object.  This is the detailed description of the property.

* **Type**: `string`
* **Required**: No

### image.extensions

Dictionary object with extension-specific objects.

* **Type**: `extension`
* **Required**: No
* **Additional properties are allowed.**
* **Type of each property**: `object`

### image.extras

Application-specific data.

* **Type**: `extras`
* **Required**: No




---------------------------------------
<a name="reference-material"></a>
## Material

The material appearance of a primitive.

**`Material` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**name**|`string`|The user-defined name of this object.|No|
|**extensions**|`extension`|Dictionary object with extension-specific objects.|No|
|**extras**|`extras`|Application-specific data.|No|
|**pbrMetallicRoughness**|`material.pbrMetallicRoughness`|A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology. When not specified, all the default values of `pbrMetallicRoughness` apply.|No|
|**emissiveFactor**|`number` `[3]`|The emissive color of the material.|No, default: `[0,0,0]`|
|**alphaMode**|`string`|The alpha rendering mode of the material.|No, default: `"OPAQUE"`|
|**alphaCutoff**|`number`|The alpha cutoff value of the material.|No, default: `0.5`|
|**doubleSided**|`boolean`|Specifies whether the material is double sided.|No, default: `false`|

* **Additional properties are allowed.**
### material.name

The user-defined name of this object.  This is the detailed description of the property.

* **Type**: `string`
* **Required**: No

### material.extensions

Dictionary object with extension-specific objects.

* **Type**: `extension`
* **Required**: No
* **Additional properties are allowed.**
* **Type of each property**: `object`

### material.extras

Application-specific data.

* **Type**: `extras`
* **Required**: No

### material.pbrMetallicRoughness

A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology. When not specified, all the default values of `pbrMetallicRoughness` apply.

* **Type**: `material.pbrMetallicRoughness`
* **Required**: No

### material.emissiveFactor

The RGB components of the emissive color of the material. This is the detailed description of the property.

* **Type**: `number` `[3]`
    * Each element in the array **MUST** be greater than or equal to `0` and less than or equal to `1`.
* **Required**: No, default: `[0,0,0]`

### material.alphaMode

The material's alpha rendering mode enumeration specifying the interpretation of the alpha value of the main factor and texture.

* **Type**: `string`
* **Required**: No, default: `"OPAQUE"`
* **Allowed values**:
    * `"OPAQUE"` The alpha value is ignored and the rendered output is fully opaque.
    * `"MASK"` The rendered output is either fully opaque or fully transparent depending on the alpha value and the specified alpha cutoff value.
    * `"BLEND"` The alpha value is used to composite the source and destination areas.

### material.alphaCutoff

Specifies the cutoff threshold when in `MASK` mode. This is the detailed description of the property.

* **Type**: `number`
* **Required**: No, default: `0.5`
* **Minimum**: ` >= 0`

### material.doubleSided

Specifies whether the material is double sided. This is the detailed description of the property.

* **Type**: `boolean`
* **Required**: No, default: `false`




---------------------------------------
<a name="reference-material-pbrmetallicroughness"></a>
## Material PBR Metallic Roughness

A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology.

**`Material PBR Metallic Roughness` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**baseColorFactor**|`number` `[4]`|The material's base color factor.|No, default: `[1,1,1,1]`|
|**metallicFactor**|`number`|The metalness of the material.|No, default: `1`|
|**roughnessFactor**|`number`|The roughness of the material.|No, default: `1`|
|**extensions**|`extension`|Dictionary object with extension-specific objects.|No|
|**extras**|`extras`|Application-specific data.|No|

* **Additional properties are allowed.**
### material.pbrMetallicRoughness.baseColorFactor

The RGBA components of the base color of the material. This is the detailed description of the property.

* **Type**: `number` `[4]`
    * Each element in the array **MUST** be greater than or equal to `0` and less than or equal to `1`.
* **Required**: No, default: `[1,1,1,1]`

### material.pbrMetallicRoughness.metallicFactor

The metalness of the material. This is the detailed description of the property.

* **Type**: `number`
* **Required**: No, default: `1`
* **Minimum**: ` >= 0`
* **Maximum**: ` <= 1`

### material.pbrMetallicRoughness.roughnessFactor

The roughness of the material. This is the detailed description of the property.

* **Type**: `number`
* **Required**: No, default: `1`
* **Minimum**: ` >= 0`
* **Maximum**: ` <= 1`

### material.pbrMetallicRoughness.extensions

Dictionary object with extension-specific objects.

* **Type**: `extension`
* **Required**: No
* **Additional properties are allowed.**
* **Type of each property**: `object`

### material.pbrMetallicRoughness.extras

Application-specific data.

* **Type**: `extras`
* **Required**: No




---------------------------------------
<a name="reference-nestedtest"></a>
## nestedTest

The root object for a nestedTest asset.

**`nestedTest` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**bufferViews**|`bufferView` `[1-*]`|An array of bufferViews.| &#10003; Yes|
|**materials**|`material` `[1-*]`|An array of materials.|No|
|**images**|`image` `[1-*]`|An array of images.|No|
|**version**|`string`|A version string with a specific pattern.|No|
|**uri**|`string`|A string that should reference a URI.|No|
|**extensions**|`extension`|Dictionary object with extension-specific objects.|No|
|**extras**|`extras`|Application-specific data.|No|

* **Additional properties are allowed.**
### nestedTest.bufferViews

An array of bufferViews.  This is the detailed description of the property.

* **Type**: `bufferView` `[1-*]`
* **Required**:  &#10003; Yes

### nestedTest.materials

An array of materials.  This is the detailed description of the property.

* **Type**: `material` `[1-*]`
* **Required**: No

### nestedTest.images

An array of images.  This is the detailed description of the property.

* **Type**: `image` `[1-*]`
* **Required**: No

### nestedTest.version

A version string with a specific pattern.

* **Type**: `string`
* **Required**: No
* **Pattern**: `^[0-9]+\.[0-9]+$`

### nestedTest.uri

A string that should reference a URI.  This is the detailed description of the property.

* **Type**: `string`
* **Required**: No
* **Format**: uriref

### nestedTest.extensions

Dictionary object with extension-specific objects.

* **Type**: `extension`
* **Required**: No
* **Additional properties are allowed.**
* **Type of each property**: `object`

### nestedTest.extras

Application-specific data.

* **Type**: `extras`
* **Required**: No




