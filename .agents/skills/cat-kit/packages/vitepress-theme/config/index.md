# vitepress-theme — 配置

## 何时使用

在 `.vitepress/config.ts` 中接入 demo 容器、Mermaid 与 examples 导入插件。

## 推荐公开 API（子路径）

从 **`@cat-kit/vitepress-theme/config`** 导入：

- `defineThemeConfig({ examplesDir })` — `examplesDir` 必须为**绝对路径**
- `demoContainer`、`mermaidPlugin`、`importExamples`
- 类型：`CatKitThemeOptions`、`DemoContainerOptions`、`ImportExamplesOptions`

```ts
import { defineThemeConfig } from '@cat-kit/vitepress-theme/config'
import { fileURLToPath } from 'node:url'

export default {
  ...defineThemeConfig({
    examplesDir: fileURLToPath(new URL('../examples', import.meta.url))
  })
}
```

详情见 [apis.md](apis.md)、包级 [examples.md](../examples.md)。

## 约束

- 不要从包根导入 `defineThemeConfig` / `demoContainer` 等（README 旧示例可能有误）
- `defineThemeConfig` 会配置 `markdown` 与 `vite.plugins`；合并时勿浅覆盖这些嵌套字段
- `::: demo path/to/file.vue` 需要 config 助手 + 默认主题注册的 `DemoContainer`
