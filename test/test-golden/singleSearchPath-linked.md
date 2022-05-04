## Objects
* [`SearchPaths external A`](#reference-searchpathsexternala)
* [`SingleSearchPath`](#reference-singlesearchpath) (root object)


---------------------------------------
<a name="reference-searchpathsexternala"></a>
### SearchPaths external A

A schema that is referred to by another one

Additional properties are allowed.

* **JSON schema**: [searchPathsExternalA.schema.json](schema/searchPathsExternalA.schema.json)




---------------------------------------
<a name="reference-singlesearchpath"></a>
### SingleSearchPath

A schema that refers to a schema in a different path

**`SingleSearchPath` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**examplePropertyA**|[`searchPathsExternalA`](#reference-searchpathsexternala)|A schema that is referred to by another one|No|

Additional properties are allowed.

* **JSON schema**: [singleSearchPath.schema.json](schema/singleSearchPath.schema.json)

#### SingleSearchPath.examplePropertyA

A schema that is referred to by another one

* **Type**: [`searchPathsExternalA`](#reference-searchpathsexternala)
* **Required**: No


