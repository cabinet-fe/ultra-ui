---
'@veltra/sheet': minor
---

**Breaking**：USheet 自 `src/vue/` 迁入 `src/components/sheet/`（对齐 desktop 多组件结构），`vue/` 目录整体移除、不留兼容导出。样式入口由 `@veltra/sheet/vue/style` 改为 `@veltra/sheet/components/sheet/style`；包主入口 API（`USheet`、tools、types、sheet-core 白名单 re-export）不变，行为零变化。
