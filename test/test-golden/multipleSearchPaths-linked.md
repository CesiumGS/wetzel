## Objects
* [`MultipleSearchPaths`](#reference-multiplesearchpaths) (root object)
* [`SearchPaths external A`](#reference-searchpathsexternala)
* [`SearchPaths external B`](#reference-searchpathsexternalb)


---------------------------------------
<a name="reference-multiplesearchpaths"></a>
### MultipleSearchPaths

A schema that refers to schemas in different paths

**`MultipleSearchPaths` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**examplePropertyA**|[`searchPathsExternalA`](#reference-searchpathsexternala)|A schema that is referred to by another one|No|
|**examplePropertyB**|[`searchPathsExternalB`](#reference-searchpathsexternalb)|A schema that is referred to by another one|No|

Additional properties are allowed.

* **JSON schema**: [multipleSearchPaths.schema.json](schema/multipleSearchPaths.schema.json)

#### MultipleSearchPaths.examplePropertyA

A schema that is referred to by another one

* **Type**: [`searchPathsExternalA`](#reference-searchpathsexternala)
* **Required**: No

#### MultipleSearchPaths.examplePropertyB

A schema that is referred to by another one

* **Type**: [`searchPathsExternalB`](#reference-searchpathsexternalb)
* **Required**: No




---------------------------------------
<a name="reference-searchpathsexternala"></a>
### SearchPaths external A

A schema that is referred to by another one

Additional properties are allowed.

* **JSON schema**: [searchPathsExternalA.schema.json](schema/searchPathsExternalA.schema.json)




---------------------------------------
<a name="reference-searchpathsexternalb"></a>
### SearchPaths external B

A schema that is referred to by another one

Additional properties are allowed.

* **JSON schema**: [searchPathsExternalB.schema.json](schema/searchPathsExternalB.schema.json)


