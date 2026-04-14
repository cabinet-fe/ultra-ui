# 修复 desktop 构建后 style 依赖丢失

> 状态: 已执行

## 目标

`@tsdown/css` 在多入口 + `preserveModules` 下仅为每个 chunk 收集**本 chunk 内**的编译后 CSS，并把对「纯 CSS 中间 chunk」的 import 从产物中移除；因此 `style.ts` 里对其它组件 `../foo/style` 的副作用导入不会进入对应 `style2.css`，也不会保留为对 `../foo/style.js` 的引用，导致按需引入单个组件样式时依赖样式缺失。**最终以构建层保留 `style.ts` 副作用链为主方案**（见 patch-1），不采用「把依赖全部迁入各组件 `style.scss`」的 Sass 内联方案，以免重复注入 CSS 并破坏按组件分割的语义。

## 内容

1. **patch-1**：在 `packages/desktop/tsdown.config.ts` 为匹配 `**/components/<name>/style.ts` 的模块设置 `treeshake.moduleSideEffects: true`（判断前将路径中的 `\\` 规范为 `/`），显式保留各样式入口的跨组件 `import`。`entry` 与 Sass `preprocessorOptions` 以 **patch-3 / patch-4** 为准（当前：`index` + 各组件 `style.ts`；`NodePackageImporter`；无独立 `types` 入口、无 `scss.api`）。`src/install.ts` 尚未存在于仓库，待 `@veltra/desktop/install` 落地后再加入 `entry`。
2. **验证**：执行 `bun run build`（`@veltra/desktop`）与 `bun run check-types`，确认按需场景下依赖选择器出现在对应 `style2.css` 中、`style.js` 副作用链完整。
3. **patch-2**：修正 Select 在 `u-dropdown` Teleport 下 `--u-menu-*` 继承位置，以及 Menu / Table 中与主题色阶相关的 `fn.use-var` 用法（见 `patch-2.md`）。
4. **patch-4**：`entry` 仅保留 `src/index.ts` 与各组件 `style.ts`；移除 `preprocessorOptions.scss.api`（保留 `NodePackageImporter`），见 `patch-4.md`。

## 影响范围

`packages/desktop/tsdown.config.ts`（`entry`：`index` + 各组件 `style.ts`；`treeshake.moduleSideEffects`；Sass 仅 `NodePackageImporter`）。`packages/desktop/src/components/select/style.scss`、`packages/desktop/src/components/menu/style.scss`、`packages/desktop/src/components/table/style.scss`（patch-2）。

## 历史补丁

- patch-1: 恢复 style 副作用链并修复 dist 摇树裁掉依赖
- patch-2: Select 下拉 --u-menu-* 与 use-var 修正
- patch-3: 恢复 tsdown 多入口与 Sass api；同步 plan 正文与审查结论
- patch-4: tsdown 入口精简与移除 Sass api
