# CodeMirror 单实例（根因修复）

> 状态: 已执行

## 目标

消除 CodeMirror 多实例错误的根因（依赖树中解析出不同版本的 `@codemirror/state` / `@codemirror/view`），不再依赖 Vite `dedupe` 与 `optimizeDeps.include` 掩盖问题。

## 内容

1. 在 monorepo 根 `package.json` 增加 `overrides`，将 `@codemirror/state`、`@codemirror/view` 及易嵌套的核心 `@codemirror/*` 固定为与 `@ultra-ui/desktop` 一致的单一版本，使安装后仅一份物理包。
2. 执行 `bun install` 并验证 `node_modules` 下不再存在嵌套的 `@codemirror/state`。
3. 从 `playgrounds/desktop/vite.config.ts` 移除 CodeMirror 相关的 `resolve.dedupe` 与 `optimizeDeps.include` 配置块。

## 影响范围

- `package.json`（根）：新增 `overrides` 统一 CodeMirror 核心包版本。
- `playgrounds/desktop/vite.config.ts`：移除 CodeMirror 相关 `resolve.dedupe` 与 `optimizeDeps.include`。

## 历史补丁
