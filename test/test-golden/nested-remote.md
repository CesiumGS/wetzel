## Objects
* [`Buffer View`](#reference-bufferview)
* [`Extension`](#reference-extension)
* [`Extras`](#reference-extras)
* [`Material`](#reference-material)
   * [`PBR Metallic Roughness`](#reference-material-pbrmetallicroughness)
* [`nestedTest`](#reference-nestedtest) (root object)


---------------------------------------
<a name="reference-bufferview"></a>
### Buffer View

A view into a buffer.

**`Buffer View` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**byteOffset**|`integer`|The offset into the buffer in bytes.|No, default: `0`|
|**byteLength**|`integer`|The length of the bufferView in bytes.| &#x2705; Yes|
|**byteStride**|`integer`|The stride, in bytes.|No|
|**target**|`integer`|This is a test of some enums.|No|
|**name**|`string`|The user-defined name of this object.|No|
|**extensions**|[`extension`](#reference-extension)|Dictionary object with extension-specific objects.|No|
|**extras**|[`extras`](#reference-extras)|Application-specific data.|No|

Additional properties are allowed.

* **JSON schema**: [bufferView.schema.json](https://www.khronos.org/wetzel/just/testing/schema/bufferView.schema.json)

#### bufferView.byteOffset

The offset into the buffer in bytes.

* **Type**: `integer`
* **Required**: No, default: `0`
* **Minimum**: ` >= 0`

#### bufferView.byteLength &#x2705; 

The length of the bufferView in bytes.

* **Type**: `integer`
* **Required**: Yes
* **Minimum**: ` >= 1`

#### bufferView.byteStride

The stride, in bytes, between vertex attributes.  This is the detailed description of the property.

* **Type**: `integer`
* **Required**: No
* **Minimum**: ` >= 4`
* **Maximum**: ` <= 252`
* **Related WebGL functions**: `vertexAttribPointer()` stride parameter

#### bufferView.target

This is a test of some enums.

* **Type**: `integer`
* **Required**: No
* **Allowed values**:
   * `34962` ARRAY_BUFFER
   * `34963` ELEMENT_ARRAY_BUFFER
* **Related WebGL functions**: `bindBuffer()`

#### bufferView.name

The user-defined name of this object.  This is the detailed description of the property.

* **Type**: `string`
* **Required**: No

#### bufferView.extensions

Dictionary object with extension-specific objects.

* **Type**: [`extension`](#reference-extension)
* **Required**: No
* **Type of each property**: Extension

#### bufferView.extras

Application-specific data.

* **Type**: [`extras`](#reference-extras)
* **Required**: No




---------------------------------------
<a name="reference-extension"></a>
### Extension

Dictionary object with extension-specific objects.

Additional properties are allowed.

* **JSON schema**: [extension.schema.json](https://www.khronos.org/wetzel/just/testing/schema/extension.schema.json)




---------------------------------------
<a name="reference-extras"></a>
### Extras

Application-specific data.

**Implementation Note:** Although extras may have any type, it is common for applications to store and access custom data as key/value pairs. As best practice, extras should be an Object rather than a primitive value for best portability.



---------------------------------------
<a name="reference-material"></a>
### Material

The material appearance of a primitive.

**`Material` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**name**|`string`|The user-defined name of this object.|No|
|**extensions**|[`extension`](#reference-extension)|Dictionary object with extension-specific objects.|No|
|**extras**|[`extras`](#reference-extras)|Application-specific data.|No|
|**pbrMetallicRoughness**|[`material.pbrMetallicRoughness`](#reference-material-pbrmetallicroughness)|A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology. When not specified, all the default values of `pbrMetallicRoughness` apply.|No|
|**emissiveFactor**|`number` `[3]`|The emissive color of the material.|No, default: `[0,0,0]`|
|**alphaMode**|`string`|The alpha rendering mode of the material.|No, default: `"OPAQUE"`|
|**alphaCutoff**|`number`|The alpha cutoff value of the material.|No, default: `0.5`|
|**doubleSided**|`boolean`|Specifies whether the material is double sided.|No, default: `false`|

Additional properties are allowed.

* **JSON schema**: [material.schema.json](https://www.khronos.org/wetzel/just/testing/schema/material.schema.json)

#### material.name

The user-defined name of this object.  This is the detailed description of the property.

* **Type**: `string`
* **Required**: No

#### material.extensions

Dictionary object with extension-specific objects.

* **Type**: [`extension`](#reference-extension)
* **Required**: No
* **Type of each property**: Extension

#### material.extras

Application-specific data.

* **Type**: [`extras`](#reference-extras)
* **Required**: No

#### material.pbrMetallicRoughness

A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology. When not specified, all the default values of `pbrMetallicRoughness` apply.

* **Type**: [`material.pbrMetallicRoughness`](#reference-material-pbrmetallicroughness)
* **Required**: No

#### material.emissiveFactor

The RGB components of the emissive color of the material. This is the detailed description of the property.

* **Type**: `number` `[3]`
   * Each element in the array must be greater than or equal to `0` and less than or equal to `1`.
* **Required**: No, default: `[0,0,0]`

#### material.alphaMode

The material's alpha rendering mode enumeration specifying the interpretation of the alpha value of the main factor and texture.

* **Type**: `string`
* **Required**: No, default: `"OPAQUE"`
* **Allowed values**:
   * `"OPAQUE"` The alpha value is ignored and the rendered output is fully opaque.
   * `"MASK"` The rendered output is either fully opaque or fully transparent depending on the alpha value and the specified alpha cutoff value.
   * `"BLEND"` The alpha value is used to composite the source and destination areas.

#### material.alphaCutoff

Specifies the cutoff threshold when in `MASK` mode. This is the detailed description of the property.

* **Type**: `number`
* **Required**: No, default: `0.5`
* **Minimum**: ` >= 0`

#### material.doubleSided

Specifies whether the material is double sided. This is the detailed description of the property.

* **Type**: `boolean`
* **Required**: No, default: `false`




---------------------------------------
<a name="reference-material-pbrmetallicroughness"></a>
### Material PBR Metallic Roughness

A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology.

**`Material PBR Metallic Roughness` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**baseColorFactor**|`number` `[4]`|The material's base color factor.|No, default: `[1,1,1,1]`|
|**metallicFactor**|`number`|The metalness of the material.|No, default: `1`|
|**roughnessFactor**|`number`|The roughness of the material.|No, default: `1`|
|**extensions**|[`extension`](#reference-extension)|Dictionary object with extension-specific objects.|No|
|**extras**|[`extras`](#reference-extras)|Application-specific data.|No|

Additional properties are allowed.

* **JSON schema**: [material.pbrMetallicRoughness.schema.json](https://www.khronos.org/wetzel/just/testing/schema/material.pbrMetallicRoughness.schema.json)

#### material.pbrMetallicRoughness.baseColorFactor

The RGBA components of the base color of the material. This is the detailed description of the property.

* **Type**: `number` `[4]`
   * Each element in the array must be greater than or equal to `0` and less than or equal to `1`.
* **Required**: No, default: `[1,1,1,1]`

#### material.pbrMetallicRoughness.metallicFactor

The metalness of the material. This is the detailed description of the property.

* **Type**: `number`
* **Required**: No, default: `1`
* **Minimum**: ` >= 0`
* **Maximum**: ` <= 1`

#### material.pbrMetallicRoughness.roughnessFactor

The roughness of the material. This is the detailed description of the property.

* **Type**: `number`
* **Required**: No, default: `1`
* **Minimum**: ` >= 0`
* **Maximum**: ` <= 1`

#### material.pbrMetallicRoughness.extensions

Dictionary object with extension-specific objects.

* **Type**: [`extension`](#reference-extension)
* **Required**: No
* **Type of each property**: Extension

#### material.pbrMetallicRoughness.extras

Application-specific data.

* **Type**: [`extras`](#reference-extras)
* **Required**: No




---------------------------------------
<a name="reference-nestedtest"></a>
### nestedTest

The root object for a nestedTest asset.

**`nestedTest` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**bufferViews**|[`bufferView`](#reference-bufferview) `[1-*]`|An array of bufferViews.| &#x2705; Yes|
|**materials**|[`material`](#reference-material) `[1-*]`|An array of materials.|No|
|**version**|`string`|A version string with a specific pattern.|No|
|**uri**|`string`|A string that should reference a URI.|No|
|**extensions**|[`extension`](#reference-extension)|Dictionary object with extension-specific objects.|No|
|**extras**|[`extras`](#reference-extras)|Application-specific data.|No|

Additional properties are allowed.

* **JSON schema**: [nestedTest.schema.json](https://www.khronos.org/wetzel/just/testing/schema/nestedTest.schema.json)

#### nestedTest.bufferViews &#x2705; 

An array of bufferViews.  This is the detailed description of the property.

* **Type**: [`bufferView`](#reference-bufferview) `[1-*]`
* **Required**: Yes

#### nestedTest.materials

An array of materials.  This is the detailed description of the property.

* **Type**: [`material`](#reference-material) `[1-*]`
* **Required**: No

#### nestedTest.version

A version string with a specific pattern.

* **Type**: `string`
* **Required**: No

#### nestedTest.uri

A string that should reference a URI.  This is the detailed description of the property.

* **Type**: `string`
* **Required**: No
* **Format**: uriref

#### nestedTest.extensions

Dictionary object with extension-specific objects.

* **Type**: [`extension`](#reference-extension)
* **Required**: No
* **Type of each property**: Extension

#### nestedTest.extras

Application-specific data.

* **Type**: [`extras`](#reference-extras)
* **Required**: No




