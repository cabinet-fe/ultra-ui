---
'@veltra/desktop': patch
---

fix(desktop): nav 展开图标深侧栏下变黑失去对比度

展开态图标颜色由全局 token `text-color/title` 改为导航作用域变量 `--u-nav-strong-color`。浅色主题默认深侧栏底色为 `text-color/title`（近黑），原写法使展开后的箭头图标与底色同色不可见；改后四个 nav 变体（深/浅侧栏 × 浅/深主题）下均与展开行强调色一致。
