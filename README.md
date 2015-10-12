# wetzel

Generate Markdown documentation from JSON Schema

It is useful to redirect the output to the clipboard and then paste into a temporary GitHub issue for testing.

On Mac:
```
node ./bin/wetzel.js ../glTF/specification/schema/accessor.schema.json -l 2 | pbcopy
```

On Windows:
```
node ./bin/wetzel.js ../glTF/specification/schema/accessor.schema.json -l 2 | clip
```
