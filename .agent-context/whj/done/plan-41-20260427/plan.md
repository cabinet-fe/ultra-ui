# code-editor 接入 one-dark 主题

> 状态: 已执行

## 目标

为 `@veltra/desktop` 的 `UCodeEditor` 组件接入 CodeMirror 官方 `@codemirror/theme-one-dark` 主题，提供与代码语义高亮匹配的暗色外观（用户已确认：默认即用 one-dark，不增加 prop，不区分 light/dark 状态）。

## 内容

1. 在 `packages/desktop/package.json` 的 `dependencies` 中新增 `@codemirror/theme-one-dark`，版本与现有 `@codemirror/*` 系列保持兼容（使用 `^6.x` 区间，安装时由 bun 解析当前最新 6.x 版本并写回精确 caret）。
2. 在 `packages/desktop/src/components/code-editor/code-editor.vue` 顶部新增静态导入：`import { oneDark } from '@codemirror/theme-one-dark'`（不走动态 `import()`，主题样式必随主组件加载，不做按需）。
3. 在 `renderEditor` 内部组装 `extensions` 时，将 `oneDark` 加入数组——位置放在 `basicSetup` 之后、`tooltips` 之前；`EditorView.theme({ '.cm-tooltip': { zIndex } })` 保留在末尾，保证 tooltip 的 z-index 覆盖优先级不被 oneDark 主题覆写。
4. 不修改 `CodeEditorProps`、`CodeEditorEmits` 类型定义，不修改 `style.scss`（boxShadow / hover 视觉与主题正交，不冲突）。
5. 校验：执行 `bun install` 写入 lockfile；执行 `bun run --filter @veltra/desktop check-types`；保证无 TS 错误。

## 影响范围

- `packages/desktop/package.json`：`dependencies` 新增 `@codemirror/theme-one-dark: ^6.1.3`。
- `packages/desktop/src/components/code-editor/code-editor.vue`：新增 `import { oneDark } from '@codemirror/theme-one-dark'`；`renderEditor` 内 `extensions` 数组在 `basicSetup` 之后、`tooltips` 之前插入 `oneDark`。
- `bun.lock`：被 `bun install` 写入对应 lockfile 条目。

## 历史补丁

- patch-1: 修复 plan-41 装包后 @embedpdf/core 入口丢失（vite ENOENT）
