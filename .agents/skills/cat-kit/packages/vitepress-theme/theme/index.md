# vitepress-theme — 主题

## 何时使用

在 VitePress 站点使用 CatKit 默认主题、布局与内置 Demo/Mermaid 组件。

## 推荐公开 API

- 默认导出：VitePress theme（extends DefaultTheme，`CatKitLayout`，注册 `DemoContainer` / `Mermaid`）
- 命名导出：`CatKitLayout`、`useConsoleInterceptor`、`useFullscreen`、`useDraggable` 及对应类型

```ts
// .vitepress/theme/index.ts
import theme from '@cat-kit/vitepress-theme'
export default theme
```

样式：`@cat-kit/vitepress-theme/style.css` 或 `@cat-kit/vitepress-theme/styles/theme.css`（主题入口已引入 theme.css）。

详情见 [apis.md](apis.md)。配置助手见 [config](../config/index.md)。
