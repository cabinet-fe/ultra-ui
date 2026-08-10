# 01 — sheet 包骨架重构：vue/ → components/sheet/

**What to build:** `@veltra/sheet` 从单组件 `vue/` 结构迁移为多组件 `components/` 结构（对齐 desktop 模式）：USheet 迁入 `components/sheet/`，包导出、`sideEffects`、样式入口同步调整。纯 prefactor，行为零变化，不新增任何能力；按 ADR-0003 决策 1，`vue/` 整体移除、不留兼容导出。

**Blocked by:** None — can start immediately

**Status:** completed

- [x] `components/sheet/` 落地，`vue/` 目录移除，无兼容导出
- [x] 包 exports 与 `sideEffects` 和新结构一致，样式入口可用
- [x] `packages/sheet/AGENTS.md` 目录结构同步
- [x] playground 表格页行为不变；`bun run lint` / `bun run test` / `bun run build` 全绿
