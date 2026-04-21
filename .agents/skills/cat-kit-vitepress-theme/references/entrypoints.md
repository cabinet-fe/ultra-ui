# vitepress-theme — 导出入口

**权威 typings**：[`index.d.ts`](../generated/index.d.ts) · [`config` 构建产物](../generated/config.d.ts)（若存在） · 根目录样式声明 [`style.css.d.ts`](../generated/style.css.d.ts)

npm `exports` 中与类型相关的主要入口：

- `.` → `dist/index.js` / `dist/index.d.ts`
- `./config` → 主题配置侧代码（部分类型可能仍指向源码发布字段，以 `generated` 镜像为准）

`./config` 提供的 `importExamples` 用于给 `::: demo` 页面自动注入示例组件导入，并且会保留 Markdown 顶部 frontmatter 的解析位置。
