# Review 跟进：sample 的 auto、单测与映射摘要

## 补丁内容

- **Sample**：用「浅色 / 深色 / 系统」单选替代二态开关；`themeMode` 持久化到 `localStorage`（兼容旧键 `isDark`）；`系统` 对应 `UITheme.setTheme('auto')`；`activeTheme` 在 `auto` 下按 `prefers-color-scheme` 在 light/dark 的 `theme` 对象间切换展示。
- **测试**：新增 `packages/utils/src/styles/theme/__test__/ui-theme.test.ts`，校验 `themeToDeclarationList` 仅产出 `--u-*` 声明，以及 `setTheme` 对 `data-theme` 的读写。
- **文档（本补丁）**：补充核心 **JS Theme 路径 → CSS 变量** 映射摘要（完整表仍建议随大版本在独立设计文档维护）。

## 全局 token 映射摘要（`Theme` → `--u-*`）

| Theme 路径（概念） | CSS 变量示例 |
|-------------------|-------------|
| `color.primary` | `--u-color-primary` |
| `bg.color.top` | `--u-bg-color-top` |
| `text-color.main` | `--u-text-color-main` |
| `border.color` / `width` / `style` | `--u-border-color` 等；复合 `--u-border` |
| `radius.*` | `--u-radius-small` … |
| `form-component-height.*` | `--u-form-component-height-small` … |
| `font-family` | `--u-font-family` |
| `font-size-*.*` | `--u-font-size-title-small` … |
| `shadow.*` | `--u-shadow-color` …；复合 `--u-shadow` |
| `gap.*` | `--u-gap-small` … |
| `breakpoint.*` | `--u-breakpoint-xs` … |
| 色阶（由 `UITheme` 派生） | `--u-color-{type}-light-{1..9}`、`--u-color-{type}-dark-{1..9}` |
| 派生 | `--u-bg-color-{slot}-alpha`、`--u-bg-filter` |

**组件 token（已迁出 `Theme`）**：在各自 `style.scss` 中以 `--u-{component}-*` 声明（如 `--u-table-border-color`、`--u-menu-hover-bg`），引用侧使用 `fn.component-var()` 或直接使用 `var(--u-…)`；暗色覆盖用 `m.dark()`。

## 影响范围

- 修改文件: `apps/sample/App.vue`
- 新增文件: `packages/utils/src/styles/theme/__test__/ui-theme.test.ts`
- 修改文件: `.agent-context/whj/plan-3/plan.md`（历史补丁 / 影响范围）
