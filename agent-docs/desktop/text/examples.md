---
title: UText 文本示例
description: 用 UText 按标题层级展示文本，并支持高亮、删除线与强调
---

`UText` 只渲染默认插槽里的文本节点。`as` 默认 `content`，还可为 `main-title` / `title` / `sub-title` / `additional`。`font-size` 与 `bold` 会覆盖 `as` 对应样式。`highlight` 可以是字符串或字符串数组，命中部分包在 `mark` 里。

```vue
<template>
  <u-text as="title">页面标题</u-text>
  <u-text>正文段落</u-text>
  <u-text highlight="截止日期">请在截止日期前完成提交。</u-text>
  <u-text deleted>已撤销的说明</u-text>
  <u-text underline bold>强调内容</u-text>
</template>
```
