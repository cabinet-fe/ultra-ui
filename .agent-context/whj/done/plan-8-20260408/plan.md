# playground 移除 ultra-ui 裸包名引入

> 状态: 已执行

## 目标

将 `playgrounds/desktop` 内所有 `ultra-ui` / `ultra-ui/...` 模块说明符改为显式 `@veltra/desktop`、`@veltra/desktop/types`、`@veltra/utils`、`@veltra/compositions` 等子路径；删除仅用于该别名的 `ultra-ui.ts` 与 Vite 中 `ultra-ui` 别名；为新增依赖补充 `package.json` 中的 `@veltra/compositions`。

## 内容

1. 在 `playgrounds/desktop/package.json` 增加 workspace 依赖 `@veltra/compositions`（`App.vue` 等将使用 `loadTheme` / `useConfig`）。
2. 修改 `playgrounds/desktop/vite.config.ts`：移除 `resolve.alias` 中与 `ultra-ui` 相关的两条规则。
3. 删除 `playgrounds/desktop/ultra-ui.ts`（不再被引用）。
4. 按文件将 import 映射为：`@veltra/desktop`（组件与 `defineTableColumns` / `message` / `FormModel` 等）、`@veltra/desktop/types`（`*Exposed`、`*Props`、`BatchEditFeature` 等类型）、`@veltra/utils`（`bem`、`setStyles`）、`@veltra/compositions`（`useComponentProps`、`useTransition`、`loadTheme`、`useConfig`）、`@veltra/utils/styles/theme`（`currentTheme`、`lightTheme`、`darkTheme`、`UITheme`）；样式侧路径与现有 `@veltra/desktop/components/.../style.scss` 用法对齐。
5. 运行 `bun vitest` 与 `playgrounds/desktop` 的 `vite build`（或根目录可及的等价校验）确认无解析错误。

## 影响范围

- `playgrounds/desktop/package.json`
- `playgrounds/desktop/vite.config.ts`
- `playgrounds/desktop/App.vue`
- `playgrounds/desktop/src/action/index.vue`
- `playgrounds/desktop/src/batch-edit/index.vue`
- `playgrounds/desktop/src/button/index.vue`
- `playgrounds/desktop/src/card/index.vue`
- `playgrounds/desktop/src/dialog/index.vue`
- `playgrounds/desktop/src/dropdown/index.vue`
- `playgrounds/desktop/src/float-button/index.vue`
- `playgrounds/desktop/src/form/full.vue`
- `playgrounds/desktop/src/grid-input/index.vue`
- `playgrounds/desktop/src/number-range-input/index.vue`
- `playgrounds/desktop/src/progress/index.vue`
- `playgrounds/desktop/src/progress-nodes/index.vue`
- `playgrounds/desktop/src/scroll/index.vue`
- `playgrounds/desktop/src/select/index.vue`
- `playgrounds/desktop/src/steps/full.vue`
- `playgrounds/desktop/src/table/base.vue`
- `playgrounds/desktop/src/table/expand.vue`
- `playgrounds/desktop/src/table/full.vue`
- `playgrounds/desktop/src/table/merge-cell.vue`
- `playgrounds/desktop/src/tag/index.vue`
- `playgrounds/desktop/src/tip/index.vue`
- `playgrounds/desktop/src/tree/index.vue`

## 历史补丁
