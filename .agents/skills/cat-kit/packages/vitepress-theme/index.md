# @cat-kit/vitepress-theme

VitePress 文档主题：默认主题、布局、Demo/Mermaid 与配置助手。

**版本**：1.0.2  
**Peers**：`vitepress ^2.0.0`、`vue ^3.5.31`

## 主题

| 主题 | 说明 |
| --- | --- |
| [theme](theme/index.md) | 默认主题、布局、composable |
| [config](config/index.md) | `defineThemeConfig` 与 markdown/vite 插件 |
| [组合示例](examples.md) | 接入主题 + demo 容器 |

## 安装

```bash
bun add @cat-kit/vitepress-theme
```

`defineThemeConfig`、`demoContainer`、`mermaidPlugin`、`importExamples` 从 **`@cat-kit/vitepress-theme/config`** 导入，不要从包根导入这些助手。
