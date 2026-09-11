# Override Patterns

## Common override keys

| Key | Typical use |
|-----|-------------|
| `image` | lightboxes, captions, lazy-loading wrappers |
| `link` | analytics, router integration, custom tooltip behavior |
| `code_block` | replace regular fenced code blocks |
| `mermaid` | customize Mermaid only |
| `d2` | customize D2 only |
| `infographic` | customize infographic blocks only |
| `inline_code` | typography or special inline behavior |
| `heading`, `paragraph`, `list_item` | container overrides that must render children |

## Trusted custom-tag pattern

### Vue, Vue 2, Svelte, and Angular shared registry

1. register the tag in `customHtmlTags`
2. map the same tag name with `setCustomComponents(customId, { tagName: Component })`
3. if the tag body contains Markdown, render `node.content` with a nested renderer
4. pass the same `customHtmlTags` list to the nested renderer

Svelte and Angular can pass `customComponents` directly to one renderer instead when shared registration is unnecessary.

### React renderer-local maps

1. use `streamingComponents` for parser-backed tags that need `node.loading` and incomplete-tag handling
2. use `htmlComponents` for sanitized HTML attributes plus `children`
3. define typed maps with `defineStreamingComponents(...)` or `defineHtmlComponents(...)`
4. only add `customHtmlTags` separately when another parser path needs it; `streamingComponents` contributes its own keys automatically

## Nested renderer defaults

- `typewriter: false`
- `viewportPriority: false`
- `deferNodesUntilVisible: false`
- `maxLiveNodes: 0`
- `batchRendering: false`

Use those defaults when predictable nested streaming behavior matters more than optimization.
