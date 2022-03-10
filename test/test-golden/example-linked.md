## Objects
* [`example`](#reference-example) (root object)


---------------------------------------
<a name="reference-example"></a>
### example

Example description.

**`example` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**byteOffset**|`integer`|The offset relative to the start of the buffer in bytes.|No, default: `0`|
|**type**|`string`|Specifies if the elements are scalars, vectors, or matrices.| &#10003; Yes|

* **Additional properties are not allowed.**
* **JSON schema**: [example.schema.json](schema/example.schema.json)

#### example.byteOffset

The offset relative to the start of the buffer in bytes.

* **Type**: `integer`
* **Required**: No, default: `0`
* **Minimum**: ` >= 0`

#### example.type

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


