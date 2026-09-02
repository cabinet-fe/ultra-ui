# @cat-kit/vitepress-theme — 组合示例

```bash
bun add @cat-kit/vitepress-theme
# peers: vitepress ^2、vue ^3.5.31
```

```ts
// .vitepress/theme/index.ts
import theme from '@cat-kit/vitepress-theme'
export default theme
```

```ts
// .vitepress/config.ts
import { defineThemeConfig } from '@cat-kit/vitepress-theme/config'
import { fileURLToPath } from 'node:url'

const examplesDir = fileURLToPath(new URL('../../examples', import.meta.url))

export default {
  title: 'Docs',
  ...defineThemeConfig({ examplesDir })
}
```

Markdown 中：

```md
::: demo my-pkg/demo.vue
:::
```
